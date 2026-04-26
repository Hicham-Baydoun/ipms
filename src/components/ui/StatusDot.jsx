import React from 'react';

const StatusDot = ({ status, size = 'md', showLabel = false, animate = true }) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const statusConfig = {
    active: {
      color: 'bg-emerald-500',
      label: 'Active',
      animate: animate
    },
    inactive: {
      color: 'bg-gray-400',
      label: 'Inactive',
      animate: false
    },
    checkedIn: {
      color: 'bg-emerald-500',
      label: 'Checked In',
      animate: animate
    },
    checkedOut: {
      color: 'bg-gray-400',
      label: 'Checked Out',
      animate: false
    },
    warning: {
      color: 'bg-amber-500',
      label: 'Warning',
      animate: animate
    },
    danger: {
      color: 'bg-rose-500',
      label: 'Critical',
      animate: animate
    },
    pending: {
      color: 'bg-blue-500',
      label: 'Pending',
      animate: false
    }
  };

  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <div className="flex items-center gap-2">
      <div 
        className={`${sizeClasses[size]} ${config.color} rounded-full ${config.animate ? 'animate-breathe' : ''}`}
      />
      {showLabel && (
        <span className="text-sm text-gray-600">{config.label}</span>
      )}
    </div>
  );
};

export default StatusDot;
