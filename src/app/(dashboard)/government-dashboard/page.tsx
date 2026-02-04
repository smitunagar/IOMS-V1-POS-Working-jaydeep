"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Shield, CheckCircle, AlertTriangle, FileText, Calendar, TrendingUp } from 'lucide-react';

export default function GovernmentDashboardPage() {
  return (
    
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Government Compliance Dashboard</h1>
              <p className="text-gray-600">Monitor regulatory compliance and government requirements</p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">98.5%</div>
              <p className="text-xs text-muted-foreground">+1.3% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Permits</CardTitle>
              <FileText className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">All current and valid</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inspections</CardTitle>
              <Calendar className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45</div>
              <p className="text-xs text-muted-foreground">This year</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Violations</CardTitle>
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">2</div>
              <p className="text-xs text-muted-foreground">-60% from last period</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Inspections */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Inspections</CardTitle>
              <CardDescription>Latest government inspections and results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { date: '2024-01-12', type: 'Health & Safety', status: 'Passed', score: 95 },
                  { date: '2024-01-08', type: 'Fire Safety', status: 'Passed', score: 98 },
                  { date: '2024-01-05', type: 'Food Hygiene', status: 'Passed', score: 92 },
                  { date: '2024-01-02', type: 'Licensing', status: 'Passed', score: 100 }
                ].map((inspection, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{inspection.type}</div>
                      <div className="text-sm text-gray-600">{inspection.date}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${inspection.status === 'Passed' ? 'text-green-600' : 'text-red-600'}`}>
                        {inspection.status}
                      </div>
                      <div className="text-sm text-gray-600">{inspection.score}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Compliance Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Categories</CardTitle>
              <CardDescription>Status across different regulatory areas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { category: 'Food Safety', score: 98, status: 'Excellent' },
                  { category: 'Health Regulations', score: 95, status: 'Excellent' },
                  { category: 'Fire Safety', score: 100, status: 'Perfect' },
                  { category: 'Labor Laws', score: 92, status: 'Good' },
                  { category: 'Environmental', score: 89, status: 'Good' }
                ].map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{item.category}</span>
                      <span className="text-sm text-gray-600">{item.score}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${item.score >= 95 ? 'bg-green-500' : item.score >= 90 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${item.score}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Requirements</CardTitle>
            <CardDescription>Important deadlines and renewals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: 'Business License Renewal', due: '2024-03-15', priority: 'High', daysLeft: 45 },
                { title: 'Health Permit Renewal', due: '2024-04-20', priority: 'Medium', daysLeft: 81 },
                { title: 'Fire Safety Inspection', due: '2024-02-28', priority: 'High', daysLeft: 28 }
              ].map((item, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="font-medium mb-2">{item.title}</div>
                  <div className="text-sm text-gray-600 mb-2">Due: {item.due}</div>
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      item.priority === 'High' ? 'bg-red-100 text-red-800' :
                      item.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {item.priority}
                    </span>
                    <span className="text-sm font-medium">{item.daysLeft} days</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    
  );
}