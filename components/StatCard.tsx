
import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  changeType?: 'increase' | 'decrease';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, change, changeType }) => {
  const changeColor = changeType === 'increase' ? 'text-red-600' : 'text-rose-600';
  const changeBg = changeType === 'increase' ? 'bg-red-50' : 'bg-rose-50';

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-xl hover:border-red-100 transition-all duration-300 group">
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-slate-600 transition-colors">{title}</h3>
        <div className="w-10 h-10 text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100 transition-transform group-hover:scale-110">
            {icon}
        </div>
      </div>
      <div>
        <p className="text-4xl font-black text-slate-950 tracking-tighter mb-2 group-hover:text-red-700 transition-colors">{value}</p>
        {change && (
          <p className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg inline-block ${changeColor} ${changeBg} border border-transparent hover:border-current transition-all`}>
            {changeType === 'increase' ? '↑' : '↓'} {change}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
