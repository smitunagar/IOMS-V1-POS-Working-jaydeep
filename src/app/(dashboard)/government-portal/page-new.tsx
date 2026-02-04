"use client";

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/shared/components/layout/MainLayout';
import { GovKPICards } from '@/features/government-portal/components/GovKPICards';
import { WasteHeatmap } from '@/features/government-portal/components/WasteHeatmap';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { 
  Building2, 
  AlertTriangle, 
  FileText, 
  MapPin,
  Bell,
  Calendar,
  Users,
  TrendingUp,
  Download,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import { govDataService } from '@/server/services/govDataService';
import { GovKPIData } from '@/types/gov';
import { useToast } from '@/shared/hooks/use-toast';

export default function GovernmentPortalPage() {
  const [kpiData, setKpiData] = useState<GovKPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await govDataService.getKPIData();
      setKpiData(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: string) => {
    try {
      toast({
        title: "Export Started",
        description: `Generating ${type} report...`
      });
      
      // Simulate export
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Export Complete",
        description: `${type} report has been downloaded`
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate report",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading Government Portal...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Government Portal</h1>
                  <p className="text-gray-600">Waste management compliance and reporting dashboard</p>
                  <p className="text-sm text-gray-500 mt-1">by IOMS team</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm" onClick={() => handleExport('comprehensive')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
                <Button variant="outline" size="sm" onClick={loadDashboardData}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <div className="relative">
                  <Bell className="w-5 h-5 text-gray-500" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-6">
          {/* KPI Cards */}
          {kpiData && (
            <GovKPICards 
              kpiData={kpiData} 
              onExport={handleExport}
            />
          )}

          {/* Tabbed Content */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
              <TabsTrigger value="inspections">Inspections</TabsTrigger>
              <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <span>Recent Activity</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        {
                          id: 1,
                          business: 'Restaurant Goldener Stern',
                          action: 'Submitted weekly waste report',
                          time: '2 hours ago',
                          status: 'success'
                        },
                        {
                          id: 2,
                          business: 'Hotel Berlin Central',
                          action: 'Failed compliance inspection',
                          time: '4 hours ago',
                          status: 'error'
                        },
                        {
                          id: 3,
                          business: 'Café Alexanderplatz',
                          action: 'Requested inspection reschedule',
                          time: '6 hours ago',
                          status: 'warning'
                        }
                      ].map((activity) => (
                        <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`w-2 h-2 rounded-full ${
                              activity.status === 'success' ? 'bg-green-500' :
                              activity.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                            }`} />
                            <div>
                              <p className="font-medium text-gray-900">{activity.business}</p>
                              <p className="text-sm text-gray-600">{activity.action}</p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">{activity.time}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      <span>Quick Stats</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">1,247</div>
                      <div className="text-sm text-gray-600">Registered Businesses</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">94.2%</div>
                      <div className="text-sm text-gray-600">Compliance Rate</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">28</div>
                      <div className="text-sm text-gray-600">Active Inspections</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Alerts Tab */}
            <TabsContent value="alerts" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <span>System Alerts</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      {
                        id: 1,
                        title: 'Compliance Deadline Approaching',
                        description: 'Monthly waste reporting deadline in 3 days for 12 businesses',
                        severity: 'warning',
                        time: '1 hour ago'
                      },
                      {
                        id: 2,
                        title: 'High Waste Volume Detected',
                        description: 'Unusual waste spike detected in Berlin Center district',
                        severity: 'info',
                        time: '3 hours ago'
                      },
                      {
                        id: 3,
                        title: 'Inspection Overdue',
                        description: 'Restaurant "Zur Linde" has not been inspected in 6 months',
                        severity: 'error',
                        time: '1 day ago'
                      }
                    ].map((alert) => (
                      <div key={alert.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <Badge variant={
                                alert.severity === 'error' ? 'destructive' :
                                alert.severity === 'warning' ? 'secondary' : 'default'
                              }>
                                {alert.severity}
                              </Badge>
                              <span className="text-xs text-gray-500">{alert.time}</span>
                            </div>
                            <h4 className="font-semibold text-gray-900">{alert.title}</h4>
                            <p className="text-sm text-gray-600">{alert.description}</p>
                          </div>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Inspections Tab */}
            <TabsContent value="inspections" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <span>Inspection Management</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search inspections..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                    <Button variant="outline" size="sm">
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      {
                        id: 1,
                        business: 'Restaurant Goldener Stern',
                        inspector: 'Dr. Mueller',
                        date: '2025-08-26',
                        status: 'scheduled',
                        priority: 'medium'
                      },
                      {
                        id: 2,
                        business: 'Hotel Berlin Central',
                        inspector: 'Dr. Schmidt',
                        date: '2025-08-25',
                        status: 'completed',
                        priority: 'high',
                        score: 87
                      },
                      {
                        id: 3,
                        business: 'Café Alexanderplatz',
                        inspector: 'Ms. Weber',
                        date: '2025-08-27',
                        status: 'pending',
                        priority: 'low'
                      }
                    ].map((inspection) => (
                      <div key={inspection.id} className="p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{inspection.business}</h4>
                            <p className="text-sm text-gray-600">Inspector: {inspection.inspector}</p>
                            <p className="text-xs text-gray-500">Date: {inspection.date}</p>
                          </div>
                          <div className="text-right space-y-1">
                            <Badge variant={
                              inspection.status === 'completed' ? 'default' :
                              inspection.status === 'scheduled' ? 'secondary' : 'outline'
                            }>
                              {inspection.status}
                            </Badge>
                            {inspection.score && (
                              <div className="text-sm font-medium">Score: {inspection.score}/100</div>
                            )}
                            <Badge variant="outline" className={
                              inspection.priority === 'high' ? 'border-red-300 text-red-700' :
                              inspection.priority === 'medium' ? 'border-yellow-300 text-yellow-700' :
                              'border-green-300 text-green-700'
                            }>
                              {inspection.priority} priority
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Heatmap Tab */}
            <TabsContent value="heatmap" className="space-y-6">
              <WasteHeatmap 
                onPointClick={(point) => {
                  toast({
                    title: "Location Selected",
                    description: `${point.businessName} - ${point.wasteAmount} kg`
                  });
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
