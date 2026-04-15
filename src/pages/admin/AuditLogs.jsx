import React, { useState, useMemo } from 'react';
import { Filter, X, Trash2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { usePermissions } from '../../hooks/usePermissions';
import { useToast } from '../../context/ToastContext';
import { clearAuditLogs, clearAttendanceLogs } from '../../services/auditService';
import DataTable from '../../components/ui/DataTable';
import { formatDateTime, toDate } from '../../utils/formatters';

const AuditLogs = () => {
  const { auditLogs } = useData();
  const { isAdmin } = usePermissions();
  const { success, error } = useToast();
  const [actionFilter, setActionFilter] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [confirmReset, setConfirmReset] = useState(null); // 'audit' | 'attendance' | null
  const [resetting, setResetting] = useState(false);

  const hasActiveFilters = actionFilter || dateRange.from || dateRange.to;

  const clearFilters = () => {
    setActionFilter('');
    setDateRange({ from: '', to: '' });
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      if (confirmReset === 'audit') {
        await clearAuditLogs();
        success('Audit logs cleared.');
      } else if (confirmReset === 'attendance') {
        await clearAttendanceLogs();
        success('Attendance logs cleared.');
      }
    } catch {
      error('Failed to clear logs. Try again.');
    } finally {
      setResetting(false);
      setConfirmReset(null);
    }
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
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-500 text-sm">Track all system activities and changes</p>
        </div>
        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setConfirmReset('attendance')}
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors min-h-[44px]"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clear Attendance Logs</span>
              <span className="sm:hidden">Attendance</span>
            </button>
            <button
              onClick={() => setConfirmReset('audit')}
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors min-h-[44px]"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clear Audit Logs</span>
              <span className="sm:hidden">Audit</span>
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmReset && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Clear {confirmReset === 'audit' ? 'Audit' : 'Attendance'} Logs?
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              This will permanently delete all {confirmReset === 'audit' ? 'audit' : 'attendance'} log records. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmReset(null)}
                disabled={resetting}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-medium hover:bg-rose-700 disabled:opacity-50"
              >
                {resetting ? 'Clearing...' : 'Yes, Clear'}
              </button>
            </div>
          </div>
        </div>
      )}

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

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
          />
          <span className="text-gray-400 hidden sm:inline">to</span>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
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
