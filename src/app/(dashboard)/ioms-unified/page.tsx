"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { 
  ArrowLeft,
  Bell,
  Users,
  Calendar,
  ShoppingCart,
  Package,
  Settings,
  LogOut,
  BarChart3,
  Leaf,
  Camera,
  Database,
  Monitor,
  Wifi,
  Smartphone,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Shield,
  FileText,
  Globe,
  Brain,
  PieChart,
  CheckCircle,
  Activity,
  Building
} from 'lucide-react';
import Link from 'next/link';

interface SidebarItem {
  id: string;
  label: string;
  icon: any;
  description?: string;
  type?: 'header';
  parent?: string;
  route?: string;
}

export default function IOMSUnifiedDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedModules, setExpandedModules] = useState<string[]>(['wastewatch']);

  const toggleModuleExpansion = (moduleId: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const sidebarItems: SidebarItem[] = [
    // Main IOMS Functions
    {
      id: 'receptionist',
      label: 'Receptionist',
      icon: Users,
      description: 'Guest management & check-in'
    },
    {
      id: 'reservations',
      label: 'Reservations',
      icon: Calendar,
      description: 'Booking management system'
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: ShoppingCart,
      description: 'Order processing & tracking'
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Package,
      description: 'Stock management & control'
    },
    {
      id: 'setup',
      label: 'Setup',
      icon: Settings,
      description: 'System configuration'
    },
    
    // WasteWatchDog Section
    {
      id: 'wastewatch',
      label: 'WasteWatchDog',
      type: 'header',
      icon: Leaf,
      description: 'Waste management system'
    },
    {
      id: 'wastewatch-dashboard',
      label: 'WasteWatch Dashboard',
      icon: BarChart3,
      description: 'Monitor and analyze food waste',
      parent: 'wastewatch'
    },
    {
      id: 'wastewatch-module',
      label: 'WasteWatch Module',
      icon: Monitor,
      description: 'Hardware & device management',
      parent: 'wastewatch'
    }
  ];

  const renderSidebar = () => (
    <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
      sidebarCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🏢</span>
              </div>
              <span className="text-lg font-bold text-gray-900">IOMS</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          const isExpanded = expandedModules.includes(item.id);
          
          // Render header items with accordion functionality
          if (item.type === 'header') {
            return (
              <div key={item.id} className="mt-4 first:mt-0">
                <button
                  onClick={() => toggleModuleExpansion(item.id)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-green-600" />
                    {!sidebarCollapsed && (
                      <div className="text-left">
                        <div className="font-semibold text-sm text-gray-900">{item.label}</div>
                        <div className="text-xs text-gray-500">{item.description}</div>
                      </div>
                    )}
                  </div>
                  {!sidebarCollapsed && (
                    <div className="flex-shrink-0">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  )}
                </button>
              </div>
            );
          }
          
          // Only render sub-items if their parent module is expanded
          if (item.parent && !expandedModules.includes(item.parent)) {
            return null;
          }
          
          // Render regular navigation items
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                isActive 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                  : 'text-gray-600 hover:bg-gray-50'
              } ${item.parent ? 'ml-4 pl-4' : ''}`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!sidebarCollapsed && (
                <div>
                  <div className="font-medium text-sm">{item.label}</div>
                  {item.description && (
                    <div className="text-xs text-gray-500">{item.description}</div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">N</span>
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1">
              <div className="text-sm font-medium">Admin User</div>
              <div className="text-xs text-gray-500">Administrator</div>
            </div>
          )}
          <Button variant="ghost" size="sm">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'wastewatch-dashboard':
        return renderWasteWatchDashboard();
      case 'wastewatch-module':
        return renderWasteWatchModule();
      case 'receptionist':
        return renderReceptionist();
      case 'reservations':
        return renderReservations();
      case 'orders':
        return renderOrders();
      case 'inventory':
        return renderInventory();
      case 'setup':
        return renderSetup();
      default:
        return renderMainDashboard();
    }
  };

  const renderWasteWatchDashboard = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Waste</CardTitle>
            <div className="w-4 h-4 text-orange-600">⚠️</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">45.2 kg</div>
            <div className="flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-orange-500 mr-1" />
              <span className="text-xs text-orange-600">23.5% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Carbon Footprint</CardTitle>
            <div className="w-4 h-4 text-green-600">✓</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">67.8 kg CO₂</div>
            <div className="flex items-center mt-1">
              <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-green-600">12.3% this week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">€234.5</div>
            <p className="text-xs text-blue-600 mt-1">Saved through waste reduction</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <div className="w-4 h-4 text-red-600">⚠️</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">3</div>
            <p className="text-xs text-red-600 mt-1">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Waste Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { item: 'Chicken Curry', weight: '2.3 kg', co2: '3.4 kg CO₂', date: '2024-01-15' },
                { item: 'Rice', weight: '1.8 kg', co2: '2.1 kg CO₂', date: '2024-01-14' },
                { item: 'Vegetable Soup', weight: '1.2 kg', co2: '1.8 kg CO₂', date: '2024-01-13' },
                { item: 'Bread', weight: '0.9 kg', co2: '1.2 kg CO₂', date: '2024-01-12' }
              ].map((waste, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">{waste.item}</div>
                    <div className="text-sm text-gray-600">{waste.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{waste.weight}</div>
                    <div className="text-sm text-gray-600">{waste.co2}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Waste by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { category: 'Main Courses', percentage: 41, weight: '18.5 kg' },
                { category: 'Side Dishes', percentage: 27, weight: '12.3 kg' },
                { category: 'Beverages', percentage: 19, weight: '8.7 kg' },
                { category: 'Desserts', percentage: 13, weight: '5.7 kg' }
              ].map((cat, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{cat.category}</span>
                    <span className="text-sm text-gray-600">{cat.weight} ({cat.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${cat.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sustainability Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Sustainability Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-2">23.5%</div>
              <div className="text-sm font-medium">Waste Reduction</div>
              <div className="text-xs text-gray-600">Compared to last month</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-2">235€</div>
              <div className="text-sm font-medium">Cost Savings</div>
              <div className="text-xs text-gray-600">This month</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-2">68 kg</div>
              <div className="text-sm font-medium">CO₂ Saved</div>
              <div className="text-xs text-gray-600">Environmental impact</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderWasteWatchModule = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Hardware Management</CardTitle>
          <p className="text-gray-600">Monitor and manage WasteWatch hardware components</p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Hardware monitoring and device management</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderReceptionist = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Receptionist Dashboard</CardTitle>
          <p className="text-gray-600">Guest management and check-in system</p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Guest management features coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderReservations = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Reservations Management</CardTitle>
          <p className="text-gray-600">Booking and reservation system</p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Reservation management features coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Orders Management</CardTitle>
          <p className="text-gray-600">Order processing and tracking</p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Order management features coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Inventory Management</CardTitle>
          <p className="text-gray-600">Stock management and control</p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Inventory management features coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSetup = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>System Setup</CardTitle>
          <p className="text-gray-600">System configuration and settings</p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Setup and configuration options coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMainDashboard = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>IOMS Dashboard</CardTitle>
          <p className="text-gray-600">Integrated Operations Management System</p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Main dashboard overview</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      {renderSidebar()}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Marketplace
                </Link>
              </Button>
              <div className="w-px h-6 bg-gray-300"></div>
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <span>IOMS</span>
                  {(() => {
                    const currentItem = sidebarItems.find(item => item.id === activeSection);
                    return currentItem ? (
                      <>
                        <span>•</span>
                        <span>{currentItem.label}</span>
                      </>
                    ) : null;
                  })()}
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {sidebarItems.find(item => item.id === activeSection)?.label || 'IOMS Dashboard'}
                </h2>
                <p className="text-sm text-gray-600">
                  {sidebarItems.find(item => item.id === activeSection)?.description || 'Integrated Operations Management System'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="default" className="bg-green-100 text-green-800">
                <Activity className="h-3 w-3 mr-1" />
                Live
              </Badge>
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
