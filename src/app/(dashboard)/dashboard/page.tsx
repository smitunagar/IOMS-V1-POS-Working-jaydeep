'use client';

/**
 * DASHBOARD UI ANALYSIS
 * 
 * A thorough analysis of this page's UI architecture, state management, 
 * and component structure can be found in:
 * docs/architecture/HOME_UI_ANALYSIS.md
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import Link from 'next/link';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  TrendingUp, 
  Clock,
  DollarSign,
  Activity,
  ArrowUpRight,
  Calendar,
  Store,
  ChefHat,
  BarChart3,
  Wallet,
  AlertCircle,
  CheckCircle2,
  Upload,
  Bell
} from 'lucide-react';

export default function DashboardPage() {
  const { currentUser, isLoading, isInitialized } = useAuth();
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    lowStock: 0,
    activeReservations: 0
  });

  useEffect(() => {
    // Load stats from localStorage
    if (typeof window !== 'undefined' && currentUser) {
      const userId = currentUser.id || 'user_1';
      const orders = JSON.parse(localStorage.getItem(`orders_${userId}`) || '[]');
      const today = new Date().toDateString();
      
      const todayOrders = orders.filter((o: any) => 
        new Date(o.createdAt).toDateString() === today
      );
      
      const todayRevenue = todayOrders.reduce((sum: number, o: any) => 
        sum + (parseFloat(o.totalAmount) || 0), 0
      );
      
      setStats({
        todayOrders: todayOrders.length,
        todayRevenue: todayRevenue,
        lowStock: 0,
        activeReservations: 0
      });
    }
  }, [currentUser]);

  // Get user display name
  const getUserDisplayName = () => {
    if (currentUser?.email) {
      const name = currentUser.email.split('@')[0];
      return name.split('.').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
    }
    return 'Maan Alvi';
  };

  return (
    <div className="p-6 overflow-y-auto">
      {/* Dashboard Hero Section */}
      <div className="relative w-full rounded-[2rem] overflow-hidden mb-8 shadow-enterprise bg-wm-blue">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1B1F3B] via-[#23294a] to-[#1B1F3B] z-0"></div>
        <div className="absolute inset-0 z-0 opacity-10" 
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }}>
        </div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-wm-teal rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
        
        <div className="relative z-10 p-8 flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-bold text-wm-teal uppercase tracking-widest backdrop-blur-sm">
                Overview
              </span>
            </div>
            <h1 className="font-headline font-black text-3xl md:text-4xl text-white mb-2 tracking-tight">
              Dashboard
            </h1>
            <p className="text-gray-400 text-sm font-medium">
              Welcome back, {getUserDisplayName()}. Here's what's happening in your kitchen today.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md text-sm text-gray-200 font-medium">
              <Calendar size={16} className="text-wm-teal" />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <button className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-gray-200 hover:bg-white/10 hover:text-white transition-all relative backdrop-blur-md">
              <Bell size={18} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-wm-red rounded-full border border-[#23294a]"></span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Grid - Unified Branding */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card 1: Orders */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-enterprise-hover transition-all duration-300 flex flex-col justify-between h-36 group">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-wm-gray text-wm-blue rounded-xl group-hover:bg-wm-blue group-hover:text-white transition-colors duration-300">
              <ShoppingCart size={20} strokeWidth={2} />
            </div>
            <span className="text-[10px] font-bold text-wm-teal bg-teal-50 px-2 py-1 rounded-full flex items-center gap-1">
              <ArrowUpRight size={12} /> +12%
            </span>
          </div>
          <div>
            <div className="text-3xl font-black text-wm-blue font-headline">{stats.todayOrders}</div>
            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Today's Orders</div>
          </div>
        </div>

        {/* Card 2: Revenue */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-enterprise-hover transition-all duration-300 flex flex-col justify-between h-36 group">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-wm-gray text-wm-blue rounded-xl group-hover:bg-wm-blue group-hover:text-white transition-colors duration-300">
              <Wallet size={20} strokeWidth={2} />
            </div>
            <span className="text-[10px] font-bold text-wm-teal bg-teal-50 px-2 py-1 rounded-full flex items-center gap-1">
              <ArrowUpRight size={12} /> +8%
            </span>
          </div>
          <div>
            <div className="text-3xl font-black text-wm-blue font-headline">€{stats.todayRevenue.toFixed(0)}</div>
            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Today's Revenue</div>
          </div>
        </div>

        {/* Card 3: Stock */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-enterprise-hover transition-all duration-300 flex flex-col justify-between h-36 group">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-wm-gray text-wm-blue rounded-xl group-hover:bg-wm-blue group-hover:text-white transition-colors duration-300">
              <Package size={20} strokeWidth={2} />
            </div>
            <span className="text-[10px] font-bold text-wm-red bg-red-50 px-2 py-1 rounded-full flex items-center gap-1">
              <AlertCircle size={12} /> 3 Alerts
            </span>
          </div>
          <div>
            <div className="text-3xl font-black text-wm-blue font-headline">{stats.lowStock}</div>
            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Low Stock Items</div>
          </div>
        </div>

        {/* Card 4: Reservations */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-enterprise-hover transition-all duration-300 flex flex-col justify-between h-36 group">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-wm-gray text-wm-blue rounded-xl group-hover:bg-wm-blue group-hover:text-white transition-colors duration-300">
              <Users size={20} strokeWidth={2} />
            </div>
            <span className="text-[10px] font-bold text-wm-teal bg-teal-50 px-2 py-1 rounded-full flex items-center gap-1">
              <Clock size={12} /> Live
            </span>
          </div>
          <div>
            <div className="text-3xl font-black text-wm-blue font-headline">{stats.activeReservations}</div>
            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">Active Reservations</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-wm-blue uppercase tracking-widest">Quick Actions</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link href="/orders" className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-wm-blue/20 transition-all flex items-center gap-4 text-left group">
            <div className="p-3 bg-wm-gray text-wm-blue rounded-xl group-hover:bg-wm-blue group-hover:text-white transition-colors duration-300">
              <ShoppingCart size={20} strokeWidth={2} />
            </div>
            <div>
              <div className="font-bold text-sm text-wm-blue font-headline group-hover:text-wm-teal transition-colors">POS</div>
              <div className="text-xs text-gray-500">Create orders</div>
            </div>
            <ArrowUpRight size={14} className="ml-auto text-gray-300 group-hover:text-wm-blue transition-colors" />
          </Link>

          <Link href="/inventory-hub" className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-wm-blue/20 transition-all flex items-center gap-4 text-left group">
            <div className="p-3 bg-wm-gray text-wm-blue rounded-xl group-hover:bg-wm-blue group-hover:text-white transition-colors duration-300">
              <Package size={20} strokeWidth={2} />
            </div>
            <div>
              <div className="font-bold text-sm text-wm-blue font-headline group-hover:text-wm-teal transition-colors">Inventory</div>
              <div className="text-xs text-gray-500">Manage stock</div>
            </div>
            <ArrowUpRight size={14} className="ml-auto text-gray-300 group-hover:text-wm-blue transition-colors" />
          </Link>

          <Link href="/reservations" className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-wm-blue/20 transition-all flex items-center gap-4 text-left group">
            <div className="p-3 bg-wm-gray text-wm-blue rounded-xl group-hover:bg-wm-blue group-hover:text-white transition-colors duration-300">
              <Users size={20} strokeWidth={2} />
            </div>
            <div>
              <div className="font-bold text-sm text-wm-blue font-headline group-hover:text-wm-teal transition-colors">Reservations</div>
              <div className="text-xs text-gray-500">Manage bookings</div>
            </div>
            <ArrowUpRight size={14} className="ml-auto text-gray-300 group-hover:text-wm-blue transition-colors" />
          </Link>

          <Link href="/menu-upload" className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-wm-blue/20 transition-all flex items-center gap-4 text-left group">
            <div className="p-3 bg-wm-gray text-wm-blue rounded-xl group-hover:bg-wm-blue group-hover:text-white transition-colors duration-300">
              <Upload size={20} strokeWidth={2} />
            </div>
            <div>
              <div className="font-bold text-sm text-wm-blue font-headline group-hover:text-wm-teal transition-colors">Menu</div>
              <div className="text-xs text-gray-500">Update menu</div>
            </div>
            <ArrowUpRight size={14} className="ml-auto text-gray-300 group-hover:text-wm-blue transition-colors" />
          </Link>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Recent Activity */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-enterprise p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-sm font-bold text-wm-blue uppercase tracking-widest">Recent Activity</h2>
            <button className="text-xs font-bold text-wm-teal hover:underline bg-teal-50 px-3 py-1 rounded-full transition-colors hover:bg-teal-100">View All</button>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4 pb-6 border-b border-gray-50 last:border-0 last:pb-0 group cursor-pointer">
              <div className="w-12 h-12 rounded-2xl bg-wm-gray text-wm-blue flex items-center justify-center shrink-0 group-hover:bg-wm-blue group-hover:text-white transition-colors duration-300">
                <ShoppingCart size={20} strokeWidth={2} />
              </div>
              <div>
                <div className="text-sm font-bold text-wm-blue font-headline group-hover:text-wm-teal transition-colors">New order placed <span className="text-gray-400 font-normal">#1024</span></div>
                <div className="text-xs text-gray-500 mt-1">2 minutes ago • Table 4 • Server: John</div>
              </div>
            </div>

            <div className="flex items-start gap-4 pb-6 border-b border-gray-50 last:border-0 last:pb-0 group cursor-pointer">
              <div className="w-12 h-12 rounded-2xl bg-wm-gray text-wm-blue flex items-center justify-center shrink-0 group-hover:bg-wm-blue group-hover:text-white transition-colors duration-300">
                <Package size={20} strokeWidth={2} />
              </div>
              <div>
                <div className="text-sm font-bold text-wm-blue font-headline group-hover:text-wm-teal transition-colors">Inventory updated</div>
                <div className="text-xs text-gray-500 mt-1">15 minutes ago • Sysco Delivery Received</div>
              </div>
            </div>

            <div className="flex items-start gap-4 pb-6 border-b border-gray-50 last:border-0 last:pb-0 group cursor-pointer">
              <div className="w-12 h-12 rounded-2xl bg-wm-gray text-wm-blue flex items-center justify-center shrink-0 group-hover:bg-wm-blue group-hover:text-white transition-colors duration-300">
                <Users size={20} strokeWidth={2} />
              </div>
              <div>
                <div className="text-sm font-bold text-wm-blue font-headline group-hover:text-wm-teal transition-colors">New reservation</div>
                <div className="text-xs text-gray-500 mt-1">1 hour ago • 4 Guests • 19:30</div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-enterprise p-8 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-sm font-bold text-wm-blue uppercase tracking-widest">Analytics</h2>
            <div className="flex gap-2">
              <span className="w-2 h-2 rounded-full bg-wm-teal animate-pulse"></span>
              <span className="w-2 h-2 rounded-full bg-gray-200"></span>
            </div>
          </div>
          
          <div className="space-y-2 flex-1">
            <div className="flex justify-between items-center p-4 hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer group">
              <span className="text-sm text-gray-500 font-medium group-hover:text-wm-blue">Average Order Value</span>
              <span className="text-lg font-black text-wm-blue font-headline group-hover:text-wm-teal transition-colors">€45.50</span>
            </div>
            <div className="flex justify-between items-center p-4 hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer group">
              <span className="text-sm text-gray-500 font-medium group-hover:text-wm-blue">Top Category</span>
              <span className="text-lg font-black text-wm-blue font-headline group-hover:text-wm-teal transition-colors">Main Course</span>
            </div>
            <div className="flex justify-between items-center p-4 hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer group">
              <span className="text-sm text-gray-500 font-medium group-hover:text-wm-blue">Customer Satisfaction</span>
              <span className="text-lg font-black text-wm-teal font-headline">98%</span>
            </div>
            <div className="flex justify-between items-center p-4 hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer group">
              <span className="text-sm text-gray-500 font-medium group-hover:text-wm-blue">Tables Occupied</span>
              <span className="text-lg font-black text-wm-blue font-headline group-hover:text-wm-teal transition-colors">6/20</span>
            </div>
          </div>

          <Link href="/order-analytics" className="w-full mt-6 bg-wm-blue hover:bg-[#23294a] text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transform active:scale-95 duration-200 group">
            <BarChart3 size={20} className="group-hover:text-wm-teal transition-colors" /> View Full Analytics Report
          </Link>
        </div>
      </div>
    </div>
  );
} 