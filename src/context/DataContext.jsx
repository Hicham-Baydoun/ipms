import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState
} from 'react';
import { useAuth } from './AuthContext';
import { isFirebaseConfigured } from '../firebase/config';
import { subscribeToZones, addZone, updateZone, deactivateZone, reactivateZone } from '../services/zoneService';
import { subscribeToNotifications } from '../services/notificationService';
import { subscribeToUsers, addUser, updateUser } from '../services/userService';
import { subscribeToStaff, addStaff, updateStaff, removeStaff } from '../services/staffService';
import { subscribeToSessions, addSession, updateSession } from '../services/sessionService';
import { subscribeToAttendance } from '../services/attendanceService';
import { subscribeToAuditLogs } from '../services/auditService';
import { subscribeToBracelets } from '../services/braceletService';
import { ensureSystemConfig, subscribeToEmergency, toggleEmergency } from '../services/emergencyService';
import { subscribeToGuardians, subscribeToGuardian, updatePickupList } from '../services/guardianService';
import { performCheckIn } from '../services/checkInService';
import { performCheckOut } from '../services/checkOutService';
import { performReassign } from '../services/reassignService';

const initialState = {
  zones: [],
  users: [],
  staff: [],
  sessions: [],
  attendanceLogs: [],
  auditLogs: [],
  guardians: [],
  notifications: [],
  bracelets: [],
  currentGuardian: null,
  emergencyMode: false,
  emergencyActivatedAt: null,
  emergencyActivatedBy: null,
  systemConfig: null
};

const updateEntity = (collection, payload) =>
  collection.map((item) => (item.id === payload.id ? { ...item, ...payload } : item));

const dataReducer = (state, action) => {
  switch (action.type) {
    case 'SET_ZONES':
      return { ...state, zones: action.payload };
    case 'SET_USERS':
      return { ...state, users: action.payload };
    case 'SET_STAFF':
      return { ...state, staff: action.payload };
    case 'SET_SESSIONS':
      return { ...state, sessions: action.payload };
    case 'SET_ATTENDANCE_LOGS':
      return { ...state, attendanceLogs: action.payload };
    case 'SET_AUDIT_LOGS':
      return { ...state, auditLogs: action.payload };
    case 'SET_GUARDIANS':
      return { ...state, guardians: action.payload };
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload };
    case 'SET_BRACELETS':
      return { ...state, bracelets: action.payload };
    case 'SET_CURRENT_GUARDIAN': {
      const nextGuardians = state.guardians.some((guardian) => guardian.id === action.payload.id)
        ? state.guardians.map((guardian) => (guardian.id === action.payload.id ? action.payload : guardian))
        : [action.payload, ...state.guardians];
      return {
        ...state,
        guardians: nextGuardians,
        currentGuardian: action.payload
      };
    }
    case 'SET_SYSTEM_CONFIG':
      return {
        ...state,
        systemConfig: action.payload,
        emergencyActivatedAt: action.payload?.emergencyActivatedAt || state.emergencyActivatedAt,
        emergencyActivatedBy: action.payload?.emergencyActivatedBy || state.emergencyActivatedBy
      };

    case 'ADD_ZONE':
      return { ...state, zones: [...state.zones, action.payload] };
    case 'UPDATE_ZONE':
      return { ...state, zones: updateEntity(state.zones, action.payload) };
    case 'DELETE_ZONE':
      return { ...state, zones: state.zones.map((zone) => (zone.id === action.payload ? { ...zone, isActive: false } : zone)) };
    case 'REACTIVATE_ZONE':
      return { ...state, zones: state.zones.map((zone) => (zone.id === action.payload ? { ...zone, isActive: true } : zone)) };

    case 'ADD_USER':
      return { ...state, users: [...state.users, action.payload] };
    case 'UPDATE_USER':
      return { ...state, users: updateEntity(state.users, action.payload) };
    case 'CHECK_IN_USER':
      return {
        ...state,
        users: state.users.map((user) =>
          user.id === action.payload.userId
            ? {
                ...user,
                isCheckedIn: true,
                assignedZoneId: action.payload.zoneId,
                braceletId: action.payload.braceletId,
                checkInTime: action.payload.checkInTime || new Date().toISOString()
              }
            : user
        ),
        zones: state.zones.map((zone) =>
          zone.id === action.payload.zoneId ? { ...zone, currentOccupancy: zone.currentOccupancy + 1 } : zone
        )
      };
    case 'CHECK_OUT_USER':
      return {
        ...state,
        users: state.users.map((user) =>
          user.id === action.payload.userId
            ? {
                ...user,
                isCheckedIn: false,
                assignedZoneId: null,
                braceletId: null,
                checkOutTime: action.payload.checkOutTime || new Date().toISOString()
              }
            : user
        ),
        zones: state.zones.map((zone) =>
          zone.id === action.payload.zoneId ? { ...zone, currentOccupancy: Math.max(0, zone.currentOccupancy - 1) } : zone
        )
      };

    case 'ADD_STAFF':
      return { ...state, staff: [...state.staff, action.payload] };
    case 'UPDATE_STAFF':
      return { ...state, staff: updateEntity(state.staff, action.payload) };
    case 'DELETE_STAFF':
      return { ...state, staff: state.staff.filter((member) => member.id !== action.payload) };

    case 'ADD_SESSION':
      return { ...state, sessions: [...state.sessions, action.payload] };
    case 'UPDATE_SESSION':
      return { ...state, sessions: updateEntity(state.sessions, action.payload) };

    case 'ADD_ATTENDANCE_LOG':
      return { ...state, attendanceLogs: [action.payload, ...state.attendanceLogs] };
    case 'UPDATE_ATTENDANCE_LOG':
      return {
        ...state,
        attendanceLogs: state.attendanceLogs.map((log) => {
          const idMatched = action.payload.id && log.id === action.payload.id;
          const activeLogMatched =
            !action.payload.id &&
            action.payload.userId &&
            log.userId === action.payload.userId &&
            !log.checkOutTime;
          if (!idMatched && !activeLogMatched) return log;
          return { ...log, ...action.payload };
        })
      };

    case 'ADD_AUDIT_LOG':
      return { ...state, auditLogs: [action.payload, ...state.auditLogs] };

    case 'ADD_GUARDIAN':
      return { ...state, guardians: [...state.guardians, action.payload] };
    case 'UPDATE_GUARDIAN':
      return { ...state, guardians: updateEntity(state.guardians, action.payload) };
    case 'UPDATE_GUARDIAN_PICKUP':
      return {
        ...state,
        guardians: state.guardians.map((guardian) =>
          guardian.id === action.payload.guardianId ? { ...guardian, authorizedPickup: action.payload.authorizedPickup } : guardian
        )
      };

    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [action.payload, ...state.notifications] };
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map((notification) =>
          notification.id === action.payload ? { ...notification, isRead: true } : notification
        )
      };

    case 'ADD_BRACELET':
      return { ...state, bracelets: [...state.bracelets, action.payload] };
    case 'UPDATE_BRACELET':
      return { ...state, bracelets: updateEntity(state.bracelets, action.payload) };

    case 'SET_EMERGENCY': {
      const payloadIsObject = typeof action.payload === 'object' && action.payload !== null;
      const isEnabled = payloadIsObject ? Boolean(action.payload.emergencyMode) : Boolean(action.payload);
      return {
        ...state,
        emergencyMode: isEnabled,
        emergencyActivatedAt: isEnabled
          ? payloadIsObject
            ? action.payload.emergencyActivatedAt || state.emergencyActivatedAt
            : state.emergencyActivatedAt
          : null,
        emergencyActivatedBy: isEnabled
          ? payloadIsObject
            ? action.payload.emergencyActivatedBy || state.emergencyActivatedBy
            : state.emergencyActivatedBy
          : null
      };
    }
    case 'ACTIVATE_EMERGENCY':
      return {
        ...state,
        emergencyMode: true,
        emergencyActivatedAt: action.payload?.activatedAt || new Date().toISOString(),
        emergencyActivatedBy: action.payload?.activatedBy || null
      };
    case 'DEACTIVATE_EMERGENCY':
      return {
        ...state,
        emergencyMode: false,
        emergencyActivatedAt: null,
        emergencyActivatedBy: null
      };

    default:
      return state;
  }
};

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [state, baseDispatch] = useReducer(dataReducer, initialState);
  const [lastDataSyncAt, setLastDataSyncAt] = useState(() => new Date().toISOString());
  const { user, profile, role } = useAuth();

  const stateRef = useRef(state);
  const authRef = useRef({ user, profile, role });
  const reassignIgnoreRef = useRef({});

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    authRef.current = { user, profile, role };
  }, [user, profile, role]);

  const getActorUid = () => {
    return authRef.current.profile?.username || authRef.current.profile?.uid || authRef.current.user?.uid || 'system';
  };

  const shouldIgnoreReassignFollowUp = (userId) => {
    const ignoreUntil = reassignIgnoreRef.current[userId];
    return typeof ignoreUntil === 'number' && Date.now() < ignoreUntil;
  };

  const dispatch = useCallback(async (action) => {
    if (!action?.type) return;

    const isRemoteEnabled = isFirebaseConfigured();
    const actorUid = getActorUid();
    let actionResult = null;

    const applyLocal = () => {
      baseDispatch(action);
      setLastDataSyncAt(new Date().toISOString());
    };

    if (action.type.startsWith('SET_')) {
      applyLocal();
      return action.payload ?? null;
    }

    if (!isRemoteEnabled) {
      // Zone toggle actions update local state directly when Firebase is unavailable
      if (action.type === 'DELETE_ZONE' || action.type === 'REACTIVATE_ZONE') {
        applyLocal();
        return action.payload;
      }
      console.warn(`Skipping action "${action.type}" because Firebase is not configured.`);
      return null;
    }

    try {
      switch (action.type) {
        case 'ADD_ZONE':
          actionResult = await addZone(action.payload, actorUid);
          break;
        case 'UPDATE_ZONE':
          await updateZone(action.payload.id, action.payload, actorUid);
          actionResult = action.payload.id;
          break;
        case 'DELETE_ZONE':
          baseDispatch(action); // optimistic: flip isActive false immediately
          await deactivateZone(action.payload, actorUid);
          actionResult = action.payload;
          break;
        case 'REACTIVATE_ZONE':
          baseDispatch(action); // optimistic: flip isActive true immediately
          await reactivateZone(action.payload, actorUid);
          actionResult = action.payload;
          break;

        case 'ADD_STAFF':
          actionResult = await addStaff(action.payload, actorUid);
          break;
        case 'UPDATE_STAFF':
          await updateStaff(action.payload.id, action.payload, actorUid);
          actionResult = action.payload.id;
          break;
        case 'DELETE_STAFF':
          await removeStaff(action.payload, actorUid);
          actionResult = action.payload;
          break;

        case 'ADD_SESSION':
          actionResult = await addSession(action.payload, actorUid);
          break;
        case 'UPDATE_SESSION':
          await updateSession(action.payload.id, action.payload);
          actionResult = action.payload.id;
          break;

        case 'ADD_USER':
          actionResult = await addUser(action.payload);
          break;
        case 'UPDATE_USER': {
          const existingUser = stateRef.current.users.find((userEntity) => userEntity.id === action.payload.id);
          const newZoneId = action.payload.assignedZoneId;
          const isReassignAction =
            existingUser &&
            existingUser.isCheckedIn &&
            newZoneId &&
            existingUser.assignedZoneId &&
            newZoneId !== existingUser.assignedZoneId;

          if (isReassignAction) {
            reassignIgnoreRef.current[action.payload.id] = Date.now() + 5000;
            await performReassign(action.payload.id, existingUser.assignedZoneId, newZoneId, actorUid);
            actionResult = action.payload.id;
          } else {
            await updateUser(action.payload.id, action.payload);
            actionResult = action.payload.id;
          }
          break;
        }

        case 'CHECK_IN_USER':
          if (!shouldIgnoreReassignFollowUp(action.payload.userId)) {
            await performCheckIn(
              action.payload.userId,
              action.payload.zoneId,
              action.payload.braceletId || `BRC-${Date.now()}`,
              actorUid
            );
            actionResult = action.payload.userId;
          }
          break;
        case 'CHECK_OUT_USER':
          if (!shouldIgnoreReassignFollowUp(action.payload.userId)) {
            await performCheckOut(action.payload.userId, action.payload.zoneId, actorUid, action.payload.pickupPerson || null);
            actionResult = action.payload.userId;
          }
          break;

        case 'UPDATE_GUARDIAN_PICKUP':
          await updatePickupList(action.payload.guardianId, action.payload.authorizedPickup);
          actionResult = action.payload.guardianId;
          break;

        case 'ACTIVATE_EMERGENCY':
          await toggleEmergency(true, actorUid);
          actionResult = true;
          break;
        case 'DEACTIVATE_EMERGENCY':
          await toggleEmergency(false, actorUid);
          actionResult = true;
          break;

        case 'ADD_NOTIFICATION':
          // Always apply locally — Firestore persistence is handled by the caller
          // (notificationService) so guardians' sessions pick it up via subscription.
          baseDispatch(action);
          actionResult = action.payload?.id;
          break;

        // These are generated by existing pages after transaction-like actions.
        // Ignore to avoid duplicate Firestore writes and duplicate audit entries.
        case 'ADD_ATTENDANCE_LOG':
        case 'UPDATE_ATTENDANCE_LOG':
        case 'ADD_AUDIT_LOG':
          break;

        default:
          console.warn(`Unhandled data action "${action.type}" in remote-only mode.`);
          return null;
      }

      setLastDataSyncAt(new Date().toISOString());
      return actionResult;
    } catch (error) {
      console.error(`Data action failed (${action.type})`, error);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured()) return undefined;

    ensureSystemConfig().catch((error) => {
      console.error('Failed to initialize system config:', error);
    });

    const unsubscribers = [
      subscribeToZones(dispatch),
      subscribeToUsers(dispatch),
      subscribeToStaff(dispatch),
      subscribeToSessions(dispatch),
      subscribeToAttendance(dispatch),
      subscribeToAuditLogs(dispatch),
      subscribeToBracelets(dispatch),
      subscribeToEmergency(dispatch)
    ];

    if (role !== 'Guardian') {
      unsubscribers.push(subscribeToGuardians(dispatch));
    }

    return () => {
      unsubscribers.forEach((unsubscribe) => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
  }, [dispatch, role]);

  useEffect(() => {
    if (!isFirebaseConfigured()) return undefined;
    if (role !== 'Guardian' || !user?.uid) return undefined;

    const unsubGuardian = subscribeToGuardian(user.uid, dispatch);
    const unsubNotifications = subscribeToNotifications(user.uid, dispatch);
    return () => {
      if (typeof unsubGuardian === 'function') unsubGuardian();
      if (typeof unsubNotifications === 'function') unsubNotifications();
    };
  }, [dispatch, role, user?.uid]);

  const contextValue = useMemo(
    () => ({
      ...state,
      lastDataSyncAt,
      dispatch
    }),
    [state, lastDataSyncAt, dispatch]
  );

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
};

export const useAppData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useAppData must be used within a DataProvider');
  }
  return context;
};

export const useData = useAppData;
