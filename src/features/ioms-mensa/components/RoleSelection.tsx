import React from 'react';
import { Role } from '../types';
import { Briefcase, ChefHat, Users, Building2, ArrowRight, ShieldCheck, LogOut } from 'lucide-react';

interface RoleSelectionProps {
  onSelect: (role: Role) => void;
  onLogout?: () => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({ onSelect, onLogout }) => {
  return (
    <div className="min-h-screen bg-slate-50 relative flex flex-col font-sans">
      
      {/* Hero Background Split */}
      <div className="absolute top-0 left-0 w-full h-[45vh] bg-slate-900 z-0">
         {/* Abstract ambient glows */}
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
         <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>
         
         {/* Pattern Overlay */}
         <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12">
        
        {/* Header / Hero Section */}
        <div className="text-center mb-12 max-w-3xl mx-auto animate-fade-in-down">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 text-emerald-400 text-xs font-medium mb-6 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            System Operational • v2.4.1
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Select Your Workspace
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed font-light">
            Welcome to the <strong className="text-white font-medium">IOMS Mensa</strong> portal. 
            Access your specialized dashboard to manage inventory, strategy, and operations.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 w-full max-w-7xl perspective-1000">
          
          {/* Strategic Role */}
          <RoleCard 
            role="DIRECTOR" 
            title="Director" 
            subtitle="Strategic Oversight"
            description="High-level financials, subsidy trends, and ESG compliance across all 10 sites."
            icon={<Briefcase size={28} className="text-indigo-600" />}
            colorClass="bg-indigo-50 text-indigo-600"
            borderClass="group-hover:border-indigo-500"
            delay={0}
            onSelect={onSelect}
          />

          {/* Tactical Role */}
           <RoleCard 
            role="CAMPUS_HEAD" 
            title="Campus Head" 
            subtitle="Regional Management"
            description="Tactical control for 3 assigned sites. Menu planning and regional coordination."
            icon={<Building2 size={28} className="text-blue-600" />}
            colorClass="bg-blue-50 text-blue-600"
            borderClass="group-hover:border-blue-500"
            delay={100}
            onSelect={onSelect}
          />

          {/* Operational Role */}
           <RoleCard 
            role="CHEF" 
            title="Head Chef" 
            subtitle="Kitchen Operations"
            description="Inventory control, recipe management, and real-time production schedules."
            icon={<ChefHat size={28} className="text-emerald-600" />}
            colorClass="bg-emerald-50 text-emerald-600"
            borderClass="group-hover:border-emerald-500"
            delay={200}
            onSelect={onSelect}
          />

          {/* Task Role */}
           <RoleCard 
            role="STAFF" 
            title="Line Staff" 
            subtitle="Daily Tasks"
            description="Shift checklists, hygiene logs, and service point management."
            icon={<Users size={28} className="text-slate-600" />}
            colorClass="bg-slate-100 text-slate-600"
            borderClass="group-hover:border-slate-500"
            delay={300}
            onSelect={onSelect}
          />
        </div>

        {/* Footer Actions */}
        <div className="mt-16 flex items-center gap-6 text-sm text-slate-500">
           <div className="flex items-center gap-2">
             <ShieldCheck size={16} className="text-emerald-600" />
             <span>Logged in as <strong>Admin</strong></span>
           </div>
           <span className="h-4 w-px bg-slate-300"></span>
           <button 
             onClick={onLogout}
             className="flex items-center gap-2 hover:text-rose-600 transition-colors font-medium"
            >
             <LogOut size={16} />
             Sign Out
           </button>
        </div>

      </div>
    </div>
  );
};

interface RoleCardProps {
  role: Role;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  colorClass: string;
  borderClass: string;
  delay: number;
  onSelect: (r: Role) => void;
}

const RoleCard: React.FC<RoleCardProps> = ({ role, title, subtitle, description, icon, colorClass, borderClass, delay, onSelect }) => (
  <button 
    onClick={() => onSelect(role)}
    className={`group relative bg-white rounded-2xl p-6 text-left shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-200 flex flex-col h-full overflow-hidden ${borderClass}`}
    style={{ animationDelay: `${delay}ms` }}
  >
    {/* Colored Top accent */}
    <div className={`absolute top-0 left-0 w-full h-1 ${colorClass.replace('text-', 'bg-').split(' ')[0].replace('50', '500')}`}></div>

    <div className="flex items-start justify-between mb-6 mt-2">
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${colorClass}`}>
        {icon}
      </div>
      <div className="bg-slate-50 rounded-full p-2 group-hover:bg-emerald-50 transition-colors">
        <ArrowRight size={20} className="text-slate-300 group-hover:text-emerald-500 -ml-1 group-hover:ml-0 transition-all duration-300" />
      </div>
    </div>

    <div className="mb-4">
      <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-900 transition-colors">{title}</h3>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">{subtitle}</p>
    </div>

    <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-grow border-t border-slate-50 pt-4 group-hover:border-slate-100">
      {description}
    </p>

    <div className="w-full py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold text-center group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all shadow-sm">
      Enter Workspace
    </div>
  </button>
);

export default RoleSelection;