import React, { useEffect, useMemo, useState } from 'react';

const OccupancyBar = ({ current = 0, max, capacity, showPercentage = true, size = 'md' }) => {
  const resolvedMax = max ?? capacity ?? 0;

  const percentage = useMemo(() => {
    if (!resolvedMax || resolvedMax <= 0) {
      return 0;
    }

    const raw = Math.round((current / resolvedMax) * 100);
    return Math.min(Math.max(raw, 0), 100);
  }, [current, resolvedMax]);

  const [animatedPercent, setAnimatedPercent] = useState(0);

  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => {
      setAnimatedPercent(percentage);
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [percentage]);

  let colorClass = 'bg-emerald-500';
  if (percentage >= 90) {
    colorClass = 'bg-rose-500';
  } else if (percentage >= 70) {
    colorClass = 'bg-amber-500';
  }

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm text-gray-600">
          {current} / {resolvedMax}
        </span>
        {showPercentage && (
          <span
            className={`text-sm font-medium ${
              percentage >= 90 ? 'text-rose-600' : percentage >= 70 ? 'text-amber-600' : 'text-emerald-600'
            }`}
          >
            {percentage}%
          </span>
        )}
      </div>
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`${colorClass} rounded-full`}
          style={{
            width: `${animatedPercent}%`,
            transition: 'width 600ms ease-out, background-color 400ms ease'
          }}
        />
      </div>
    </div>
  );
};

export default OccupancyBar;
