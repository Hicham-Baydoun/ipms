import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import StaffForm from '../../components/forms/StaffForm';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const StaffManagement = () => {
  const { staff, dispatch } = useData();
  const { success, error } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [deletingStaff, setDeletingStaff] = useState(null);

  const handleAddStaff = async (staffData) => {
    const createdStaffId = await dispatch({ type: 'ADD_STAFF', payload: staffData });
    if (!createdStaffId) {
      error('Could not create staff account. Check Firebase Auth settings and try again.');
      return;
    }

    success('Staff member added successfully');
    setIsModalOpen(false);
  };

  const handleUpdateStaff = async (staffData) => {
    const updatedStaff = {
      ...editingStaff,
      ...staffData
    };
    const updatedStaffId = await dispatch({ type: 'UPDATE_STAFF', payload: updatedStaff });
    if (!updatedStaffId) {
      error('Could not update staff member.');
      return;
    }

    success('Staff member updated successfully');
    setEditingStaff(null);
  };

  const handleDeleteStaff = async () => {
    const removedStaffId = await dispatch({ type: 'DELETE_STAFF', payload: deletingStaff.id });
    if (!removedStaffId) {
      error('Could not remove staff member.');
      return;
    }

    success('Staff member removed successfully');
    setDeletingStaff(null);
  };

  const openEditModal = (staffMember) => {
    setEditingStaff(staffMember);
  };

  const columns = [
    { key: 'name', title: 'Name', sortable: true },
    { 
      key: 'role', 
      title: 'Role', 
      sortable: true,
      render: (value) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value === 'Admin' ? 'bg-purple-100 text-purple-800' :
          value === 'Supervisor' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      )
    },
    { key: 'phone', title: 'Phone', sortable: false },
    { key: 'email', title: 'Email', sortable: false },
    { 
      key: 'isActive', 
      title: 'Status',
      render: (value) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEditModal(row)}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Edit staff"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeletingStaff(row)}
            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Remove staff"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-500 text-sm">Manage staff members and their roles</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors self-start sm:self-auto min-h-[44px]"
        >
          <Plus className="w-5 h-5" />
          Add Staff
        </button>
      </div>

      {/* Staff Table */}
      <DataTable
        columns={columns}
        data={staff}
        searchable
        searchPlaceholder="Search staff..."
        emptyMessage="No staff members found"
      />

      {/* Add Staff Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Staff Member"
      >
        <StaffForm
          onSubmit={handleAddStaff}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* Edit Staff Modal */}
      <Modal
        isOpen={!!editingStaff}
        onClose={() => setEditingStaff(null)}
        title="Edit Staff Member"
      >
        <StaffForm
          staff={editingStaff}
          onSubmit={handleUpdateStaff}
          onCancel={() => setEditingStaff(null)}
        />
      </Modal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deletingStaff}
        onClose={() => setDeletingStaff(null)}
        onConfirm={handleDeleteStaff}
        title="Remove Staff Member?"
        message={`Are you sure you want to remove "${deletingStaff?.name}" from the system? This action cannot be undone.`}
        confirmText="Remove"
        type="danger"
      />
    </div>
  );
};

export default StaffManagement;
