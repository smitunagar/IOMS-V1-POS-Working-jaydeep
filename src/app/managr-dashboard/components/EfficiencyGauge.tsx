import React from 'react';
import { Card } from './ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { AlertTriangle } from 'lucide-react';

const data = [
  { name: 'Value', value: 62, color: '#2d5a3f' },
  { name: 'Remaining', value: 38, color: '#e5e7eb' },
];

export const EfficiencyGauge: React.FC = () => {
  return (
    <Card className="flex flex-col h-full bg-[#f9fafb]" padding="p-0">
        <div className="bg-white p-5 rounded-t-xl border-b border-gray-50 flex-1 flex flex-col items-center justify-center relative">
             <div className="w-48 h-24 relative mt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cy="100%"
                            innerRadius="80%"
                            outerRadius="100%"
                            startAngle={180}
                            endAngle={0}
                            paddingAngle={0}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                {/* Needle / Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-end -mb-2">
                    <span className="text-4xl font-bold text-gray-800">62%</span>
                </div>
             </div>
             <div className="text-center mt-4">
                 <p className="text-sm font-medium text-gray-800">On pace to finish:</p>
                 <p className="text-sm font-bold text-[#2d5a3f]">+5% surplus</p>
             </div>
        </div>
        
        <div className="bg-[#fff9e6] p-5 rounded-b-xl">
             <div className="flex items-start gap-2">
                <AlertTriangle size={18} className="text-[#d97706] mt-0.5 shrink-0" fill="#d97706" textAnchor="middle" color="white" />
                <div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">Risk of overproduction in Pasta Veg</p>
                    <p className="text-sm text-gray-700">Reduce next batch by ~15 portions</p>
                </div>
             </div>
        </div>
    </Card>
  );
};
