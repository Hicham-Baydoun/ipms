import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Shield, UserCog, Users, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showError, setShowError] = useState(false);
  const [authError, setAuthError] = useState('');

  React.useEffect(() => {
    const requestedRole = location.state?.requestedRole;
    if (requestedRole && !selectedRole) {
      setSelectedRole(requestedRole);
    }
  }, [location.state, selectedRole]);

  const roles = [
    { 
      id: 'Admin', 
      label: 'Administrator', 
      icon: UserCog, 
      description: 'Full system access',
      color: 'bg-purple-100 border-purple-200 text-purple-700',
      selectedColor: 'bg-purple-600 border-purple-600 text-white'
    },
    { 
      id: 'Staff', 
      label: 'Staff Member', 
      icon: Users, 
      description: 'Check-in/out & monitoring',
      color: 'bg-blue-100 border-blue-200 text-blue-700',
      selectedColor: 'bg-blue-600 border-blue-600 text-white'
    },
    { 
      id: 'Guardian', 
      label: 'Guardian', 
      icon: User, 
      description: 'View children & pickup',
      color: 'bg-emerald-100 border-emerald-200 text-emerald-700',
      selectedColor: 'bg-emerald-600 border-emerald-600 text-white'
    }
  ];

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setShowError(false);
    setAuthError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedRole) {
      setShowError(true);
      return;
    }

    setAuthError('');

    try {
      const authState = await login({
        email,
        password,
        requestedRole: selectedRole
      });

      const resolvedRole = authState?.role || selectedRole;
      if (resolvedRole === 'Admin') {
        navigate('/admin/dashboard');
      } else if (resolvedRole === 'Staff' || resolvedRole === 'Supervisor') {
        navigate('/staff/dashboard');
      } else if (resolvedRole === 'Guardian') {
        navigate('/guardian/dashboard');
      }
    } catch (error) {
      setAuthError(error.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Indoor Playground
          </h1>
          <p className="text-gray-500">Management System</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">
            Select your role to continue
          </h2>

          {/* Role Selection */}
          <div className="space-y-3 mb-6">
            {roles.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.id;
              
              return (
                <button
                  key={role.id}
                  onClick={() => handleRoleSelect(role.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    isSelected 
                      ? `${role.selectedColor} border-current` 
                      : `${role.color} hover:opacity-80`
                  } ${showError && !selectedRole ? 'animate-shake' : ''}`}
                >
                  <Icon className="w-6 h-6" />
                  <div className="text-left">
                    <p className="font-semibold">{role.label}</p>
                    <p className={`text-sm ${isSelected ? 'text-white/80' : 'opacity-80'}`}>
                      {role.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Email/Password (decorative) */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="admin@ipms.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="••••••••"
              />
            </div>

            {showError && (
              <p className="text-sm text-rose-500 text-center">
                Please select a role to continue
              </p>
            )}

            {authError && (
              <p className="text-sm text-rose-500 text-center">{authError}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors btn-transition"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <button 
                onClick={() => navigate('/register')}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Register as Guardian
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 mt-8">
          © 2024 Indoor Playground Management System
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
