import { useState, useEffect, useRef, useCallback } from 'react';

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

export const useCountUp = (target, duration = 800, startOnMount = true) => {
  const [count, setCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const animationRef = useRef(null);
  const prevTargetRef = useRef(target);
  const countRef = useRef(0);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    countRef.current = count;
  }, [count]);

  const runAnimation = useCallback(
    (from, to) => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      let startTime;
      setIsComplete(false);

      const animate = (timestamp) => {
        if (!startTime) {
          startTime = timestamp;
        }

        const progress = Math.min((timestamp - startTime) / duration, 1);
        const eased = easeOutCubic(progress);
        const nextValue = Math.round(from + (to - from) * eased);

        setCount(nextValue);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setCount(to);
          setIsComplete(true);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    },
    [duration]
  );

  const start = useCallback(
    (from = 0) => {
      prevTargetRef.current = target;
      runAnimation(from, target);
    },
    [runAnimation, target]
  );

  useEffect(() => {
    const isFirstRender = !hasMountedRef.current;
    const targetChanged = prevTargetRef.current !== target;

    if (isFirstRender && !startOnMount) {
      hasMountedRef.current = true;
      prevTargetRef.current = target;
      return undefined;
    }

    const from = targetChanged ? countRef.current : 0;
    hasMountedRef.current = true;
    prevTargetRef.current = target;
    runAnimation(from, target);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [target, startOnMount, runAnimation]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return { count, isComplete, start };
};
