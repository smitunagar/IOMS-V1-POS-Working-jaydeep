"use client";

/**
 * HOME PAGE UI ANALYSIS
 * 
 * A thorough analysis of this page's UI architecture, state management, 
 * and component structure can be found in:
 * docs/architecture/HOME_UI_ANALYSIS.md
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/AuthContext';
import { APPS_DATA, MarketApp, AppCategory } from '@/lib/marketplaceConstants';
import { 
  Search, Bell, User, ArrowRight, PlayCircle, CheckCircle2, 
  Github, Twitter, Linkedin, Bot, LogOut
} from 'lucide-react';

// Header Component
const Header = () => {
  const { currentUser, logout } = useAuth();
  
  const handleLogout = async () => {
    await logout();
  };
  
  return (
    <header className="bg-wm-blue border-b border-white/5 sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Brand: WebMeister360 Logo (Inverse for Dark Background) */}
          <div className="flex items-center gap-3 cursor-pointer group">
            {/* SVG Icon */}
            <div className="relative w-10 h-10 flex items-center justify-center transition-transform group-hover:rotate-180 duration-700">
               <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
                   <circle cx="20" cy="20" r="17" stroke="#2A9D8F" strokeWidth="2.5" className="opacity-90" />
                   {/* Stylized M/W shape */}
                   <path d="M12 16L16 26L20 16L24 26L28 16" stroke="#2A9D8F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
               </svg>
            </div>
            
            {/* Text Logo */}
            <div className="flex flex-col">
              <div className="text-xl font-headline font-bold text-white leading-none tracking-tight">
                 WebMe<span className="text-wm-red">i</span>ster360
              </div>
              <div className="text-[8px] text-wm-teal font-sans font-bold tracking-[0.2em] uppercase mt-1 opacity-90">
                 Building Digital Brilliance
              </div>
            </div>
          </div>

          {/* Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#" className="text-sm font-medium text-white hover:text-wm-teal transition-colors">Solutions</a>
            <a href="#" className="text-sm font-medium text-white/80 hover:text-white transition-colors">Platform</a>
            <a href="#" className="text-sm font-medium text-white/80 hover:text-white transition-colors">Resources</a>
            <a href="#" className="text-sm font-medium text-white/80 hover:text-white transition-colors">Company</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-6">
            <button className="text-white/70 hover:text-white">
              <Search size={20} />
            </button>
            <button className="text-white/70 hover:text-white relative">
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-wm-teal rounded-full animate-pulse"></span>
            </button>
            <div className="h-8 w-px bg-white/10 mx-2"></div>
            {currentUser ? (
              <div className="flex items-center gap-3">
                <Link href="/profile" className="flex items-center gap-2 text-sm font-bold text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-colors">
                  <User size={16} />
                  <span>{currentUser.email?.split('@')[0] || 'Profile'}</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-sm font-bold text-white bg-white/10 hover:bg-red-500/20 hover:text-red-200 px-4 py-2 rounded-full transition-colors"
                  title="Logout"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <Link href="/login" className="flex items-center gap-2 text-sm font-bold text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-colors border border-white/5">
                <User size={16} />
                <span>Log In</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// Hero Component
const Hero = () => {
  return (
    <div className="relative bg-wm-blue text-white overflow-hidden min-h-[85vh] flex items-center pb-12">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#1B1F3B] via-[#242A4A] to-[#2E355B]"></div>
      
      <div className="absolute inset-0 z-0 opacity-20" 
           style={{
             backgroundImage: 'linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)',
             backgroundSize: '40px 40px'
           }}>
      </div>
      
      <div className="absolute top-0 right-0 w-[60%] h-full bg-gradient-to-l from-wm-teal/5 to-transparent pointer-events-none z-0"></div>
      <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-[#2A9D8F] rounded-full blur-[120px] pointer-events-none z-0 mix-blend-soft-light opacity-30"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div className="space-y-8 pt-10 lg:pt-0">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm group hover:bg-white/10 transition-colors cursor-default">
              <span className="w-2 h-2 rounded-full bg-wm-teal animate-pulse"></span>
              <span className="text-xs font-bold tracking-widest uppercase text-gray-300 group-hover:text-white transition-colors">SYSTEM V4.2 LIVE</span>
            </div>

            <h1 className="font-headline font-black text-5xl sm:text-6xl lg:text-7xl leading-[1.1] tracking-tight text-white drop-shadow-sm">
              The Real-Time <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-wm-teal to-emerald-400">Kitchen Brain</span>
            </h1>
            
            <div className="flex items-start gap-4 border-l-4 border-wm-teal/50 pl-6">
              <p className="font-sans text-xl text-gray-300 font-light leading-relaxed max-w-lg">
                IOMS unifies hardware, software, and compliance into one intelligence layer. We turn waste tracking and order prediction into measurable profit and SDG 12.3 compliance.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Link href="/signup" className="bg-wm-teal text-white hover:bg-emerald-500 transition-all transform hover:-translate-y-1 px-8 py-4 rounded-xl font-headline font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-wm-teal/20 group">
                Initialize System <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="px-8 py-4 rounded-xl font-headline font-bold text-white border border-white/20 hover:bg-white/10 transition-all flex items-center justify-center gap-3 backdrop-blur-sm">
                <PlayCircle size={20} /> Watch Demo
              </button>
            </div>

            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-white/10 max-w-md">
              <div>
                <div className="font-headline font-black text-3xl text-white">32%</div>
                <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mt-1">Food Waste Cut</div>
              </div>
              <div>
                <div className="font-headline font-black text-3xl text-white">100%</div>
                <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mt-1">EU Compliant</div>
              </div>
              <div>
                <div className="font-headline font-black text-3xl text-white">500+</div>
                <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mt-1">Kitchens Live</div>
              </div>
            </div>
          </div>

          <div className="relative">
             <div className="grid grid-cols-2 gap-4 md:gap-6 transform hover:scale-[1.01] transition-transform duration-700 ease-out">
                
                <div className="relative h-64 rounded-3xl overflow-hidden group border border-white/10 shadow-2xl bg-gray-900">
                   <div className="absolute inset-0 bg-gradient-to-t from-wm-blue via-transparent to-transparent z-10 opacity-90"></div>
                   <img 
                      src="https://images.unsplash.com/photo-1581349485608-9469926a8e5e?q=80&w=800&auto=format&fit=crop" 
                      alt="Chef" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100" 
                   />
                   <div className="absolute bottom-4 left-4 z-20">
                      <span className="bg-wm-teal text-white text-[10px] font-bold px-2 py-1 rounded mb-1 inline-block uppercase tracking-wider shadow-md">Smart Chef</span>
                      <p className="text-white text-sm font-medium">Digital Prep Lists</p>
                   </div>
                </div>

                <div className="relative h-64 rounded-3xl overflow-hidden group border border-white/10 shadow-2xl mt-8 bg-gray-900">
                   <div className="absolute inset-0 bg-gradient-to-t from-wm-blue via-transparent to-transparent z-10 opacity-90"></div>
                   <img 
                      src="https://images.unsplash.com/photo-1615485290382-441e4d049cb5?q=80&w=800&auto=format&fit=crop" 
                      alt="Produce" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100" 
                   />
                   <div className="absolute bottom-4 left-4 z-20">
                      <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded mb-1 inline-block uppercase tracking-wider shadow-md">Sustainability</span>
                      <p className="text-white text-sm font-medium">Fresh Tracking</p>
                   </div>
                </div>

                <div className="col-span-2 relative h-64 rounded-3xl overflow-hidden group border border-white/10 shadow-2xl bg-gray-900">
                   <div className="absolute inset-0 bg-gradient-to-t from-wm-blue via-wm-blue/40 to-transparent z-10"></div>
                   <img 
                      src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop" 
                      alt="Analytics" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-90" 
                   />
                   
                   <div className="absolute inset-0 z-20 p-6 flex flex-col justify-end">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                        <span className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">System Active</span>
                      </div>
                      <h3 className="text-white font-headline font-bold text-xl">WasteWatchDog Analytics</h3>
                      <p className="text-gray-400 text-sm">Real-time consumption vs. waste tracking.</p>
                   </div>
                </div>

             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// AppCard Component
const AppCard = ({ app }: { app: MarketApp }) => {
  const IconComponent = app.icon;
  
  // Determine button text based on status
  const getButtonText = () => {
    if (app.status === 'Active') {
      return 'View Details';
    }
    return 'Install Agent';
  };
  
  return (
    <Link href={app.route || '#'} className="block h-full">
      <div className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-enterprise card-hover-effect flex flex-col h-full relative">
        
        {/* Top Image Section */}
        <div className="relative h-48 overflow-hidden">
          <div className="absolute inset-0 bg-wm-blue/10 group-hover:bg-wm-teal/10 transition-colors duration-500 z-10 mix-blend-multiply"></div>
          <img 
            src={app.imageUrl} 
            alt={app.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          
          {/* Category Pill */}
          <div className="absolute top-4 left-4 z-20">
            <span className="bg-white/95 backdrop-blur-md text-wm-blue text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
              {app.category}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 flex flex-col flex-grow">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-wm-gray flex items-center justify-center text-wm-blue group-hover:bg-wm-blue group-hover:text-white transition-colors duration-300">
              <IconComponent size={24} strokeWidth={1.5} />
            </div>
            {app.status === 'Active' ? (
               <div className="flex items-center gap-1.5 text-wm-teal">
                  <CheckCircle2 size={16} />
                  <span className="text-xs font-bold uppercase tracking-wide">Active</span>
               </div>
            ) : (
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Available</span>
            )}
          </div>

          <h3 className="font-headline font-bold text-xl text-wm-blue mb-2 group-hover:text-wm-teal transition-colors">
            {app.name}
          </h3>
          
          <p className="font-sans text-sm text-gray-500 leading-relaxed mb-6 line-clamp-3">
            {app.description}
          </p>

          <div className="mt-auto pt-6 border-t border-gray-100 flex items-center justify-between">
            <div className="text-xs text-gray-400">
              <span className="font-bold text-wm-blue">{app.activeInstallations}</span> installs
            </div>
            
            <button className="text-wm-teal font-bold text-sm flex items-center gap-2 group-hover:translate-x-1 transition-transform">
               {getButtonText()} <ArrowRight size={16} />
            </button>
          </div>
        </div>
        
        {/* Bottom Highlight Bar */}
        <div className="h-1 w-0 bg-wm-teal group-hover:w-full transition-all duration-500"></div>
      </div>
    </Link>
  );
};

// AppGrid Component
const AppGrid = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['All', ...Object.values(AppCategory)];

  const filteredApps = useMemo(() => {
    return APPS_DATA.filter(app => {
      const matchesCategory = selectedCategory === 'All' || app.category === selectedCategory;
      const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchTerm]);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-20">
      
      {/* Section Header & Filters */}
      <div className="bg-white rounded-2xl shadow-enterprise p-2 mb-12 flex flex-col md:flex-row justify-between items-center gap-4 border border-gray-100">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto p-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`
                px-6 py-3 rounded-xl text-sm font-bold font-headline transition-all duration-200 whitespace-nowrap
                ${selectedCategory === cat
                  ? 'bg-wm-blue text-white shadow-md'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-wm-blue'}
              `}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="w-full md:w-64 px-4 py-2 border-l border-gray-100">
           <div className="relative">
              <input 
                type="text" 
                placeholder="Find a module..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-4 py-2 text-sm bg-transparent focus:outline-none placeholder-gray-400 text-wm-blue font-sans"
              />
              <Search className="absolute left-0 top-2.5 text-gray-400" size={16} />
           </div>
        </div>
      </div>

      <div className="mb-10">
        <h2 className="font-headline text-3xl font-bold text-wm-blue">Platform Modules</h2>
        <p className="text-gray-500 mt-2 font-sans">Expand your kitchen's capabilities with specialized IOMS agents.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredApps.map((app) => (
          <AppCard key={app.id} app={app} />
        ))}
      </div>
    </section>
  );
};

// Footer Component
const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-20 mb-16">
          <div className="col-span-1 md:col-span-2 pr-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-wm-blue text-white w-8 h-8 rounded-full flex items-center justify-center shadow-md">
                 <span className="font-headline font-bold text-xs">WM</span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline font-bold text-xl text-wm-blue leading-none">
                  WebMeister360
                </span>
                <span className="caption-text text-[10px] text-gray-400 uppercase tracking-widest">Building Digital Brilliance</span>
              </div>
            </div>
            <p className="font-sans text-sm text-gray-500 leading-relaxed max-w-md mb-8">
              Empowering European businesses with innovative digital transformation solutions. IOMS is a flagship product of WebMeister360, designed to bring premium intelligence to the gastronomy sector.
            </p>
            
            <div className="flex items-center gap-4">
               <button className="px-4 py-2 bg-wm-blue text-white text-xs font-bold rounded hover:bg-wm-teal transition-colors">
                 Contact Sales
               </button>
               <div className="flex gap-4 ml-2">
                 <a href="#" className="text-gray-400 hover:text-wm-blue transition-colors"><Twitter size={20} /></a>
                 <a href="#" className="text-gray-400 hover:text-wm-blue transition-colors"><Linkedin size={20} /></a>
                 <a href="#" className="text-gray-400 hover:text-wm-blue transition-colors"><Github size={20} /></a>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-headline text-sm font-bold text-wm-blue uppercase tracking-widest mb-6 border-b border-gray-100 pb-2">IOMS Platform</h3>
            <ul className="space-y-4">
              <li><a href="#" className="font-sans text-sm text-gray-500 hover:text-wm-teal transition-colors">Agents Marketplace</a></li>
              <li><a href="#" className="font-sans text-sm text-gray-500 hover:text-wm-teal transition-colors">Integration API</a></li>
              <li><a href="#" className="font-sans text-sm text-gray-500 hover:text-wm-teal transition-colors">Compliance Portal</a></li>
              <li><a href="#" className="font-sans text-sm text-gray-500 hover:text-wm-teal transition-colors">System Status</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-headline text-sm font-bold text-wm-blue uppercase tracking-widest mb-6 border-b border-gray-100 pb-2">WebMeister360</h3>
            <ul className="space-y-4">
              <li><a href="#" className="font-sans text-sm text-gray-500 hover:text-wm-teal transition-colors">About Us</a></li>
              <li><a href="#" className="font-sans text-sm text-gray-500 hover:text-wm-teal transition-colors">Digital Services</a></li>
              <li><a href="#" className="font-sans text-sm text-gray-500 hover:text-wm-teal transition-colors">Case Studies</a></li>
              <li><a href="#" className="font-sans text-sm text-gray-500 hover:text-wm-teal transition-colors">Partner Program</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-sans text-xs text-gray-400">© 2024 WebMeister360. All rights reserved. Engineered in Germany.</p>
          <div className="flex items-center gap-2 px-3 py-1 bg-wm-mint/50 rounded-full">
            <Bot size={14} className="text-wm-teal" />
            <span className="caption-text text-xs text-wm-teal font-bold">Virtual Assistant Online</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default function MarketplacePage() {
  return (
    <div className="min-h-screen flex flex-col bg-wm-gray text-wm-blue font-sans selection:bg-wm-teal selection:text-white relative">
      <Header />
      <main className="flex-grow">
        <Hero />
        <AppGrid />
        
        <section className="bg-wm-blue py-24 relative overflow-hidden mt-12">
           <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10 mix-blend-overlay"></div>
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
             <h2 className="font-headline font-bold text-3xl sm:text-5xl text-white mb-6">
               Ready to transform your kitchen?
             </h2>
             <p className="font-sans text-xl text-gray-300 max-w-2xl mx-auto mb-10">
               Join the WebMeister360 ecosystem and drive sustainable profitability with the world's most advanced gastronomy OS.
             </p>
             <button className="bg-white text-wm-blue hover:bg-gray-100 px-10 py-4 rounded-full font-headline font-bold text-lg shadow-xl transition-transform hover:-translate-y-1">
               Contact Sales
             </button>
           </div>
        </section>
      </main>
      <Footer />

      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 items-end pointer-events-none md:pointer-events-auto">
         
         <div className="bg-white p-4 rounded-2xl shadow-enterprise border border-gray-100 max-w-[200px] animate-in slide-in-from-right fade-in duration-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-wm-teal">Status: Online</span>
            </div>
            <p className="text-[10px] text-gray-500 leading-tight">
              Need help with EU Compliance module setup?
            </p>
         </div>

         <div className="group relative">
           <button className="w-14 h-14 bg-wm-teal text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all cursor-pointer border-4 border-white">
              <Bot size={28} />
              <span className="absolute top-0 right-0 w-4 h-4 bg-wm-red rounded-full border-2 border-white"></span>
           </button>
         </div>
      </div>
    </div>
  );
}
