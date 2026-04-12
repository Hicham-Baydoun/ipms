import React, { useState, useMemo } from 'react';
import { Filter, X } from 'lucide-react';
import { useData } from '../../context/DataContext';
import DataTable from '../../components/ui/DataTable';
import { formatDateTime, toDate } from '../../utils/formatters';

const AuditLogs = () => {
  const { auditLogs } = useData();
  const [actionFilter, setActionFilter] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const hasActiveFilters = actionFilter || dateRange.from || dateRange.to;

  const clearFilters = () => {
    setActionFilter('');
    setDateRange({ from: '', to: '' });
  };

  const actionTypes = [
    { value: '', label: 'All Actions' },
    { value: 'CHECK_IN', label: 'Check In' },
    { value: 'CHECK_OUT', label: 'Check Out' },
    { value: 'ZONE_CREATED', label: 'Zone Created' },
    { value: 'ZONE_UPDATED', label: 'Zone Updated' },
    { value: 'ZONE_REASSIGN', label: 'Zone Reassign' },
    { value: 'STAFF_ADDED', label: 'Staff Added' },
    { value: 'STAFF_REMOVED', label: 'Staff Removed' },
    { value: 'EMERGENCY_ON', label: 'Emergency Activated' },
    { value: 'EMERGENCY_OFF', label: 'Emergency Deactivated' },
    { value: 'SESSION_CREATED', label: 'Session Created' }
  ];

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      // Filter by action type
      if (actionFilter && log.action !== actionFilter) return false;
      
      // Filter by date range
      if (dateRange.from || dateRange.to) {
        const logDate = toDate(log.timestamp);
        if (!logDate) return false;
        const fromDate = dateRange.from ? new Date(dateRange.from) : null;
        const toDateFilter = dateRange.to ? new Date(dateRange.to) : null;
        
        if (fromDate && logDate < fromDate) return false;
        if (toDateFilter) {
          const rangeEnd = new Date(toDateFilter);
          rangeEnd.setHours(23, 59, 59, 999);
          if (logDate > rangeEnd) return false;
        }
      }
      
      return true;
    });
  }, [auditLogs, actionFilter, dateRange]);

  const columns = [
    { 
      key: 'timestamp', 
      title: 'Timestamp', 
      sortable: true,
      render: (value) => formatDateTime(value)
    },
    { 
      key: 'action', 
      title: 'Action', 
      sortable: true,
      render: (value) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value === 'CHECK_IN' ? 'bg-emerald-100 text-emerald-800' :
          value === 'CHECK_OUT' ? 'bg-blue-100 text-blue-800' :
          value === 'ZONE_UPDATED' || value === 'ZONE_CREATED' ? 'bg-purple-100 text-purple-800' :
          value === 'ZONE_REASSIGN' ? 'bg-amber-100 text-amber-800' :
          value === 'EMERGENCY_ON' || value === 'EMERGENCY_OFF' ? 'bg-rose-100 text-rose-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value.replace(/_/g, ' ')}
        </span>
      )
    },
    { key: 'performedBy', title: 'Performed By', sortable: true },
    { key: 'targetId', title: 'Target', sortable: true },
    { key: 'details', title: 'Details', sortable: false }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-500">Track all system activities and changes</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>
        
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {actionTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors ml-auto"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </button>
        )}
      </div>

      {/* Audit Logs Table */}
      <DataTable
        columns={columns}
        data={filteredLogs}
        searchable
        searchPlaceholder="Search audit logs..."
        emptyMessage="No audit logs found"
      />
    </div>
  );
};

export default AuditLogs;
