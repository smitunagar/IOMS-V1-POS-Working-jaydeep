import React from 'react';
import { KpiCardProps } from '../types';
import { Info } from 'lucide-react';

const KPICard: React.FC<KpiCardProps> = ({ title, value, subValue, status = 'neutral', icon, onClick }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'warning': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'danger': return 'text-rose-600 bg-rose-50 border-rose-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  const getBorderColor = () => {
     switch (status) {
      case 'success': return 'border-l-emerald-500';
      case 'warning': return 'border-l-amber-500';
      case 'danger': return 'border-l-rose-500';
      default: return 'border-l-slate-300';
    }
  };

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-lg shadow-sm border border-slate-200 p-5 border-l-4 ${getBorderColor()} hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer group relative`}
    >
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <Info size={16} className="text-slate-400" />
      </div>
      
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
          {subValue && <p className={`text-sm mt-1 font-medium ${status === 'danger' ? 'text-rose-600' : status === 'success' ? 'text-emerald-600' : 'text-slate-400'}`}>{subValue}</p>}
        </div>
        <div className={`p-2 rounded-md ${getStatusColor()}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default KPICard;