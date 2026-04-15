import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import EmergencyBanner from './EmergencyBanner';
import { useAppData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useIdleTimer } from '../../hooks/useIdleTimer';
import { useToast } from '../../context/ToastContext';

const FACILITY_PHONE = '+1-555-9999';
const FACILITY_PHONE_TEL = 'tel:+15559999';
const OVERTIME_THRESHOLD_MS = 2 * 60 * 60 * 1000;

const AppLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { emergencyMode, users } = useAppData();
  const { role, logout, isAuthenticated } = useAuth();
  const { warning } = useToast();
  const alertedUsersRef = useRef(new Set());

  const handleIdle = useCallback(() => { logout(); }, [logout]);
  useIdleTimer(handleIdle, isAuthenticated);

  useEffect(() => {
    if (role !== 'Staff' && role !== 'Supervisor' && role !== 'Admin') return;
    const check = () => {
      const now = Date.now();
      users.forEach((user) => {
        if (!user.isCheckedIn || !user.checkInTime) return;
        const elapsed = now - new Date(user.checkInTime).getTime();
        if (elapsed >= OVERTIME_THRESHOLD_MS && !alertedUsersRef.current.has(user.id)) {
          alertedUsersRef.current.add(user.id);
          warning(`${user.name} has been checked in for over 2 hours.`);
        }
      });
    };
    check();
    const interval = setInterval(check, 60 * 1000);
    return () => clearInterval(interval);
  }, [users, role, warning]);

  useEffect(() => {
    users.forEach((user) => {
      if (!user.isCheckedIn) alertedUsersRef.current.delete(user.id);
    });
  }, [users]);

  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);
  const toggleMobileSidebar = () => setIsMobileSidebarOpen(prev => !prev);

  return (
    <div className={`min-h-screen bg-gray-50 ${emergencyMode ? 'animate-emergency-pulse border-4 border-rose-500' : ''}`}>

      {/* Desktop/Tablet sidebar — visible from md (768px) up, icon-only on md, toggleable on lg+ */}
      <div className="hidden md:block">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={toggleSidebar}
          isMobile={false}
        />
      </div>

      {/* Mobile backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleMobileSidebar}
        />
      )}

      {/* Mobile slide-in drawer — only below md */}
      <div className={`md:hidden fixed inset-y-0 left-0 z-50 sidebar-transition ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar
          isCollapsed={false}
          onToggle={toggleMobileSidebar}
          isMobile={true}
        />
      </div>

      {/* Main content — offset by sidebar width */}
      <div className={`sidebar-transition md:ml-[64px] ${isSidebarCollapsed ? 'lg:ml-[64px]' : 'lg:ml-[240px]'}`}>
        <TopBar
          onMenuClick={toggleMobileSidebar}
          isSidebarCollapsed={isSidebarCollapsed}
        />
        <EmergencyBanner />
        <main className="p-3 sm:p-4 lg:p-6">
          <div className="max-w-[1440px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Guardian emergency overlay */}
      {emergencyMode && role === 'Guardian' && (
        <div className="fixed inset-0 z-50 bg-rose-600/95 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full text-center animate-modal-in">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 animate-pulse-alert">
              <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-rose-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">EMERGENCY ALERT</h2>
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
              An emergency has been declared at the facility. Please contact us immediately.
            </p>
            <div className="bg-rose-50 rounded-xl p-4 mb-4 sm:mb-6">
              <p className="text-rose-800 font-semibold text-sm">Facility Phone</p>
              <p className="text-xl sm:text-2xl font-bold text-rose-600">{FACILITY_PHONE}</p>
            </div>
            <a
              href={FACILITY_PHONE_TEL}
              className="block w-full py-3 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition-colors text-center"
            >
              Call Now
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppLayout;
