import React, { useState, useEffect } from 'react';
import { 
  Flame, TrendingUp, AlertOctagon, UtensilsCrossed, CloudRain, 
  Trash2, XCircle, Moon, Sun, Clock, LogOut, Zap, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { MOCK_KITCHEN_MENU, MOCK_WASTE_LOG } from '../constants';
import { KitchenDish, Role, Theme } from '../types';

interface HeadChefDashboardProps {
  onLogout: () => void;
  onNavigateHome: (role: Role | null) => void;
  theme: Theme;
  toggleTheme: () => void;
}

const HeadChefDashboard: React.FC<HeadChefDashboardProps> = ({ onLogout, onNavigateHome, theme, toggleTheme }) => {
  const [dishes, setDishes] = useState<KitchenDish[]>(MOCK_KITCHEN_MENU);
  const [waste, setWaste] = useState(MOCK_WASTE_LOG);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Auto-switch to Dark Mode on mount for KDS optimization
  useEffect(() => {
    if (theme === 'light') {
      toggleTheme();
    }
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCookMore = (id: string, amount: number) => {
    setDishes(prev => prev.map(d => 
      d.id === id ? { ...d, preparedQty: d.preparedQty + amount } : d
    ));
  };

  const handleStopSell = (id: string) => {
    setDishes(prev => prev.map(d => 
      d.id === id ? { ...d, soldQty: d.preparedQty } : d
    ));
  };

  const handleAddWaste = (amount: number, reason: string) => {
    setWaste(prev => ({
      ...prev,
      currentKg: prev.currentKg + amount,
      entries: [{ time: currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), reason, amount: `${amount}kg` }, ...prev.entries]
    }));
  };

  // Aggregates
  const totalSold = dishes.reduce((acc, d) => acc + d.soldQty, 0);
  const totalPlanned = dishes.reduce((acc, d) => acc + d.plannedQty, 0);
  const totalPrepared = dishes.reduce((acc, d) => acc + d.preparedQty, 0);
  
  // Pace calculation (Mock logic: assume we are 60% through service time)
  const pace = 12; // +12 meals/min

  // Theme Classes - HUD Style (Updated to lighter Slate-900 branding)
  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-slate-900' : 'bg-slate-50';
  const cardBg = isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const textMain = isDark ? 'text-slate-100' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const borderClass = isDark ? 'border-slate-700' : 'border-slate-200';

  return (
    <div className={`min-h-screen ${bgClass} font-sans flex flex-col h-screen overflow-hidden transition-colors duration-500 selection:bg-emerald-500/30`}>
      
      {/* --- HUD HEADER --- */}
      <header className={`h-20 shrink-0 border-b ${borderClass} px-6 flex items-center justify-between z-50 relative`}>
        {/* Left: Branding */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => onNavigateHome(null)}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-600 text-white'}`}>
              <UtensilsCrossed size={20} />
            </div>
            <div>
              <h1 className={`text-lg font-bold tracking-tight leading-none ${textMain} uppercase`}>MensaFlow</h1>
              <span className={`text-[10px] font-bold tracking-widest uppercase ${isDark ? 'text-emerald-500' : 'text-emerald-600'}`}>KDS Active • v3.0</span>
            </div>
          </div>
          
          <div className={`h-8 w-px ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>

          {/* Service Pulse */}
          <div className={`flex items-center gap-3 px-4 py-2 rounded-full border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Lunch Service Active</span>
          </div>
        </div>

        {/* Right: Telemetry */}
        <div className="flex items-center gap-8">
           <div className="text-right hidden xl:block">
             <p className={`text-[10px] uppercase font-bold tracking-wider ${textMuted}`}>Throughput Pace</p>
             <div className="flex items-center justify-end gap-2 text-emerald-500 font-mono font-bold text-xl leading-none mt-1">
               <Zap size={16} fill="currentColor" />
               +{pace} <span className="text-sm text-slate-500">meals/min</span>
             </div>
           </div>

           <div className={`text-right px-6 border-l ${borderClass}`}>
              <p className={`text-[10px] uppercase font-bold tracking-wider ${textMuted}`}>Output / Plan</p>
              <p className={`font-mono font-bold text-2xl leading-none mt-1 ${textMain}`}>
                {totalSold} <span className="text-base text-slate-500">/ {totalPlanned}</span>
              </p>
           </div>

           <div className="text-right">
              <p className={`font-mono text-3xl font-bold ${textMain} tracking-widest`}>
                {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </p>
           </div>

           <div className="flex gap-2 ml-4">
              <button onClick={toggleTheme} className={`p-3 rounded-xl border transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'}`}>
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button onClick={onLogout} className={`p-3 rounded-xl border transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-900' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-rose-600'}`}>
                <LogOut size={20} />
              </button>
           </div>
        </div>
      </header>

      {/* --- MAIN HUD CONTENT --- */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Background Mesh (Subtle) */}
        {isDark && (
          <div className="absolute inset-0 pointer-events-none opacity-20" 
               style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
          </div>
        )}

        {/* DISH GRID (Left) */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pb-20">
            {dishes.map(dish => (
              <SmartProductionCard 
                key={dish.id} 
                dish={dish} 
                isDark={isDark} 
                onCook={handleCookMore}
                onStop={handleStopSell}
              />
            ))}
          </div>
        </div>

        {/* SIDE INTELLIGENCE (Right) */}
        <div className={`w-80 border-l ${borderClass} flex flex-col z-20 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
          
          {/* Weather Module */}
          <div className={`p-6 border-b ${borderClass}`}>
             <div className="flex items-center gap-3 mb-4">
               <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                 <CloudRain size={20} />
               </div>
               <div>
                 <p className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}>Ext. Factors</p>
                 <p className={`font-bold ${textMain}`}>Heavy Rain</p>
               </div>
             </div>
             <div className={`p-3 rounded-lg text-sm border ${isDark ? 'bg-indigo-900/20 border-indigo-500/30 text-indigo-300' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}`}>
                <p className="mb-1 font-bold flex items-center gap-2"><TrendingUp size={14}/> Demand Shift</p>
                Soup sales expected <strong>+15%</strong>. Salad sales <strong>-10%</strong>.
             </div>
          </div>

          {/* Quick Waste Module */}
          <div className="flex-1 p-6 flex flex-col">
            <h3 className={`text-xs font-bold uppercase tracking-widest ${textMuted} mb-4 flex items-center gap-2`}>
              <Trash2 size={14} /> Waste Control
            </h3>

            {/* Gauge */}
            <div className={`relative h-32 rounded-2xl mb-6 border flex flex-col items-center justify-center overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
               <div className="relative z-10 text-center">
                 <span className={`text-4xl font-mono font-bold ${textMain}`}>{waste.currentKg.toFixed(1)}</span>
                 <span className="text-sm text-slate-500 block">/ {waste.limitKg}kg Limit</span>
               </div>
               {/* Liquid Fill */}
               <div 
                 className={`absolute bottom-0 left-0 w-full transition-all duration-700 opacity-20 ${waste.currentKg > 15 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                 style={{ height: `${(waste.currentKg / waste.limitKg) * 100}%` }}
               ></div>
            </div>

            {/* Buttons */}
            <div className="space-y-3">
              {[
                { label: 'Spilled', val: 0.5 },
                { label: 'Burnt', val: 1.0 },
                { label: 'Overprod.', val: 2.0 }
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleAddWaste(item.val, item.label)}
                  className={`w-full py-4 px-4 rounded-xl border flex items-center justify-between group active:scale-95 transition-all ${isDark ? 'bg-slate-800 border-slate-700 hover:border-slate-500' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                >
                  <span className={`font-semibold ${textMain}`}>{item.label}</span>
                  <span className={`font-mono font-bold ${isDark ? 'text-slate-500 group-hover:text-rose-400' : 'text-slate-400 group-hover:text-rose-600'}`}>+{item.val}kg</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: SMART PRODUCTION CARD ---
const SmartProductionCard: React.FC<{ 
  dish: KitchenDish; 
  isDark: boolean; 
  onCook: (id: string, qty: number) => void;
  onStop: (id: string) => void;
}> = ({ dish, isDark, onCook, onStop }) => {
  
  // Logic
  const buffer = dish.preparedQty - dish.soldQty;
  const velocity = dish.velocity || 5; // Default fallback
  const minutesLeft = buffer / velocity;
  
  // States
  const isCritical = minutesLeft < 15;
  const isWarning = minutesLeft >= 15 && minutesLeft < 30;
  const isOptimal = minutesLeft >= 30;

  // Visuals
  let borderColor = isDark ? 'border-slate-700' : 'border-slate-200';
  let glowClass = '';
  let timeColor = isDark ? 'text-slate-400' : 'text-slate-500';
  let bufferColor = isDark ? 'bg-emerald-500' : 'bg-emerald-500';

  if (isCritical) {
    borderColor = 'border-rose-500';
    glowClass = 'shadow-[0_0_30px_-5px_rgba(244,63,94,0.3)] ring-1 ring-rose-500';
    timeColor = 'text-rose-500 animate-pulse';
    bufferColor = 'bg-rose-500';
  } else if (isWarning) {
    borderColor = 'border-amber-500';
    timeColor = 'text-amber-500';
    bufferColor = 'bg-amber-500';
  }

  // Progress Calculations
  const plan = dish.plannedQty;
  const soldPct = (dish.soldQty / plan) * 100;
  const bufferPct = (buffer / plan) * 100;

  return (
    <div className={`relative flex flex-col p-5 rounded-2xl border-2 ${borderColor} ${glowClass} transition-all duration-300 ${isDark ? 'bg-slate-800' : 'bg-white'} group`}>
      
      {/* Top Row: Category & Timer */}
      <div className="flex justify-between items-start mb-4">
        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${isDark ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
          {dish.category}
        </span>
        <div className={`flex items-center gap-1.5 font-mono font-bold text-lg ${timeColor}`}>
          <Clock size={16} />
          {minutesLeft <= 0 ? '0m' : `${minutesLeft.toFixed(0)}m`}
        </div>
      </div>

      {/* Title */}
      <h3 className={`text-xl font-bold leading-tight mb-6 line-clamp-2 min-h-[3.5rem] ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
        {dish.name}
      </h3>

      {/* Multi-Segment Progress Bar */}
      <div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
        <span>Sold: {dish.soldQty}</span>
        <span>Plan: {dish.plannedQty}</span>
      </div>
      <div className={`h-4 w-full rounded-full flex overflow-hidden relative border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
        {/* Sold Segment */}
        <div style={{ width: `${soldPct}%` }} className="h-full bg-slate-600 transition-all duration-500 relative group/seg">
           <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/seg:opacity-100"></div>
        </div>
        {/* Buffer Segment */}
        <div style={{ width: `${bufferPct}%` }} className={`h-full ${bufferColor} transition-all duration-500 relative group/seg`}>
           <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/seg:opacity-100"></div>
           {/* Stripes for texture */}
           <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem'}}></div>
        </div>
        {/* Remaining Plan (Implicit space) */}
      </div>
      
      <div className="mt-2 text-center">
         <span className={`text-sm font-mono font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Buffer: <span className={isCritical ? 'text-rose-500' : isDark ? 'text-white' : 'text-slate-900'}>{buffer}</span> portions
         </span>
      </div>

      {/* Spacer */}
      <div className="flex-1 min-h-[1.5rem]"></div>

      {/* Actions */}
      <div className="flex gap-3 mt-4">
        <button 
          onClick={() => onCook(dish.id, dish.batchSize)}
          className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-lg shadow-lg active:scale-95 transition-all ${isDark ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'}`}
        >
          <Flame size={20} className={isCritical ? 'animate-bounce' : ''} />
          <span>Fire {dish.batchSize}</span>
        </button>
        
        <button 
          onClick={() => onStop(dish.id)}
          className={`w-16 rounded-xl flex items-center justify-center border-2 active:scale-95 transition-all ${isDark ? 'border-slate-700 text-slate-500 hover:border-rose-500 hover:text-rose-500' : 'border-slate-200 text-slate-400 hover:border-rose-500 hover:text-rose-600'}`}
          title="Mark Sold Out (86)"
        >
          <XCircle size={24} />
        </button>
      </div>

    </div>
  );
};

export default HeadChefDashboard;