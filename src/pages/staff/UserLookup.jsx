import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, X, User, MapPin, Clock, AlertTriangle, Calendar } from 'lucide-react';
import { useData } from '../../context/DataContext';
import DataTable from '../../components/ui/DataTable';
import { calculateAge } from '../../utils/ageCalculator';
import { formatDate, formatDateTime } from '../../utils/formatters';
import StatusDot from '../../components/ui/StatusDot';

const UserLookup = () => {
  const location = useLocation();
  const { users, zones, guardians, attendanceLogs } = useData();
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // When navigated from the TopBar global search, auto-open the selected user's profile
  useEffect(() => {
    const incomingId = location.state?.selectedUserId;
    if (!incomingId || !users.length) return;
    const found = users.find((u) => u.id === incomingId);
    if (found) setSelectedUser(found);
  }, [location.state?.selectedUserId, users]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    return users.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.braceletId?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const getUserZone = (zoneId) => zones.find(z => z.id === zoneId);
  const getUserGuardian = (guardianId) => guardians.find(g => g.id === guardianId);
  
  const getUserAttendanceHistory = (userId) => {
    return attendanceLogs
      .filter(log => log.userId === userId)
      .sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime))
      .slice(0, 5);
  };

  const columns = [
    { key: 'name', title: 'Name', sortable: true },
    { 
      key: 'dateOfBirth', 
      title: 'Age', 
      sortable: true,
      render: (value) => calculateAge(value)
    },
    { 
      key: 'assignedZoneId', 
      title: 'Zone', 
      sortable: true,
      render: (value) => getUserZone(value)?.zoneName || '—'
    },
    { 
      key: 'isCheckedIn', 
      title: 'Status', 
      sortable: true,
      render: (value) => (
        <StatusDot 
          status={value ? 'checkedIn' : 'checkedOut'} 
          showLabel 
        />
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      sortable: false,
      render: (_, row) => (
        <button
          onClick={() => setSelectedUser(row)}
          className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
        >
          View Profile
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Lookup</h1>
        <p className="text-gray-500">Search and view user information</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Search users by name or bracelet ID..."
        />
      </div>

      {/* Users Table */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        searchable={false}
        emptyMessage="No users found"
      />

      {/* User Profile Side Panel */}
      {selectedUser && (
        <>
          <div 
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setSelectedUser(null)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 animate-slide-in-right overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedUser.name}</h2>
                    <p className="text-gray-500">
                      {calculateAge(selectedUser.dateOfBirth)} years old • {selectedUser.gender}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Status */}
              <div className="flex items-center gap-3 mb-6">
                <StatusDot 
                  status={selectedUser.isCheckedIn ? 'checkedIn' : 'checkedOut'} 
                  size="lg"
                />
                <span className="font-medium">
                  {selectedUser.isCheckedIn ? 'Currently Checked In' : 'Not Checked In'}
                </span>
              </div>

              {/* Current Zone */}
              {selectedUser.isCheckedIn && (
                <div className="bg-indigo-50 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    <span className="font-medium text-indigo-900">Current Zone</span>
                  </div>
                  <p className="text-indigo-700">
                    {getUserZone(selectedUser.assignedZoneId)?.zoneName}
                  </p>
                  <p className="text-sm text-indigo-600 mt-1">
                    Bracelet ID: {selectedUser.braceletId}
                  </p>
                </div>
              )}

              {/* Medical Information */}
              {(selectedUser.medicalInfo || selectedUser.allergies) && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <h3 className="font-semibold text-amber-800">Confidential Medical Info</h3>
                  </div>
                  {selectedUser.medicalInfo && (
                    <div className="mb-2">
                      <p className="text-sm text-amber-700 font-medium">Medical Conditions</p>
                      <p className="text-sm text-amber-800">{selectedUser.medicalInfo}</p>
                    </div>
                  )}
                  {selectedUser.allergies && (
                    <div>
                      <p className="text-sm text-amber-700 font-medium">Allergies</p>
                      <p className="text-sm text-amber-800">{selectedUser.allergies}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Guardian Info */}
              {selectedUser.guardianId && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Guardian Information</h3>
                  {(() => {
                    const guardian = getUserGuardian(selectedUser.guardianId);
                    return guardian ? (
                      <div className="space-y-2">
                        <p className="text-gray-700"><strong>Name:</strong> {guardian.name}</p>
                        <p className="text-gray-700"><strong>Phone:</strong> {guardian.phone}</p>
                        <p className="text-gray-700"><strong>Email:</strong> {guardian.email}</p>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              {/* Attendance History */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Recent Attendance
                </h3>
                <div className="space-y-2">
                  {getUserAttendanceHistory(selectedUser.id).map((log, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">
                          {getUserZone(log.zoneId)?.zoneName}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(log.checkInTime)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Duration: {log.duration ? `${log.duration} min` : 'In progress'}
                      </p>
                    </div>
                  ))}
                  {getUserAttendanceHistory(selectedUser.id).length === 0 && (
                    <p className="text-gray-500 text-center py-4">No attendance history</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserLookup;
