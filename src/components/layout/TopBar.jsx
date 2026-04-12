import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu, Bell, Search, Shield,
  Info, AlertTriangle, AlertCircle, Check, X,
  User, MapPin
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/DataContext';
import { usePermissions } from '../../hooks/usePermissions';
import ConfirmDialog from '../ui/ConfirmDialog';
import { sendEmergencyNotificationsToGuardians } from '../../services/notificationService';
import { sendEmergencyEmailsToGuardians } from '../../services/emailService';
import { formatRelativeTime } from '../../utils/formatters';

const NOTIF_ICONS = {
  info:      <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />,
  warning:   <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />,
  emergency: <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />,
};

const NOTIF_STYLES = {
  info:      'bg-blue-50 border-blue-100',
  warning:   'bg-amber-50 border-amber-100',
  emergency: 'bg-rose-50 border-rose-100',
};

const TopBar = ({ onMenuClick, isSidebarCollapsed }) => {
  const navigate = useNavigate();
  const { role, profile, user } = useAuth();
  const { emergencyMode, lastDataSyncAt, guardians, users, zones, notifications, dispatch } = useAppData();
  const { canActivateEmergency } = usePermissions();

  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [syncClock, setSyncClock] = useState(() => Date.now());

  const notifRef = useRef(null);
  const searchRef = useRef(null);

  // Only staff / supervisor can look up users via the global search
  const canSearchUsers = role === 'Staff' || role === 'Supervisor';

  useEffect(() => {
    const id = setInterval(() => setSyncClock(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  // Close notification panel on outside click
  useEffect(() => {
    if (!isNotifOpen) return;
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isNotifOpen]);

  // Close search dropdown on outside click
  useEffect(() => {
    if (!isSearchOpen) return;
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isSearchOpen]);

  const syncedLabel = useMemo(() => {
    if (!lastDataSyncAt) return 'just now';
    const d = new Date(lastDataSyncAt);
    if (Number.isNaN(d.getTime())) return 'just now';
    const elapsed = syncClock - d.getTime();
    if (elapsed < 45000) return 'just now';
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }, [lastDataSyncAt, syncClock]);

  // --- Notification state ---
  const myNotifications = useMemo(
    () => notifications.filter((n) => n.guardianId === user?.uid),
    [notifications, user?.uid]
  );
  const unreadCount = useMemo(
    () => myNotifications.filter((n) => !n.isRead).length,
    [myNotifications]
  );

  const handleMarkRead = (id) =>
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id });

  const handleMarkAllRead = () =>
    myNotifications
      .filter((n) => !n.isRead)
      .forEach((n) => dispatch({ type: 'MARK_NOTIFICATION_READ', payload: n.id }));

  // --- Global search ---
  const searchResults = useMemo(() => {
    if (!canSearchUsers || !globalSearch.trim()) return [];
    const term = globalSearch.toLowerCase();
    return users
      .filter(
        (u) =>
          u.name?.toLowerCase().includes(term) ||
          u.braceletId?.toLowerCase().includes(term)
      )
      .slice(0, 6);
  }, [users, globalSearch, canSearchUsers]);

  const handleSearchChange = (e) => {
    setGlobalSearch(e.target.value);
    setIsSearchOpen(true);
  };

  const handleSearchResultClick = (selectedUser) => {
    setGlobalSearch('');
    setIsSearchOpen(false);
    navigate('/staff/users', { state: { selectedUserId: selectedUser.id } });
  };

  // --- Emergency ---
  const handleEmergencyToggle = () => {
    if (emergencyMode) {
      dispatch({ type: 'DEACTIVATE_EMERGENCY' });
    } else {
      setShowEmergencyConfirm(true);
    }
  };

  const confirmEmergency = async () => {
    const activatedBy = profile?.name || profile?.email || role || 'Staff';
    dispatch({ type: 'ACTIVATE_EMERGENCY', payload: { activatedBy } });
    setShowEmergencyConfirm(false);
    await Promise.all([
      sendEmergencyNotificationsToGuardians(guardians, dispatch),
      sendEmergencyEmailsToGuardians(guardians)
    ]);
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
        {/* Left */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          <div className="hidden md:flex items-center text-sm text-gray-500">
            <span className="capitalize">{role}</span>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Dashboard</span>
          </div>

          <div className="hidden md:flex items-center text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-breathe mr-2" />
            Data synced: {syncedLabel}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">

          {/* Global Search — staff / supervisor only */}
          {canSearchUsers && (
            <div className="relative hidden md:block" ref={searchRef}>
              <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2">
                <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  value={globalSearch}
                  onChange={handleSearchChange}
                  onFocus={() => globalSearch && setIsSearchOpen(true)}
                  placeholder="Search users..."
                  className="bg-transparent border-none outline-none text-sm w-48 placeholder-gray-400"
                />
                {globalSearch && (
                  <button
                    onClick={() => { setGlobalSearch(''); setIsSearchOpen(false); }}
                    className="ml-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {isSearchOpen && globalSearch.trim() && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 animate-fade-in overflow-hidden">
                  {searchResults.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm text-gray-400">No users found for "{globalSearch}"</p>
                    </div>
                  ) : (
                    <ul>
                      {searchResults.map((u) => {
                        const zone = zones.find((z) => z.id === u.assignedZoneId);
                        return (
                          <li key={u.id}>
                            <button
                              onClick={() => handleSearchResultClick(u)}
                              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 text-left"
                            >
                              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-indigo-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{u.name}</p>
                                {u.isCheckedIn && zone ? (
                                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3" />
                                    {zone.zoneName}
                                    {u.braceletId && <span className="ml-1 font-mono">· {u.braceletId}</span>}
                                  </p>
                                ) : (
                                  <p className="text-xs text-gray-400 mt-0.5">Not checked in</p>
                                )}
                              </div>
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                                u.isCheckedIn
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-gray-100 text-gray-500'
                              }`}>
                                {u.isCheckedIn ? 'In' : 'Out'}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <div className="px-4 py-2 border-t border-gray-100">
                    <button
                      onClick={() => { setIsSearchOpen(false); navigate('/staff/users'); }}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      View all users →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Emergency button */}
          {canActivateEmergency && (
            <button
              onClick={handleEmergencyToggle}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                emergencyMode
                  ? 'bg-rose-600 text-white animate-pulse-alert'
                  : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">
                {emergencyMode ? 'Emergency Active' : 'Emergency'}
              </span>
            </button>
          )}

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotifOpen((prev) => !prev)}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-rose-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold leading-none px-0.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 animate-fade-in overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-gray-500" />
                    <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="bg-rose-100 text-rose-700 text-xs font-medium px-1.5 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium px-2 py-1 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={() => setIsNotifOpen(false)}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* List */}
                <div className="max-h-[360px] overflow-y-auto">
                  {myNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                      <Bell className="w-8 h-8 text-gray-200 mb-2" />
                      <p className="text-sm text-gray-400">No notifications</p>
                    </div>
                  ) : (
                    <ul>
                      {myNotifications.map((notif) => (
                        <li
                          key={notif.id}
                          className={`px-4 py-3 border-b border-gray-50 last:border-0 transition-colors ${
                            !notif.isRead
                              ? NOTIF_STYLES[notif.type] || 'bg-gray-50'
                              : 'bg-white'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {NOTIF_ICONS[notif.type] || (
                                <Bell className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-semibold text-gray-900 leading-tight">
                                  {notif.title}
                                </p>
                                {!notif.isRead && (
                                  <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                {notif.message}
                              </p>
                              <div className="flex items-center justify-between mt-1.5">
                                <span className="text-[11px] text-gray-400">
                                  {formatRelativeTime(notif.timestamp)}
                                </span>
                                {!notif.isRead && (
                                  <button
                                    onClick={() => handleMarkRead(notif.id)}
                                    className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-700 font-medium"
                                  >
                                    <Check className="w-3 h-3" />
                                    Mark read
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Footer */}
                {role === 'Guardian' && myNotifications.length > 0 && (
                  <div className="px-4 py-2.5 border-t border-gray-100">
                    <Link
                      to="/guardian/notifications"
                      onClick={() => setIsNotifOpen(false)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      View all notifications →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Avatar */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-indigo-700 font-semibold text-sm">
                {role?.charAt(0) || 'U'}
              </span>
            </div>
            {!isSidebarCollapsed && (
              <div className="hidden lg:block">
                <p className="text-sm font-medium text-gray-900">{profile?.name || `${role} User`}</p>
                <p className="text-xs text-gray-500">{profile?.email || `${role?.toLowerCase()}@ipms.com`}</p>
              </div>
            )}
          </div>
        </div>
      </header>

      <ConfirmDialog
        isOpen={showEmergencyConfirm}
        onClose={() => setShowEmergencyConfirm(false)}
        onConfirm={confirmEmergency}
        title="Activate Emergency Mode?"
        message="This will trigger emergency protocols across the facility. All guardians will be notified and emailed to pick up their children immediately. All check-ins will be disabled. Are you sure?"
        confirmText="Activate Emergency"
        type="danger"
      />
    </>
  );
};

export default TopBar;
