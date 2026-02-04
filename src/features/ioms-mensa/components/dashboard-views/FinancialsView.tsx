import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { MensaSite } from '../../types';
import { Euro, TrendingDown, ArrowDownRight, AlertCircle } from 'lucide-react';

interface FinancialsViewProps {
  sites: MensaSite[];
}

const FinancialsView: React.FC<FinancialsViewProps> = ({ sites }) => {
  // Sort by highest subsidy (Loss Makers)
  const lossMakers = [...sites].sort((a, b) => b.subsidyPerMeal - a.subsidyPerMeal);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Financial Performance</h2>
        <p className="text-slate-500">Revenue Analysis & Cost Structures</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Top Card 1 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase">Total Revenue (Daily)</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">
              €{sites.reduce((acc, s) => acc + s.totalRevenue, 0).toLocaleString()}
            </h3>
            <p className="text-sm text-emerald-600 flex items-center mt-1">
              <TrendingDown className="rotate-180 mr-1" size={16} /> +4.2% vs Last Month
            </p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
            <Euro size={24} />
          </div>
        </div>

        {/* Top Card 2 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase">Avg Food Cost %</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">
              {(sites.reduce((acc, s) => acc + s.cogsPercent, 0) / sites.length).toFixed(1)}%
            </h3>
            <p className="text-sm text-slate-400 mt-1">Target: 28% - 30%</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
            <TrendingDown size={24} />
          </div>
        </div>

        {/* Top Card 3 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
           <div>
            <p className="text-sm font-semibold text-slate-500 uppercase">Labor Cost Ratio</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">
              {(sites.reduce((acc, s) => acc + s.laborCostPercent, 0) / sites.length).toFixed(1)}%
            </h3>
             <p className="text-sm text-rose-600 flex items-center mt-1">
              <ArrowDownRight className="mr-1" size={16} /> 2% Over Budget
            </p>
          </div>
           <div className="p-3 bg-rose-50 rounded-lg text-rose-600">
            <AlertCircle size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart: Cost Structure */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Cost Breakdown by Site</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sites} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={false} axisLine={false} />
                <YAxis unit="%" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: number) => `${val}%`}
                />
                <Legend />
                <Bar dataKey="cogsPercent" name="COGS %" stackId="a" fill="#6366f1" />
                <Bar dataKey="laborCostPercent" name="Labor %" stackId="a" fill="#cbd5e1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-center text-slate-400 mt-2">Sites shown left to right</p>
        </div>

        {/* Table: Loss Makers */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-rose-50/50">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <AlertCircle size={20} className="text-rose-500" />
              Highest Subsidy Sites (Loss Leaders)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Site Name</th>
                  <th className="px-6 py-3 text-right">Subsidy / Meal</th>
                  <th className="px-6 py-3 text-right">Revenue</th>
                  <th className="px-6 py-3 text-right">Margin Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lossMakers.map((site, index) => (
                  <tr key={site.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                      <span className="text-slate-400 w-4">{index + 1}.</span>
                      {site.name}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-rose-600">
                      €{site.subsidyPerMeal.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600">
                      €{site.totalRevenue.toLocaleString()}
                    </td>
                     <td className="px-6 py-4 text-right">
                       <span className={`px-2 py-1 rounded text-xs font-bold ${site.subsidyPerMeal > 3 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                         {site.subsidyPerMeal > 3 ? 'CRITICAL' : 'WATCH'}
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FinancialsView;