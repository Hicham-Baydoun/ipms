import React, { useState, useMemo } from 'react';
import { Search, Clock, Check, User, MapPin, AlertTriangle, X } from 'lucide-react';
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

  const checkedInUsers = useMemo(() => users.filter(u => u.isCheckedIn), [users]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return checkedInUsers;
    return checkedInUsers.filter(u =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.braceletId?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [checkedInUsers, searchTerm]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSelectedPickupPerson(null);
    setShowConfirmation(false);
    setSearchTerm('');
  };

  const handleBack = () => {
    setSelectedUser(null);
    setSelectedPickupPerson(null);
    setShowConfirmation(false);
  };

  const getUserZone = (zoneId) => zones.find(z => z.id === zoneId);
  const getUserGuardian = (guardianId) => guardians.find(g => g.id === guardianId);

  const getSessionDuration = () => {
    if (!selectedUser?.checkInTime) return '-';
    const checkInDate = toDate(selectedUser.checkInTime);
    if (!checkInDate) return '-';
    return formatDuration(differenceInMinutes(new Date(), checkInDate));
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
  const userGuardian = selectedUser ? getUserGuardian(selectedUser.guardianId || selectedUser.guardianUid) : null;
  const authorizedPickupList = userGuardian?.authorizedPickup?.length ? userGuardian.authorizedPickup : null;
  // Only block checkout if under 10 AND there IS a pickup list to choose from
  const requiresPickupVerification = userAge !== null && userAge < 10 && Boolean(authorizedPickupList);

  /* ── User list ── */
  if (!selectedUser) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Check Out</h1>
          <p className="text-gray-500">
            {checkedInUsers.length} visitor{checkedInUsers.length !== 1 ? 's' : ''} currently inside
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-slide-up">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Search by name or bracelet ID..."
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Checked-in list */}
          {filteredUsers.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="font-medium">
                {checkedInUsers.length === 0 ? 'No visitors currently checked in' : 'No results found'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map(user => {
                const zone = getUserZone(user.assignedZoneId);
                return (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="w-full p-4 bg-gray-50 hover:bg-indigo-50 rounded-xl text-left transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">
                          {zone?.zoneName || '—'} · {user.braceletId}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                      Inside
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Confirmation screen ── */
  if (showConfirmation) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-slide-up">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Confirm Check Out</h3>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-500">Visitor</span>
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
      </div>
    );
  }

  /* ── Detail / pickup screen ── */
  return (
    <div className="max-w-2xl mx-auto">
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

        {/* Pickup Verification — only if under 10 AND authorized list exists */}
        {requiresPickupVerification && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Verify Pickup Person</h4>
            <div className="space-y-2">
              {authorizedPickupList.map(person => (
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
                  <p className="text-sm text-gray-500">{person.relation} · {person.contact}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleBack}
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
    </div>
  );
};

export default CheckOut;
