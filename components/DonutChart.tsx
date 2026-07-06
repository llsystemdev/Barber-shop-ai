import React from 'react';

interface DonutChartProps {
  data: { name: string; count: number; color: string }[];
  title: string;
}

const DonutChart: React.FC<DonutChartProps> = ({ data, title }) => {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  if (total === 0) {
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
            <div className="flex-grow flex items-center justify-center">
                <p className="text-gray-500">No hay datos para mostrar.</p>
            </div>
        </div>
    )
  }

  const radius = 15.91549430918954; 
  let cumulativePercent = 0;

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full flex flex-col">
      <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
      <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="relative w-48 h-48 mx-auto">
          <svg viewBox="0 0 36 36" className="transform -rotate-90">
            {data.map((item, index) => {
              const percent = (item.count / total) * 100;
              const offset = 25 - cumulativePercent;
              cumulativePercent += percent;
              return (
                <circle
                  key={index}
                  r={radius}
                  cx="18"
                  cy="18"
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth="6"
                  strokeDasharray={`${percent} ${100 - percent}`}
                  strokeDashoffset={offset}
                  className="transition-all duration-500 ease-in-out"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-800">{total}</span>
            <span className="text-sm text-gray-500">Total</span>
          </div>
        </div>
        
        <div className="space-y-3">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: item.color }} />
                <span className="font-semibold text-gray-700">{item.name}</span>
              </div>
              <span className="font-bold text-gray-900">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DonutChart;