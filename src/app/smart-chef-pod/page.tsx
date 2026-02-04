"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { ChefHat, TrendingUp, Clock, Star, Users, Utensils, ArrowLeft, MessageCircle, BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';

interface Subsection {
  id: string;
  title: string;
  description: string;
}

const smartChefSubsections: Subsection[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'View analytics and insights',
  },
  {
    id: 'chat',
    title: 'Chat with SmartChefBot',
    description: 'AI-powered recipe assistance',
  },
];

export default function SmartChefPodPage() {
  const router = useRouter();
  const [activeSubsection, setActiveSubsection] = useState<string>('dashboard');

  const handleChatClick = () => {
    window.open('https://smartchefbot-production.up.railway.app/chat', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Back to Marketplace Button */}
        <Button
          onClick={() => router.push('/')}
          variant="outline"
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Marketplace
        </Button>

        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <ChefHat className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Smart Chef Bot</h1>
                <p className="text-gray-600 mt-1">AI-powered culinary intelligence and recipe optimization</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subsection Cards */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {smartChefSubsections.map((subsection) => {
            const isActive = activeSubsection === subsection.id;
            const Icon = subsection.id === 'dashboard' ? BarChart3 : MessageCircle;

            return (
              <Card
                key={subsection.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  isActive
                    ? 'ring-2 ring-orange-500 shadow-md bg-orange-50 border-orange-200'
                    : 'shadow-sm hover:border-orange-200'
                }`}
                onClick={() => {
                  if (subsection.id === 'chat') {
                    handleChatClick();
                  } else {
                    setActiveSubsection(subsection.id);
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      isActive ? 'bg-orange-100' : 'bg-gray-100'
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        isActive ? 'text-orange-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold truncate ${
                        isActive ? 'text-orange-900' : 'text-gray-900'
                      }`}>
                        {subsection.title}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{subsection.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Dashboard Content */}
        {activeSubsection === 'dashboard' && (
          <div className="space-y-6">

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dishes Created</CardTitle>
              <Utensils className="w-4 h-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">127</div>
              <p className="text-xs text-muted-foreground">+15% this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recipe Optimizations</CardTitle>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45</div>
              <p className="text-xs text-muted-foreground">AI-enhanced recipes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$8,500</div>
              <p className="text-xs text-muted-foreground">Through optimization</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customer Rating</CardTitle>
              <Star className="w-4 h-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.8</div>
              <p className="text-xs text-muted-foreground">Average dish rating</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Popular AI Dishes */}
          <Card>
            <CardHeader>
              <CardTitle>Popular AI-Created Dishes</CardTitle>
              <CardDescription>Top performing AI-optimized recipes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'AI-Optimized Pasta', orders: 234, rating: 4.9, margin: '65%' },
                  { name: 'Smart Burger', orders: 189, rating: 4.7, margin: '58%' },
                  { name: 'Fusion Bowl', orders: 156, rating: 4.8, margin: '72%' },
                  { name: 'Intelligent Salad', orders: 143, rating: 4.6, margin: '80%' }
                ].map((dish, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{dish.name}</div>
                      <div className="text-sm text-gray-600">{dish.orders} orders</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{dish.rating} ⭐</div>
                      <div className="text-sm text-green-600">{dish.margin} margin</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recipe Optimization Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Optimization Insights</CardTitle>
              <CardDescription>AI-driven recommendations for recipe improvements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { 
                    insight: 'Reduce salt by 15% in pasta dishes',
                    impact: 'Health-conscious appeal',
                    status: 'Implemented'
                  },
                  { 
                    insight: 'Add seasonal vegetables to burger',
                    impact: '+$2.50 profit per dish',
                    status: 'Testing'
                  },
                  { 
                    insight: 'Optimize cooking temperature',
                    impact: '12% faster preparation',
                    status: 'Recommended'
                  },
                  { 
                    insight: 'Alternative protein options',
                    impact: 'Expand customer base',
                    status: 'Planning'
                  }
                ].map((item, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="font-medium mb-1">{item.insight}</div>
                    <div className="text-sm text-gray-600 mb-2">{item.impact}</div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      item.status === 'Implemented' ? 'bg-green-100 text-green-800' :
                      item.status === 'Testing' ? 'bg-yellow-100 text-yellow-800' :
                      item.status === 'Recommended' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Chef Pod Performance</CardTitle>
            <CardDescription>Real-time cooking analytics and efficiency metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">92%</div>
                <div className="text-sm text-gray-600">Kitchen Efficiency</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">3.2min</div>
                <div className="text-sm text-gray-600">Avg Prep Time</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">18%</div>
                <div className="text-sm text-gray-600">Waste Reduction</div>
              </div>
            </div>
          </CardContent>
        </Card>
          </div>
        )}
      </div>
    </div>
  );
}