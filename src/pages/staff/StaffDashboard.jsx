import React, { useMemo } from 'react';
import { Users, MapPin, Calendar, LogIn, LogOut, AlertTriangle } from 'lucide-react';
import { useAppData } from '../../context/DataContext';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/ui/StatCard';
import OccupancyBar from '../../components/ui/OccupancyBar';

const StaffDashboard = () => {
  const navigate = useNavigate();
  const { zones, users, sessions, emergencyMode } = useAppData();

  const stats = useMemo(() => {
    const checkedInUsers = users.filter(u => u.isCheckedIn).length;
    const zonesAtCapacity = zones.filter(z => z.currentOccupancy >= z.capacity * 0.9).length;
    const upcomingSessions = sessions.filter(s => new Date(s.startTime) > new Date()).length;

    return { checkedInUsers, zonesAtCapacity, upcomingSessions };
  }, [zones, users, sessions]);

  const medicalAlerts = useMemo(() => {
    return users.filter(u => 
      u.isCheckedIn && (u.medicalInfo || u.allergies)
    );
  }, [users]);

  const emergencyAttendanceGroups = useMemo(() => {
    const checkedInUsers = users.filter((user) => user.isCheckedIn);

    return zones
      .filter((zone) => zone.isActive)
      .map((zone) => ({
        zoneId: zone.id,
        zoneName: zone.zoneName,
        users: checkedInUsers.filter((user) => user.assignedZoneId === zone.id)
      }))
      .filter((group) => group.users.length > 0);
  }, [zones, users]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
          <div className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-breathe" />
            Live
          </div>
        </div>
        <p className="text-gray-500">Quick overview and actions</p>
      </div>

      {/* Emergency Warning */}
      {emergencyMode && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3 animate-pulse-alert">
          <AlertTriangle className="w-6 h-6 text-rose-600" />
          <div>
            <h3 className="font-semibold text-rose-800">Emergency Mode Active</h3>
            <p className="text-sm text-rose-600">Check-in is disabled. Follow evacuation procedures.</p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => navigate('/staff/check-in')}
          disabled={emergencyMode}
          title={emergencyMode ? 'Check-in is disabled while emergency mode is active.' : ''}
          className={`p-4 rounded-xl border-2 border-dashed flex flex-col items-center gap-2 transition-colors ${
            emergencyMode 
              ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
              : 'border-indigo-200 text-indigo-600 hover:bg-indigo-50'
          }`}
        >
          <LogIn className="w-6 h-6" />
          <span className="font-medium">Check In</span>
        </button>
        <button
          onClick={() => navigate('/staff/check-out')}
          className="p-4 rounded-xl border-2 border-dashed border-emerald-200 text-emerald-600 hover:bg-emerald-50 flex flex-col items-center gap-2 transition-colors"
        >
          <LogOut className="w-6 h-6" />
          <span className="font-medium">Check Out</span>
        </button>
        <button
          onClick={() => navigate('/staff/zones')}
          className="p-4 rounded-xl border-2 border-dashed border-amber-200 text-amber-600 hover:bg-amber-50 flex flex-col items-center gap-2 transition-colors"
        >
          <MapPin className="w-6 h-6" />
          <span className="font-medium">Monitor</span>
        </button>
        <button
          onClick={() => navigate('/staff/users')}
          className="p-4 rounded-xl border-2 border-dashed border-purple-200 text-purple-600 hover:bg-purple-50 flex flex-col items-center gap-2 transition-colors"
        >
          <Users className="w-6 h-6" />
          <span className="font-medium">Lookup</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label="Users Checked In"
          value={stats.checkedInUsers}
          color="indigo"
          delay={1}
        />
        <StatCard
          icon={MapPin}
          label="Zones at Capacity"
          value={stats.zonesAtCapacity}
          color="amber"
          delay={2}
        />
        <StatCard
          icon={Calendar}
          label="Upcoming Sessions"
          value={stats.upcomingSessions}
          color="emerald"
          delay={3}
        />
      </div>

      {/* Zone Status */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Zone Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.filter(z => z.isActive).map((zone, index) => (
            <div 
              key={zone.id}
              className={`bg-white rounded-2xl p-5 shadow-sm border card-hover animate-fade-slide-up ${
                emergencyMode ? 'border-rose-200 bg-rose-50/50' : 'border-gray-100'
              }`}
              style={{ animationDelay: `${(index + 4) * 80}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{zone.zoneName}</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mt-1">
                    {zone.ageGroup}
                  </span>
                </div>
                <span className={`w-2.5 h-2.5 rounded-full ${
                  emergencyMode ? 'bg-rose-500' :
                  zone.currentOccupancy >= zone.capacity * 0.9 ? 'bg-rose-500' :
                  zone.currentOccupancy >= zone.capacity * 0.7 ? 'bg-amber-500' :
                  'bg-emerald-500'
                }`} />
              </div>
              <OccupancyBar 
                current={zone.currentOccupancy}
                max={zone.capacity}
                size="sm"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Attendance Groups */}
      {emergencyMode && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-rose-900 mb-3">Emergency Attendance Groups</h2>
          <div className="space-y-3">
            {emergencyAttendanceGroups.length === 0 ? (
              <p className="text-sm text-rose-700">No checked-in users to group right now.</p>
            ) : (
              emergencyAttendanceGroups.map((group) => (
                <div key={group.zoneId} className="bg-white rounded-xl border border-rose-100 p-4">
                  <p className="font-medium text-gray-900 mb-2">{group.zoneName}</p>
                  <p className="text-sm text-gray-600">
                    {group.users.map((user) => user.name).join(', ')}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Medical Alerts */}
      {medicalAlerts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Medical Alerts</h2>
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 space-y-3">
            {medicalAlerts.map(user => (
              <div key={user.id} className="flex items-start gap-3 bg-white rounded-xl p-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  {user.medicalInfo && (
                    <p className="text-sm text-gray-600">Medical: {user.medicalInfo}</p>
                  )}
                  {user.allergies && (
                    <p className="text-sm text-gray-600">Allergies: {user.allergies}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;
