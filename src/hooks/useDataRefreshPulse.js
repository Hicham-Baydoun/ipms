import { useEffect, useRef, useState } from 'react';

export const useDataRefreshPulse = (watchedValue, duration = 200) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return undefined;
    }

    setIsRefreshing(true);
    const timeoutId = setTimeout(() => {
      setIsRefreshing(false);
    }, duration);

    return () => clearTimeout(timeoutId);
  }, [watchedValue, duration]);

  return isRefreshing;
};
