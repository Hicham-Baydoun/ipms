import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const SIZE_CLASSES = {
  sm: 'max-w-full sm:max-w-md',
  md: 'max-w-full sm:max-w-lg',
  lg: 'max-w-full sm:max-w-2xl',
  xl: 'max-w-full sm:max-w-4xl',
};

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const modalRef = useRef(null);
  const mouseDownOnBackdrop = useRef(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') onCloseRef.current();
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    // Reset drag-origin flag each time the modal opens so stale state from a
    // previous session doesn't cause an immediate close.
    mouseDownOnBackdrop.current = false;

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleBackdropMouseDown = (e) => {
    mouseDownOnBackdrop.current = e.target === modalRef.current;
  };

  const handleBackdropClick = (e) => {
    // Only close when both mousedown AND click landed on the backdrop itself.
    // This prevents the Windows native <select> quirk where the OS dropdown
    // fires its click event with the backdrop as the target.
    if (mouseDownOnBackdrop.current && e.target === modalRef.current) {
      onClose();
    }
    mouseDownOnBackdrop.current = false;
  };

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onMouseDown={handleBackdropMouseDown}
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${SIZE_CLASSES[size] ?? SIZE_CLASSES.md} animate-modal-in max-h-[90vh] overflow-hidden`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
