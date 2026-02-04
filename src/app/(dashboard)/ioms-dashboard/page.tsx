"use client";

import { Button } from '@/shared/components/ui/button';
import { BarChart3, TrendingUp, Users, DollarSign, Package, Building2, Zap, Shield, Target } from 'lucide-react';

export default function IOMSDashboardPage() {
  const businessMetrics = {
    totalRevenue: 125000,
    monthlyGrowth: 5.9,
    activeUsers: 1247,
    newUsers: 180,
    totalOrders: 5678,
    weeklyGrowth: 12.3,
    systemHealth: 99.8,
    uptime: 'This month'
  };

  const modulePerformance = [
    { 
      module: 'Smart Inventory', 
      usage: 89, 
      performance: 'Excellent', 
      users: 245,
      icon: Package,
      color: 'emerald',
      revenue: 45000 
    },
    { 
      module: 'WasteWatchDog', 
      usage: 76, 
      performance: 'Good', 
      users: 189,
      icon: Shield,
      color: 'teal',
      revenue: 28000 
    },
    { 
      module: 'Smart POS', 
      usage: 92, 
      performance: 'Excellent', 
      users: 312,
      icon: Zap,
      color: 'blue',
      revenue: 67000 
    },
    { 
      module: 'Smart Chef Pod', 
      usage: 67, 
      performance: 'Good', 
      users: 156,
      icon: Target,
      color: 'purple',
      revenue: 34000 
    }
  ];

  const recentActivity = [
    { action: 'Order processed', module: 'Smart POS', time: '2 min ago', status: 'success' },
    { action: 'Inventory updated', module: 'Smart Inventory', time: '5 min ago', status: 'success' },
    { action: 'Waste detected', module: 'WasteWatchDog', time: '8 min ago', status: 'warning' },
    { action: 'Recipe optimized', module: 'Smart Chef Pod', time: '12 min ago', status: 'success' }
  ];

  return (
    
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              IOMS Analytics Dashboard
            </h1>
            <p className="text-slate-600 font-medium mt-1">Comprehensive business intelligence and operational insights</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
            Generate Report
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 font-medium text-sm">Total Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-1">${businessMetrics.totalRevenue.toLocaleString()}</div>
            <div className="text-xs text-emerald-600 font-medium">+{businessMetrics.monthlyGrowth}% from last month</div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 font-medium text-sm">Active Users</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-1">{businessMetrics.activeUsers.toLocaleString()}</div>
            <div className="text-xs text-blue-600 font-medium">+{businessMetrics.newUsers} new this month</div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 font-medium text-sm">Total Orders</span>
              <Package className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-1">{businessMetrics.totalOrders.toLocaleString()}</div>
            <div className="text-xs text-purple-600 font-medium">+{businessMetrics.weeklyGrowth}% this week</div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 font-medium text-sm">System Health</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-bold text-emerald-600 mb-1">{businessMetrics.systemHealth}%</div>
            <div className="text-xs text-slate-500 font-medium">Uptime {businessMetrics.uptime}</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Module Performance */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-sm">
            <div className="flex items-center mb-6">
              <BarChart3 className="w-5 h-5 text-slate-600 mr-2" />
              <h3 className="text-lg font-semibold text-slate-800">Module Performance</h3>
            </div>
            <div className="space-y-6">
              {modulePerformance.map((item, index) => {
                const IconComponent = item.icon;
                const colorClasses = {
                  emerald: 'text-emerald-600 bg-emerald-50 border-emerald-200',
                  teal: 'text-teal-600 bg-teal-50 border-teal-200',
                  blue: 'text-blue-600 bg-blue-50 border-blue-200',
                  purple: 'text-purple-600 bg-purple-50 border-purple-200'
                };
                
                return (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg border ${colorClasses[item.color as keyof typeof colorClasses]} flex items-center justify-center`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-slate-800">{item.module}</span>
                          <p className="text-xs text-slate-500">{item.users} active users</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-slate-800">${item.revenue.toLocaleString()}</span>
                        <p className="text-xs text-slate-500">{item.performance}</p>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200/50 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          item.usage >= 80 
                            ? 'bg-emerald-500' 
                            : item.usage >= 60 
                              ? 'bg-yellow-500' 
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${item.usage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>{item.usage}% utilization</span>
                      <span>Revenue contribution</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-sm">
            <div className="flex items-center mb-6">
              <Building2 className="w-5 h-5 text-slate-600 mr-2" />
              <h3 className="text-lg font-semibold text-slate-800">Recent Activity</h3>
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-slate-50/50 rounded-xl hover:bg-slate-100/50 transition-colors">
                  <div className={`w-3 h-3 rounded-full ${
                    activity.status === 'success' 
                      ? 'bg-emerald-500' 
                      : activity.status === 'warning' 
                        ? 'bg-yellow-500' 
                        : 'bg-red-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{activity.action}</p>
                    <p className="text-xs text-slate-500">{activity.module}</p>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Business Insights */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-sm">
          <div className="flex items-center mb-6">
            <TrendingUp className="w-5 h-5 text-slate-600 mr-2" />
            <h3 className="text-lg font-semibold text-slate-800">Business Insights</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200/50">
              <div className="text-3xl font-bold text-emerald-600 mb-2">23%</div>
              <div className="text-sm text-slate-600 font-medium">Efficiency Improvement</div>
              <div className="text-xs text-slate-500 mt-1">vs last quarter</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50">
              <div className="text-3xl font-bold text-blue-600 mb-2">$47K</div>
              <div className="text-sm text-slate-600 font-medium">Cost Savings</div>
              <div className="text-xs text-slate-500 mt-1">through optimization</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200/50">
              <div className="text-3xl font-bold text-purple-600 mb-2">98.5%</div>
              <div className="text-sm text-slate-600 font-medium">Customer Satisfaction</div>
              <div className="text-xs text-slate-500 mt-1">based on feedback</div>
            </div>
          </div>
        </div>
      </div>
    
  );
}