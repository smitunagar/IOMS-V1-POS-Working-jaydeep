"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Package, TrendingDown, AlertTriangle, CheckCircle, BarChart3, Clock } from 'lucide-react';

export default function SmartInventoryPage() {
  return (
    
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Smart Inventory Management</h1>
              <p className="text-gray-600">AI-powered inventory optimization and tracking</p>
              <p className="text-sm text-gray-500 mt-1">by IOMS team</p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Items Tracked</CardTitle>
              <Package className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,247</div>
              <p className="text-xs text-muted-foreground">Across all categories</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Waste Reduction</CardTitle>
              <TrendingDown className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">23.5%</div>
              <p className="text-xs text-muted-foreground">Compared to last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Optimization</CardTitle>
              <BarChart3 className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89.2%</div>
              <p className="text-xs text-muted-foreground">Efficiency score</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
              <TrendingDown className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">$12,000</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alerts & Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>Smart Alerts</CardTitle>
              <CardDescription>Real-time inventory notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { type: 'Low Stock', item: 'Fresh Tomatoes', level: '15 units', priority: 'High', icon: AlertTriangle, color: 'text-red-600' },
                  { type: 'Expiry Alert', item: 'Dairy Products', level: '3 days', priority: 'Medium', icon: Clock, color: 'text-yellow-600' },
                  { type: 'Reorder Point', item: 'Cooking Oil', level: '5 bottles', priority: 'Medium', icon: Package, color: 'text-blue-600' },
                  { type: 'Quality Check', item: 'Fresh Vegetables', level: 'Due today', priority: 'Low', icon: CheckCircle, color: 'text-green-600' }
                ].map((alert, index) => {
                  const IconComponent = alert.icon;
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <IconComponent className={`w-5 h-5 ${alert.color}`} />
                        <div>
                          <div className="font-medium">{alert.type}</div>
                          <div className="text-sm text-gray-600">{alert.item}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{alert.level}</div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          alert.priority === 'High' ? 'bg-red-100 text-red-800' :
                          alert.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {alert.priority}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
              <CardDescription>Efficiency metrics by inventory category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { category: 'Fresh Vegetables', efficiency: 95.2, trend: '+2.1%' },
                  { category: 'Dairy Products', efficiency: 92.8, trend: '+1.5%' },
                  { category: 'Meat & Poultry', efficiency: 88.9, trend: '+0.8%' },
                  { category: 'Pantry Items', efficiency: 86.5, trend: '-0.3%' }
                ].map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{item.category}</span>
                      <span className="text-sm text-gray-600">{item.efficiency}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                        style={{ width: `${item.efficiency}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500">Trend: {item.trend}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Overview</CardTitle>
            <CardDescription>Current stock levels and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">874</div>
                <div className="text-sm text-gray-600">In Stock</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 mb-2">23</div>
                <div className="text-sm text-gray-600">Low Stock</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 mb-2">15</div>
                <div className="text-sm text-gray-600">Critical</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">45</div>
                <div className="text-sm text-gray-600">Pending Orders</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    
  );
}