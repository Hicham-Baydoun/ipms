import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Users,
  BarChart3,
  ClipboardList,
  Calendar,
  LogIn,
  LogOut,
  Monitor,
  Search,
  ArrowRightLeft,
  UserCheck,
  Bell,
  History,
  Shield,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isCollapsed, onToggle, isMobile = false }) => {
  const location = useLocation();
  const { logout } = useAuth();
  const {
    isAdmin,
    isSupervisor,
    isStaff,
    isGuardian,
    canViewAuditLogs,
    canViewReports
  } = usePermissions();

  // Track whether viewport is desktop (lg = 1024px+)
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1024
  );

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    const handler = (e) => setIsDesktop(e.matches);
    mql.addEventListener('change', handler);
    setIsDesktop(mql.matches);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Show labels when: mobile drawer, OR desktop AND not collapsed
  const showLabels = isMobile || (isDesktop && !isCollapsed);

  const getNavItems = () => {
    if (isAdmin) {
      return [
        { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/admin/zones', icon: MapPin, label: 'Zone Management' },
        { path: '/admin/staff', icon: Users, label: 'Staff Management' },
        ...(canViewReports ? [{ path: '/admin/reports', icon: BarChart3, label: 'Reports' }] : []),
        ...(canViewAuditLogs ? [{ path: '/admin/audit-logs', icon: ClipboardList, label: 'Audit Logs' }] : []),
        { path: '/admin/sessions', icon: Calendar, label: 'Sessions' },
      ];
    }
    if (isStaff) {
      return [
        { path: '/staff/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/staff/check-in', icon: LogIn, label: 'Check In' },
        { path: '/staff/check-out', icon: LogOut, label: 'Check Out' },
        { path: '/staff/zones', icon: Monitor, label: 'Zone Monitor' },
        { path: '/staff/users', icon: Search, label: 'User Lookup' },
        { path: '/staff/reassign', icon: ArrowRightLeft, label: 'Reassign' },
        ...(isSupervisor && canViewReports ? [{ path: '/staff/reports', icon: BarChart3, label: 'Reports' }] : []),
        ...(isSupervisor && canViewAuditLogs ? [{ path: '/staff/audit-logs', icon: ClipboardList, label: 'Audit Logs' }] : []),
      ];
    }
    if (isGuardian) {
      return [
        { path: '/guardian/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/guardian/history', icon: History, label: 'Visit History' },
        { path: '/guardian/pickup', icon: UserCheck, label: 'Pickup Auth' },
        { path: '/guardian/notifications', icon: Bell, label: 'Notifications' },
      ];
    }
    return [];
  };

  const navItems = getNavItems();

  return (
    <aside
      className={`bg-[#1E1B4B] text-white h-[100dvh] flex flex-col safe-pt safe-pb
        ${isMobile
          ? 'w-[72vw] max-w-[260px]'
          : `fixed left-0 top-0 z-40 sidebar-transition w-[64px] lg:${isCollapsed ? 'w-[64px]' : 'w-[240px]'}`
        }
      `}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          {showLabels && (
            <span className="font-bold text-base truncate">IPMS</span>
          )}
        </div>

        {/* Mobile: X to close drawer */}
        {isMobile && (
          <button
            onClick={onToggle}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        )}

        {/* Desktop: chevron to collapse/expand */}
        {!isMobile && isDesktop && (
          <button
            onClick={onToggle}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors flex items-center justify-center flex-shrink-0"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed
              ? <ChevronRight className="w-4 h-4 text-gray-400" />
              : <ChevronLeft className="w-4 h-4 text-gray-400" />
            }
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto custom-scrollbar">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              location.pathname.startsWith(item.path + '/');

            return (
              <li key={item.path}>
                {showLabels ? (
                  /* Expanded: icon + label row */
                  <NavLink
                    to={item.path}
                    onClick={isMobile ? onToggle : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all min-h-[44px]
                      ${isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'}
                    `}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium text-sm truncate">{item.label}</span>
                  </NavLink>
                ) : (
                  /* Icon-only: centered icon square */
                  <NavLink
                    to={item.path}
                    title={item.label}
                    className="flex items-center justify-center min-h-[44px] w-full"
                  >
                    <div className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all
                      ${isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'}
                    `}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </NavLink>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-white/10 flex-shrink-0">
        {showLabels ? (
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-all w-full min-h-[44px]"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        ) : (
          <div className="flex items-center justify-center">
            <button
              onClick={logout}
              title="Logout"
              className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
