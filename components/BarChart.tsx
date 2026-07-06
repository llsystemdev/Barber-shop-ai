import React from 'react';

interface BarChartProps<T> {
  data: T[];
  title: string;
  category: keyof T;
  value: keyof T;
}

const BarChart = <T,>({ data, title, category, value }: BarChartProps<T>) => {
  const maxValue = Math.max(...data.map(d => Number(d[value])), 0);
  const yAxisLabels = [0, Math.ceil(maxValue / 2), maxValue].filter((v, i, a) => a.indexOf(v) === i); // Unique values

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
      <div className="flex">
        <div className="flex flex-col justify-between text-xs text-gray-500 pr-4">
          {yAxisLabels.slice().reverse().map(label => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-7 gap-3 border-l border-gray-200 pl-4 items-end">
          {data.map((item, index) => (
            <div key={index} className="text-center group">
              <div
                className="bg-red-200 hover:bg-red-500 rounded-t-md transition-all h-32 flex items-end"
                style={{ height: `${(Number(item[value]) / (maxValue || 1)) * 100}%` }}
                title={`${String(item[category])}: ${String(item[value])}`}
              >
                 <div className="w-full h-full bg-red-400 group-hover:bg-red-600 rounded-t-md transition-colors" style={{ height: `${(Number(item[value]) / (maxValue || 1)) * 100}%` }}></div>
              </div>
              <p className="text-xs font-semibold text-gray-600 mt-2 truncate">{String(item[category])}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BarChart;