import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './context/ToastContext';

// Auth Components
import AuthGuard from './components/auth/AuthGuard';
import ErrorBoundary from './components/auth/ErrorBoundary';

// Layout
import AppLayout from './components/layout/AppLayout';

// Toast Container
import ToastContainer from './components/ui/Toast';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import GuardianRegisterPage from './pages/auth/GuardianRegisterPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ZoneManagement from './pages/admin/ZoneManagement';
import StaffManagement from './pages/admin/StaffManagement';
import Reports from './pages/admin/Reports';
import AuditLogs from './pages/admin/AuditLogs';
import SessionScheduling from './pages/admin/SessionScheduling';

// Staff Pages
import StaffDashboard from './pages/staff/StaffDashboard';
import CheckIn from './pages/staff/CheckIn';
import CheckOut from './pages/staff/CheckOut';
import ZoneMonitor from './pages/staff/ZoneMonitor';
import UserLookup from './pages/staff/UserLookup';
import ZoneReassignment from './pages/staff/ZoneReassignment';

// Guardian Pages
import GuardianDashboard from './pages/guardian/GuardianDashboard';
import PickupAuthorization from './pages/guardian/PickupAuthorization';
import Notifications from './pages/guardian/Notifications';

// Styles
import './styles/animations.css';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <ToastProvider>
            <Router>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<GuardianRegisterPage />} />

                {/* Admin Routes */}
                <Route path="/admin" element={
                  <AuthGuard role="Admin">
                    <AppLayout />
                  </AuthGuard>
                }>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="zones" element={<ZoneManagement />} />
                  <Route path="staff" element={<StaffManagement />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="audit-logs" element={<AuditLogs />} />
                  <Route path="sessions" element={<SessionScheduling />} />
                </Route>

                {/* Staff Routes */}
                <Route path="/staff" element={
                  <AuthGuard role={['Staff', 'Supervisor']}>
                    <AppLayout />
                  </AuthGuard>
                }>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<StaffDashboard />} />
                  <Route path="check-in" element={<CheckIn />} />
                  <Route path="check-out" element={<CheckOut />} />
                  <Route path="zones" element={<ZoneMonitor />} />
                  <Route path="users" element={<UserLookup />} />
                  <Route path="reassign" element={<ZoneReassignment />} />
                </Route>

                {/* Guardian Routes */}
                <Route path="/guardian" element={
                  <AuthGuard role="Guardian">
                    <AppLayout />
                  </AuthGuard>
                }>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<GuardianDashboard />} />
                  <Route path="pickup" element={<PickupAuthorization />} />
                  <Route path="notifications" element={<Notifications />} />
                </Route>

                {/* Default Redirect */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </Router>
            <ToastContainer />
          </ToastProvider>
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
