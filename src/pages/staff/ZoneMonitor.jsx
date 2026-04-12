import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Users } from 'lucide-react';
import { useAppData } from '../../context/DataContext';
import OccupancyBar from '../../components/ui/OccupancyBar';
import StatusDot from '../../components/ui/StatusDot';

const ZoneMonitor = () => {
  const { zones, users, emergencyMode } = useAppData();
  const [expandedZones, setExpandedZones] = useState({});

  const toggleZone = (zoneId) => {
    setExpandedZones(prev => ({
      ...prev,
      [zoneId]: !prev[zoneId]
    }));
  };

  const zoneUsersByZone = useMemo(() => {
    return users.reduce((acc, user) => {
      if (!user.isCheckedIn || !user.assignedZoneId) {
        return acc;
      }

      if (!acc[user.assignedZoneId]) {
        acc[user.assignedZoneId] = [];
      }

      acc[user.assignedZoneId].push(user);
      return acc;
    }, {});
  }, [users]);

  const getZoneStatus = (zone) => {
    if (emergencyMode) return 'danger';
    const percentage = (zone.currentOccupancy / zone.capacity) * 100;
    if (percentage >= 90) return 'danger';
    if (percentage >= 70) return 'warning';
    return 'active';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Zone Monitor</h1>
        <p className="text-gray-500">Real-time zone occupancy and user tracking</p>
      </div>

      {/* Zones Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {zones.filter(z => z.isActive).map((zone, index) => {
          const zoneUsers = zoneUsersByZone[zone.id] || [];
          const isExpanded = expandedZones[zone.id];
          const status = getZoneStatus(zone);

          return (
            <div 
              key={zone.id}
              className={`rounded-2xl shadow-sm border overflow-hidden animate-fade-slide-up ${
                emergencyMode ? 'bg-rose-50/50 border-rose-200' : 'bg-white border-gray-100'
              }`}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              {/* Zone Header */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{zone.zoneName}</h3>
                      <StatusDot 
                        status={status === 'danger' ? 'danger' : status === 'warning' ? 'warning' : 'active'} 
                        size="sm"
                      />
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {zone.ageGroup}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleZone(zone.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>

                <OccupancyBar 
                  current={zone.currentOccupancy}
                  max={zone.capacity}
                />

                <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
                  <Users className="w-4 h-4" />
                  <span>{zoneUsers.length} users currently in zone</span>
                </div>
              </div>

              {/* Expanded User List */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50 p-4 animate-fade-in">
                  {zoneUsers.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No users in this zone</p>
                  ) : (
                    <div className="space-y-2">
                      {[...zoneUsers]
                        .sort((a, b) => new Date(a.dateOfBirth) - new Date(b.dateOfBirth))
                        .map(user => (
                          <div 
                            key={user.id}
                            className="bg-white rounded-lg p-3 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-medium text-gray-900">{user.name}</p>
                              <p className="text-sm text-gray-500">
                                Bracelet: {user.braceletId}
                              </p>
                            </div>
                            {(user.medicalInfo || user.allergies) && (
                              <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                                Medical Alert
                              </span>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ZoneMonitor;
