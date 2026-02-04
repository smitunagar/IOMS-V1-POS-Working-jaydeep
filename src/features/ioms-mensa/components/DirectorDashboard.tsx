import React, { useMemo, useState } from 'react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea, 
  ScatterChart, Scatter, ZAxis 
} from 'recharts';
import { 
  Euro, TrendingUp, Users, AlertTriangle, CheckCircle2, ArrowRight, Filter, ChevronDown, Smile, Meh, Frown, Heart, Sun, Moon
} from 'lucide-react';
import { MOCK_SITES, SUBSIDY_TREND } from '../constants';
import { DashboardView, KpiDetail, Role, Theme } from '../types';
import KPICard from './KPICard';
import Sidebar from './Sidebar';
import FinancialsView from './dashboard-views/FinancialsView';
import SustainabilityView from './dashboard-views/SustainabilityView';
import KpiDetailModal from './KpiDetailModal';

interface DirectorDashboardProps {
  onLogout: () => void;
  onNavigateHome: (role: Role | null) => void;
  theme: Theme;
  toggleTheme: () => void;
}

const DirectorDashboard: React.FC<DirectorDashboardProps> = ({ onLogout, onNavigateHome, theme, toggleTheme }) => {
  const [currentView, setCurrentView] = useState<DashboardView>('OVERVIEW');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('ALL');
  const [selectedKpiDetail, setSelectedKpiDetail] = useState<KpiDetail | null>(null);

  // Filter Data
  const filteredSites = useMemo(() => {
    if (selectedSiteId === 'ALL') return MOCK_SITES;
    return MOCK_SITES.filter(site => site.id === selectedSiteId);
  }, [selectedSiteId]);

  // Calculate Aggregates
  const stats = useMemo(() => {
    const totalMeals = filteredSites.reduce((acc, s) => acc + s.dailyMeals, 0);
    const avgSubsidy = filteredSites.reduce((acc, s) => acc + s.subsidyPerMeal, 0) / filteredSites.length;
    const avgCogs = filteredSites.reduce((acc, s) => acc + s.cogsPercent, 0) / filteredSites.length;
    const avgCsi = filteredSites.reduce((acc, s) => acc + s.customerSatisfaction, 0) / filteredSites.length;
    const totalLaborHours = filteredSites.reduce((acc, s) => acc + s.laborHours, 0);
    const mplh = totalLaborHours > 0 ? totalMeals / totalLaborHours : 0;

    return { totalMeals, avgSubsidy, avgCogs, mplh, avgCsi };
  }, [filteredSites]);

  const sortedByWaste = [...filteredSites].sort((a, b) => a.foodWastePerGuest - b.foodWastePerGuest);
  const focusSites = [...filteredSites]
    .sort((a, b) => (b.subsidyPerMeal + b.foodWastePerGuest/100) - (a.subsidyPerMeal + a.foodWastePerGuest/100))
    .slice(0, 3);
  const dgeFailures = filteredSites.filter(s => !s.dgeCompliant);

  const handleKpiClick = (type: string) => {
    // ... (Keep existing KPI modal logic, purely informational)
  };

  // Theme Helpers
  const bgClass = theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50';
  const textClass = theme === 'dark' ? 'text-slate-100' : 'text-slate-900';
  const cardBg = theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const subText = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';

  const renderContent = () => {
    if (currentView === 'FINANCIALS') return <FinancialsView sites={filteredSites} />;
    if (currentView === 'SUSTAINABILITY') return <SustainabilityView sites={filteredSites} />;
    if (currentView === 'SETTINGS') return <div className="p-12 text-center text-slate-500">Settings Module Placeholder</div>;

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard title="Gov. Subsidy / Meal" value={`€${stats.avgSubsidy.toFixed(2)}`} subValue={stats.avgSubsidy > 2.8 ? "+12% vs Target" : "-2% vs Target"} status={stats.avgSubsidy > 3.0 ? "danger" : stats.avgSubsidy > 2.5 ? "warning" : "success"} icon={<Euro size={24} />} onClick={() => handleKpiClick('SUBSIDY')} theme={theme} />
          <KPICard title="COGS (Wareneinsatz)" value={`${stats.avgCogs.toFixed(1)}%`} subValue="Target: 28-30%" status={stats.avgCogs > 32 ? "danger" : "success"} icon={<TrendingUp size={24} />} onClick={() => handleKpiClick('COGS')} theme={theme} />
          <KPICard title="Labor Efficiency" value={`${stats.mplh.toFixed(1)}`} subValue="Meals Per Labor Hour" status={stats.mplh < 12 ? "warning" : "success"} icon={<Users size={24} />} onClick={() => handleKpiClick('LABOR')} theme={theme} />
          <KPICard title="Student Satisfaction" value={`${stats.avgCsi.toFixed(1)} / 5.0`} subValue="Based on 12k Ratings" status={stats.avgCsi >= 4.0 ? "success" : stats.avgCsi >= 3.0 ? "warning" : "danger"} icon={<Heart size={24} />} onClick={() => handleKpiClick('CSI')} theme={theme} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Chart 1: Subsidy Trend */}
          <div className={`lg:col-span-7 p-6 rounded-xl border shadow-sm ${cardBg}`}>
            <div className="mb-6">
              <h2 className={`text-lg font-bold ${textClass}`}>Subsidy Trend Corridor</h2>
              <p className={`text-sm ${subText}`}>12-Month Performance vs. Target Zone (€2.00 - €3.00)</p>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={SUBSIDY_TREND} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                  <XAxis dataKey="month" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `€${val}`} domain={[1.5, 4]} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', color: theme === 'dark' ? '#fff' : '#000' }} formatter={(value: number) => [`€${value.toFixed(2)}`, 'Subsidy']} />
                  <ReferenceArea y1={2.00} y2={3.00} fill="#10b981" fillOpacity={0.1} strokeOpacity={0} />
                  <Line type="monotone" dataKey="actualSubsidy" stroke={theme === 'dark' ? '#cbd5e1' : '#0f172a'} strokeWidth={3} dot={{ r: 4, fill: theme === 'dark' ? '#cbd5e1' : '#0f172a', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Waste & Mood */}
          <div className={`lg:col-span-5 p-6 rounded-xl border shadow-sm flex flex-col ${cardBg}`}>
            <div className="mb-4 flex justify-between items-center">
              <div>
                <h2 className={`text-lg font-bold ${textClass}`}>Waste Watch & Mood</h2>
                <p className={`text-sm ${subText}`}>Waste (g) correlated with Satisfaction</p>
              </div>
              <div className={`${theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'} px-2 py-1 rounded text-xs font-semibold`}>Ranked</div>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-3">
               {sortedByWaste.map((site) => {
                 const wastePercent = Math.min((site.foodWastePerGuest / 300) * 100, 100);
                 const isHighWaste = site.foodWastePerGuest > 120;
                 const isLowWaste = site.foodWastePerGuest < 80;
                 const barColor = isHighWaste ? 'bg-rose-500' : isLowWaste ? 'bg-emerald-500' : 'bg-amber-400';
                 
                 return (
                   <div key={site.id} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`}>
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className={`font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{site.name}</span>
                          <span className={subText}>{site.foodWastePerGuest}g</span>
                        </div>
                        <div className={`h-2 w-full rounded-full overflow-hidden ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'}`}>
                          <div className={`h-full ${barColor} rounded-full`} style={{ width: `${wastePercent}%` }}></div>
                        </div>
                      </div>
                      <div className="w-8 flex justify-center">
                        {site.customerSatisfaction >= 4.0 ? <Smile className="text-emerald-500" size={20} /> : site.customerSatisfaction >= 3.0 ? <Meh className="text-amber-500" size={20} /> : <Frown className="text-rose-500" size={20} />}
                      </div>
                   </div>
                 );
               })}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`p-6 rounded-xl border shadow-sm ${cardBg}`}>
             <div className="mb-6">
              <h2 className={`text-lg font-bold ${textClass}`}>Operational Efficiency Matrix</h2>
              <p className={`text-sm ${subText}`}>Volume (X) vs. Labor Cost % (Y) • Bubble Size = Revenue</p>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                  <XAxis type="number" dataKey="dailyMeals" name="Meals" unit="" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis type="number" dataKey="laborCostPercent" name="Labor" unit="%" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={12} tickLine={false} axisLine={false} />
                  <ZAxis type="number" dataKey="totalRevenue" range={[50, 400]} name="Revenue" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-800 text-white p-2 rounded text-xs shadow-lg">
                          <p className="font-bold">{data.name}</p>
                          <p>Meals: {data.dailyMeals}</p>
                          <p>Labor: {data.laborCostPercent}%</p>
                          <p>Rev: €{data.totalRevenue}</p>
                        </div>
                      );
                    }
                    return null;
                  }} />
                  <Scatter name="Sites" data={filteredSites} fill="#6366f1" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className={`rounded-xl border shadow-sm overflow-hidden flex-1 ${cardBg}`}>
              <div className="bg-rose-500/10 border-b border-rose-500/20 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-600">
                  <AlertTriangle size={20} />
                  <h3 className="font-bold">DGE Compliance Alerts</h3>
                </div>
                <span className="bg-white px-2 py-0.5 rounded text-xs font-bold text-rose-600 shadow-sm border border-rose-100">{dgeFailures.length} Sites</span>
              </div>
              <div className={`divide-y overflow-y-auto max-h-[160px] ${theme === 'dark' ? 'divide-slate-700' : 'divide-slate-100'}`}>
                {dgeFailures.map(site => (
                  <div key={site.id} className={`p-4 flex justify-between items-center transition-colors ${theme === 'dark' ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-slate-50 text-slate-800'}`}>
                    <div>
                      <p className="font-semibold text-sm">{site.name}</p>
                      <p className={`text-xs ${subText}`}>Non-compliant for &gt;48h</p>
                    </div>
                    <button className="text-xs font-medium text-indigo-500 hover:text-indigo-400">View Audit</button>
                  </div>
                ))}
              </div>
            </div>

            <div className={`rounded-xl border shadow-sm p-5 flex-1 ${cardBg}`}>
               <h3 className={`font-bold mb-4 flex items-center gap-2 ${textClass}`}>
                 <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                 Management Focus Required
               </h3>
               <div className="space-y-3">
                 {focusSites.map((site, idx) => (
                   <div key={site.id} className={`flex items-center justify-between p-3 rounded-lg border ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="flex items-center gap-3">
                        <span className={`flex items-center justify-center w-6 h-6 rounded border text-xs font-bold ${theme === 'dark' ? 'bg-slate-800 border-slate-600 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>{idx + 1}</span>
                        <div>
                          <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{site.name}</p>
                          <p className={`text-xs ${subText}`}>Subsidy: €{site.subsidyPerMeal.toFixed(2)}</p>
                        </div>
                      </div>
                      <ArrowRight size={16} className={subText} />
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen flex ${bgClass} transition-colors duration-300`}>
      {selectedKpiDetail && <KpiDetailModal detail={selectedKpiDetail} onClose={() => setSelectedKpiDetail(null)} />}
      <Sidebar currentView={currentView} onViewChange={setCurrentView} onLogout={onLogout} onHomeClick={() => onNavigateHome(null)} theme={theme} />
      <main className="flex-1 md:ml-64 p-8 overflow-y-auto h-screen">
        <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className={`text-3xl font-bold tracking-tight ${textClass}`}>
              {currentView === 'OVERVIEW' ? 'Executive Overview' : currentView === 'FINANCIALS' ? 'Financial Control' : 'Sustainability Hub'}
            </h1>
            <p className={`mt-1 ${subText}`}>Strategic Dashboard • {new Date().toLocaleDateString('de-DE')}</p>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={toggleTheme} className={`p-2 rounded-full border ${theme === 'dark' ? 'border-slate-600 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-500 hover:text-slate-800'}`}>
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
             </button>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-sm border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className={`text-sm font-medium ${subText}`}>Online</span>
            </div>
          </div>
        </header>
        {renderContent()}
      </main>
    </div>
  );
};

export default DirectorDashboard;