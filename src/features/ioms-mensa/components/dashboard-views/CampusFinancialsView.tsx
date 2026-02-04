import React from 'react';
import { CampusClusterSite } from '../../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { Euro, TrendingUp, AlertOctagon, TrendingDown } from 'lucide-react';

interface CampusFinancialsViewProps {
  sites: CampusClusterSite[];
}

const CampusFinancialsView: React.FC<CampusFinancialsViewProps> = ({ sites }) => {
  const totalRevenue = sites.reduce((acc, s) => acc + s.revenue, 0);
  const avgPrimeCost = sites.reduce((acc, s) => acc + s.foodCostPercent + s.laborCostPercent, 0) / sites.length;
  
  const viewTitle = sites.length > 1 ? "Cluster Financials" : "Site Financials";

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Total Revenue</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">€{totalRevenue.toLocaleString()}</h3>
            <p className="text-xs text-emerald-600 font-medium mt-1">Daily Aggregated</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg text-slate-600">
            <Euro size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Avg Prime Cost</p>
            <h3 className={`text-3xl font-bold mt-1 ${avgPrimeCost > 65 ? 'text-rose-600' : 'text-slate-900'}`}>
              {avgPrimeCost.toFixed(1)}%
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1">Target: &lt; 65%</p>
          </div>
          <div className={`p-3 rounded-lg ${avgPrimeCost > 65 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
            <TrendingUp size={24} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
           <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Gross Margin</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">
              {(100 - avgPrimeCost).toFixed(1)}%
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1">Contribution Margin</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg text-slate-500">
            <TrendingDown size={24} />
          </div>
        </div>
      </div>

      {/* Prime Cost Breakdown Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="mb-6 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">Prime Cost Structure</h3>
            <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-slate-800 rounded-sm"></span> Food Cost %</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-slate-300 rounded-sm"></span> Labor Cost %</div>
            </div>
        </div>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sites} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} stroke="#64748b" />
              <YAxis unit="%" tickLine={false} axisLine={false} fontSize={12} stroke="#64748b" domain={[0, 100]} />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <ReferenceLine y={65} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'Danger Zone (65%)', fill: '#ef4444', fontSize: 10 }} />
              <Bar dataKey="foodCostPercent" name="Food Cost" stackId="a" fill="#1e293b" barSize={sites.length === 1 ? 100 : 60} />
              <Bar dataKey="laborCostPercent" name="Labor Cost" stackId="a" fill="#cbd5e1" barSize={sites.length === 1 ? 100 : 60} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Variance Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <AlertOctagon size={18} className="text-slate-400" />
            <h3 className="font-bold text-slate-800 text-sm">Cost Variance Analysis</h3>
        </div>
        <table className="w-full text-sm text-left">
            <thead className="bg-white text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                    <th className="px-6 py-3">Site</th>
                    <th className="px-6 py-3 text-right">Revenue</th>
                    <th className="px-6 py-3 text-right">Food %</th>
                    <th className="px-6 py-3 text-right">Labor %</th>
                    <th className="px-6 py-3 text-right">Prime %</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {sites.map(site => {
                    const prime = site.foodCostPercent + site.laborCostPercent;
                    return (
                        <tr key={site.id} className="hover:bg-slate-50">
                            <td className="px-6 py-3 font-medium text-slate-900">{site.name}</td>
                            <td className="px-6 py-3 text-right">€{site.revenue.toLocaleString()}</td>
                            <td className="px-6 py-3 text-right">{site.foodCostPercent}%</td>
                            <td className="px-6 py-3 text-right">{site.laborCostPercent}%</td>
                            <td className="px-6 py-3 text-right font-bold">
                                <span className={`px-2 py-1 rounded ${prime > 65 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                    {prime.toFixed(1)}%
                                </span>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default CampusFinancialsView;