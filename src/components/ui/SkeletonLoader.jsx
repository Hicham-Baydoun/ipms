import React from 'react';

const SkeletonLoader = ({ type = 'card', count = 1, className = '' }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ${className}`}>
            <div className="flex items-start justify-between">
              <div className="space-y-3 flex-1">
                <div className="h-4 w-24 animate-shimmer rounded" />
                <div className="h-8 w-16 animate-shimmer rounded" />
              </div>
              <div className="h-12 w-12 animate-shimmer rounded-xl" />
            </div>
          </div>
        );
      
      case 'text':
        return (
          <div className={`space-y-2 ${className}`}>
            <div className="h-4 w-full animate-shimmer rounded" />
            <div className="h-4 w-3/4 animate-shimmer rounded" />
          </div>
        );
      
      case 'avatar':
        return (
          <div className={`flex items-center gap-3 ${className}`}>
            <div className="h-10 w-10 animate-shimmer rounded-full" />
            <div className="space-y-2">
              <div className="h-4 w-32 animate-shimmer rounded" />
              <div className="h-3 w-24 animate-shimmer rounded" />
            </div>
          </div>
        );
      
      case 'table-row':
        return (
          <div className={`flex items-center gap-4 py-4 ${className}`}>
            <div className="h-4 w-1/6 animate-shimmer rounded" />
            <div className="h-4 w-1/6 animate-shimmer rounded" />
            <div className="h-4 w-1/6 animate-shimmer rounded" />
            <div className="h-4 w-1/6 animate-shimmer rounded" />
            <div className="h-4 w-1/6 animate-shimmer rounded" />
            <div className="h-4 w-1/6 animate-shimmer rounded" />
          </div>
        );
      
      case 'chart':
        return (
          <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ${className}`}>
            <div className="h-6 w-32 animate-shimmer rounded mb-4" />
            <div className="h-64 w-full animate-shimmer rounded-xl" />
          </div>
        );
      
      default:
        return (
          <div className={`h-4 w-full animate-shimmer rounded ${className}`} />
        );
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{renderSkeleton()}</div>
      ))}
    </>
  );
};

export default SkeletonLoader;
