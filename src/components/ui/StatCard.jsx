import React from 'react';
import { useCountUp } from '../../hooks/useCountUp';

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  suffix = '', 
  color = 'indigo',
  delay = 0 
}) => {
  const { count } = useCountUp(value, 800, true);
  
  const colorClasses = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <div 
      className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover animate-fade-slide-up ${delay > 0 ? `animate-fade-slide-up-delay-${delay}` : ''}`}
      style={{ animationDelay: delay ? `${delay * 80}ms` : '0ms' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">
            {count}{suffix}
          </p>
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
