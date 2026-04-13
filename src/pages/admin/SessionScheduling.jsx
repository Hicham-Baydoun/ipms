import React, { useState } from 'react';
import { Plus, Clock, MapPin, Users } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/ui/Modal';
import { formatTime } from '../../utils/formatters';

const SessionScheduling = () => {
  const { sessions, zones, staff, dispatch } = useData();
  const { success, error } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState('monday');

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  const resolveNextDateForDay = (dayName) => {
    const dayToIndex = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6
    };
    const targetDayIndex = dayToIndex[dayName] ?? new Date().getDay();
    const today = new Date();
    const delta = (targetDayIndex - today.getDay() + 7) % 7;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + delta);
    targetDate.setHours(0, 0, 0, 0);
    return targetDate;
  };

  const mergeDateAndTime = (date, timeValue) => {
    const [hours, minutes] = String(timeValue || '')
      .split(':')
      .map((part) => Number(part));
    const merged = new Date(date);
    merged.setHours(Number.isFinite(hours) ? hours : 0, Number.isFinite(minutes) ? minutes : 0, 0, 0);
    return merged;
  };

  const handleAddSession = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const sessionDate = resolveNextDateForDay(selectedDay);
    const startTime = mergeDateAndTime(sessionDate, formData.get('startTime'));
    const endTime = mergeDateAndTime(sessionDate, formData.get('endTime'));

    if (startTime < new Date()) {
      error('Session start time cannot be in the past.');
      return;
    }

    if (endTime <= startTime) {
      error('End time must be after start time.');
      return;
    }

    const zoneId = formData.get('zoneId');
    const hasOverlap = sessions.some(s => {
      if (s.zoneId !== zoneId) return false;
      const sStart = new Date(s.startTime);
      const sEnd = new Date(s.endTime);
      return startTime < sEnd && endTime > sStart;
    });

    if (hasOverlap) {
      error('This zone already has a session scheduled during that time slot.');
      return;
    }

    const newSession = {
      zoneId,
      startTime,
      endTime,
      staffId: formData.get('staffId'),
      sessionType: formData.get('sessionType'),
      maxParticipants: parseInt(formData.get('maxParticipants')),
      currentParticipants: 0
    };

    const createdSessionId = await dispatch({ type: 'ADD_SESSION', payload: newSession });
    if (!createdSessionId) {
      error('Could not schedule session.');
      return;
    }

    success('Session scheduled successfully');
    setIsModalOpen(false);
  };

  const getZoneColor = (zoneId) => {
    const colors = [
      'bg-indigo-100 border-indigo-200 text-indigo-800',
      'bg-emerald-100 border-emerald-200 text-emerald-800',
      'bg-amber-100 border-amber-200 text-amber-800',
      'bg-rose-100 border-rose-200 text-rose-800',
      'bg-purple-100 border-purple-200 text-purple-800',
      'bg-blue-100 border-blue-200 text-blue-800',
      'bg-cyan-100 border-cyan-200 text-cyan-800',
      'bg-pink-100 border-pink-200 text-pink-800'
    ];
    const hash = String(zoneId || '')
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = hash % colors.length;
    return colors[index];
  };

  const getZoneById = (zoneId) => zones.find(z => z.id === zoneId);

  // Group sessions by hour for display
  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Session Scheduling</h1>
          <p className="text-gray-500">Manage sessions and activities</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Session
        </button>
      </div>

      {/* Day Selector */}
      <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-gray-100 overflow-x-auto">
        {days.map(day => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition-colors ${
              selectedDay === day
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Weekly Calendar View */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-9 border-b border-gray-100">
          <div className="p-4 border-r border-gray-100 bg-gray-50">
            <span className="text-xs font-medium text-gray-500">Time</span>
          </div>
          {days.map(day => (
            <div 
              key={day} 
              className={`p-4 text-center ${selectedDay === day ? 'bg-indigo-50' : ''}`}
            >
              <span className={`text-sm font-medium capitalize ${selectedDay === day ? 'text-indigo-700' : 'text-gray-700'}`}>
                {day.slice(0, 3)}
              </span>
            </div>
          ))}
        </div>

        <div className="divide-y divide-gray-100">
          {hours.map(hour => (
            <div key={hour} className="grid grid-cols-9 min-h-[80px]">
              <div className="p-3 border-r border-gray-100 bg-gray-50 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-500">
                  {hour <= 12 ? `${hour} AM` : `${hour - 12} PM`}
                </span>
              </div>
              {days.map(day => {
                const daySessions = sessions.filter(s => {
                  const sessionStart = new Date(s.startTime);
                  const weekday = sessionStart.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                  const sessionHour = sessionStart.getHours();
                  return weekday === day && sessionHour === hour;
                });

                return (
                  <div 
                    key={`${day}-${hour}`} 
                    className={`p-2 border-r border-gray-100 relative ${selectedDay === day ? 'bg-indigo-50/30' : ''}`}
                  >
                    {daySessions.map(session => {
                      const zone = getZoneById(session.zoneId);
                      return (
                        <div 
                          key={session.id}
                          className={`p-2 rounded-lg border text-xs mb-1 ${getZoneColor(session.zoneId)}`}
                        >
                          <div className="font-medium truncate">{zone?.zoneName}</div>
                          <div className="flex items-center gap-1 mt-1 opacity-75">
                            <Clock className="w-3 h-3" />
                            {formatTime(session.startTime)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Sessions List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Sessions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.slice(0, 6).map(session => {
            const zone = getZoneById(session.zoneId);
            return (
              <div 
                key={session.id}
                className={`p-4 rounded-xl border ${getZoneColor(session.zoneId)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold">{zone?.zoneName}</h4>
                  <span className="text-xs opacity-75">{session.sessionType}</span>
                </div>
                <div className="space-y-1 text-sm opacity-75">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {formatTime(session.startTime)} - {formatTime(session.endTime)}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {zone?.activityType}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {session.currentParticipants} / {session.maxParticipants}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Session Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule New Session"
      >
        <form onSubmit={handleAddSession} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
            <select
              name="zoneId"
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a zone</option>
              {zones.filter(z => z.isActive).map(zone => (
                <option key={zone.id} value={zone.id}>{zone.zoneName}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                name="startTime"
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                name="endTime"
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Staff</label>
            <select
              name="staffId"
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select staff member</option>
              {staff.filter(s => s.isActive).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session Type</label>
            <input
              type="text"
              name="sessionType"
              required
              placeholder="e.g., Open Play, Workshop"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
            <input
              type="number"
              name="maxParticipants"
              min="1"
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
            >
              Schedule Session
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SessionScheduling;
