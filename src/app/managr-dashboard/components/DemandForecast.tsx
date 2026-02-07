import React from 'react';
import { Info } from 'lucide-react';
import { Card } from './ui/Card';
import { BarChart, Bar, Cell, XAxis, ResponsiveContainer, YAxis } from 'recharts';
import { CHART_DATA } from '../constants';

export const DemandForecast: React.FC = () => {
  return (
    <Card className="h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Demand Forecast</h2>
        <Info size={18} className="text-gray-400 cursor-pointer" />
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 bg-[#f0f9f4] p-3 rounded-lg border border-[#e0f2e5]">
          <p className="text-xs text-gray-600 mb-1">Scheduled Orders</p>
          <span className="bg-[#4da167] text-white px-3 py-1 rounded-md text-lg font-bold inline-block">640</span>
        </div>
        <div className="flex-1 bg-[#f0f9f4] p-3 rounded-lg border border-[#e0f2e5]">
          <div className="flex items-center gap-1 mb-1">
             <div className="w-2 h-2 rounded-full bg-[#4da167]"></div>
             <p className="text-xs text-gray-600">Expected Walk-ins</p>
          </div>
          <span className="bg-[#5a8d6a] text-white px-3 py-1 rounded-md text-lg font-bold inline-block">210</span>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-gray-600 text-sm mb-1">Total Forecast <span className="text-black text-xl font-bold ml-1">850</span> <span className="text-gray-500 font-medium">± 50</span></p>
      </div>

      <div className="flex-1 min-h-[180px]">
        <p className="text-xs text-gray-400 mb-4">Demand by Time Slot</p>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={CHART_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
             <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#9CA3AF' }} 
                interval={1}
             />
             <YAxis 
                hide 
                domain={[0, 'dataMax + 20']}
             />
            <Bar dataKey="uv" radius={[4, 4, 0, 0]}>
              {CHART_DATA.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
