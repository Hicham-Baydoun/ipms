import React, { useMemo, useState } from 'react';
import { Calendar, Download } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppData } from '../../context/DataContext';
import { useDataRefreshPulse } from '../../hooks/useDataRefreshPulse';
import DataTable from '../../components/ui/DataTable';
import { formatDate, toDate } from '../../utils/formatters';

const dayColumns = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const dayKeyMap = {
  Mon: 'mon',
  Tue: 'tue',
  Wed: 'wed',
  Thu: 'thu',
  Fri: 'fri',
  Sat: 'sat',
  Sun: 'sun'
};

const Reports = () => {
  const { attendanceLogs, zones, users } = useAppData();
  const [activeTab, setActiveTab] = useState('attendance');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const zonesById = useMemo(() => {
    return zones.reduce((acc, zone) => {
      acc[zone.id] = zone;
      return acc;
    }, {});
  }, [zones]);

  const usersById = useMemo(() => {
    return users.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});
  }, [users]);

  const filteredLogs = useMemo(() => {
    return attendanceLogs.filter((log) => {
      if (!dateRange.from && !dateRange.to) {
        return true;
      }

      const logDate = toDate(log.checkInTime);
      if (!logDate) {
        return false;
      }

      const fromDate = dateRange.from ? new Date(dateRange.from) : null;
      const toDateFilter = dateRange.to ? new Date(dateRange.to) : null;

      if (fromDate && logDate < fromDate) {
        return false;
      }

      if (toDateFilter) {
        const rangeEnd = new Date(toDateFilter);
        rangeEnd.setHours(23, 59, 59, 999);
        if (logDate > rangeEnd) {
          return false;
        }
      }

      return true;
    });
  }, [attendanceLogs, dateRange]);

  const zoneUsageData = useMemo(() => {
    const zoneLookup = zones.reduce((acc, zone) => {
      if (zone.isActive) {
        acc[zone.id] = {
          name: zone.zoneName,
          activeVisits: 0,
          completedVisits: 0
        };
      }
      return acc;
    }, {});

    filteredLogs.forEach((log) => {
      const zoneData = zoneLookup[log.zoneId];
      if (!zoneData) {
        return;
      }

      if (log.checkOutTime) {
        zoneData.completedVisits += 1;
      } else {
        zoneData.activeVisits += 1;
      }
    });

    return Object.values(zoneLookup);
  }, [zones, filteredLogs]);

  const heatmapData = useMemo(() => {
    const grid = {};

    filteredLogs.forEach((log) => {
      const date = toDate(log.checkInTime);
      if (!date) {
        return;
      }

      const day = format(date, 'EEE');
      const hour = date.getHours();
      const key = `${day}-${hour}`;
      grid[key] = (grid[key] || 0) + 1;
    });

    const startHour = 8;
    const endHour = 20;
    const rows = [];

    for (let hour = startHour; hour <= endHour; hour += 1) {
      const label = format(new Date().setHours(hour, 0, 0, 0), 'h a');
      const row = { hour: label };

      dayColumns.forEach((day) => {
        row[dayKeyMap[day]] = grid[`${day}-${hour}`] || 0;
      });

      rows.push(row);
    }

    return rows;
  }, [filteredLogs]);

  const maxHeatmapValue = useMemo(() => {
    const values = heatmapData.flatMap((row) => dayColumns.map((day) => row[dayKeyMap[day]]));
    return Math.max(1, ...values);
  }, [heatmapData]);

  const zoneUsageRefreshing = useDataRefreshPulse(zoneUsageData);
  const heatmapRefreshing = useDataRefreshPulse(heatmapData);

  const handleExport = () => {
    const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    let rows = [];
    let filename = 'report.csv';

    if (activeTab === 'attendance') {
      rows = [
        ['User', 'Zone', 'Check In', 'Check Out', 'Duration (min)'],
        ...filteredLogs.map((log) => [
          usersById[log.userId]?.fullName || usersById[log.userId]?.name || 'Unknown',
          zonesById[log.zoneId]?.zoneName || 'Unknown',
          log.checkInTime ? formatDate(log.checkInTime, 'yyyy-MM-dd HH:mm') : '',
          log.checkOutTime ? formatDate(log.checkOutTime, 'yyyy-MM-dd HH:mm') : '',
          (() => {
            if (log.duration != null) return log.duration;
            const checkIn = toDate(log.checkInTime);
            const checkOut = toDate(log.checkOutTime);
            if (checkIn && checkOut) return Math.round((checkOut - checkIn) / 60000);
            return '';
          })()
        ])
      ];
      filename = 'attendance_report.csv';
    } else if (activeTab === 'zoneUsage') {
      rows = [
        ['Zone', 'Active Visits', 'Completed Visits'],
        ...zoneUsageData.map((z) => [z.name, z.activeVisits, z.completedVisits])
      ];
      filename = 'zone_usage_report.csv';
    } else if (activeTab === 'peakHours') {
      rows = [
        ['Hour', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        ...heatmapData.map((row) => [
          row.hour, row.mon, row.tue, row.wed, row.thu, row.fri, row.sat, row.sun
        ])
      ];
      filename = 'peak_hours_report.csv';
    }

    const csv = rows.map((r) => r.map(escape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const attendanceColumns = [
    {
      key: 'userId',
      title: 'User',
      sortable: true,
      render: (value) => {
        const matchedUser = usersById[value];
        return matchedUser?.fullName || matchedUser?.name || 'Unknown user';
      }
    },
    {
      key: 'zoneId',
      title: 'Zone',
      sortable: true,
      render: (value) => zonesById[value]?.zoneName || 'Unknown zone'
    },
    {
      key: 'checkInTime',
      title: 'Check In',
      sortable: true,
      render: (value) => formatDate(value, 'MMM dd, yyyy h:mm a')
    },
    {
      key: 'checkOutTime',
      title: 'Check Out',
      sortable: true,
      render: (value) => (value ? formatDate(value, 'h:mm a') : '-')
    },
    {
      key: 'duration',
      title: 'Duration',
      sortable: true,
      render: (value, row) => {
        if (value) return `${value} min`;
        if (row?.checkInTime && row?.checkOutTime) {
          const checkIn = toDate(row.checkInTime);
          const checkOut = toDate(row.checkOutTime);
          if (checkIn && checkOut) {
            const mins = Math.round((checkOut - checkIn) / 60000);
            return `${mins} min`;
          }
        }
        return '-';
      }
    }
  ];

  const tabs = [
    { id: 'attendance', label: 'Attendance' },
    { id: 'zoneUsage', label: 'Zone Usage' },
    { id: 'peakHours', label: 'Peak Hours' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500">View detailed reports and analytics</p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={dateRange.from}
            onChange={(event) => setDateRange((prev) => ({ ...prev, from: event.target.value }))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={dateRange.to}
            onChange={(event) => setDateRange((prev) => ({ ...prev, to: event.target.value }))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {activeTab === 'attendance' && (
        <DataTable
          columns={attendanceColumns}
          data={filteredLogs}
          searchable
          searchPlaceholder="Search attendance records..."
          emptyMessage="No attendance records found"
        />
      )}

      {activeTab === 'zoneUsage' && (
        <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ${zoneUsageRefreshing ? 'animate-data-refresh' : ''}`}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Zone Usage Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zoneUsageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="activeVisits" stackId="usage" fill="#6366f1" radius={[4, 4, 0, 0]} animationDuration={800} />
                <Bar dataKey="completedVisits" stackId="usage" fill="#14b8a6" radius={[4, 4, 0, 0]} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'peakHours' && (
        <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ${heatmapRefreshing ? 'animate-data-refresh' : ''}`}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Peak Hours Heatmap</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500">Hour</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500">Mon</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500">Tue</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500">Wed</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500">Thu</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500">Fri</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500">Sat</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500">Sun</th>
                </tr>
              </thead>
              <tbody>
                {heatmapData.map((row) => (
                  <tr key={row.hour}>
                    <td className="px-2 py-2 text-sm text-gray-700">{row.hour}</td>
                    {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => {
                      const value = row[day];
                      const intensity = value / maxHeatmapValue;
                      return (
                        <td key={`${row.hour}-${day}`} className="px-2 py-2">
                          <div
                            className="w-full h-8 rounded flex items-center justify-center text-xs font-medium"
                            style={{
                              backgroundColor: `rgba(99, 102, 241, ${0.1 + intensity * 0.9})`,
                              color: intensity > 0.5 ? 'white' : '#4b5563'
                            }}
                          >
                            {value}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
