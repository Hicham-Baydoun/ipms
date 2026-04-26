import { useState, useEffect } from 'react';

export const useFakeLoading = (data, delay = 300) => {
  const [isLoading, setIsLoading] = useState(true);
  const [displayData, setDisplayData] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setDisplayData(data);
      setIsLoading(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [data, delay]);

  return { isLoading, data: displayData };
};
