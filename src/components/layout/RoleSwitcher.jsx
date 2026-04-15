import React, { useState } from 'react';
import { UserCog, X, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const RoleSwitcher = () => {
  const { role, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const roles = [
    { id: 'Admin', label: 'Administrator', color: 'bg-purple-100 text-purple-700' },
    { id: 'Staff', label: 'Staff Member', color: 'bg-blue-100 text-blue-700' },
    { id: 'Guardian', label: 'Guardian', color: 'bg-emerald-100 text-emerald-700' }
  ];

  const currentRoleLabel = roles.find((entry) => entry.id === (role === 'Supervisor' ? 'Staff' : role))?.label || role;

  const handleRoleSwitch = async (newRole) => {
    await logout();
    setIsOpen(false);
    navigate('/login', { state: { requestedRole: newRole } });
  };

  // Only render in development — never expose in production builds
  if (!import.meta.env.DEV) return null;
  if (!role) return null;

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
        title="Show Role Switcher"
      >
        <UserCog className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-64 animate-fade-slide-up">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <UserCog className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Switch Role</span>
        </div>
        <button
          onClick={() => setIsMinimized(true)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Minimize"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors text-left"
        >
          <span className="text-sm text-gray-700">
            {currentRoleLabel || 'Select Role'}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden animate-fade-in">
            {roles.map((r) => (
              <button
                key={r.id}
                onClick={() => handleRoleSwitch(r.id)}
                className={`w-full px-3 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                  role === r.id ? 'bg-gray-50' : ''
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${r.color.replace('text-', 'bg-').replace('100', '500')}`} />
                {r.label}
                {role === r.id && (
                  <span className="ml-auto text-xs text-gray-400">Current</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-2">
        Quick role switch for demo purposes
      </p>
    </div>
  );
};

export default RoleSwitcher;
