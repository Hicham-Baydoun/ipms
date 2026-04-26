import React, { useState } from 'react';
import { Plus, Edit2, Power } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import ZoneForm from '../../components/forms/ZoneForm';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import OccupancyBar from '../../components/ui/OccupancyBar';
import { sendZoneDeactivationNotifications } from '../../services/notificationService';

const ZoneManagement = () => {
  const { zones, guardians, users, dispatch } = useData();
  const { success, error } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [deactivatingZone, setDeactivatingZone] = useState(null);

  const handleAddZone = async (zoneData) => {
    const createdZoneId = await dispatch({ type: 'ADD_ZONE', payload: zoneData });
    if (!createdZoneId) {
      error('Could not add zone.');
      return;
    }

    success('Zone added successfully');
    setIsModalOpen(false);
  };

  const handleUpdateZone = async (zoneData) => {
    const updatedZone = {
      ...editingZone,
      ...zoneData
    };
    const updatedZoneId = await dispatch({ type: 'UPDATE_ZONE', payload: updatedZone });
    if (!updatedZoneId) {
      error('Could not update zone.');
      return;
    }

    success('Zone updated successfully');
    setEditingZone(null);
  };

  const handleDeactivateZone = async () => {
    const zone = deactivatingZone;
    const deletedZoneId = await dispatch({ type: 'DELETE_ZONE', payload: zone.id });
    if (!deletedZoneId) {
      error('Could not deactivate zone.');
      return;
    }

    success(`Zone "${zone.zoneName}" deactivated`);
    setDeactivatingZone(null);

    await sendZoneDeactivationNotifications(zone, guardians, users, dispatch);
  };

  const handleReactivateZone = async (zone) => {
    const reactivatedId = await dispatch({ type: 'REACTIVATE_ZONE', payload: zone.id });
    if (!reactivatedId) {
      error('Could not reactivate zone.');
      return;
    }

    success(`Zone "${zone.zoneName}" reactivated`);
  };

  const openEditModal = (zone) => {
    setEditingZone(zone);
  };

  const columns = [
    { key: 'zoneName', title: 'Zone Name', sortable: true },
    { key: 'ageGroup', title: 'Age Group', sortable: true },
    { key: 'activityType', title: 'Activity Type', sortable: true },
    {
      key: 'capacity',
      title: 'Capacity',
      render: (value, row) => (
        <OccupancyBar current={row.currentOccupancy} max={row.capacity} showPercentage={false} size="sm" />
      )
    },
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
            title="Edit zone"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => row.isActive ? setDeactivatingZone(row) : handleReactivateZone(row)}
            className={`p-2 rounded-lg transition-colors ${
              row.isActive
                ? 'text-rose-600 hover:bg-rose-50'
                : 'text-gray-400 hover:bg-gray-100'
            }`}
            title={row.isActive ? 'Deactivate zone' : 'Reactivate zone'}
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Zone Management</h1>
          <p className="text-gray-500">Manage playground zones and their settings</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Zone
        </button>
      </div>

      <DataTable
        columns={columns}
        data={zones}
        searchable
        searchPlaceholder="Search zones..."
        emptyMessage="No zones found"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Zone"
      >
        <ZoneForm
          onSubmit={handleAddZone}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={!!editingZone}
        onClose={() => setEditingZone(null)}
        title="Edit Zone"
      >
        <ZoneForm
          zone={editingZone}
          onSubmit={handleUpdateZone}
          onCancel={() => setEditingZone(null)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deactivatingZone}
        onClose={() => setDeactivatingZone(null)}
        onConfirm={handleDeactivateZone}
        title="Deactivate Zone?"
        message={`Are you sure you want to deactivate "${deactivatingZone?.zoneName}"? Guardians with children in this zone will be notified to come pick up or schedule a new zone.`}
        confirmText="Deactivate"
        type="warning"
      />
    </div>
  );
};

export default ZoneManagement;
