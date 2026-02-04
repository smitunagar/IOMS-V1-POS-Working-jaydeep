'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import { History } from 'lucide-react';

export default function ReservationHistoryPage() {
  return (
    <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <History className="h-6 w-6" />
              Reservation History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground mb-6">
              View all past reservations for your restaurant.
            </div>
            {/* Placeholder for reservation records */}
            <div className="flex flex-col items-center justify-center py-16">
              <History className="h-12 w-12 text-blue-400 mb-4" />
              <div className="font-semibold text-lg mb-2">No reservation history yet</div>
              <div className="text-sm text-muted-foreground">Reservation records will appear here once you have data.</div>
            </div>
          </CardContent>
        </Card>
      </div>
  );
} 