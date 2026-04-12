import React, { useState, useMemo } from 'react';
import { Search, UserPlus, Check, ChevronRight, ChevronLeft, AlertTriangle } from 'lucide-react';
import { useAppData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { calculateAge } from '../../utils/ageCalculator';
import { getEligibleZones } from '../../utils/zoneEligibility';
import { generateBraceletId } from '../../utils/braceletGenerator';
import { sanitizeInput } from '../../utils/sanitize';
import { validateName, validatePhone } from '../../utils/validators';

const CheckIn = () => {
  const { users, zones, dispatch, emergencyMode } = useAppData();
  const { success, error } = useToast();
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [braceletId, setBraceletId] = useState('');
  
  const [newUserData, setNewUserData] = useState({
    name: '',
    dateOfBirth: '',
    gender: 'Male',
    guardianName: '',
    guardianContact: '',
    medicalInfo: '',
    allergies: ''
  });
  const [errors, setErrors] = useState({});

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return [];
    return users.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) && !u.isCheckedIn
    ).slice(0, 5);
  }, [users, searchTerm]);

  const eligibleZones = useMemo(() => {
    if (!selectedUser && !isNewUser) return [];
    const dob = isNewUser ? newUserData.dateOfBirth : selectedUser?.dateOfBirth;
    return getEligibleZones(dob, zones);
  }, [selectedUser, isNewUser, newUserData.dateOfBirth, zones]);

  const handleSelectExistingUser = (user) => {
    setSelectedUser(user);
    setStep(2);
  };

  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUserData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validateNewUser = () => {
    const newErrors = {};
    const nameError = validateName(newUserData.name);
    if (nameError) newErrors.name = nameError;
    if (!newUserData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    const phoneError = validatePhone(newUserData.guardianContact);
    if (phoneError) newErrors.guardianContact = phoneError;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateNewUser = async () => {
    if (!validateNewUser()) return;

    const newUserPayload = {
      name: sanitizeInput(newUserData.name),
      fullName: sanitizeInput(newUserData.name),
      dateOfBirth: newUserData.dateOfBirth,
      gender: newUserData.gender,
      guardianName: sanitizeInput(newUserData.guardianName || ''),
      guardianContact: sanitizeInput(newUserData.guardianContact || ''),
      guardianId: null,
      isCheckedIn: false,
      assignedZoneId: null,
      braceletId: null,
      checkInTime: null,
      medicalInfo: sanitizeInput(newUserData.medicalInfo),
      allergies: sanitizeInput(newUserData.allergies)
    };

    const createdUserId = await dispatch({ type: 'ADD_USER', payload: newUserPayload });
    if (!createdUserId) {
      error('Could not create user. Please verify Firebase is configured and try again.');
      return;
    }

    setSelectedUser({
      id: createdUserId,
      ...newUserPayload
    });
    setStep(2);
  };

  const handleSelectZone = (zone) => {
    setSelectedZone(zone);
    setBraceletId(generateBraceletId());
    setStep(4);
  };

  const handleConfirmCheckIn = async () => {
    if (emergencyMode) return;

    const checkedInUserId = await dispatch({
      type: 'CHECK_IN_USER', 
      payload: { 
        userId: selectedUser.id, 
        zoneId: selectedZone.id,
        braceletId
      }
    });

    if (!checkedInUserId) {
      error('Check-in failed. Please try again.');
      return;
    }

    success(`${selectedUser.name} checked in successfully!`);
    setStep(1);
    setSearchTerm('');
    setSelectedUser(null);
    setSelectedZone(null);
    setBraceletId('');
    setIsNewUser(false);
    setNewUserData({
      name: '',
      dateOfBirth: '',
      gender: 'Male',
      guardianName: '',
      guardianContact: '',
      medicalInfo: '',
      allergies: ''
    });
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 animate-fade-slide-up">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsNewUser(false)}
                className={`flex-1 py-4 px-6 rounded-xl border-2 transition-all ${
                  !isNewUser 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Search className="w-6 h-6 mx-auto mb-2" />
                <p className="font-medium">Search Existing User</p>
              </button>
              <button
                onClick={() => setIsNewUser(true)}
                className={`flex-1 py-4 px-6 rounded-xl border-2 transition-all ${
                  isNewUser 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <UserPlus className="w-6 h-6 mx-auto mb-2" />
                <p className="font-medium">Register New User</p>
              </button>
            </div>

            {!isNewUser ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search by name
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Type a name..."
                  />
                </div>
                {filteredUsers.length > 0 && (
                  <div className="mt-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {filteredUsers.map(user => (
                      <button
                        key={user.id}
                        onClick={() => handleSelectExistingUser(user)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-0"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">
                            Age: {calculateAge(user.dateOfBirth)} | {user.gender}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={newUserData.name}
                      onChange={handleNewUserChange}
                      className={`w-full px-3 py-2 border rounded-lg ${errors.name ? 'border-rose-500' : 'border-gray-200'}`}
                    />
                    {errors.name && <p className="text-sm text-rose-500 mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={newUserData.dateOfBirth}
                      onChange={handleNewUserChange}
                      className={`w-full px-3 py-2 border rounded-lg ${errors.dateOfBirth ? 'border-rose-500' : 'border-gray-200'}`}
                    />
                    {errors.dateOfBirth && <p className="text-sm text-rose-500 mt-1">{errors.dateOfBirth}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select
                      name="gender"
                      value={newUserData.gender}
                      onChange={handleNewUserChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Contact</label>
                    <input
                      type="tel"
                      name="guardianContact"
                      value={newUserData.guardianContact}
                      onChange={handleNewUserChange}
                      className={`w-full px-3 py-2 border rounded-lg ${errors.guardianContact ? 'border-rose-500' : 'border-gray-200'}`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medical Info</label>
                  <textarea
                    name="medicalInfo"
                    value={newUserData.medicalInfo}
                    onChange={handleNewUserChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none"
                    rows="2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                  <input
                    type="text"
                    name="allergies"
                    value={newUserData.allergies}
                    onChange={handleNewUserChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <button
                  onClick={handleCreateNewUser}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        );

      case 2:
        const age = calculateAge(selectedUser?.dateOfBirth);
        return (
          <div className="space-y-6 animate-fade-slide-up">
            <div className="bg-indigo-50 rounded-xl p-4">
              <h3 className="font-semibold text-indigo-900">Selected User</h3>
              <p className="text-indigo-700">{selectedUser?.name}</p>
              <p className="text-sm text-indigo-600">Age: {age} years</p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3">Select Zone</h3>
              {eligibleZones.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                  <p className="text-gray-500">No eligible zones available</p>
                  <p className="text-sm text-gray-400">All zones for this age group are at capacity</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {eligibleZones.map(zone => (
                    <button
                      key={zone.id}
                      onClick={() => handleSelectZone(zone)}
                      className="p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-indigo-500 transition-colors text-left"
                    >
                      <p className="font-medium text-gray-900">{zone.zoneName}</p>
                      <p className="text-sm text-gray-500">{zone.activityType}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {zone.currentOccupancy} / {zone.capacity} occupied
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 animate-fade-slide-up">
            <div className="text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Ready to Check In</h3>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">User</span>
                <span className="font-medium">{selectedUser?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Zone</span>
                <span className="font-medium">{selectedZone?.zoneName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Bracelet ID</span>
                <span className="font-mono font-medium text-indigo-600">{braceletId}</span>
              </div>
              {selectedUser?.medicalInfo && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
                  <p className="text-sm text-amber-800">
                    <strong>Medical Alert:</strong> {selectedUser.medicalInfo}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleConfirmCheckIn}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700"
              >
                Confirm Check In
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (emergencyMode) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <h1 className="text-xl font-semibold text-rose-900">Check-in is disabled</h1>
              <p className="text-sm text-rose-700 mt-1">
                Emergency mode is active. New check-ins are temporarily blocked until the emergency is cleared.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Check In User</h1>
        <p className="text-gray-500">Step {step} of 3</p>
      </div>

      {/* Progress */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 4].map((s) => (
          <div 
            key={s}
            className={`flex-1 h-2 rounded-full ${
              step >= s ? 'bg-indigo-600' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {renderStep()}
      </div>
    </div>
  );
};

export default CheckIn;
