import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import { logAudit } from './auditService';

const globalConfigRef = () => doc(db, 'systemConfig', 'global');

export const ensureSystemConfig = async () => {
  if (!isFirebaseConfigured() || !db) return;

  const snapshot = await getDoc(globalConfigRef());
  if (snapshot.exists()) {
    return;
  }

  await setDoc(globalConfigRef(), {
    emergencyMode: false,
    emergencyActivatedAt: null,
    emergencyActivatedBy: null,
    playgroundName: 'IPMS Indoor Playground'
  });
};

export const subscribeToEmergency = (dispatch) => {
  if (!isFirebaseConfigured() || !db) return () => {};

  return onSnapshot(globalConfigRef(), (snapshot) => {
    if (snapshot.exists()) {
      const config = snapshot.data();
      dispatch({ type: 'SET_EMERGENCY', payload: config.emergencyMode });
      dispatch({
        type: 'SET_SYSTEM_CONFIG',
        payload: {
          ...config,
          emergencyActivatedAt: config.emergencyActivatedAt?.toDate?.()?.toISOString?.() || null
        }
      });
    }
  });
};

export const toggleEmergency = async (activate, performedBy) => {
  if (!isFirebaseConfigured() || !db) return;

  await ensureSystemConfig();
  await updateDoc(globalConfigRef(), {
    emergencyMode: activate,
    emergencyActivatedAt: activate ? serverTimestamp() : null,
    emergencyActivatedBy: activate ? performedBy : null
  });

  await logAudit(
    activate ? 'EMERGENCY_ON' : 'EMERGENCY_OFF',
    performedBy,
    'global',
    'system',
    activate ? 'Emergency mode activated' : 'Emergency mode deactivated'
  );
};

export const setEmergencyState = async (emergencyMode, performedBy) => {
  return toggleEmergency(Boolean(emergencyMode), performedBy);
};
