import React from 'react';
import { Bell, Info, AlertTriangle, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/DataContext';
import { formatDateTime, formatRelativeTime } from '../../utils/formatters';

const Notifications = () => {
  const { user } = useAuth();
  const { notifications, dispatch, emergencyMode } = useAppData();

  const guardianNotifications = notifications.filter((notification) => notification.guardianId === user?.uid);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'emergency':
        return <AlertCircle className="w-5 h-5 text-rose-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationStyle = (type) => {
    switch (type) {
      case 'info':
        return 'bg-blue-50 border-blue-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      case 'emergency':
        return 'bg-rose-50 border-rose-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const handleMarkAsRead = (notificationId) => {
    dispatch({
      type: 'MARK_NOTIFICATION_READ',
      payload: notificationId
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-500">Stay updated on your children's activities</p>
      </div>

      {/* Emergency Overlay */}
      {emergencyMode && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <p className="text-sm text-rose-700 font-medium">
              Emergency mode is active. Follow facility guidance and monitor updates.
            </p>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-3">
        {guardianNotifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No notifications yet</p>
          </div>
        ) : (
          guardianNotifications.map((notification, index) => (
            <div
              key={notification.id}
              className={`relative p-5 rounded-2xl border transition-all animate-fade-slide-up ${
                getNotificationStyle(notification.type)
              } ${!notification.isRead ? 'ring-2 ring-indigo-500/20' : ''}`}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              {!notification.isRead && (
                <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-indigo-500 rounded-full" />
              )}
              
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                    <span className="text-xs text-gray-500">
                      {formatRelativeTime(notification.timestamp)}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {formatDateTime(notification.timestamp)}
                  </p>
                </div>
              </div>

              {!notification.isRead && (
                <button
                  onClick={() => handleMarkAsRead(notification.id)}
                  className="mt-3 flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  <Check className="w-4 h-4" />
                  Mark as read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
