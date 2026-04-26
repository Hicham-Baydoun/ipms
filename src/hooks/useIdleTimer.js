import { useEffect, useRef, useCallback } from 'react';

const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes

export const useIdleTimer = (onIdle, isActive = true) => {
  const idleTimerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    if (isActive) {
      idleTimerRef.current = setTimeout(() => {
        onIdle();
      }, IDLE_TIMEOUT);
    }
  }, [onIdle, isActive]);

  useEffect(() => {
    if (!isActive) return;

    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];

    const handleActivity = () => {
      resetTimer();
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    resetTimer();

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [resetTimer, isActive]);

  const getIdleTime = useCallback(() => {
    return Date.now() - lastActivityRef.current;
  }, []);

  return { resetTimer, getIdleTime };
};
