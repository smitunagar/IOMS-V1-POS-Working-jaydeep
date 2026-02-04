'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function OrderAnalyticsPage() {
  return (
    
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <BarChart3 className="h-6 w-6" />
              Order Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground mb-6">
              Visualize order trends, sales, and key metrics for your restaurant.
            </div>
            {/* Placeholder for future charts/metrics */}
            <div className="flex flex-col items-center justify-center py-16">
              <BarChart3 className="h-12 w-12 text-blue-400 mb-4" />
              <div className="font-semibold text-lg mb-2">No analytics data yet</div>
              <div className="text-sm text-muted-foreground">Order analytics will appear here once you have order data.</div>
            </div>
          </CardContent>
        </Card>
      </div>
    
  );
} 