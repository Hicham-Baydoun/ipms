import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, limit, query, updateDoc, where } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../firebase/config';
import { generateUsername } from '../utils/usernameGenerator';

const AUTH_CACHE_KEY = 'ipms_auth_cache';

const readCachedAuth = () => {
  try {
    const raw = localStorage.getItem(AUTH_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to read auth cache', error);
    return null;
  }
};

const writeCachedAuth = (authState) => {
  try {
    if (!authState?.user?.uid || !authState?.role) {
      localStorage.removeItem(AUTH_CACHE_KEY);
      return;
    }
    localStorage.setItem(
      AUTH_CACHE_KEY,
      JSON.stringify({
        uid: authState.user.uid,
        role: authState.role,
        profile: authState.profile || null
      })
    );
  } catch (error) {
    console.warn('Failed to write auth cache', error);
  }
};

const cachedAuth = isFirebaseConfigured() ? readCachedAuth() : null;

const initialState = {
  role: cachedAuth?.role || null,
  user: cachedAuth?.uid ? { uid: cachedAuth.uid } : null,
  profile: cachedAuth?.profile || null,
  isAuthenticated: Boolean(cachedAuth?.uid && cachedAuth?.role),
  loading: isFirebaseConfigured(),
  error: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'SET_AUTH':
      return {
        ...state,
        user: action.payload.user,
        role: action.payload.role,
        profile: action.payload.profile || null,
        isAuthenticated: Boolean(action.payload.user && action.payload.role),
        loading: false,
        error: null
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload || null,
        loading: false
      };
    case 'LOGOUT':
      return {
        role: null,
        user: null,
        profile: null,
        isAuthenticated: false,
        loading: false,
        error: null
      };
    case 'UPDATE_USER':
      return {
        ...state,
        profile: state.profile ? { ...state.profile, ...action.payload } : action.payload
      };
    default:
      return state;
  }
};

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const resolveRoleFromFirestore = useCallback(async (firebaseUser) => {
    if (!firebaseUser || !isFirebaseConfigured() || !db) {
      return null;
    }

    const buildStaffRoleResult = async (staffDoc) => {
      const staffData = staffDoc.data();
      let { username } = staffData;

      if (!username) {
        const allStaff = await getDocs(collection(db, 'staff'));
        const existingUsernames = allStaff.docs
          .filter((d) => d.id !== staffDoc.id)
          .map((d) => d.data().username)
          .filter(Boolean);
        username = generateUsername(staffData.name, existingUsernames);
        await updateDoc(doc(db, 'staff', staffDoc.id), { username });
      }

      return {
        role: staffData.role || 'Staff',
        profile: {
          id: staffDoc.id,
          ...staffData,
          username,
          phone: staffData.phone || staffData.phoneNumber || '',
          uid: firebaseUser.uid
        }
      };
    };

    // Check guardian first — guardians cannot read the staff collection
    const guardianDoc = await getDoc(doc(db, 'guardians', firebaseUser.uid));
    if (guardianDoc.exists()) {
      const guardianData = guardianDoc.data();
      const username = guardianData.username || generateUsername(guardianData.name, []);
      if (!guardianData.username) {
        await updateDoc(doc(db, 'guardians', guardianDoc.id), { username });
      }
      return {
        role: 'Guardian',
        profile: {
          id: guardianDoc.id,
          ...guardianData,
          username,
          uid: firebaseUser.uid
        }
      };
    }

    // Not a guardian — safe to query staff collection
    const staffByUidQuery = query(collection(db, 'staff'), where('uid', '==', firebaseUser.uid), limit(1));
    const staffByUidSnapshot = await getDocs(staffByUidQuery);
    if (!staffByUidSnapshot.empty) {
      return await buildStaffRoleResult(staffByUidSnapshot.docs[0]);
    }

    if (firebaseUser.email) {
      const staffByEmailQuery = query(collection(db, 'staff'), where('email', '==', firebaseUser.email), limit(1));
      const staffByEmailSnapshot = await getDocs(staffByEmailQuery);
      if (!staffByEmailSnapshot.empty) {
        console.warn('Staff uid mismatch detected. Matched staff profile by email.');
        return await buildStaffRoleResult(staffByEmailSnapshot.docs[0]);
      }
    }

    return null;
  }, []);

  const setAuthenticatedState = useCallback((payload) => {
    dispatch({ type: 'SET_AUTH', payload });
    writeCachedAuth(payload);
  }, []);

  const clearAuthState = useCallback(() => {
    dispatch({ type: 'LOGOUT' });
    writeCachedAuth(null);
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured() || !auth || !db) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          clearAuthState();
          return;
        }

        const resolvedRole = await resolveRoleFromFirestore(firebaseUser);
        if (!resolvedRole) {
          await signOut(auth);
          clearAuthState();
          dispatch({ type: 'SET_ERROR', payload: 'Account not recognized' });
          return;
        }

        setAuthenticatedState({
          user: firebaseUser,
          role: resolvedRole.role,
          profile: resolvedRole.profile
        });
      } catch (error) {
        console.error('Auth state sync failed:', error);
        clearAuthState();
        dispatch({ type: 'SET_ERROR', payload: error.message || 'Authentication failed' });
      }
    });

    return () => unsubscribe();
  }, [clearAuthState, resolveRoleFromFirestore, setAuthenticatedState]);

  const login = useCallback(
    async (firstArg, secondArg, thirdArg) => {
      const parsedInput =
        typeof firstArg === 'object' && firstArg !== null
          ? {
              email: firstArg.email || '',
              password: firstArg.password || '',
              requestedRole: firstArg.requestedRole || firstArg.role || null
            }
          : {
              email: firstArg || '',
              password: secondArg || '',
              requestedRole: thirdArg || null
            };

      if (!isFirebaseConfigured() || !auth || !db) {
        throw new Error('Firebase is not configured. Add valid Firebase env values first.');
      }

      if (!parsedInput.email || !parsedInput.password) {
        if (auth.currentUser) {
          await signOut(auth);
          clearAuthState();
          return null;
        }
        throw new Error('Email and password are required.');
      }

      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const credentials = await signInWithEmailAndPassword(auth, parsedInput.email, parsedInput.password);
      const resolvedRole = await resolveRoleFromFirestore(credentials.user);

      if (!resolvedRole) {
        await signOut(auth);
        clearAuthState();
        throw new Error('Account not recognized');
      }

      const requestedRoleMatches = (() => {
        if (!parsedInput.requestedRole) return true;
        if (parsedInput.requestedRole === 'Staff') {
          return resolvedRole.role === 'Staff' || resolvedRole.role === 'Supervisor';
        }
        if (parsedInput.requestedRole === 'Supervisor') {
          return resolvedRole.role === 'Supervisor';
        }
        return resolvedRole.role === parsedInput.requestedRole;
      })();

      if (!requestedRoleMatches) {
        await signOut(auth);
        clearAuthState();
        throw new Error(`This account is ${resolvedRole.role}, not ${parsedInput.requestedRole}.`);
      }

      const authState = {
        user: credentials.user,
        role: resolvedRole.role,
        profile: resolvedRole.profile
      };

      setAuthenticatedState(authState);
      return authState;
    },
    [clearAuthState, resolveRoleFromFirestore, setAuthenticatedState]
  );

  const logout = useCallback(async () => {
    if (isFirebaseConfigured() && auth) {
      await signOut(auth);
    }
    clearAuthState();
  }, [clearAuthState]);

  const updateUser = useCallback((userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
    writeCachedAuth({
      user: state.user,
      role: state.role,
      profile: state.profile ? { ...state.profile, ...userData } : userData
    });
  }, [state.profile, state.role, state.user]);

  const contextValue = useMemo(
    () => ({
      ...state,
      login,
      logout,
      updateUser
    }),
    [state, login, logout, updateUser]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
