import React, { useState, useMemo } from 'react';
import { Search, Clock, Check, User, MapPin, AlertTriangle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { calculateAge } from '../../utils/ageCalculator';
import { formatDuration, toDate } from '../../utils/formatters';
import { differenceInMinutes } from 'date-fns';

const CheckOut = () => {
  const { users, zones, guardians, dispatch } = useData();
  const { success, error } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPickupPerson, setSelectedPickupPerson] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const checkedInUsers = useMemo(() => {
    return users.filter(u => u.isCheckedIn);
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return [];
    return checkedInUsers.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.braceletId?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);
  }, [checkedInUsers, searchTerm]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSearchTerm('');
  };

  const getUserZone = (zoneId) => zones.find(z => z.id === zoneId);
  
  const getUserGuardian = (guardianId) => guardians.find(g => g.id === guardianId);

  const getSessionDuration = () => {
    if (!selectedUser?.checkInTime) return '-';
    const checkInDate = toDate(selectedUser.checkInTime);
    if (!checkInDate) return '-';
    const minutes = differenceInMinutes(new Date(), checkInDate);
    return formatDuration(minutes);
  };

  const handleCheckOut = async () => {
    const checkedOutUserId = await dispatch({
      type: 'CHECK_OUT_USER',
      payload: {
        userId: selectedUser.id,
        zoneId: selectedUser.assignedZoneId,
        pickupPerson: selectedPickupPerson || null
      }
    });

    if (!checkedOutUserId) {
      error('Check-out failed. Please try again.');
      return;
    }

    success(`${selectedUser.name} checked out successfully!`);
    setSelectedUser(null);
    setSelectedPickupPerson(null);
    setShowConfirmation(false);
  };

  const userAge = selectedUser ? calculateAge(selectedUser.dateOfBirth) : 0;
  const requiresPickupVerification = userAge < 10;
  const userGuardian = selectedUser ? getUserGuardian(selectedUser.guardianId) : null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Check Out User</h1>
        <p className="text-gray-500">Search and verify user checkout</p>
      </div>

      {!selectedUser ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-slide-up">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search by name or bracelet ID
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Type name or scan bracelet..."
            />
          </div>

          {filteredUsers.length > 0 && (
            <div className="mt-4 space-y-2">
              {filteredUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className="w-full p-4 bg-gray-50 hover:bg-indigo-50 rounded-xl text-left transition-colors flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">
                      {getUserZone(user.assignedZoneId)?.zoneName} • {user.braceletId}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-indigo-600" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {searchTerm && filteredUsers.length === 0 && (
            <div className="mt-4 text-center py-8">
              <p className="text-gray-500">No checked-in users found</p>
            </div>
          )}
        </div>
      ) : showConfirmation ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-slide-up">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Confirm Check Out</h3>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-500">User</span>
              <span className="font-medium">{selectedUser.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Zone</span>
              <span className="font-medium">{getUserZone(selectedUser.assignedZoneId)?.zoneName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Duration</span>
              <span className="font-medium">{getSessionDuration()}</span>
            </div>
            {selectedPickupPerson && (
              <div className="flex justify-between">
                <span className="text-gray-500">Picked up by</span>
                <span className="font-medium">{selectedPickupPerson.name} ({selectedPickupPerson.relation})</span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirmation(false)}
              className="flex-1 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleCheckOut}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700"
            >
              Confirm Check Out
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-slide-up">
          {/* User Info */}
          <div className="bg-indigo-50 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-indigo-900">{selectedUser.name}</h3>
                <p className="text-sm text-indigo-700">Age: {userAge} years</p>
                <p className="text-sm text-indigo-600">Bracelet: {selectedUser.braceletId}</p>
              </div>
            </div>
          </div>

          {/* Current Zone */}
          <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
            <MapPin className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Current Zone</p>
              <p className="font-medium">{getUserZone(selectedUser.assignedZoneId)?.zoneName}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{getSessionDuration()}</span>
            </div>
          </div>

          {/* Medical Alerts */}
          {(selectedUser.medicalInfo || selectedUser.allergies) && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h4 className="font-medium text-amber-800">Medical Information</h4>
              </div>
              {selectedUser.medicalInfo && (
                <p className="text-sm text-amber-700 mb-1">
                  <strong>Conditions:</strong> {selectedUser.medicalInfo}
                </p>
              )}
              {selectedUser.allergies && (
                <p className="text-sm text-amber-700">
                  <strong>Allergies:</strong> {selectedUser.allergies}
                </p>
              )}
            </div>
          )}

          {/* Pickup Verification (for users under 10) */}
          {requiresPickupVerification && userGuardian?.authorizedPickup ? (
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Verify Pickup Person</h4>
              <div className="space-y-2">
                {userGuardian.authorizedPickup.map(person => (
                  <button
                    key={person.id}
                    onClick={() => setSelectedPickupPerson(person)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
                      selectedPickupPerson?.id === person.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-gray-900">{person.name}</p>
                    <p className="text-sm text-gray-500">{person.relation} • {person.contact}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedUser(null)}
              className="flex-1 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowConfirmation(true)}
              disabled={requiresPickupVerification && !selectedPickupPerson}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Proceed to Check Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckOut;
