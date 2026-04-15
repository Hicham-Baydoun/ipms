import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ChevronLeft, ChevronRight, Plus, Trash2, CheckCircle } from 'lucide-react';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { addDoc, collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { sanitizeInput } from '../../utils/sanitize';
import { validateEmail, validateName, validatePhone } from '../../utils/validators';
import { generateUsername } from '../../utils/usernameGenerator';
import { useToast } from '../../context/ToastContext';

const GuardianRegisterPage = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [step, setStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationError, setRegistrationError] = useState('');
  
  const [guardianData, setGuardianData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: ''
  });
  
  const [children, setChildren] = useState([
    { name: '', dateOfBirth: '', gender: 'Male', medicalInfo: '', allergies: '' }
  ]);
  
  const [errors, setErrors] = useState({});

  const handleGuardianChange = (e) => {
    const { name, value } = e.target;
    setGuardianData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    if (registrationError) setRegistrationError('');
  };

  const handleChildChange = (index, field, value) => {
    setChildren(prev => prev.map((child, i) => 
      i === index ? { ...child, [field]: value } : child
    ));
  };

  const addChild = () => {
    setChildren(prev => [...prev, { 
      name: '', 
      dateOfBirth: '', 
      gender: 'Male', 
      medicalInfo: '', 
      allergies: '' 
    }]);
  };

  const removeChild = (index) => {
    if (children.length > 1) {
      setChildren(prev => prev.filter((_, i) => i !== index));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    const nameError = validateName(guardianData.name);
    if (nameError) newErrors.name = nameError;
    
    const emailError = validateEmail(guardianData.email);
    if (emailError) newErrors.email = emailError;
    
    const phoneError = validatePhone(guardianData.phone);
    if (phoneError) newErrors.phone = phoneError;

    if (!guardianData.password || guardianData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!guardianData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (guardianData.confirmPassword !== guardianData.password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    let hasError = false;
    
    children.forEach((child, index) => {
      if (!child.name.trim()) {
        newErrors[`child_${index}_name`] = 'Name is required';
        hasError = true;
      }
      if (!child.dateOfBirth) {
        newErrors[`child_${index}_dob`] = 'Date of birth is required';
        hasError = true;
      }
    });

    setErrors(newErrors);
    return !hasError;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep2()) return;
    if (isSubmitting) return;

    const getRegistrationErrorMessage = (registrationIssue) => {
      switch (registrationIssue?.code) {
        case 'auth/email-already-in-use':
          return 'This email is already registered.';
        case 'auth/invalid-email':
          return 'Please enter a valid email address.';
        case 'auth/weak-password':
          return 'Password is too weak. Use at least 6 characters.';
        default:
          return registrationIssue?.message || 'Registration failed. Please try again.';
      }
    };

    setRegistrationError('');
    setIsSubmitting(true);

    try {
      const guardianName = sanitizeInput(guardianData.name);
      const guardianEmail = sanitizeInput(guardianData.email).toLowerCase();
      const guardianPhone = sanitizeInput(guardianData.phone);

      const username = generateUsername(guardianName, []);

      const credential = await createUserWithEmailAndPassword(auth, guardianEmail, guardianData.password);
      const guardianUid = credential.user.uid;

      await setDoc(doc(db, 'guardians', guardianUid), {
        name: guardianName,
        email: guardianEmail,
        phone: guardianPhone,
        username,
        childrenIds: [],
        authorizedPickup: []
      });

      // Register email in public index so password reset can verify guardian accounts
      await setDoc(doc(db, 'guardianEmails', guardianEmail), { exists: true });

      const childIds = [];
      for (const child of children) {
        const childRef = await addDoc(collection(db, 'users'), {
          fullName: sanitizeInput(child.name),
          dateOfBirth: child.dateOfBirth ? new Date(child.dateOfBirth) : null,
          gender: child.gender,
          guardianName,
          guardianContact: guardianPhone,
          guardianUid,
          medicalInfo: sanitizeInput(child.medicalInfo || ''),
          allergies: sanitizeInput(child.allergies || ''),
          assignedZoneId: null,
          checkInTime: null,
          checkOutTime: null,
          isCheckedIn: false,
          braceletId: null
        });
        childIds.push(childRef.id);
      }

      await updateDoc(doc(db, 'guardians', guardianUid), { childrenIds: childIds });
      await signOut(auth);

      setIsComplete(true);
      success('Registration successful! Welcome to IPMS.');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (registrationIssue) {
      console.error('Guardian registration failed:', registrationIssue);
      const message = getRegistrationErrorMessage(registrationIssue);
      setRegistrationError(message);
      error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center animate-fade-slide-up">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Registration Complete!
          </h1>
          <p className="text-gray-500 mb-6">
            Your account has been created successfully.
          </p>
          <p className="text-sm text-gray-400">
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate('/login')}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Guardian Registration</h1>
              <p className="text-sm text-gray-500">Step {step} of 2</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-200 rounded-full h-2 mb-8">
          <div 
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8">
          {step === 1 ? (
            <div className="animate-fade-slide-up">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Account Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={guardianData.name}
                    onChange={handleGuardianChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.name ? 'border-rose-500' : 'border-gray-200'
                    }`}
                    placeholder="Your full name"
                  />
                  {errors.name && <p className="mt-1 text-sm text-rose-500">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={guardianData.email}
                    onChange={handleGuardianChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.email ? 'border-rose-500' : 'border-gray-200'
                    }`}
                    placeholder="your@email.com"
                  />
                  {errors.email && <p className="mt-1 text-sm text-rose-500">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={guardianData.password}
                    onChange={handleGuardianChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.password ? 'border-rose-500' : 'border-gray-200'
                    }`}
                    placeholder="At least 6 characters"
                  />
                  {errors.password && <p className="mt-1 text-sm text-rose-500">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={guardianData.confirmPassword}
                    onChange={handleGuardianChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.confirmPassword ? 'border-rose-500' : 'border-gray-200'
                    }`}
                    placeholder="Re-enter password"
                  />
                  {errors.confirmPassword && <p className="mt-1 text-sm text-rose-500">{errors.confirmPassword}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={guardianData.phone}
                    onChange={handleGuardianChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.phone ? 'border-rose-500' : 'border-gray-200'
                    }`}
                    placeholder="+1-555-0123"
                  />
                  {errors.phone && <p className="mt-1 text-sm text-rose-500">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={guardianData.address}
                    onChange={handleGuardianChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Your address"
                  />
                </div>
              </div>

              <button
                onClick={handleNext}
                className="w-full mt-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                Next Step
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="animate-fade-slide-up">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Add Children
              </h2>

              <div className="space-y-6">
                {children.map((child, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-700">Child {index + 1}</h3>
                      {children.length > 1 && (
                        <button
                          onClick={() => removeChild(index)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={child.name}
                          onChange={(e) => handleChildChange(index, 'name', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                            errors[`child_${index}_name`] ? 'border-rose-500' : 'border-gray-200'
                          }`}
                          placeholder="Child's name"
                        />
                        {errors[`child_${index}_name`] && (
                          <p className="mt-1 text-sm text-rose-500">{errors[`child_${index}_name`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date of Birth <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={child.dateOfBirth}
                          onChange={(e) => handleChildChange(index, 'dateOfBirth', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                            errors[`child_${index}_dob`] ? 'border-rose-500' : 'border-gray-200'
                          }`}
                        />
                        {errors[`child_${index}_dob`] && (
                          <p className="mt-1 text-sm text-rose-500">{errors[`child_${index}_dob`]}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Gender
                        </label>
                        <select
                          value={child.gender}
                          onChange={(e) => handleChildChange(index, 'gender', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Medical Info
                        </label>
                        <textarea
                          value={child.medicalInfo}
                          onChange={(e) => handleChildChange(index, 'medicalInfo', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                          rows="2"
                          placeholder="Any medical conditions or medications"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Allergies
                        </label>
                        <input
                          type="text"
                          value={child.allergies}
                          onChange={(e) => handleChildChange(index, 'allergies', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="e.g., Peanuts, Shellfish"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={addChild}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Another Child
                </button>
              </div>

              {registrationError && (
                <p className="mt-4 text-sm text-rose-500 text-center">{registrationError}</p>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors"
                >
                  {isSubmitting ? 'Creating Account...' : 'Complete Registration'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuardianRegisterPage;
