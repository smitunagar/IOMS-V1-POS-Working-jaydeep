"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { 
  MapPin, 
  Filter, 
  Download, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface WasteHeatmapPoint {
  id: string;
  lat: number;
  lng: number;
  businessName: string;
  wasteAmount: number;
  wasteType: string;
  complianceLevel: 'good' | 'warning' | 'violation';
  lastReported: string;
  address: string;
}

interface WasteHeatmapProps {
  className?: string;
  onPointClick?: (point: WasteHeatmapPoint) => void;
}

export function WasteHeatmap({ className, onPointClick }: WasteHeatmapProps) {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'good' | 'warning' | 'violation'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [mapData, setMapData] = useState<WasteHeatmapPoint[]>([]);

  // Mock data for development
  const mockData: WasteHeatmapPoint[] = [
    {
      id: 'point_1',
      lat: 52.5200,
      lng: 13.4050,
      businessName: 'Restaurant Zur Linde',
      wasteAmount: 45.2,
      wasteType: 'Food Waste',
      complianceLevel: 'good',
      lastReported: '2025-08-25T10:30:00Z',
      address: 'Unter den Linden 1, Berlin'
    },
    {
      id: 'point_2',
      lat: 52.5170,
      lng: 13.3888,
      businessName: 'Café Berlin Central',
      wasteAmount: 23.8,
      wasteType: 'Packaging',
      complianceLevel: 'warning',
      lastReported: '2025-08-25T09:15:00Z',
      address: 'Brandenburger Tor 5, Berlin'
    },
    {
      id: 'point_3',
      lat: 52.5219,
      lng: 13.4132,
      businessName: 'Hotel Alexanderplatz',
      wasteAmount: 78.9,
      wasteType: 'Mixed Waste',
      complianceLevel: 'violation',
      lastReported: '2025-08-24T18:45:00Z',
      address: 'Alexanderplatz 7, Berlin'
    },
    {
      id: 'point_4',
      lat: 52.5159,
      lng: 13.3777,
      businessName: 'Bistro Potsdamer Platz',
      wasteAmount: 34.1,
      wasteType: 'Food Waste',
      complianceLevel: 'good',
      lastReported: '2025-08-25T11:20:00Z',
      address: 'Potsdamer Platz 12, Berlin'
    }
  ];

  useEffect(() => {
    setMapData(mockData);
  }, []);

  const filteredData = mapData.filter(point => 
    selectedFilter === 'all' || point.complianceLevel === selectedFilter
  );

  const getComplianceIcon = (level: string) => {
    switch (level) {
      case 'good':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'violation':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <MapPin className="w-4 h-4 text-gray-500" />;
    }
  };

  const getComplianceBadge = (level: string) => {
    switch (level) {
      case 'good':
        return <Badge className="bg-green-100 text-green-800">Compliant</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'violation':
        return <Badge className="bg-red-100 text-red-800">Violation</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span>Waste Monitoring Heatmap</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
        
        {/* Filter Controls */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <div className="flex space-x-1">
            {['all', 'good', 'warning', 'violation'].map((filter) => (
              <Button
                key={filter}
                variant={selectedFilter === filter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilter(filter as any)}
                className="capitalize"
              >
                {filter === 'all' ? 'All' : filter}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Map Placeholder */}
        <div className="relative">
          <div className="w-full h-96 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center mb-4">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 font-medium">Interactive Map</p>
              <p className="text-sm text-gray-500">Leaflet/MapBox integration would go here</p>
              <p className="text-xs text-gray-400 mt-2">
                {filteredData.length} locations shown
              </p>
            </div>
          </div>

          {/* Mock Map Points Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {filteredData.slice(0, 4).map((point, index) => (
              <div
                key={point.id}
                className="absolute pointer-events-auto cursor-pointer"
                style={{
                  left: `${20 + index * 20}%`,
                  top: `${30 + index * 15}%`,
                }}
                onClick={() => onPointClick?.(point)}
              >
                <div className={`w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center ${
                  point.complianceLevel === 'good' ? 'bg-green-500' :
                  point.complianceLevel === 'warning' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}>
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Legend:</span>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-xs text-gray-600">Compliant</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              <span className="text-xs text-gray-600">Warning</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <span className="text-xs text-gray-600">Violation</span>
            </div>
          </div>
        </div>

        {/* Data List */}
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {filteredData.map((point) => (
            <div
              key={point.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              onClick={() => onPointClick?.(point)}
            >
              <div className="flex items-center space-x-3">
                {getComplianceIcon(point.complianceLevel)}
                <div>
                  <p className="font-medium text-gray-900">{point.businessName}</p>
                  <p className="text-xs text-gray-500">{point.address}</p>
                  <p className="text-xs text-gray-600">
                    {point.wasteAmount} kg • {point.wasteType}
                  </p>
                </div>
              </div>
              <div className="text-right space-y-1">
                {getComplianceBadge(point.complianceLevel)}
                <p className="text-xs text-gray-500">
                  {new Date(point.lastReported).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-8">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No data points match the selected filter</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
