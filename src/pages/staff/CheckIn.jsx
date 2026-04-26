import React, { useState, useMemo } from 'react';
import { Search, Check, ChevronLeft, ChevronRight, AlertTriangle, X, User } from 'lucide-react';
import { useAppData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { calculateAge } from '../../utils/ageCalculator';
import { getEligibleZones } from '../../utils/zoneEligibility';
import { generateBraceletId } from '../../utils/braceletGenerator';
import { sanitizeInput } from '../../utils/sanitize';
import { validateName } from '../../utils/validators';

const CheckIn = () => {
  const { users, zones, guardians, dispatch, emergencyMode } = useAppData();
  const { success, error } = useToast();

  const [step, setStep] = useState(1);
  const [searchMode, setSearchMode] = useState('guardian'); // 'guardian' | 'returning' | 'new'
  // Guardian search
  const [guardianSearch, setGuardianSearch] = useState('');
  const [selectedGuardian, setSelectedGuardian] = useState(null);
  // Returning adult search
  const [returningSearch, setReturningSearch] = useState('');
  // Selected children/adults to check in
  const [selectedChildren, setSelectedChildren] = useState([]);
  // Zone + bracelets
  const [selectedZone, setSelectedZone] = useState(null);
  const [braceletIds, setBraceletIds] = useState({});
  // New user form
  const [newUserData, setNewUserData] = useState({
    name: '', dateOfBirth: '', gender: 'Male', medicalInfo: '', allergies: ''
  });
  const [errors, setErrors] = useState({});

  /* ── derived data ── */

  const filteredGuardians = useMemo(() => {
    if (selectedGuardian) return [];
    if (!guardianSearch) return guardians;
    return guardians.filter(g => g.name?.toLowerCase().includes(guardianSearch.toLowerCase()));
  }, [guardians, guardianSearch, selectedGuardian]);

  const guardianChildren = useMemo(() => {
    if (!selectedGuardian?.childrenIds?.length) return [];
    return users.filter(u => selectedGuardian.childrenIds.includes(u.id) && !u.isCheckedIn);
  }, [selectedGuardian, users]);

  // Returning adults: no guardian, not currently checked in
  const returningAdults = useMemo(() => {
    const adults = users.filter(u => !u.guardianUid && !u.guardianId && !u.isCheckedIn);
    if (!returningSearch) return adults;
    return adults.filter(u => u.name?.toLowerCase().includes(returningSearch.toLowerCase()));
  }, [users, returningSearch]);

  const eligibleZones = useMemo(() => {
    if (!selectedChildren.length && searchMode !== 'new') return [];
    const dob = searchMode === 'new' ? newUserData.dateOfBirth : selectedChildren[0]?.dateOfBirth;
    return getEligibleZones(dob, zones);
  }, [selectedChildren, searchMode, newUserData.dateOfBirth, zones]);

  /* ── helpers ── */

  const resetFlow = () => {
    setStep(1);
    setGuardianSearch('');
    setSelectedGuardian(null);
    setReturningSearch('');
    setSelectedChildren([]);
    setSelectedZone(null);
    setBraceletIds({});
    setErrors({});
    setNewUserData({ name: '', dateOfBirth: '', gender: 'Male', medicalInfo: '', allergies: '' });
  };

  /* ── guardian child selection ── */

  const toggleChild = (child) => {
    setSelectedChildren(prev =>
      prev.some(c => c.id === child.id) ? prev.filter(c => c.id !== child.id) : [...prev, child]
    );
  };

  const allSelected = guardianChildren.length > 0 && selectedChildren.length === guardianChildren.length;

  const toggleAllChildren = () => {
    setSelectedChildren(allSelected ? [] : [...guardianChildren]);
  };

  const proceedWithSelection = (children) => {
    const ids = {};
    children.forEach(c => { ids[c.id] = generateBraceletId(); });
    setBraceletIds(ids);
    setSelectedChildren(children);
    setStep(2);
  };

  /* ── step handlers ── */

  const handleSelectZone = (zone) => {
    setSelectedZone(zone);
    setStep(4);
  };

  const handleConfirmCheckIn = async () => {
    if (emergencyMode) return;
    let allOk = true;
    for (const child of selectedChildren) {
      const result = await dispatch({
        type: 'CHECK_IN_USER',
        payload: {
          userId: child.id,
          zoneId: selectedZone.id,
          braceletId: braceletIds[child.id] || generateBraceletId()
        }
      });
      if (!result) allOk = false;
    }
    if (!allOk) {
      error('One or more check-ins failed. Please try again.');
      return;
    }
    const names = selectedChildren.map(c => c.name).join(', ');
    success(`${names} checked in to ${selectedZone.zoneName}!`);
    resetFlow();
  };

  /* ── new user ── */

  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUserData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const newVisitorAge = useMemo(
    () => (newUserData.dateOfBirth ? calculateAge(newUserData.dateOfBirth) : null),
    [newUserData.dateOfBirth]
  );

  const newVisitorIsAdult = newVisitorAge !== null && newVisitorAge >= 18;

  const validateNewUser = () => {
    const newErrors = {};
    const nameError = validateName(newUserData.name);
    if (nameError) newErrors.name = nameError;
    if (!newUserData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (newUserData.dateOfBirth && !newVisitorIsAdult) {
      newErrors.dateOfBirth = 'Only adults (18+) can be checked in without a guardian account.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateNewUser = async () => {
    if (!validateNewUser()) return;
    const payload = {
      name: sanitizeInput(newUserData.name),
      fullName: sanitizeInput(newUserData.name),
      dateOfBirth: newUserData.dateOfBirth,
      gender: newUserData.gender,
      guardianId: null,
      isCheckedIn: false,
      assignedZoneId: null,
      braceletId: null,
      checkInTime: null,
      medicalInfo: sanitizeInput(newUserData.medicalInfo),
      allergies: sanitizeInput(newUserData.allergies)
    };
    const createdId = await dispatch({ type: 'ADD_USER', payload });
    if (!createdId) {
      error('Could not create user. Please verify Firebase is configured and try again.');
      return;
    }
    proceedWithSelection([{ id: createdId, ...payload }]);
  };


  /* ── render: step 1 ── */

  const renderStep1 = () => (
    <div className="space-y-5 animate-fade-slide-up">
      {/* Mode selector */}
      <div className="flex gap-2">
        {[
          { id: 'guardian', label: 'By Guardian' },
          { id: 'returning', label: 'Returning Adult' },
          { id: 'new', label: 'New Adult' }
        ].map(m => (
          <button
            key={m.id}
            onClick={() => {
              setSearchMode(m.id);
              setGuardianSearch('');
              setSelectedGuardian(null);
              setReturningSearch('');
              setSelectedChildren([]);
            }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
              searchMode === m.id
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Search by guardian */}
      {searchMode === 'guardian' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={guardianSearch}
              onChange={e => { setGuardianSearch(e.target.value); setSelectedGuardian(null); setSelectedChildren([]); }}
              className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Search guardian by name..."
              autoFocus
            />
            {guardianSearch && (
              <button
                onClick={() => { setGuardianSearch(''); setSelectedGuardian(null); setSelectedChildren([]); }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Guardian list */}
          {filteredGuardians.length === 0 && !selectedGuardian && (
            <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-xl">
              <p className="font-medium">{guardianSearch ? 'No guardians match your search' : 'No guardian accounts registered yet'}</p>
            </div>
          )}
          {filteredGuardians.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden max-h-72 overflow-y-auto">
              {filteredGuardians.map(g => (
                <button
                  key={g.id}
                  onClick={() => { setSelectedGuardian(g); setGuardianSearch(g.name); }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-0 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{g.name}</p>
                    <p className="text-sm text-gray-500">{g.phone} · {g.childrenIds?.length || 0} child(ren)</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              ))}
            </div>
          )}

          {/* Selected guardian's children */}
          {selectedGuardian && (
            <div className="space-y-3">
              <div className="bg-indigo-50 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-indigo-900">{selectedGuardian.name}</p>
                  <p className="text-sm text-indigo-600">{selectedGuardian.phone}</p>
                </div>
                <button
                  onClick={() => { setSelectedGuardian(null); setGuardianSearch(''); setSelectedChildren([]); }}
                  className="p-1 hover:bg-indigo-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-indigo-500" />
                </button>
              </div>

              {guardianChildren.length === 0 ? (
                <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-xl">
                  <p className="font-medium">All children are already checked in</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700">Select children to check in:</p>
                    <button
                      onClick={toggleAllChildren}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      {allSelected ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {guardianChildren.map(child => {
                      const isSelected = selectedChildren.some(c => c.id === child.id);
                      return (
                        <button
                          key={child.id}
                          onClick={() => toggleChild(child)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                            isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{child.name}</p>
                            <p className="text-sm text-gray-500">Age: {calculateAge(child.dateOfBirth)} · {child.gender}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => proceedWithSelection(selectedChildren)}
                    disabled={selectedChildren.length === 0}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Continue — {selectedChildren.length === 0 ? 'select children' : `${selectedChildren.length} selected`}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Returning adult search */}
      {searchMode === 'returning' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={returningSearch}
              onChange={e => setReturningSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Search by name..."
              autoFocus
            />
            {returningSearch && (
              <button onClick={() => setReturningSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {returningAdults.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl text-gray-400">
              <p className="font-medium">
                {returningSearch ? 'No adults match your search' : 'No returning adults on record'}
              </p>
              <p className="text-sm mt-1">Use "New Adult" to register a first-time visitor</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {returningAdults.map(adult => (
                <button
                  key={adult.id}
                  onClick={() => proceedWithSelection([adult])}
                  className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-indigo-50 rounded-xl text-left transition-colors border border-transparent hover:border-indigo-200"
                >
                  <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{adult.name}</p>
                    <p className="text-sm text-gray-500">
                      {adult.dateOfBirth ? `${calculateAge(adult.dateOfBirth)} yrs · ` : ''}{adult.gender}
                      {adult.medicalInfo ? ' · ⚠ Medical info' : ''}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New visitor form */}
      {searchMode === 'new' && (
        <div className="space-y-4">
          {newVisitorAge !== null && (
            <div className={`text-xs font-medium px-3 py-1.5 rounded-lg inline-block ${
              newVisitorIsAdult
                ? 'bg-purple-100 text-purple-700'
                : newVisitorAge >= 13
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-blue-100 text-blue-700'
            }`}>
              {newVisitorIsAdult ? 'Adult (18+)' : newVisitorAge >= 13 ? `Teen (${newVisitorAge} yrs)` : `Child (${newVisitorAge} yrs)`}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                name="name"
                value={newUserData.name}
                onChange={handleNewUserChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.name ? 'border-rose-500' : 'border-gray-200'}`}
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
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.dateOfBirth ? 'border-rose-500' : 'border-gray-200'}`}
              />
              {errors.dateOfBirth && <p className="text-sm text-rose-500 mt-1">{errors.dateOfBirth}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select
              name="gender"
              value={newUserData.gender}
              onChange={handleNewUserChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          {newUserData.dateOfBirth && !newVisitorIsAdult && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
              <p className="text-sm text-rose-700 font-medium">Only adults (18+) can be checked in without a guardian account.</p>
              <p className="text-xs text-rose-600 mt-1">If this is a child, the guardian must register an account first.</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medical Info</label>
            <textarea
              name="medicalInfo"
              value={newUserData.medicalInfo}
              onChange={handleNewUserChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Peanuts, Shellfish"
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

  /* ── render: step 2 (zone selection) ── */

  const renderStep2 = () => (
    <div className="space-y-6 animate-fade-slide-up">
      <div className="bg-indigo-50 rounded-xl p-4">
        <p className="text-sm text-indigo-600 font-medium mb-1">Checking in:</p>
        <p className="font-semibold text-indigo-900">
          {selectedChildren.map(c => c.name).join(', ')}
        </p>
        {selectedChildren.length > 1 && (
          <p className="text-sm text-indigo-600 mt-0.5">{selectedChildren.length} children · same zone for all</p>
        )}
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-3">Select Zone</h3>
        {eligibleZones.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <p className="text-gray-500">No eligible zones available</p>
            <p className="text-sm text-gray-400 mt-1">All zones for this age group are at capacity</p>
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
                <p className="text-sm text-gray-500 mt-1">{zone.currentOccupancy} / {zone.capacity} occupied</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <button onClick={() => setStep(1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>
    </div>
  );

  /* ── render: step 4 (confirm) ── */

  const renderStep4 = () => (
    <div className="space-y-6 animate-fade-slide-up">
      <div className="text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-10 h-10 text-emerald-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900">Ready to Check In</h3>
      </div>

      <div className="bg-gray-50 rounded-xl p-6 space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-500">Zone</span>
          <span className="font-medium">{selectedZone?.zoneName}</span>
        </div>
        {selectedChildren.map(child => (
          <div key={child.id} className="border-t border-gray-200 pt-3 space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Child</span>
              <span className="font-medium">{child.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Bracelet</span>
              <span className="font-mono font-medium text-indigo-600">{braceletIds[child.id]}</span>
            </div>
            {child.medicalInfo && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mt-1">
                <p className="text-xs text-amber-800"><strong>Medical Alert:</strong> {child.medicalInfo}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setStep(2)}
          className="flex-1 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleConfirmCheckIn}
          className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
        >
          Confirm Check In
        </button>
      </div>
    </div>
  );

  /* ── emergency block ── */

  if (emergencyMode) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <h1 className="text-xl font-semibold text-rose-900">Check-in is disabled</h1>
              <p className="text-sm text-rose-700 mt-1">
                Emergency mode is active. New check-ins are blocked until the emergency is cleared.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── main render ── */

  const stepCurrent = step === 1 ? 1 : step === 2 ? 2 : 3;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Check In</h1>
          <p className="text-gray-500 text-sm">Step {stepCurrent} of 3</p>
        </div>
        {step > 1 && (
          <button
            onClick={resetFlow}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map(s => (
          <div
            key={s}
            className={`flex-1 h-2 rounded-full transition-colors ${stepCurrent >= s ? 'bg-indigo-600' : 'bg-gray-200'}`}
          />
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 4 && renderStep4()}
      </div>
    </div>
  );
};

export default CheckIn;
