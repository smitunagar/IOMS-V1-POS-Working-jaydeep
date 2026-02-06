"use client";

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Camera, Activity, ArrowRight } from 'lucide-react';

export default function HardwareHubPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Hardware Options</h1>
        <p className="text-slate-600 mt-1">Choose the hardware workflow you want to use</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Waste Watchdog Station
            </CardTitle>
            <CardDescription>
              Camera + scale capture for AI waste tracking.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-hidden rounded-lg border bg-slate-50">
              <img
                src="/images/waste-watchdog-station.png"
                alt="IOMS Waste Watchdog Station"
                className="h-44 w-full object-cover"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Live station workflow</span>
              <Button asChild>
                <Link href="/apps-waste-watchdog/hardware/station">
                  Open Station
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Waste Watchdog Line
            </CardTitle>
            <CardDescription>
              Production line flow (blank for now).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Coming soon</span>
            <Button asChild variant="outline">
              <Link href="/apps-waste-watchdog/hardware/line">
                Open Line
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
