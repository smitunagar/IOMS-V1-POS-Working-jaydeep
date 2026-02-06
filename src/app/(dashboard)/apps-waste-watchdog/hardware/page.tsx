"use client";

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Camera, Activity, ArrowRight, MapPin, Info, Users } from 'lucide-react';

export default function HardwareHubPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">IOMS Hardware Management</h1>
      </div>

      <Card className="border-slate-200 bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className="text-xl">Mensa Wilhelmstraße · Tübingen</CardTitle>
            <img
              src="/images/Logo-Horizontal-Studierendenwerk-Tübingen-Hohenheim.webp"
              alt="Studierendenwerk Tübingen-Hohenheim"
              className="h-10 w-auto"
            />
          </div>
          <CardDescription>
            Frisch modernisiert (2019–2024) mit mehreren Frontcooking-Bereichen und bis zu 3.500 Essen täglich.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="flex items-start gap-3 rounded-lg border bg-white/80 p-3">
            <MapPin className="mt-0.5 h-4 w-4 text-emerald-600" />
            <div>
              <p className="text-sm font-medium text-slate-900">Adresse</p>
              <p className="text-sm text-slate-600">Wilhelmstraße 13, 72074 Tübingen</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border bg-white/80 p-3">
            <Users className="mt-0.5 h-4 w-4 text-emerald-600" />
            <div>
              <p className="text-sm font-medium text-slate-900">Kapazität</p>
              <p className="text-sm text-slate-600">Bis zu 3.500 Essen pro Tag</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border bg-white/80 p-3">
            <Info className="mt-0.5 h-4 w-4 text-emerald-600" />
            <div>
              <p className="text-sm font-medium text-slate-900">Highlights</p>
              <p className="text-sm text-slate-600">
                Cafeteria im EG, warmes Aktionsangebot, Lernbereiche außerhalb der Speisezeiten.
              </p>
            </div>
          </div>
          <div className="md:col-span-3">
            <a
              className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
              href="https://www.my-stuwe.de/mensa/mensa-wilhelmstrasse-tuebingen/"
              target="_blank"
              rel="noreferrer"
            >
              Offizielle Infos & Öffnungszeiten →
            </a>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
          <CardContent>
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <div className="group relative w-full overflow-hidden rounded-xl border bg-slate-950 md:w-80">
                <div className="aspect-[3/4] w-full">
                  <img
                    src="/images/waste-watchdog-station.png"
                    alt="IOMS Waste Watchdog Station"
                    className="h-full w-full object-contain p-3"
                  />
                </div>
                <div className="absolute bottom-3 left-3 rounded-md bg-white/90 px-3 py-1 text-xs font-medium text-slate-800 shadow">
                  Live Station • Camera + Scale
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-4">
                <p className="text-sm text-slate-600">
                  Real-time capture with integrated scale, auto-tagging, and POS sync.
                </p>
                <div>
                  <Button asChild>
                    <Link href="/apps-waste-watchdog/hardware/station">
                      Open Station
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
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
          <CardContent>
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <div className="group relative w-full overflow-hidden rounded-xl border bg-slate-950 md:w-80">
                <div className="aspect-[3/4] w-full">
                  <img
                    src="/images/waste-watchdog-line.png"
                    alt="IOMS Waste Watchdog Line"
                    className="h-full w-full object-contain p-3"
                  />
                </div>
                <div className="absolute bottom-3 left-3 rounded-md bg-white/90 px-3 py-1 text-xs font-medium text-slate-800 shadow">
                  Production Line • Vision Only
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-4">
                <p className="text-sm text-slate-600">
                  High-throughput line scanning with AI classification and volume estimates.
                </p>
                <div>
                  <Button asChild variant="outline">
                    <Link href="/apps-waste-watchdog/hardware/line">
                      Open Line
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
