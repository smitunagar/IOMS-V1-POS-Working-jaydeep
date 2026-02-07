import React from 'react';
import { Card } from './ui/Card';
import { ArrowUp, Circle } from 'lucide-react';
import { BarChart, Bar, Cell, ResponsiveContainer } from 'recharts';
import { WEEKLY_TREND_DATA } from '../constants';

export const WasteDetail: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Yesterday Waste Snapshot</h3>
          
          <div className="space-y-3">
            {/* Plate Waste Row */}
            <div className="bg-[#fcfdfd] border border-gray-100 rounded-lg p-0 flex overflow-hidden shadow-sm">
                <div className="w-32 bg-[#2d5a3f] text-white p-4 flex flex-col justify-center">
                    <p className="font-medium text-sm">Plate Waste:</p>
                    <div className="flex items-center text-xs mt-1 font-medium text-[#4da167]">
                        <ArrowUp size={12} strokeWidth={3} className="mr-0.5" />
                        <span>+8%</span>
                    </div>
                </div>
                <div className="flex-1 p-3 flex items-center justify-between bg-[#fcfdfd]">
                    <div>
                        <span className="text-xl font-bold text-gray-800">32 kg</span>
                        <div className="h-2 w-2 rounded-full bg-[#2d5a3f] inline-block ml-3 align-middle"></div>
                    </div>
                    <div className="text-[10px] text-gray-400 flex items-center">
                        <span className="text-gray-300 mr-1">▲</span> Week week
                    </div>
                </div>
            </div>

            {/* Prep Waste Row */}
            <div className="bg-[#fcfdfd] border border-gray-100 rounded-lg p-0 flex overflow-hidden shadow-sm">
                <div className="w-32 bg-[#fcd34d] text-[#133E28] p-4 flex flex-col justify-center">
                    <p className="font-medium text-sm">Prep Waste:</p>
                    <div className="flex items-center text-xs mt-1 font-bold text-[#133E28]">
                        <ArrowUp size={12} strokeWidth={3} className="mr-0.5" />
                        <span>+4%</span>
                    </div>
                </div>
                <div className="flex-1 p-3 flex items-center justify-between bg-[#fcfdfd]">
                     <div>
                        <span className="text-xl font-bold text-gray-800">18 kg</span>
                         <div className="h-2 w-2 rounded-full bg-[#4da167] inline-block ml-3 align-middle"></div>
                    </div>
                    <div className="text-[10px] text-gray-400 flex items-center">
                         <span className="text-gray-300 mr-1">▲</span> Week week
                    </div>
                </div>
            </div>
          </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Weekly Trends</h4>
        <div className="bg-white rounded-lg p-3 flex items-end justify-between border border-gray-100 h-16">
            <div className="flex-1 h-full mr-4">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={WEEKLY_TREND_DATA}>
                        <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                            {WEEKLY_TREND_DATA.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                 </ResponsiveContainer>
            </div>
            <div className="text-right pb-1">
                 <p className="text-[10px] text-gray-400 mb-0.5">Waste Trend</p>
                 <div className="flex items-center text-sm font-bold text-[#2d5a3f]">
                    <span className="text-[10px] mr-1">▲</span>
                    74%
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};
