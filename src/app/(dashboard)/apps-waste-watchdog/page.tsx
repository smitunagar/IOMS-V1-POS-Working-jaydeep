"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { ArrowLeft, BarChart3, Camera, FileText, TrendingDown, AlertTriangle, Leaf, DollarSign, Scale, Clock, Target, ArrowRight, ShoppingCart, Package, Activity, CheckCircle, ClipboardCheck } from 'lucide-react';
import { useWasteWatchDog } from '@/features/waste-watchdog/WasteWatchDogContext';
import { useAuth } from '@/features/auth/AuthContext';
import POSWasteIntegrationService, { WasteAnalysis } from '@/lib/posWasteIntegration';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function WasteWatchDogPage() {
  const { isActive, toggleWasteWatchDog } = useWasteWatchDog();
  const { currentUser } = useAuth();
  const [posMetrics, setPosMetrics] = useState<WasteAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Load POS integration data
  useEffect(() => {
    if (isActive && currentUser) {
      const loadPOSData = async () => {
        try {
          setLoading(true);
          const integrationService = POSWasteIntegrationService;
          const metrics = await integrationService.getWasteAnalysis('week');
          setPosMetrics(metrics);
        } catch (error) {
          console.error('Failed to load POS metrics:', error);
        } finally {
          setLoading(false);
        }
      };
      
      loadPOSData();
      
      // Refresh every 30 seconds
      const interval = setInterval(loadPOSData, 30000);
      return () => clearInterval(interval);
    }
  }, [isActive, currentUser]);
  
  // Fetch dashboard KPIs when active
  const { data: kpiData } = useSWR(
    isActive ? '/api/waste/kpis?window=today' : null,
    fetcher,
    { refreshInterval: 30000 }
  );

  // Fetch recent events
  const { data: recentEvents } = useSWR(
    isActive ? '/api/waste/recent?limit=5' : null,
    fetcher,
    { refreshInterval: 10000 }
  );

  const quickActions = [
    {
      title: "Dashboard",
      description: "View waste tracking metrics & insights",
      icon: BarChart3,
      href: "/waste-watchdog",
      color: "from-blue-500 to-blue-600",
      stats: kpiData?.data ? `${kpiData.data.totalWasteKg.toFixed(1)} kg today` : "Live Metrics"
    },
    {
      title: "CSRD Reporting",
      description: "ESRS-compliant sustainability reporting",
      icon: ClipboardCheck,
      href: "/apps-waste-watchdog/csrd-reporting",
      color: "from-indigo-500 to-indigo-600",
      stats: "99.2% Accuracy"
    },
    {
      title: "Hardware Capture",
      description: "Scan waste with camera or upload images",
      icon: Camera,
      href: "/apps-waste-watchdog/hardware",
      color: "from-green-500 to-green-600",
      stats: "AI Scanner Ready"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">WasteWatchDog</h1>
          <p className="text-gray-600">AI-Powered Waste Tracking & Sustainability Dashboard</p>
        </div>
        
        {/* Status Card */}
        <div className="mb-6">
          <Card className="shadow-sm border border-gray-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">System Status</p>
                  <p className="text-xs text-gray-600">AI monitoring active</p>
                </div>
              </div>
              <button
                onClick={toggleWasteWatchDog}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                  isActive ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </CardContent>
          </Card>
        </div>

        {isActive ? (
          <>
            {/* POS Integration Status */}
            {false && posMetrics && (
              <Card className="mb-6 border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-green-600" />
                      POS Integration Active
                    </h2>
                    <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                      Live Data
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Connected to Point of Sale system • {posMetrics?.recentOrders?.length || 0} recent orders • {posMetrics?.inventoryStatus?.lowStock?.length || 0} inventory alerts
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Real-time KPI Cards from POS */}
            {false && posMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="border border-gray-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-semibold text-gray-700">Today's Waste</CardTitle>
                    <Scale className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{posMetrics.todayWaste.toFixed(1)} kg</div>
                    <p className="text-xs text-gray-600">
                      +{Math.abs(posMetrics.reductionPercentage - 100).toFixed(1)}% from yesterday
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-semibold text-gray-700">Cost Impact</CardTitle>
                    <DollarSign className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">€{posMetrics.costImpact.toFixed(2)}</div>
                    <p className="text-xs text-gray-600">
                      €{(posMetrics.costImpact * 30).toFixed(2)} saved this period
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-semibold text-gray-700">CO₂ Impact</CardTitle>
                    <Leaf className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{posMetrics.co2Impact.toFixed(1)} kg</div>
                    <p className="text-xs text-gray-600">
                      {(posMetrics.co2Impact * 0.4).toFixed(1)} kg CO₂ saved
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-semibold text-gray-700">Reduction</CardTitle>
                    <TrendingDown className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{posMetrics.reductionPercentage.toFixed(1)}%</div>
                    <p className="text-xs text-gray-600">vs previous period</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Loading state for POS data */}
            {loading && !posMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                      <div className="h-4 w-4 bg-gray-200 rounded"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Fallback to API KPI Cards if POS data not available */}
            {!loading && !posMetrics && kpiData?.data && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Today's Waste</CardTitle>
                    <Scale className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{kpiData.data.totalWasteKg.toFixed(1)} kg</div>
                    <p className="text-xs text-muted-foreground">
                      {kpiData.data.trends.waste >= 0 ? '+' : ''}{kpiData.data.trends.waste.toFixed(1)}% from yesterday
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cost Impact</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">€{kpiData.data.totalCostEUR.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">
                      €{kpiData.data.costSavingsEUR.toFixed(2)} saved this period
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">CO₂ Impact</CardTitle>
                    <Leaf className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{kpiData.data.totalCO2Kg.toFixed(1)} kg</div>
                    <p className="text-xs text-muted-foreground">
                      {kpiData.data.co2SavedKg.toFixed(1)} kg CO₂ saved
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Reduction</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{kpiData.data.wasteReductionPercent.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">
                      vs previous period
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* POS Inventory Alerts */}
            {false && posMetrics && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Recent Orders from POS */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-blue-600" />
                      Recent POS Orders
                    </CardTitle>
                    <CardDescription>Live data from point of sale system</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {posMetrics.recentOrders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div>
                          <p className="font-medium">Order #{order.id.slice(-8)}</p>
                          <p className="text-sm text-gray-600">{order.items?.length || 0} items • {order.status}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${order.totalAmount.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {posMetrics.recentOrders.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No recent orders</p>
                    )}
                  </CardContent>
                </Card>

                {/* Inventory Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-orange-600" />
                      Inventory Alerts
                    </CardTitle>
                    <CardDescription>Real-time inventory status from POS</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {posMetrics.inventoryStatus.expiring.length > 0 && (
                        <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span className="text-sm text-red-800">
                            {posMetrics.inventoryStatus.expiring.length} items expiring soon
                          </span>
                        </div>
                      )}
                      {posMetrics.inventoryStatus.lowStock.length > 0 && (
                        <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
                          <Clock className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm text-yellow-800">
                            {posMetrics.inventoryStatus.lowStock.length} items low in stock
                          </span>
                        </div>
                      )}
                      {posMetrics.inventoryStatus.overstock.length > 0 && (
                        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                          <Package className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-blue-800">
                            {posMetrics.inventoryStatus.overstock.length} items overstocked
                          </span>
                        </div>
                      )}
                      {posMetrics.inventoryStatus.expiring.length === 0 && 
                       posMetrics.inventoryStatus.lowStock.length === 0 && 
                       posMetrics.inventoryStatus.overstock.length === 0 && (
                        <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-800">All inventory levels optimal</span>
                        </div>
                      )}
                    </div>

                    {/* Waste by Category */}
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium mb-2">Waste by Category (Today)</h4>
                      {Object.entries(posMetrics.wasteByCategory).slice(0, 3).map(([category, amount]) => (
                        <div key={category} className="flex justify-between items-center py-1">
                          <span className="text-sm text-gray-600 capitalize">{category}</span>
                          <span className="text-sm font-medium">{amount.toFixed(1)} kg</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {quickActions.map((action) => (
                <Link key={action.title} href={action.href}>
                  <Card className="hover:shadow-md transition-all cursor-pointer border border-gray-200">
                    {action.badge && (
                      <Badge className="absolute top-3 right-3 bg-indigo-600" variant="default">
                        {action.badge}
                      </Badge>
                    )}
                    <CardHeader className="pb-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                        <action.icon className="w-6 h-6 text-gray-700" />
                      </div>
                      <CardTitle className="text-base font-bold text-gray-900">{action.title}</CardTitle>
                      <CardDescription className="text-xs text-gray-600">{action.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">{action.stats}</span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Recent Activity */}
            {recentEvents?.data && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Recent Waste Events
                  </CardTitle>
                  <CardDescription>Latest waste tracking activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentEvents.data.map((event: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            event.type === 'food' ? 'bg-orange-500' :
                            event.type === 'oil' ? 'bg-yellow-500' :
                            event.type === 'packaging' ? 'bg-blue-500' : 'bg-green-500'
                          }`} />
                          <div>
                            <p className="font-medium">{event.type} waste</p>
                            <p className="text-sm text-gray-600">{event.station} station</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{event.amountKg} kg</p>
                          <p className="text-sm text-gray-600">€{event.costEUR}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                    <Link href="/apps/waste-watchdog/analytics">
                      <Button variant="outline" className="w-full">
                        View All Events
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          /* Inactive State */
          <Card className="text-center py-12">
            <CardContent>
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">WasteWatchDog is Inactive</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Activate WasteWatchDog to start tracking waste, monitoring environmental impact, and accessing comprehensive analytics.
              </p>
              <Button onClick={toggleWasteWatchDog} size="lg" className="bg-green-600 hover:bg-green-700">
                Activate WasteWatchDog
              </Button>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
