import React, { useState, useEffect } from 'react';
import { sanitizeInput } from '../../utils/sanitize';
import { validateName, validateEmail, validatePhone, validateRequired } from '../../utils/validators';

const StaffForm = ({ staff, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    gender: 'Male',
    phone: '',
    address: '',
    role: 'Staff',
    email: '',
    password: '',
    isActive: true
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (staff) {
      setFormData({
        name: staff.name || '',
        dateOfBirth: staff.dateOfBirth || '',
        gender: staff.gender || 'Male',
        phone: staff.phone || '',
        address: staff.address || '',
        role: staff.role || 'Staff',
        email: staff.email || '',
        password: '',
        isActive: staff.isActive !== false
      });
    }
  }, [staff]);

  const roles = [
    { value: 'Admin', label: 'Administrator' },
    { value: 'Supervisor', label: 'Supervisor' },
    { value: 'Staff', label: 'Staff Member' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    const nameError = validateName(formData.name);
    if (nameError) newErrors.name = nameError;
    
    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    if (!staff) {
      const passwordError = validateRequired(formData.password, 'Password');
      if (passwordError) {
        newErrors.password = passwordError;
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
    }
    
    const phoneError = validatePhone(formData.phone);
    if (phoneError) newErrors.phone = phoneError;
    
    const dobError = validateRequired(formData.dateOfBirth, 'Date of birth');
    if (dobError) newErrors.dateOfBirth = dobError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    const sanitizedData = {
      ...formData,
      name: sanitizeInput(formData.name),
      address: sanitizeInput(formData.address),
      phone: sanitizeInput(formData.phone),
      email: sanitizeInput(formData.email)
    };

    onSubmit(sanitizedData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full Name <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            errors.name ? 'border-rose-500 animate-shake' : 'border-gray-200'
          }`}
          placeholder="e.g., John Smith"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-rose-500">{errors.name}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date of Birth <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.dateOfBirth ? 'border-rose-500 animate-shake' : 'border-gray-200'
            }`}
          />
          {errors.dateOfBirth && (
            <p className="mt-1 text-sm text-rose-500">{errors.dateOfBirth}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gender
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role <span className="text-rose-500">*</span>
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {roles.map(role => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.phone ? 'border-rose-500 animate-shake' : 'border-gray-200'
            }`}
            placeholder="+1-555-0123"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-rose-500">{errors.phone}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email <span className="text-rose-500">*</span>
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            errors.email ? 'border-rose-500 animate-shake' : 'border-gray-200'
          }`}
          placeholder="john.smith@example.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-rose-500">{errors.email}</p>
        )}
      </div>

      {!staff && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Temporary Password <span className="text-rose-500">*</span>
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.password ? 'border-rose-500 animate-shake' : 'border-gray-200'
            }`}
            placeholder="At least 6 characters"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-rose-500">{errors.password}</p>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address
        </label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Full address"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="isActive"
          checked={formData.isActive}
          onChange={handleChange}
          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        />
        <label className="text-sm text-gray-700">Staff member is active</label>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
        >
          {staff ? 'Update Staff' : 'Add Staff'}
        </button>
      </div>
    </form>
  );
};

export default StaffForm;
