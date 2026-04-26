import React, { useState, useEffect } from 'react';
import { sanitizeInput } from '../../utils/sanitize';
import { validateRequired, validateCapacity, validateTextarea } from '../../utils/validators';

const ZoneForm = ({ zone, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    zoneName: '',
    ageGroup: '3-5',
    activityType: '',
    capacity: '',
    safetyRules: '',
    isActive: true
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (zone) {
      setFormData({
        zoneName: zone.zoneName || '',
        ageGroup: zone.ageGroup || '3-5',
        activityType: zone.activityType || '',
        capacity: zone.capacity || '',
        safetyRules: zone.safetyRules || '',
        isActive: zone.isActive !== false
      });
    }
  }, [zone]);

  const ageGroups = [
    { value: 'Under 3', label: 'Under 3 years' },
    { value: '3-5', label: '3-5 years' },
    { value: '6-8', label: '6-8 years' },
    { value: '9-12', label: '9-12 years' },
    { value: '13-17', label: '13-17 years' },
    { value: '18+', label: '18+ years (Adult)' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    const zoneNameError = validateRequired(formData.zoneName, 'Zone name');
    if (zoneNameError) newErrors.zoneName = zoneNameError;
    
    const activityTypeError = validateRequired(formData.activityType, 'Activity type');
    if (activityTypeError) newErrors.activityType = activityTypeError;
    
    const capacityError = validateCapacity(formData.capacity);
    if (capacityError) newErrors.capacity = capacityError;
    
    const safetyRulesError = validateTextarea(formData.safetyRules);
    if (safetyRulesError) newErrors.safetyRules = safetyRulesError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    const sanitizedData = {
      ...formData,
      zoneName: sanitizeInput(formData.zoneName),
      activityType: sanitizeInput(formData.activityType),
      safetyRules: sanitizeInput(formData.safetyRules),
      capacity: parseInt(formData.capacity)
    };

    onSubmit(sanitizedData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Zone Name <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          name="zoneName"
          value={formData.zoneName}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            errors.zoneName ? 'border-rose-500 animate-shake' : 'border-gray-200'
          }`}
          placeholder="e.g., Tiny Explorers"
        />
        {errors.zoneName && (
          <p className="mt-1 text-sm text-rose-500">{errors.zoneName}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Age Group <span className="text-rose-500">*</span>
          </label>
          <select
            name="ageGroup"
            value={formData.ageGroup}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {ageGroups.map(group => (
              <option key={group.value} value={group.value}>
                {group.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Capacity <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            name="capacity"
            value={formData.capacity}
            onChange={handleChange}
            min="1"
            max="500"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.capacity ? 'border-rose-500 animate-shake' : 'border-gray-200'
            }`}
            placeholder="e.g., 20"
          />
          {errors.capacity && (
            <p className="mt-1 text-sm text-rose-500">{errors.capacity}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Activity Type <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          name="activityType"
          value={formData.activityType}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            errors.activityType ? 'border-rose-500 animate-shake' : 'border-gray-200'
          }`}
          placeholder="e.g., Free Play, Obstacle Course"
        />
        {errors.activityType && (
          <p className="mt-1 text-sm text-rose-500">{errors.activityType}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Safety Rules
        </label>
        <textarea
          name="safetyRules"
          value={formData.safetyRules}
          onChange={handleChange}
          rows="3"
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${
            errors.safetyRules ? 'border-rose-500 animate-shake' : 'border-gray-200'
          }`}
          placeholder="Enter safety rules and guidelines..."
        />
        {errors.safetyRules && (
          <p className="mt-1 text-sm text-rose-500">{errors.safetyRules}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="isActive"
          checked={formData.isActive}
          onChange={handleChange}
          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        />
        <label className="text-sm text-gray-700">Zone is active</label>
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
          {zone ? 'Update Zone' : 'Add Zone'}
        </button>
      </div>
    </form>
  );
};

export default ZoneForm;
