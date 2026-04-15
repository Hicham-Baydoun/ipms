import React, { useState } from 'react';
import { Plus, Edit2, Trash2, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { sanitizeInput } from '../../utils/sanitize';
import { validateName, validatePhone } from '../../utils/validators';
import Modal from '../../components/ui/Modal';

const PickupAuthorization = () => {
  const { user } = useAuth();
  const { guardians, dispatch } = useData();
  const { success } = useToast();

  const currentGuardian = guardians.find((guardian) => guardian.id === user?.uid) || null;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    relation: 'Parent',
    contact: ''
  });
  const [errors, setErrors] = useState({});

  const relations = ['Parent', 'Grandparent', 'Sibling', 'Other'];

  const handleOpenAdd = () => {
    setEditingPerson(null);
    setFormData({ name: '', relation: 'Parent', contact: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (person) => {
    setEditingPerson(person);
    setFormData({
      name: person.name,
      relation: person.relation,
      contact: person.contact
    });
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    const nameError = validateName(formData.name);
    if (nameError) newErrors.name = nameError;
    const phoneError = validatePhone(formData.contact);
    if (phoneError) newErrors.contact = phoneError;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const sanitizedData = {
      name: sanitizeInput(formData.name),
      relation: formData.relation,
      contact: sanitizeInput(formData.contact)
    };

    let updatedPickup;
    if (editingPerson) {
      updatedPickup = currentGuardian.authorizedPickup.map(p =>
        p.id === editingPerson.id ? { ...p, ...sanitizedData } : p
      );
    } else {
      updatedPickup = [
        ...currentGuardian.authorizedPickup,
        { id: `pickup-${Date.now()}`, ...sanitizedData }
      ];
    }

    dispatch({
      type: 'UPDATE_GUARDIAN_PICKUP',
      payload: {
        guardianId: currentGuardian.id,
        authorizedPickup: updatedPickup
      }
    });

    success(editingPerson ? 'Pickup person updated' : 'Pickup person added');
    setIsModalOpen(false);
    setFormData({ name: '', relation: 'Parent', contact: '' });
  };

  const handleDelete = (personId) => {
    const updatedPickup = currentGuardian.authorizedPickup.filter(p => p.id !== personId);
    dispatch({
      type: 'UPDATE_GUARDIAN_PICKUP',
      payload: {
        guardianId: currentGuardian.id,
        authorizedPickup: updatedPickup
      }
    });
    success('Pickup person removed');
  };

  if (!currentGuardian) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No guardian data found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pickup Authorization</h1>
          <p className="text-gray-500">Manage who can pick up your children</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Person
        </button>
      </div>

      {/* Authorized Pickup List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentGuardian.authorizedPickup.map((person, index) => (
          <div 
            key={person.id}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-fade-slide-up"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{person.name}</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 mt-1">
                    {person.relation}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(person)}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {currentGuardian.authorizedPickup.length > 1 && (
                  <button
                    onClick={() => handleDelete(person.id)}
                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">Contact</p>
              <p className="font-medium text-gray-900">{person.contact}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Info Card */}
      <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
        <h3 className="font-semibold text-amber-800 mb-2">Important Note</h3>
        <p className="text-amber-700 text-sm">
          Only authorized persons listed here will be allowed to pick up your children. 
          Staff will verify identity using photo ID. Please keep this list updated.
        </p>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPerson ? 'Edit Pickup Person' : 'Add Pickup Person'}
      >
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
                errors.name ? 'border-rose-500' : 'border-gray-200'
              }`}
              placeholder="e.g., John Smith"
            />
            {errors.name && <p className="mt-1 text-sm text-rose-500">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Relation <span className="text-rose-500">*</span>
            </label>
            <select
              name="relation"
              value={formData.relation}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {relations.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.contact ? 'border-rose-500' : 'border-gray-200'
              }`}
              placeholder="+1-555-0123"
            />
            {errors.contact && <p className="mt-1 text-sm text-rose-500">{errors.contact}</p>}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
            >
              {editingPerson ? 'Update' : 'Add'} Person
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PickupAuthorization;
