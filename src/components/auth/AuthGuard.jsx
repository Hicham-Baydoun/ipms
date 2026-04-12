import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const AuthGuard = ({ children, role }) => {
  const { isAuthenticated, role: userRole, loading } = useAuth();
  const { error } = useToast();
  const location = useLocation();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const hasAccess = (() => {
    if (!role) return true;
    if (Array.isArray(role)) return role.includes(userRole);
    if (role === 'Staff') return userRole === 'Staff' || userRole === 'Supervisor';
    return userRole === role;
  })();

  if (!hasAccess) {
    error('Access denied - insufficient permissions.');

    if (userRole === 'Admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }

    if (userRole === 'Staff' || userRole === 'Supervisor') {
      return <Navigate to="/staff/dashboard" replace />;
    }

    if (userRole === 'Guardian') {
      return <Navigate to="/guardian/dashboard" replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return children;
};

export default AuthGuard;