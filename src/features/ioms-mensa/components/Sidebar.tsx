import React from 'react';
import { LayoutDashboard, PieChart, Leaf, Settings, LogOut, UtensilsCrossed } from 'lucide-react';
import { DashboardView, Theme } from '../types';

interface SidebarProps {
  currentView: DashboardView;
  onViewChange: (view: DashboardView) => void;
  onLogout: () => void;
  onHomeClick: () => void;
  theme?: Theme;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, onLogout, onHomeClick, theme = 'light' }) => {
  // Sidebar stays primarily dark in standard enterprise UI, but we can adjust borders/shades if needed
  // For this design, we keep the Sidebar dark to anchor the layout, but adjust border colors if theme changes.
  
  return (
    <div className="hidden md:flex flex-col w-64 bg-slate-900 h-screen fixed left-0 top-0 text-white z-50 shadow-2xl border-r border-slate-800">
      <button 
        onClick={onHomeClick}
        className="p-6 flex items-center gap-3 border-b border-slate-800 bg-slate-950/50 hover:bg-slate-800/50 transition-colors text-left"
      >
        <div className="w-8 h-8 bg-emerald-500 rounded-md flex items-center justify-center shadow-lg shadow-emerald-900/20">
           <UtensilsCrossed size={18} className="text-white" />
        </div>
        <div>
          <span className="font-bold text-lg tracking-tight block leading-none">IOMS</span>
          <span className="text-xs text-slate-400 tracking-wide uppercase">Mensa</span>
        </div>
      </button>

      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        <NavItem 
          icon={<LayoutDashboard size={20} />} 
          label="Overview" 
          active={currentView === 'OVERVIEW'} 
          onClick={() => onViewChange('OVERVIEW')}
        />
        <NavItem 
          icon={<PieChart size={20} />} 
          label="Financials" 
          active={currentView === 'FINANCIALS'} 
          onClick={() => onViewChange('FINANCIALS')}
        />
        <NavItem 
          icon={<Leaf size={20} />} 
          label="Sustainability" 
          active={currentView === 'SUSTAINABILITY'} 
          onClick={() => onViewChange('SUSTAINABILITY')}
        />
        <NavItem 
          icon={<Settings size={20} />} 
          label="Settings" 
          active={currentView === 'SETTINGS'} 
          onClick={() => onViewChange('SETTINGS')}
        />
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-950/30">
        <button 
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-rose-400 hover:bg-slate-800/50 rounded-lg transition-all group"
        >
          <LogOut size={20} className="group-hover:stroke-rose-400" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all duration-200 border border-transparent ${active ? 'bg-slate-800 text-white shadow-md border-slate-700/50' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
  >
    <span className={active ? 'text-emerald-400' : 'text-current'}>{icon}</span>
    <span className="font-medium text-sm">{label}</span>
  </button>
);

export default Sidebar;