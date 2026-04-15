import React from 'react';
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
  Menu,
  X
} from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isCollapsed, onToggle }) => {
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
      className={`bg-[#1E1B4B] text-white h-screen fixed left-0 top-0 z-40 sidebar-transition flex flex-col ${
        isCollapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">IPMS</span>
          </div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center mx-auto">
            <Shield className="w-5 h-5 text-white" />
          </div>
        )}
        {!isCollapsed && (
          <button
            onClick={onToggle}
            className="p-2.5 hover:bg-white/10 rounded-lg transition-colors lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto custom-scrollbar">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
                           location.pathname.startsWith(item.path + '/');
            
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all nav-item-hover ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
                  {!isCollapsed && (
                    <span className="font-medium text-sm">{item.label}</span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={logout}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-white/5 hover:text-white transition-all w-full ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Logout' : ''}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && (
            <span className="font-medium text-sm">Logout</span>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
