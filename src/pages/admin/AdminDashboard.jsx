import React, { useMemo } from 'react';
import { Users, MapPin, UserCheck, TrendingUp } from 'lucide-react';
import { format, isSameDay, subDays } from 'date-fns';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAppData } from '../../context/DataContext';
import { useDataRefreshPulse } from '../../hooks/useDataRefreshPulse';
import { toDate } from '../../utils/formatters';
import StatCard from '../../components/ui/StatCard';
import OccupancyBar from '../../components/ui/OccupancyBar';

const AdminDashboard = () => {
  const { zones, users, staff, attendanceLogs, emergencyMode } = useAppData();

  const stats = useMemo(() => {
    const checkedInUsers = users.filter((user) => user.isCheckedIn).length;
    const activeZones = zones.filter((zone) => zone.isActive);
    const activeZonesCount = activeZones.length;
    const staffOnDuty = staff.filter((member) => member.isActive).length;
    const capacityUtilization = activeZonesCount > 0
      ? Math.round(
          (activeZones.reduce((sum, zone) => {
            if (!zone.capacity) return sum;
            return sum + zone.currentOccupancy / zone.capacity;
          }, 0) / activeZonesCount) * 100
        )
      : 0;

    return {
      checkedInUsers,
      activeZonesCount,
      staffOnDuty,
      capacityUtilization
    };
  }, [zones, users, staff]);

  const checkInChartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = subDays(new Date(), 6 - index);

      return {
        day: format(date, 'EEE'),
        checkIns: attendanceLogs.filter((log) => {
          const checkInDate = toDate(log.checkInTime);
          return checkInDate ? isSameDay(checkInDate, date) : false;
        }).length
      };
    });
  }, [attendanceLogs]);

  const zoneUsageData = useMemo(() => {
    return zones
      .filter((zone) => zone.isActive)
      .map((zone) => ({
        name: zone.zoneName,
        visits: attendanceLogs.filter((log) => log.zoneId === zone.id).length,
        fill:
          zone.currentOccupancy >= zone.capacity
            ? '#F43F5E'
            : zone.currentOccupancy >= zone.capacity * 0.7
              ? '#F59E0B'
              : '#10B981'
      }));
  }, [zones, attendanceLogs]);

  const checkInChartRefreshing = useDataRefreshPulse(checkInChartData);
  const zoneUsageChartRefreshing = useDataRefreshPulse(zoneUsageData);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-breathe" />
              Live
            </div>
          </div>
          <p className="text-gray-500">Overview of your indoor playground</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={UserCheck} label="Users Checked In" value={stats.checkedInUsers} color="indigo" delay={1} />
        <StatCard icon={MapPin} label="Active Zones" value={stats.activeZonesCount} color="emerald" delay={2} />
        <StatCard icon={Users} label="Staff On Duty" value={stats.staffOnDuty} color="amber" delay={3} />
        <StatCard
          icon={TrendingUp}
          label="Capacity Utilization"
          value={stats.capacityUtilization}
          suffix="%"
          color="purple"
          delay={4}
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Zone Occupancy</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {zones.filter((zone) => zone.isActive).map((zone, index) => (
            <div
              key={zone.id}
              className={`rounded-2xl p-5 shadow-sm border card-hover animate-fade-slide-up ${
                emergencyMode ? 'bg-rose-50/50 border-rose-200' : 'bg-white border-gray-100'
              }`}
              style={{ animationDelay: `${(index + 5) * 80}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{zone.zoneName}</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mt-1">
                    {zone.ageGroup}
                  </span>
                </div>
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    emergencyMode
                      ? 'bg-rose-500'
                      : zone.currentOccupancy >= zone.capacity * 0.9
                        ? 'bg-rose-500'
                        : zone.currentOccupancy >= zone.capacity * 0.7
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                  }`}
                />
              </div>
              <OccupancyBar current={zone.currentOccupancy} max={zone.capacity} size="sm" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className={`bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 animate-fade-slide-up ${
            checkInChartRefreshing ? 'animate-data-refresh' : ''
          }`}
          style={{ animationDelay: '720ms' }}
        >
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Check-ins This Week</h3>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={checkInChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Line
                  type="monotone"
                  dataKey="checkIns"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ fill: '#6366f1', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                  animationDuration={800}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          className={`bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 animate-fade-slide-up ${
            zoneUsageChartRefreshing ? 'animate-data-refresh' : ''
          }`}
          style={{ animationDelay: '800ms' }}
        >
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Zone Usage Distribution</h3>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zoneUsageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="visits" radius={[4, 4, 0, 0]} animationDuration={800}>
                  {zoneUsageData.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
