import React, { useState } from 'react';
import { 
  CheckCircle2, Clock, RotateCcw, Droplets, Trash2, LogOut, 
  UtensilsCrossed, CheckSquare, Coffee, AlertCircle, ChevronRight,
  ShieldAlert, Sparkles, Utensils, ClipboardCheck
} from 'lucide-react';
import { Role, StaffTask, RefillItem, Theme } from '../types';
import { MOCK_STAFF_TASKS, REFILL_ITEMS } from '../constants';

interface StaffDashboardProps {
  onLogout: () => void;
  onNavigateHome: (role: Role | null) => void;
  theme: Theme;
  toggleTheme: () => void;
}

const StaffDashboard: React.FC<StaffDashboardProps> = ({ onLogout, onNavigateHome }) => {
  const [tasks, setTasks] = useState<StaffTask[]>(MOCK_STAFF_TASKS);
  const [notification, setNotification] = useState<string | null>(null);

  const handleCompleteTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: true } : t));
    showNotification("Task Verified");
  };

  const handleRefillRequest = (item: string) => {
    showNotification(`Requested: ${item}`);
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2000);
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = (completedCount / tasks.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col overflow-hidden select-none">
      
      {/* Top Bar: Kiosk Header (Branded Deep Blue/Slate) */}
      <header className="h-24 bg-slate-900 px-8 flex items-center justify-between shrink-0 shadow-lg z-30 relative border-b border-slate-800">
        <div className="flex items-center gap-6">
           <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-900/50">
             <UtensilsCrossed size={28} />
           </div>
           <div>
             <h1 className="text-2xl font-bold text-white leading-none tracking-tight">Salad Bar Station</h1>
             <div className="flex items-center gap-2 mt-1.5">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
               <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">Unit 04 • Active</p>
             </div>
           </div>
        </div>

        {/* Gamification Ring */}
        <div className="flex items-center gap-8">
           <div className="flex items-center gap-5 bg-slate-800/50 px-6 py-2.5 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
              <div className="relative w-12 h-12">
                 <svg className="w-full h-full transform -rotate-90">
                   <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="5" fill="transparent" className="text-slate-700" />
                   <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="5" fill="transparent" className="text-blue-500 transition-all duration-700 ease-out" strokeDasharray={125} strokeDashoffset={125 - (progress * 1.25)} strokeLinecap="round" />
                 </svg>
                 <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                   {Math.round(progress)}%
                 </div>
              </div>
              <div className="text-right hidden md:block">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progress</p>
                <p className="text-lg font-bold text-white leading-none mt-0.5">{completedCount} <span className="text-slate-500 text-sm">/ {tasks.length} Tasks</span></p>
              </div>
           </div>

           <button onClick={onLogout} className="w-14 h-14 bg-slate-800 border border-slate-700 text-slate-400 rounded-2xl hover:bg-rose-900/20 hover:text-rose-500 hover:border-rose-900/50 transition-all flex items-center justify-center">
             <LogOut size={24} />
           </button>
        </div>
      </header>

      {/* Main Touch Interface */}
      <main className="flex-1 p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden bg-slate-50/50">
        
        {/* Left Col: Task Stream */}
        <div className="lg:col-span-7 flex flex-col gap-4 overflow-y-auto custom-scrollbar pb-24">
           <div className="flex justify-between items-end mb-2 px-1">
             <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2">
               <ClipboardCheck className="text-blue-600" />
               Current Tasks
             </h2>
             <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200 uppercase tracking-wide">
               {tasks.filter(t => !t.completed).length} Remaining
             </span>
           </div>

           {tasks.filter(t => !t.completed).map((task) => {
             // Coherent Blue-Based Branding Logic
             let iconBg = 'bg-slate-100 text-slate-500';
             let icon = <CheckSquare size={28} />;
             let borderClass = 'border-slate-200';
             let ringClass = '';
             let cardBg = 'bg-white';
             
             if (task.urgent) {
               // Urgent: Rose/Red but kept clean
               borderClass = 'border-rose-200';
               cardBg = 'bg-rose-50/30';
               ringClass = 'ring-1 ring-rose-400/30';
               iconBg = 'bg-rose-100 text-rose-600';
             } else if (task.type === 'HACCP') {
               // Safety: Blue/Indigo
               iconBg = 'bg-blue-100 text-blue-600';
               icon = <ShieldAlert size={28} />;
               borderClass = 'border-blue-100';
             } else if (task.type === 'REFILL') {
               // Refill: Sky/Cyan
               iconBg = 'bg-sky-100 text-sky-600';
               icon = <RotateCcw size={28} />;
             } else if (task.type === 'CLEANING') {
               // Cleaning: Slate/Teal
               iconBg = 'bg-slate-100 text-slate-600';
               icon = <Sparkles size={28} />;
             }

             return (
               <div 
                 key={task.id}
                 className={`relative ${cardBg} p-2 pr-2 rounded-2xl border-2 ${borderClass} ${ringClass} shadow-sm flex items-center justify-between group active:scale-[0.99] transition-transform duration-200`}
               >
                 <div className="flex items-center gap-4 p-4">
                   <div className={`w-16 h-16 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${iconBg}`}>
                      {icon}
                   </div>
                   <div>
                     {task.urgent && (
                       <span className="inline-flex items-center gap-1 text-rose-600 text-[10px] font-black uppercase tracking-widest mb-1.5">
                         <AlertCircle size={10} /> Urgent Action
                       </span>
                     )}
                     <h3 className="text-xl font-bold text-slate-800 leading-tight">{task.title}</h3>
                     <div className="flex items-center gap-2 mt-1.5 text-slate-500 font-medium text-sm">
                       <Clock size={16} className="text-blue-400" />
                       <span>{task.time}</span>
                     </div>
                   </div>
                 </div>

                 {/* Huge Touch Target for Done */}
                 <button 
                   onClick={() => handleCompleteTask(task.id)}
                   className="h-24 w-28 bg-slate-50 hover:bg-emerald-500 hover:text-white text-slate-400 border-l border-slate-100 rounded-xl font-bold text-lg transition-all flex flex-col items-center justify-center gap-1 group/btn"
                 >
                   <div className="p-2 rounded-full bg-white group-hover/btn:bg-white/20 transition-colors">
                      <CheckCircle2 size={28} className="text-slate-300 group-hover/btn:text-white" />
                   </div>
                   <span className="text-xs font-bold uppercase tracking-wider mt-1">Complete</span>
                 </button>
               </div>
             );
           })}

           {tasks.filter(t => !t.completed).length === 0 && (
             <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white/50 rounded-3xl border-4 border-dashed border-slate-200">
               <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
                 <CheckCircle2 size={40} />
               </div>
               <h3 className="text-2xl font-bold text-slate-600">All Clear!</h3>
               <p className="text-lg mt-2 text-slate-400">Station is fully prepped.</p>
             </div>
           )}
        </div>

        {/* Right Col: Action Pad */}
        <div className="lg:col-span-5 flex flex-col gap-6">
           
           {/* Refill Module */}
           <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex-1 flex flex-col">
              <h3 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600 border border-blue-100"><RotateCcw size={20} /></div>
                Quick Refill Request
              </h3>
              <div className="grid grid-cols-2 gap-3 flex-1">
                 {REFILL_ITEMS.map(item => (
                   <button
                     key={item.id}
                     onClick={() => handleRefillRequest(item.name)}
                     className="relative overflow-hidden bg-white hover:bg-blue-50/50 border-2 border-slate-100 text-slate-600 hover:border-blue-400 hover:text-blue-700 rounded-2xl flex flex-col items-center justify-center gap-3 p-4 transition-all active:scale-[0.98] shadow-sm group"
                   >
                     <div className="w-12 h-12 rounded-xl bg-slate-50 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm">
                        {item.category === 'FOOD' ? <Utensils size={22} /> : <Coffee size={22} />}
                     </div>
                     <span className="font-bold text-base leading-none text-center">{item.name}</span>
                   </button>
                 ))}
              </div>
           </div>

           {/* Waste / Help Module */}
           <div className="grid grid-cols-2 gap-4 h-40">
              <button 
                onClick={() => showNotification("Manager Requested")}
                className="bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-300 text-slate-600 rounded-[1.5rem] flex flex-col items-center justify-center gap-2 font-bold text-lg transition-all active:scale-95 shadow-sm"
              >
                 <ShieldAlert size={28} className="text-amber-500" />
                 <span>Help</span>
              </button>

              <button 
                onClick={() => showNotification("Spillage Reported")}
                className="bg-rose-50 hover:bg-rose-100 border-2 border-rose-100 hover:border-rose-200 text-rose-600 rounded-[1.5rem] flex flex-col items-center justify-center gap-2 font-bold text-lg transition-all active:scale-95 shadow-sm"
              >
                <Trash2 size={28} />
                <span>Spillage</span>
              </button>
           </div>
        </div>

      </main>

      {/* Large Toast Notification */}
      {notification && (
        <div className="fixed bottom-12 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-10 py-6 rounded-3xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-8 zoom-in-95 z-[100] border border-slate-700">
          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
             <CheckCircle2 className="text-white" size={24} />
          </div>
          <span className="font-bold text-xl tracking-tight">{notification}</span>
        </div>
      )}

    </div>
  );
};

export default StaffDashboard;