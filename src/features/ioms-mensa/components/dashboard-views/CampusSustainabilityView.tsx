import React from 'react';
import { CampusClusterSite } from '../../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine } from 'recharts';
import { Leaf, Recycle } from 'lucide-react';

interface CampusSustainabilityViewProps {
  sites: CampusClusterSite[];
}

const CampusSustainabilityView: React.FC<CampusSustainabilityViewProps> = ({ sites }) => {
  const avgWaste = sites.reduce((acc, s) => acc + s.wastePercent, 0) / sites.length;
  const avgPhd = sites.reduce((acc, s) => acc + s.phdPercent, 0) / sites.length;
  
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="bg-emerald-100 p-4 rounded-full text-emerald-600">
                <Leaf size={32} />
            </div>
            <div>
                <p className="text-sm font-bold text-slate-500 uppercase">PHD Compliance</p>
                <h3 className="text-3xl font-bold text-slate-900">{avgPhd.toFixed(0)}%</h3>
                <p className="text-xs text-slate-400">Target: &gt; 60% (Plant-based focus)</p>
            </div>
         </div>

         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`p-4 rounded-full ${avgWaste > 3.5 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                <Recycle size={32} />
            </div>
            <div>
                <p className="text-sm font-bold text-slate-500 uppercase">Production Waste</p>
                <h3 className="text-3xl font-bold text-slate-900">{avgWaste.toFixed(1)}%</h3>
                <p className="text-xs text-slate-400">Target: &lt; 3.5%</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PHD Compliance Chart */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">PHD Menu Share by Site</h3>
             <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sites} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                        <XAxis type="number" domain={[0, 100]} unit="%" hide />
                        <YAxis dataKey="name" type="category" width={100} tickLine={false} axisLine={false} fontSize={12} stroke="#475569" />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="phdPercent" name="PHD Score" barSize={30} radius={[0, 4, 4, 0]}>
                            {sites.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.phdPercent >= 60 ? '#10b981' : '#f59e0b'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
             </div>
             <p className="text-xs text-center text-slate-400">Green = Compliant (&gt;60%)</p>
          </div>

          {/* Waste Comparison */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Waste Generation %</h3>
             <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sites}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} stroke="#64748b" />
                        <YAxis unit="%" tickLine={false} axisLine={false} fontSize={12} stroke="#64748b" />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <ReferenceLine y={3.5} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'top', value: 'Target 3.5%', fill: '#f59e0b', fontSize: 10 }} />
                        <Bar dataKey="wastePercent" name="Waste %" fill="#ef4444" barSize={50} radius={[4, 4, 0, 0]}>
                             {sites.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.wastePercent > 3.5 ? '#ef4444' : '#10b981'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
      </div>
    </div>
  );
};

export default CampusSustainabilityView;