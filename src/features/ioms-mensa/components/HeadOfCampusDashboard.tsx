import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Tooltip
} from 'recharts';
import { 
  Target, Activity, Clock, Leaf, ArrowRight, Filter, ChevronDown, 
  Zap, LayoutGrid, CheckCircle2, TrendingDown, TrendingUp, Utensils, Sun, Moon
} from 'lucide-react';
import { MOCK_CAMPUS_CLUSTER, MENU_TRENDS } from '../constants';
import { KpiDetail, Role, DashboardView, VarianceAlert, Theme } from '../types';
import KPICard from './KPICard';
import KpiDetailModal from './KpiDetailModal';
import Sidebar from './Sidebar';
import CampusFinancialsView from './dashboard-views/CampusFinancialsView';
import CampusSustainabilityView from './dashboard-views/CampusSustainabilityView';

interface HeadOfCampusDashboardProps {
  onLogout: () => void;
  onNavigateHome: (role: Role | null) => void;
  theme: Theme;
  toggleTheme: () => void;
}

const HeadOfCampusDashboard: React.FC<HeadOfCampusDashboardProps> = ({ onLogout, onNavigateHome, theme, toggleTheme }) => {
  const [selectedKpiDetail, setSelectedKpiDetail] = useState<KpiDetail | null>(null);
  const [currentView, setCurrentView] = useState<DashboardView>('OVERVIEW');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('ALL');

  const filteredSites = useMemo(() => {
    if (selectedSiteId === 'ALL') return MOCK_CAMPUS_CLUSTER;
    return MOCK_CAMPUS_CLUSTER.filter(site => site.id === selectedSiteId);
  }, [selectedSiteId]);

  const stats = useMemo(() => {
    const totalRevenue = filteredSites.reduce((acc, s) => acc + s.revenue, 0);
    const totalMeals = filteredSites.reduce((acc, s) => acc + s.mealsSold, 0);
    const avgForecast = filteredSites.reduce((acc, s) => acc + s.forecastAccuracy, 0) / filteredSites.length;
    const avgWaste = filteredSites.reduce((acc, s) => acc + s.wastePercent, 0) / filteredSites.length;
    const avgPhd = filteredSites.reduce((acc, s) => acc + s.phdPercent, 0) / filteredSites.length;
    return { totalRevenue, totalMeals, avgForecast, avgWaste, avgPhd };
  }, [filteredSites]);

  const varianceAlerts = useMemo(() => {
    const alerts: VarianceAlert[] = [];
    filteredSites.forEach((site) => {
      if (site.foodCostPercent > 30) alerts.push({ id: `alert-cogs-${site.id}`, siteName: site.name, type: 'FOOD', message: `High COGS: ${site.foodCostPercent}%`, recommendation: 'Check Portion Control.', severity: 'MEDIUM' });
      if (site.staffVariance > 5) alerts.push({ id: `alert-labor-${site.id}`, siteName: site.name, type: 'LABOR', message: `Staff Var: +${site.staffVariance}h`, recommendation: 'Check Shift Schedule.', severity: 'HIGH' });
    });
    return alerts;
  }, [filteredSites]);

  const currentMenuTrend = MENU_TRENDS[MENU_TRENDS.length - 1];
  const previousMenuTrend = MENU_TRENDS[MENU_TRENDS.length - 2];
  const pieData = [
    { name: 'Vegan', value: currentMenuTrend.vegan, color: '#10b981' },
    { name: 'Vegetarian', value: currentMenuTrend.vegetarian, color: '#f59e0b' },
    { name: 'Meat', value: currentMenuTrend.meat, color: '#ef4444' },
  ];

  // Colors based on Theme
  const bgClass = theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50';
  const textClass = theme === 'dark' ? 'text-slate-100' : 'text-slate-900';
  const cardBg = theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const subText = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';

  const renderContent = () => {
    if (currentView === 'FINANCIALS') return <CampusFinancialsView sites={filteredSites} />;
    if (currentView === 'SUSTAINABILITY') return <CampusSustainabilityView sites={filteredSites} />;
    if (currentView === 'SETTINGS') return <div className="p-12 text-center text-slate-500">Settings</div>;

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <KPICard title="Forecast Accuracy" value={`${stats.avgForecast.toFixed(1)}%`} subValue={stats.avgForecast >= 85 ? "Optimal Level" : "Review Plan"} status={stats.avgForecast >= 85 ? 'success' : 'warning'} icon={<Target size={20} />} theme={theme} />
           <KPICard title="Production Efficiency" value={`${stats.avgWaste.toFixed(1)}%`} subValue="Waste % of Vol." status={stats.avgWaste < 5 ? 'success' : 'warning'} icon={<Activity size={20} />} theme={theme} />
           <KPICard title="Labor Productivity" value="14.2" subValue="Lh / 1k Meals" status="success" icon={<Clock size={20} />} theme={theme} />
           <KPICard title="PHD Share" value={`${stats.avgPhd.toFixed(0)}%`} subValue="Planetary Health" status={stats.avgPhd > 60 ? "success" : "neutral"} icon={<Leaf size={20} />} theme={theme} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-bold flex items-center gap-2 ${textClass}`}>
              <LayoutGrid size={18} className={subText} /> Live Site Monitor
            </h2>
            {selectedSiteId !== 'ALL' && <button onClick={() => setSelectedSiteId('ALL')} className="text-xs font-medium text-emerald-600 hover:underline">Clear Filter</button>}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {MOCK_CAMPUS_CLUSTER.map((site) => {
              const isSelected = selectedSiteId === site.id;
              const isDimmed = selectedSiteId !== 'ALL' && !isSelected;
              let accentColor = site.status === 'optimal' ? '#10b981' : site.status === 'warning' ? '#f59e0b' : '#f43f5e';
              
              // Monitor cards always kept dark for "Command Center" feel, or adapted? 
              // Let's adapt them to be consistent with the requested theme but high contrast.
              // Actually, user liked "Dark Command Modules". Let's keep them Slate-900 in light mode too?
              // Or better: In Dark mode -> Slate-800. In Light mode -> Slate-900 (High contrast accent).
              const monitorBg = theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-slate-900 border border-slate-800';
              
              return (
                <div key={site.id} onClick={() => setSelectedSiteId(isSelected ? 'ALL' : site.id)} className={`${monitorBg} rounded-xl p-6 cursor-pointer transition-all duration-300 relative overflow-hidden group shadow-lg ${isSelected ? 'ring-2 ring-emerald-500' : ''} ${isDimmed ? 'opacity-40 grayscale' : 'opacity-100'}`}>
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 shadow-sm"><Utensils size={20} className="text-slate-300" /></div>
                      <div>
                        <h3 className="font-bold text-white text-lg leading-tight">{site.name}</h3>
                        <div className="flex items-center gap-1.5 mt-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }}></span><span className="text-xs text-slate-400 font-medium capitalize">{site.status}</span></div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-6 relative z-10">
                    <div><p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">COGS</p><p className={`text-xl font-bold ${site.foodCostPercent > 30 ? 'text-amber-400' : 'text-white'}`}>{site.foodCostPercent}%</p></div>
                    <div className="border-l border-slate-700 pl-4"><p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Labor</p><p className="text-xl font-bold text-white">{site.laborCostPercent}%</p></div>
                    <div className="border-l border-slate-700 pl-4"><p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Waste</p><p className={`text-xl font-bold ${site.wastePercent > 5 ? 'text-rose-400' : 'text-white'}`}>{site.wastePercent}%</p></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`${cardBg} p-6 rounded-xl border shadow-sm flex flex-col`}>
             <div className="mb-4">
                <h3 className={`text-lg font-bold ${textClass}`}>Dietary Mix</h3>
                <p className={`text-sm ${subText}`}>Sales breakdown by Category</p>
             </div>
             <div className="flex-1 flex items-center justify-between gap-6">
                <div className="h-[180px] w-[180px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value" stroke="none">
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(value: number) => `${value}%`} contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', color: theme === 'dark' ? '#fff' : '#000' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-4">
                  {pieData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                         <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div><span className={`text-sm font-medium ${subText}`}>{item.name}</span></div>
                         <span className={`text-sm font-bold ${textClass}`}>{item.value}%</span>
                      </div>
                  ))}
                </div>
             </div>
          </div>

          <div className={`lg:col-span-2 ${cardBg} p-6 rounded-xl border shadow-sm flex flex-col`}>
             <div className="mb-4 flex items-center justify-between">
               <div><h3 className={`text-lg font-bold flex items-center gap-2 ${textClass}`}><Zap className="text-amber-500" size={18} /> Variance Hunter</h3></div>
               <span className={`${theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'} px-2 py-1 rounded text-xs font-bold`}>{varianceAlerts.length} Active Alerts</span>
             </div>
             <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto custom-scrollbar pr-1">
                {varianceAlerts.map(alert => (
                  <div key={alert.id} className={`border p-4 rounded-lg transition-all ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-sm font-bold ${textClass}`}>{alert.siteName}</span>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${alert.type === 'FOOD' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>{alert.type}</span>
                    </div>
                    <p className={`text-sm font-medium mb-3 ${subText}`}>{alert.message}</p>
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-500/10 p-2 rounded"><ArrowRight size={14} /><span className="text-xs font-bold">{alert.recommendation}</span></div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${bgClass} flex font-sans transition-colors duration-300`}>
      {selectedKpiDetail && <KpiDetailModal detail={selectedKpiDetail} onClose={() => setSelectedKpiDetail(null)} />}
      <Sidebar currentView={currentView} onViewChange={setCurrentView} onLogout={onLogout} onHomeClick={() => onNavigateHome(null)} theme={theme} />
      <main className="flex-1 md:ml-64 p-8 overflow-y-auto h-screen">
        <header className="mb-8 flex flex-col xl:flex-row xl:justify-between xl:items-end gap-6">
          <div>
            <h1 className={`text-3xl font-bold tracking-tight ${textClass}`}>
                {currentView === 'OVERVIEW' ? 'Cluster: Reutlingen-Tübingen' : currentView === 'FINANCIALS' ? 'Cluster Financials' : 'Cluster Sustainability'}
            </h1>
            <p className={`mt-1 flex items-center gap-2 ${subText}`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Tactical Operations Center
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
             <button onClick={toggleTheme} className={`p-2 rounded-full border ${theme === 'dark' ? 'border-slate-600 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-500 hover:text-slate-800'}`}>
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
             </button>
             <select 
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className={`pl-4 pr-10 py-2.5 border rounded-lg text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer min-w-[240px] ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}
              >
                <option value="ALL">All Cluster Sites (3)</option>
                <option disabled>──────────</option>
                {MOCK_CAMPUS_CLUSTER.map(site => <option key={site.id} value={site.id}>{site.name}</option>)}
              </select>
          </div>
        </header>
        {renderContent()}
      </main>
    </div>
  );
};

export default HeadOfCampusDashboard;