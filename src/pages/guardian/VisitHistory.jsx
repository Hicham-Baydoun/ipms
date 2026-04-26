import React, { useEffect, useState, useMemo } from 'react';
import { History, MapPin, Clock, User, ChevronDown, ChevronUp } from 'lucide-react';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/DataContext';
import { formatDateTime, formatDuration } from '../../utils/formatters';
import { differenceInMinutes } from 'date-fns';

const toDate = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  if (value instanceof Date) return value;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

const VisitHistory = () => {
  const { user: currentUser } = useAuth();
  const { users, zones, guardians } = useAppData();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedChild, setExpandedChild] = useState(null);
  const [fetchError, setFetchError] = useState(false);

  const currentGuardian = useMemo(
    () => guardians.find(g => g.id === currentUser?.uid) || null,
    [guardians, currentUser]
  );

  const children = useMemo(() => {
    if (!currentGuardian?.childrenIds?.length) return [];
    return users.filter(u => currentGuardian.childrenIds.includes(u.id));
  }, [users, currentGuardian]);

  const zonesById = useMemo(() =>
    zones.reduce((acc, z) => { acc[z.id] = z; return acc; }, {}),
    [zones]
  );

  useEffect(() => {
    // Guardian data hasn't arrived yet — keep spinner, wait for next run
    if (!currentGuardian) return;

    if (!isFirebaseConfigured() || !db || !currentGuardian.childrenIds?.length) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchLogs = async () => {
      setLoading(true);
      setFetchError(false);
      try {
        // No orderBy — avoids composite index requirement. Sort client-side instead.
        const q = query(
          collection(db, 'attendanceLogs'),
          where('userId', 'in', currentGuardian.childrenIds),
          limit(200)
        );
        const snapshot = await getDocs(q);
        if (cancelled) return;
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort newest first client-side
        fetched.sort((a, b) => {
          const dateA = toDate(a.checkInTime) || new Date(0);
          const dateB = toDate(b.checkInTime) || new Date(0);
          return dateB - dateA;
        });
        setLogs(fetched);
      } catch (err) {
        console.error('Failed to load visit history:', err);
        if (!cancelled) setFetchError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchLogs();
    return () => { cancelled = true; };
  }, [currentGuardian]);

  const getDuration = (log) => {
    const checkIn = toDate(log.checkInTime);
    const checkOut = toDate(log.checkOutTime);
    if (!checkIn) return '—';
    if (!checkOut) return 'Still inside';
    const mins = differenceInMinutes(checkOut, checkIn);
    return formatDuration(mins);
  };

  // Group logs by child
  const logsByChild = useMemo(() => {
    const grouped = {};
    logs.forEach(log => {
      if (!grouped[log.userId]) grouped[log.userId] = [];
      grouped[log.userId].push(log);
    });
    return grouped;
  }, [logs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Visit History</h1>
        <p className="text-gray-500">Past playground sessions for your children</p>
      </div>

      {fetchError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-700">
          Could not load visit history. Make sure the updated Firestore rules are deployed in Firebase Console.
        </div>
      )}

      {children.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No children linked to your account</p>
        </div>
      ) : (
        <div className="space-y-4">
          {children.map(child => {
            const childLogs = logsByChild[child.id] || [];
            const isExpanded = expandedChild === child.id;

            return (
              <div key={child.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandedChild(isExpanded ? null : child.id)}
                  className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">{child.name}</p>
                      <p className="text-sm text-gray-500">
                        {childLogs.length} visit{childLogs.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  {isExpanded
                    ? <ChevronUp className="w-5 h-5 text-gray-400" />
                    : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {childLogs.length === 0 ? (
                      <div className="px-5 py-8 text-center text-gray-400">
                        <p>No visits recorded yet</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {childLogs.map(log => {
                          const zone = zonesById[log.zoneId];
                          const checkIn = toDate(log.checkInTime);
                          const checkOut = toDate(log.checkOutTime);
                          return (
                            <div key={log.id} className="px-5 py-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="font-medium text-gray-900">
                                      {zone?.zoneName || 'Unknown Zone'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Clock className="w-4 h-4 flex-shrink-0" />
                                    <span>{checkIn ? formatDateTime(checkIn) : '—'}</span>
                                  </div>
                                  {checkOut && (
                                    <p className="text-sm text-gray-400 pl-6">
                                      Left: {formatDateTime(checkOut)}
                                    </p>
                                  )}
                                </div>
                                <span className={`flex-shrink-0 text-xs font-medium px-2 py-1 rounded-full ${
                                  checkOut
                                    ? 'bg-gray-100 text-gray-600'
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {getDuration(log)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VisitHistory;
