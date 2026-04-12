import React, { useState, useMemo } from 'react';
import { ArrowRightLeft, Check, AlertTriangle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { getEligibleZones } from '../../utils/zoneEligibility';
import OccupancyBar from '../../components/ui/OccupancyBar';

const ZoneReassignment = () => {
  const { users, zones, dispatch } = useData();
  const { success, error } = useToast();
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const checkedInUsers = useMemo(() => {
    return users.filter(u => u.isCheckedIn);
  }, [users]);

  const currentZone = selectedUser ? zones.find(z => z.id === selectedUser.assignedZoneId) : null;

  const eligibleZones = useMemo(() => {
    if (!selectedUser) return [];
    return getEligibleZones(selectedUser.dateOfBirth, zones)
      .filter(z => z.id !== selectedUser.assignedZoneId);
  }, [selectedUser, zones]);

  const handleReassign = async () => {
    if (!selectedUser || !selectedZone) return;

    const reassignedUserId = await dispatch({
      type: 'UPDATE_USER',
      payload: {
        ...selectedUser,
        assignedZoneId: selectedZone.id
      }
    });

    if (!reassignedUserId) {
      error('Zone reassignment failed. Please try again.');
      return;
    }

    success(`${selectedUser.name} reassigned to ${selectedZone.zoneName}`);
    setSelectedUser(null);
    setSelectedZone(null);
    setShowConfirmation(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Zone Reassignment</h1>
        <p className="text-gray-500">Move users between eligible zones</p>
      </div>

      {!showConfirmation ? (
        <div className="space-y-6">
          {/* Step 1: Select User */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">1</span>
              Select User
            </h3>
            
            <select
              value={selectedUser?.id || ''}
              onChange={(e) => {
                const user = checkedInUsers.find(u => u.id === e.target.value);
                setSelectedUser(user);
                setSelectedZone(null);
              }}
              className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a checked-in user...</option>
              {checkedInUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({zones.find(z => z.id === user.assignedZoneId)?.zoneName})
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Current & Available Zones */}
          {selectedUser && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-slide-up">
              <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">2</span>
                Select New Zone
              </h3>

              {/* Current Zone */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-sm text-gray-500 mb-1">Current Zone</p>
                <p className="font-medium text-gray-900">{currentZone?.zoneName}</p>
                <OccupancyBar 
                  current={currentZone?.currentOccupancy}
                  max={currentZone?.capacity}
                  size="sm"
                />
              </div>

              {/* Arrow */}
              <div className="flex justify-center my-4">
                <ArrowRightLeft className="w-6 h-6 text-gray-400" />
              </div>

              {/* Available Zones */}
              {eligibleZones.length === 0 ? (
                <div className="text-center py-6 bg-amber-50 rounded-xl border border-amber-200">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-amber-800">No eligible zones available</p>
                  <p className="text-sm text-amber-600">All other zones for this age group are at capacity</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {eligibleZones.map(zone => (
                    <button
                      key={zone.id}
                      onClick={() => setSelectedZone(zone)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
                        selectedZone?.id === zone.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-gray-900">{zone.zoneName}</p>
                        {selectedZone?.id === zone.id && (
                          <Check className="w-5 h-5 text-indigo-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{zone.activityType}</p>
                      <div className="mt-2">
                        <OccupancyBar 
                          current={zone.currentOccupancy}
                          max={zone.capacity}
                          size="sm"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Button */}
          {selectedUser && selectedZone && (
            <button
              onClick={() => setShowConfirmation(true)}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
              Proceed with Reassignment
            </button>
          )}
        </div>
      ) : (
        /* Confirmation */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-slide-up">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowRightLeft className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Confirm Reassignment</h3>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">User</span>
              <span className="font-medium">{selectedUser.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">From</span>
              <span className="font-medium">{currentZone?.zoneName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">To</span>
              <span className="font-medium text-indigo-600">{selectedZone.zoneName}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirmation(false)}
              className="flex-1 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleReassign}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
            >
              Confirm Reassignment
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZoneReassignment;
