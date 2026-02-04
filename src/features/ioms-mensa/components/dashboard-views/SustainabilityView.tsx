import React from 'react';
import { MensaSite } from '../../types';
import { Leaf, Recycle, Scale, Award } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

interface SustainabilityViewProps {
  sites: MensaSite[];
}

const SustainabilityView: React.FC<SustainabilityViewProps> = ({ sites }) => {
  const sortedWaste = [...sites].sort((a, b) => a.foodWastePerGuest - b.foodWastePerGuest);
  
  const avgRegionalSourcing = Math.round(sites.reduce((acc, s) => acc + s.regionalSourcingPercent, 0) / sites.length);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Sustainability & ESG</h2>
          <p className="text-slate-500">Food Waste Tracking & Carbon Footprint</p>
        </div>
        <div className="flex gap-2">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">CO2 Neutral Target: 2030</span>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-slate-500 uppercase">Avg Waste / Guest</span>
                <Recycle size={20} className="text-emerald-500" />
            </div>
            <div>
                <span className="text-3xl font-bold text-slate-800">
                    {Math.round(sites.reduce((acc, s) => acc + s.foodWastePerGuest, 0) / sites.length)}g
                </span>
                <span className="text-xs text-slate-400 block mt-1">Industry Benchmark: 100g</span>
            </div>
        </div>

         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-slate-500 uppercase">CO2 Footprint</span>
                <Leaf size={20} className="text-emerald-500" />
            </div>
            <div>
                <span className="text-3xl font-bold text-slate-800">1.2kg</span>
                <span className="text-xs text-slate-400 block mt-1">Per Meal Average</span>
            </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-slate-500 uppercase">Regional Sourcing</span>
                <Scale size={20} className="text-emerald-500" />
            </div>
            <div>
                <span className="text-3xl font-bold text-slate-800">{avgRegionalSourcing}%</span>
                <span className="text-xs text-emerald-600 block mt-1 font-medium">+5% Year over Year</span>
            </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-32 bg-gradient-to-br from-emerald-50 to-white">
            <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-emerald-700 uppercase">ESG Rating</span>
                <Award size={20} className="text-emerald-600" />
            </div>
            <div>
                <span className="text-3xl font-bold text-emerald-800">B+</span>
                <span className="text-xs text-emerald-600 block mt-1">Audited: Nov 2024</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Waste Ranking Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-800">Food Waste Leaderboard</h3>
              <p className="text-sm text-slate-500">Grammes of waste per guest (Lower is better)</p>
            </div>
            <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={sortedWaste} margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9"/>
                        <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                        <YAxis dataKey="name" type="category" width={100} stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '6px' }} />
                        <Bar dataKey="foodWastePerGuest" radius={[0, 4, 4, 0]} barSize={20}>
                            {sortedWaste.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.foodWastePerGuest > 120 ? '#fb7185' : entry.foodWastePerGuest < 60 ? '#10b981' : '#f59e0b'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Action List */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Recommended Actions</h3>
            <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <h4 className="font-semibold text-slate-800 text-sm mb-1">Adjust Production in Mensa Arts</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        High waste correlated with "Schnitzel Tuesday". Consider Batch Cooking method to reduce overproduction by 15%.
                    </p>
                </div>
                 <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <h4 className="font-semibold text-slate-800 text-sm mb-1">Composting Partner Review</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Campus Süd organic waste pickup missed twice. Review SLA with provider "GreenCycle".
                    </p>
                </div>
                 <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                    <h4 className="font-semibold text-indigo-900 text-sm mb-1">New Initiative Available</h4>
                    <p className="text-xs text-indigo-700 leading-relaxed">
                        "Too Good To Go" integration pilot ready for Mensa Mitte. Estimated subsidy saving: €0.15/meal.
                    </p>
                    <button className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-800">Activate Pilot →</button>
                </div>
            </div>
        </div>

      </div>

    </div>
  );
};

export default SustainabilityView;