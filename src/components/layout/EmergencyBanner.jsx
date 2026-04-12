import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/DataContext';

const EmergencyBanner = () => {
  const { role } = useAuth();
  const { emergencyMode, emergencyActivatedBy } = useAppData();

  if (!emergencyMode) return null;

  const isAdmin = role === 'Admin';

  return (
    <div className="bg-rose-600 text-white px-4 py-3 animate-pulse-alert">
      <div className="flex items-center justify-center gap-3">
        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
        <p className="font-semibold text-sm md:text-base text-center">
          WARNING: EMERGENCY MODE ACTIVE — Evacuation in progress
          {isAdmin && emergencyActivatedBy && (
            <span className="ml-2 font-normal opacity-80">
              (Activated by {emergencyActivatedBy})
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default EmergencyBanner;
