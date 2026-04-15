import React, { useMemo, useState } from 'react';
import { AlertTriangle, X, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/DataContext';
import { calculateAge } from '../../utils/ageCalculator';

const EmergencyBanner = () => {
  const { role } = useAuth();
  const { emergencyMode, emergencyActivatedBy, users, zones } = useAppData();
  const [showEvacList, setShowEvacList] = useState(false);

  const canViewEvacList = role === 'Admin' || role === 'Supervisor' || role === 'Staff';

  // Build zone lookup
  const zonesById = useMemo(
    () => zones.reduce((acc, z) => { acc[z.id] = z; return acc; }, {}),
    [zones]
  );

  // Checked-in users grouped by zone, sorted youngest-first within each zone
  const evacGroups = useMemo(() => {
    const checkedIn = users.filter((u) => u.isCheckedIn);
    const byZone = {};
    checkedIn.forEach((u) => {
      const zid = u.assignedZoneId || 'unassigned';
      if (!byZone[zid]) byZone[zid] = [];
      byZone[zid].push(u);
    });
    // Sort each zone: youngest first (children first), then teens, then adults
    Object.values(byZone).forEach((group) => {
      group.sort((a, b) => {
        const ageA = calculateAge(a.dateOfBirth) ?? 999;
        const ageB = calculateAge(b.dateOfBirth) ?? 999;
        return ageA - ageB;
      });
    });
    return Object.entries(byZone).map(([zoneId, members]) => ({
      zoneId,
      zoneName: zonesById[zoneId]?.zoneName || 'Unassigned',
      members
    }));
  }, [users, zonesById]);

  const totalCheckedIn = useMemo(
    () => users.filter((u) => u.isCheckedIn).length,
    [users]
  );

  if (!emergencyMode) return null;

  const isAdmin = role === 'Admin';

  return (
    <>
      <div className="bg-rose-600 text-white px-4 py-3 animate-pulse-alert">
        <div className="flex flex-wrap items-center justify-between gap-2 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <p className="font-semibold text-xs sm:text-sm md:text-base">
              EMERGENCY MODE ACTIVE — Evacuation in progress
              {isAdmin && emergencyActivatedBy && (
                <span className="ml-1 font-normal opacity-80 hidden sm:inline">
                  (Activated by {emergencyActivatedBy})
                </span>
              )}
            </p>
          </div>
          {canViewEvacList && (
            <button
              onClick={() => setShowEvacList(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 min-h-[36px]"
            >
              <Users className="w-3.5 h-3.5" />
              List ({totalCheckedIn})
            </button>
          )}
        </div>
      </div>

      {showEvacList && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-full sm:max-w-2xl max-h-[90vh] flex flex-col animate-modal-in">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h2 className="text-lg font-bold text-gray-900">Evacuation List</h2>
                <span className="bg-rose-100 text-rose-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {totalCheckedIn} inside
                </span>
              </div>
              <button
                onClick={() => setShowEvacList(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-5">
              {evacGroups.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No visitors currently checked in.</p>
              ) : (
                evacGroups.map(({ zoneId, zoneName, members }) => (
                  <div key={zoneId}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{zoneName}</h3>
                      <span className="text-xs text-gray-500">{members.length} visitor{members.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="space-y-2">
                      {members.map((u, idx) => {
                        const age = calculateAge(u.dateOfBirth);
                        const priority = age !== null && age < 13 ? 'child' : age !== null && age < 18 ? 'teen' : 'adult';
                        return (
                          <div key={u.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                              {idx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-sm">{u.name}</p>
                              <p className="text-xs text-gray-500">
                                {age !== null ? `${age} yrs` : 'Age unknown'} · {u.gender || '—'}
                                {u.medicalInfo ? ` · ⚠ ${u.medicalInfo}` : ''}
                              </p>
                            </div>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              priority === 'child'
                                ? 'bg-blue-100 text-blue-700'
                                : priority === 'teen'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-purple-100 text-purple-700'
                            }`}>
                              {priority === 'child' ? 'Child' : priority === 'teen' ? 'Teen' : 'Adult'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-rose-50 rounded-b-2xl">
              <p className="text-xs text-rose-700 font-medium">
                Evacuate children first, then teens, then adults. Account for all visitors before clearing the facility.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EmergencyBanner;
