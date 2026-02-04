'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Switch } from '@/shared/components/ui/switch';
import { Separator } from '@/shared/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Globe2,
  Map,
  RefreshCcw,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Link2,
  ArrowUpRight,
} from 'lucide-react';

interface DeliveryPartner {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'syncing';
  ordersToday: number;
  avgPrepTime: string;
  brandColor: string;
}

export default function DeliveryIntegrationsPage() {
  const router = useRouter();
  const [partners, setPartners] = useState<DeliveryPartner[]>([
    {
      id: 'wolt',
      name: 'Wolt',
      description: 'Premium last-mile delivery across major EU cities.',
      status: 'connected',
      ordersToday: 18,
      avgPrepTime: '17m',
      brandColor: '#009DE0',
    },
    {
      id: 'lieferando',
      name: 'Lieferando',
      description: 'Germany’s largest food marketplace.',
      status: 'syncing',
      ordersToday: 12,
      avgPrepTime: '21m',
      brandColor: '#FF8000',
    },
    {
      id: 'ubereats',
      name: 'Uber Eats',
      description: 'On-demand delivery with global reach.',
      status: 'disconnected',
      ordersToday: 0,
      avgPrepTime: '--',
      brandColor: '#06C167',
    },
  ]);

  const [autoAcceptOrders, setAutoAcceptOrders] = useState(true);
  const [syncMenuPricing, setSyncMenuPricing] = useState(true);
  const [notifyKitchenAutomatically, setNotifyKitchenAutomatically] = useState(true);
  const [enableCourierTracking, setEnableCourierTracking] = useState(false);

  const connectedCount = partners.filter((partner) => partner.status === 'connected').length;
  const syncingCount = partners.filter((partner) => partner.status === 'syncing').length;

  const handleStatusToggle = (id: string) => {
    setPartners((prev) =>
      prev.map((partner) =>
        partner.id === id
          ? {
              ...partner,
              status:
                partner.status === 'connected'
                  ? 'disconnected'
                  : partner.status === 'syncing'
                  ? 'connected'
                  : 'connected',
            }
          : partner,
      ),
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/setup')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Setup
          </Button>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Delivery Integrations</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage marketplace partners, sync menus automatically, and accept orders directly inside the POS.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="min-w-[110px] rounded-xl border border-gray-200 px-4 py-3 text-center">
            <p className="text-xs uppercase tracking-wide text-gray-400">Connected</p>
            <p className="text-xl font-semibold text-gray-900 mt-1">{connectedCount}</p>
          </div>
          <div className="min-w-[110px] rounded-xl border border-gray-200 px-4 py-3 text-center">
            <p className="text-xs uppercase tracking-wide text-gray-400">Syncing</p>
            <p className="text-xl font-semibold text-gray-900 mt-1">{syncingCount}</p>
          </div>
          <div className="min-w-[110px] rounded-xl border border-gray-200 px-4 py-3 text-center">
            <p className="text-xs uppercase tracking-wide text-gray-400">Last sync</p>
            <p className="text-sm font-medium text-gray-700 mt-1">5 min ago</p>
          </div>
        </div>
      </div>

      {/* Partner Cards */}
      <div className="space-y-4">
        {partners.map((partner) => (
          <Card
            key={partner.id}
            className="relative overflow-hidden border border-transparent rounded-3xl bg-white shadow-lg shadow-gray-200/40 hover:shadow-2xl transition-all duration-200"
          >
            <div
              className="absolute inset-x-0 top-0 h-1.5"
              style={{ background: `linear-gradient(90deg, ${partner.brandColor}, transparent)` }}
            />
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center">
                    <Globe2 className="h-6 w-6" style={{ color: partner.brandColor }} />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">{partner.name}</CardTitle>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{partner.description}</p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "px-2 py-1 text-xs font-medium border rounded-full",
                    partner.status === 'connected'
                      ? "border-emerald-200 text-emerald-600 bg-emerald-50"
                      : partner.status === 'syncing'
                      ? "border-amber-200 text-amber-600 bg-amber-50"
                      : "border-gray-200 text-gray-500 bg-gray-50"
                  )}
                >
                  {partner.status === 'connected'
                    ? 'Connected'
                    : partner.status === 'syncing'
                    ? 'Syncing'
                    : 'Disconnected'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col flex-1 space-y-4 justify-between">
              <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-gray-500 flex items-center gap-1">
                    <RefreshCcw className="h-3 w-3" />
                    Orders today
                  </p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{partner.ordersToday}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-gray-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Avg. prep time
                  </p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{partner.avgPrepTime}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1 text-xs text-gray-500">
                  <p className="flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    POS sync active
                  </p>
                  <p className="flex items-center gap-1">
                    <Link2 className="h-3 w-3" />
                    Menu + stock updates every 15 min
                  </p>
                </div>
                <Button
                  onClick={() => handleStatusToggle(partner.id)}
                  variant={partner.status === 'disconnected' ? 'default' : 'outline'}
                  className={cn(
                    "text-xs px-3",
                    partner.status === 'disconnected'
                      ? "bg-gray-900 hover:bg-gray-800"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  )}
                >
                  {partner.status === 'disconnected' ? 'Connect Partner' : 'Manage Connection'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Routing & Sync Settings */}
      <Card className="border border-gray-200 rounded-3xl bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Map className="h-5 w-5 text-gray-600" />
            Order routing & sync preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700 p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-4">
              <div>
                <p className="font-medium text-gray-900">Auto-accept incoming orders</p>
                <p className="text-xs text-gray-500">
                  Orders go straight to kitchen queue with smart capacity check.
                </p>
              </div>
              <Switch checked={autoAcceptOrders} onCheckedChange={setAutoAcceptOrders} />
            </div>

            <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-4">
              <div>
                <p className="font-medium text-gray-900">Sync menu & pricing changes</p>
                <p className="text-xs text-gray-500">
                  Push new items, prices, and availability to marketplaces automatically.
                </p>
              </div>
              <Switch checked={syncMenuPricing} onCheckedChange={setSyncMenuPricing} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-4">
              <div>
                <p className="font-medium text-gray-900">Notify kitchen screens automatically</p>
                <p className="text-xs text-gray-500">
                  Push delivery orders to KDS with delivery label and courier ETA.
                </p>
              </div>
              <Switch
                checked={notifyKitchenAutomatically}
                onCheckedChange={setNotifyKitchenAutomatically}
              />
            </div>

            <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-4">
              <div>
                <p className="font-medium text-gray-900">Enable courier tracking for staff</p>
                <p className="text-xs text-gray-500">
                  Show courier location and arrival countdown within POS screens.
                </p>
              </div>
              <Switch checked={enableCourierTracking} onCheckedChange={setEnableCourierTracking} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          Need a custom integration?{' '}
          <button className="text-gray-900 underline" onClick={() => router.push('/contact')}>
            Talk to the integration team
          </button>
        </div>
        <Button variant="outline" className="text-sm border-gray-200 text-gray-600 hover:border-gray-300">
          View Marketplace Analytics
          <ArrowUpRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

