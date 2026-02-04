"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Target, 
  Building2, 
  ShieldCheck,
  Leaf,
  BarChart3,
  Download,
  ExternalLink
} from 'lucide-react';
import { GovKPIData } from '@/types/gov';
import { cn } from '@/server/lib/utils';

interface GovKPICardsProps {
  kpiData: GovKPIData;
  onExport?: (kpiType: string) => void;
  className?: string;
}

export function GovKPICards({ kpiData, onExport, className }: GovKPICardsProps) {
  const kpiCards = [
    {
      id: 'waste-reduction',
      title: 'Total Waste Reduction',
      value: `${kpiData.totalWasteReduction.value.toLocaleString()}`,
      unit: kpiData.totalWasteReduction.unit,
      change: kpiData.totalWasteReduction.change,
      trend: kpiData.totalWasteReduction.trend,
      icon: Leaf,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      description: 'Total waste diverted from landfills across all registered businesses'
    },
    {
      id: 'compliance-rate',
      title: 'Compliance Rate',
      value: `${kpiData.complianceRate.value}%`,
      unit: '',
      change: kpiData.complianceRate.change,
      trend: kpiData.complianceRate.trend,
      icon: ShieldCheck,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      description: 'Percentage of businesses meeting waste management standards'
    },
    {
      id: 'active-inspections',
      title: 'Active Inspections',
      value: kpiData.activeInspections.value.toString(),
      unit: 'ongoing',
      change: 0,
      trend: 'neutral' as const,
      icon: Building2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      description: `${kpiData.activeInspections.pending} pending, ${kpiData.activeInspections.completed} completed this month`,
      subMetrics: [
        { label: 'Pending', value: kpiData.activeInspections.pending },
        { label: 'Completed', value: kpiData.activeInspections.completed }
      ]
    },
    {
      id: 'sdg-progress',
      title: 'SDG Progress',
      value: `${Math.round((kpiData.sdgProgress.sdg12_3 + kpiData.sdgProgress.sdg11 + kpiData.sdgProgress.sdg13) / 3)}%`,
      unit: 'avg',
      change: 0,
      trend: 'neutral' as const,
      icon: Target,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      description: 'Sustainable Development Goals achievement progress',
      subMetrics: [
        { label: 'SDG 12.3', value: Math.round(kpiData.sdgProgress.sdg12_3) },
        { label: 'SDG 11', value: Math.round(kpiData.sdgProgress.sdg11) },
        { label: 'SDG 13', value: Math.round(kpiData.sdgProgress.sdg13) }
      ]
    }
  ];

  const getTrendIcon = (trend: 'up' | 'down' | 'stable' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'stable':
      case 'neutral':
      default:
        return <BarChart3 className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", className)}>
      {kpiCards.map((kpi) => (
        <Card key={kpi.id} className={cn(
          "relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105",
          kpi.borderColor,
          kpi.bgColor
        )}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              {kpi.title}
            </CardTitle>
            <div className={cn("p-2 rounded-lg", kpi.bgColor)}>
              <kpi.icon className={cn("w-5 h-5", kpi.color)} />
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Main Value */}
            <div className="space-y-1">
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-gray-900">{kpi.value}</span>
                {kpi.unit && (
                  <span className="text-sm text-gray-500">{kpi.unit}</span>
                )}
              </div>
              
              {/* Trend Indicator */}
              {kpi.change !== 0 && (
                <div className="flex items-center space-x-1">
                  {getTrendIcon(kpi.trend)}
                  <span className={cn(
                    "text-sm font-medium",
                    kpi.trend === 'up' ? "text-green-600" : 
                    kpi.trend === 'down' ? "text-red-600" : "text-gray-600"
                  )}>
                    {kpi.change > 0 ? '+' : ''}{kpi.change}%
                  </span>
                  <span className="text-xs text-gray-500">vs last month</span>
                </div>
              )}
            </div>

            {/* Sub Metrics */}
            {kpi.subMetrics && (
              <div className="grid grid-cols-2 gap-2">
                {kpi.subMetrics.map((metric, index) => (
                  <div key={index} className="text-center p-2 bg-white rounded-md border">
                    <div className="text-sm font-semibold">{metric.value}</div>
                    <div className="text-xs text-gray-500">{metric.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Description */}
            <p className="text-xs text-gray-600 leading-relaxed">
              {kpi.description}
            </p>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => onExport?.(kpi.id)}
              >
                <Download className="w-3 h-3 mr-1" />
                Export
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Details
              </Button>
            </div>
          </CardContent>

          {/* Decorative Elements */}
          <div className={cn(
            "absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 transform translate-x-10 -translate-y-10",
            kpi.color.replace('text-', 'bg-')
          )} />
        </Card>
      ))}
      
      {/* Regional Metrics Summary Card */}
      <Card className="md:col-span-2 lg:col-span-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Regional Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiData.regionalMetrics.map((region, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border">
                <h4 className="font-semibold text-gray-900 mb-2">{region.region}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Waste Reduction:</span>
                    <span className="text-sm font-medium">{region.wasteReduction.toLocaleString()} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Compliance:</span>
                    <Badge variant={region.complianceRate >= 95 ? 'default' : region.complianceRate >= 90 ? 'secondary' : 'destructive'}>
                      {region.complianceRate}%
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Businesses:</span>
                    <span className="text-sm font-medium">{region.businessCount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
