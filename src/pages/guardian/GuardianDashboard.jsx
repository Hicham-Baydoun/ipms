import React, { useState, useEffect, useMemo } from 'react';
import { User, MapPin, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/DataContext';
import { calculateAge } from '../../utils/ageCalculator';
import { formatTime } from '../../utils/formatters';
import OccupancyBar from '../../components/ui/OccupancyBar';
import StatusDot from '../../components/ui/StatusDot';
import { FACILITY_CONFIG } from '../../config/facilityConfig';

const GuardianDashboard = () => {
  const { user: currentGuardianUser } = useAuth();
  const { users, zones, guardians, emergencyMode } = useAppData();

  const currentGuardian = useMemo(() => {
    if (guardians.length === 0 || !currentGuardianUser?.uid) {
      return null;
    }

    const directMatch = guardians.find((guardian) => guardian.id === currentGuardianUser.uid);
    if (directMatch) {
      return directMatch;
    }

    if (currentGuardianUser?.guardianId) {
      return guardians.find((guardian) => guardian.id === currentGuardianUser.guardianId) || null;
    }

    return null;
  }, [guardians, currentGuardianUser]);

  const children = useMemo(() => {
    if (!currentGuardian) return [];
    return users.filter((user) => currentGuardian.childrenIds?.includes(user.id));
  }, [users, currentGuardian]);

  const zonesById = useMemo(() => {
    return zones.reduce((acc, zone) => {
      acc[zone.id] = zone;
      return acc;
    }, {});
  }, [zones]);

  // Countdown timer for checked-in children
  const [timers, setTimers] = useState({});

  useEffect(() => {
    const updateTimers = () => {
      const newTimers = {};
      children.forEach(child => {
        if (child.isCheckedIn && child.checkInTime) {
          const checkIn = new Date(child.checkInTime);
          const now = new Date();
          const elapsed = Math.floor((now - checkIn) / 1000 / 60); // minutes
          const remaining = Math.max(0, 120 - elapsed); // 2 hour session
          newTimers[child.id] = remaining;
        }
      });
      setTimers(newTimers);
    };

    updateTimers();
    const interval = setInterval(updateTimers, 30000);

    return () => clearInterval(interval);
  }, [children]);

  if (!currentGuardian) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No guardian data found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {currentGuardian.name.split(' ')[0]}!
          </h1>
          <div className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-breathe" />
            Live
          </div>
        </div>
        <p className="text-gray-500">Track your children's activities</p>
      </div>

      {/* Emergency Warning */}
      {emergencyMode && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 animate-pulse-alert">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-rose-600" />
            <div>
              <h3 className="font-semibold text-rose-800">Emergency Alert</h3>
              <p className="text-sm text-rose-600">
                Please contact the facility immediately: {FACILITY_CONFIG.emergencyContact}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Children Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children.map((child, index) => {
          const zone = zonesById[child.assignedZoneId];
          const remainingTime = timers[child.id];

          return (
            <div 
              key={child.id}
              className={`rounded-2xl shadow-sm border p-6 animate-fade-slide-up ${
                emergencyMode ? 'bg-rose-50/40 border-rose-200' : 'bg-white border-gray-100'
              }`}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              {/* Child Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{child.name}</h3>
                    <p className="text-sm text-gray-500">{calculateAge(child.dateOfBirth)} years old</p>
                  </div>
                </div>
                <StatusDot 
                  status={child.isCheckedIn ? 'checkedIn' : 'checkedOut'}
                  size="md"
                />
              </div>

              {/* Status Details */}
              {child.isCheckedIn ? (
                <div className="space-y-4">
                  <div className="bg-emerald-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm text-emerald-700">Checked In at</span>
                    </div>
                    <p className="font-medium text-emerald-900">{zone?.zoneName}</p>
                    <p className="text-sm text-emerald-600">{zone?.activityType}</p>
                    <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-breathe" />
                      Active session
                    </div>
                  </div>

                  {/* Session Timer */}
                  {remainingTime !== undefined && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        Session time remaining: <strong>{Math.floor(remainingTime / 60)}h {remainingTime % 60}m</strong>
                      </span>
                    </div>
                  )}

                  {/* Zone Occupancy */}
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Zone occupancy</p>
                    <OccupancyBar 
                      current={zone?.currentOccupancy}
                      max={zone?.capacity}
                      size="sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-gray-500">Not currently at the playground</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Last visit: {child.checkInTime ? formatTime(child.checkInTime) : 'Never'}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Card */}
      <div className="bg-indigo-50 rounded-2xl p-6">
        <h3 className="font-semibold text-indigo-900 mb-2">Need Help?</h3>
        <p className="text-indigo-700 text-sm mb-3">
          If you have any questions or concerns about your child's session, please contact our staff.
        </p>
        <div className="flex items-center gap-2 text-indigo-600">
          <span className="text-sm font-medium">Facility Phone:</span>
          <span className="text-sm">{FACILITY_CONFIG.emergencyContact}</span>
        </div>
      </div>
    </div>
  );
};

export default GuardianDashboard;
