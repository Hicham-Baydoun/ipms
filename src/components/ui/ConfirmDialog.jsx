import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Are you sure?', 
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger'
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const buttonColors = {
    danger: 'bg-rose-600 hover:bg-rose-700 text-white',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white',
    info: 'bg-indigo-600 hover:bg-indigo-700 text-white'
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-rose-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        <p className="text-gray-600 mb-6">
          {message}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${buttonColors[type]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
