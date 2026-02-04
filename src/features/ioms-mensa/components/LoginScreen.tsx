import React, { useState } from 'react';
import { UtensilsCrossed, Lock, ArrowRight, Loader2, CheckCircle2, BarChart3, Leaf } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API authentication delay
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans text-slate-900">
      
      {/* Left: Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden flex-col justify-between p-12 text-white">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <UtensilsCrossed size={20} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight block leading-none">IOMS</span>
            <span className="text-xs text-emerald-400 tracking-wide uppercase font-medium">Mensa Solutions</span>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-lg">
          <h1 className="text-5xl font-bold leading-tight mb-6">
            Efficiency in <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              Every Meal.
            </span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-8">
            The intelligent platform for institutional catering. Manage inventory, track sustainability metrics, and optimize order flows across all campus sites.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-4 text-slate-300">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                <BarChart3 size={20} />
              </div>
              <p className="text-sm">Real-time financial analytics & subsidy tracking</p>
            </div>
            <div className="flex items-center gap-4 text-slate-300">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                <Leaf size={20} />
              </div>
              <p className="text-sm">Automated ESG & Food Waste reporting</p>
            </div>
          </div>
        </div>

        {/* Footer / Trust */}
        <div className="relative z-10">
          <p className="text-sm text-slate-500 uppercase tracking-widest font-semibold mb-4">Trusted by</p>
          <div className="flex gap-6 opacity-50 grayscale hover:opacity-80 transition-opacity">
            {/* Simple CSS shapes to simulate logos */}
            <div className="h-8 w-24 bg-slate-700 rounded-md"></div>
            <div className="h-8 w-24 bg-slate-700 rounded-md"></div>
            <div className="h-8 w-24 bg-slate-700 rounded-md"></div>
          </div>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50/50">
        <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-slate-100">
          
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900">Welcome back</h2>
            <p className="mt-2 text-slate-500">Please enter your credentials to access the dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Username / Personnel ID
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                placeholder="e.g. dir.schmidt"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">
                  Password
                </label>
                <a href="#" className="text-sm font-medium text-emerald-600 hover:text-emerald-500">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all pr-10"
                  placeholder="••••••••"
                />
                <Lock className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" size={18} />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-lg shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Verifying Credentials...
                </>
              ) : (
                <>
                  Log In
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400">Secure System</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
             <CheckCircle2 size={12} className="text-emerald-500" />
             <span>End-to-end encrypted connection</span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginScreen;