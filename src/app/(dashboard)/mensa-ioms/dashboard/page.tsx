"use client";

import ManagrDashboard from "@/app/managr-dashboard/App";

export default function MensaIOMSDashboardPage() {
  return <ManagrDashboard />;
}
/* Legacy dashboard removed

import { AppLayout } from "@/shared/components/layout/AppLayout";
import { useState, useEffect } from "react";
import {
  ShoppingCart,
  UtensilsCrossed,
  Clock,
  CheckCircle2,
  CreditCard,
  Wallet,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Package,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  "use client";

  import ManagrDashboard from "@/app/managr-dashboard/App";

  export default function MensaIOMSDashboardPage() {
    return <ManagrDashboard />;
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#F5F5F7] p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-semibold text-[#1F2933] mb-2 tracking-tight">
                Betriebs-Dashboard
              </h1>
              "use client";

              import ManagrDashboard from "@/app/managr-dashboard/App";

              export default function MensaIOMSDashboardPage() {
                return <ManagrDashboard />;
              }
                      <span className="text-xs font-black text-[#1F2933]">{formatGermanNumber(kpiData.paymentSuccessRate.cash)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#6B7280] font-bold">Karte</span>
                      <span className="text-xs font-black text-[#1F2933]">{formatGermanNumber(kpiData.paymentSuccessRate.card)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#6B7280] font-bold">Campus-Karte</span>
                      <span className="text-xs font-black text-[#1F2933]">{formatGermanNumber(kpiData.paymentSuccessRate.campusCard)}%</span>
                    </div>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-gray-100">
                  <CreditCard className="w-4 h-4 text-[#6B7280]" />
                </div>
              </div>
            </div>

            {/* Live Cash Drawer Balance */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-all duration-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="text-xs font-black text-[#1F2933] uppercase tracking-wider mb-2">Aktueller Kassenbestand</p>
                  <p className="text-3xl font-black text-[#1F2933] text-right">€{formatGermanNumber(kpiData.cashDrawerBalance, 2)}</p>
                </div>
                <div className="p-2 rounded-lg bg-gray-100">
                  <Wallet className="w-4 h-4 text-[#6B7280]" />
                </div>
              </div>
            </div>

            {/* Refunds Today */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-all duration-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="text-xs font-black text-[#1F2933] uppercase tracking-wider mb-2">Rückerstattungen</p>
                  <p className="text-3xl font-black text-[#1F2933] text-right">{kpiData.refundsToday}</p>
                </div>
                <div className="p-2 rounded-lg bg-gray-100">
                  <XCircle className="w-4 h-4 text-[#6B7280]" />
                </div>
              </div>
            </div>

            {/* Voids Today */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-all duration-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="text-xs font-black text-[#1F2933] uppercase tracking-wider mb-2">Stornierungen</p>
                  <p className="text-3xl font-black text-[#1F2933] text-right">{kpiData.voidsToday}</p>
                </div>
                <div className="p-2 rounded-lg bg-gray-100">
                  <AlertCircle className="w-4 h-4 text-[#6B7280]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Produkte & Lagerbestand */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Items */}
          <div>
            <h2 className="text-lg font-black text-[#2563EB] mb-4 uppercase tracking-wider">Produkte</h2>
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
              <div className="space-y-2">
                {kpiData.topSellingItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-[#E5E7EB] hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-black text-[#1F2933]">{idx + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm text-[#1F2933] truncate">{item.name}</p>
                        <p className="text-xs text-[#6B7280] font-bold">{item.sales} verkauft</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-black ${
                      item.trend === 'up' ? 'bg-[#DCFCE7] text-[#166534] border border-[#16A34A]/30' :
                      item.trend === 'down' ? 'bg-[#FEE2E2] text-[#7F1D1D] border border-[#DC2626]/30' :
                      'bg-gray-100 text-[#6B7280] border border-[#E5E7EB]'
                    }`}>
                      {getTrendIcon(item.trend)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stockout Alerts */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-[#2563EB] uppercase tracking-wider">Lagerbestand</h2>
              <span className="text-xs font-bold text-[#DC2626]">
                {kpiData.stockoutAlerts.filter(a => a.status === 'critical').length} Artikel im kritischen Bereich
              </span>
            </div>
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
              <div className="space-y-3">
                {[...kpiData.stockoutAlerts]
                  .sort((a, b) => {
                    // Sort by severity first (critical first), then by remaining portions
                    if (a.status === 'critical' && b.status !== 'critical') return -1;
                    if (a.status !== 'critical' && b.status === 'critical') return 1;
                    return a.remaining - b.remaining;
                  })
                  .map((alert, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-[#E5E7EB] hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-2 rounded-lg ${
                        alert.status === 'critical' ? 'bg-[#FEE2E2]' : 'bg-[#FEF3C7]'
                      }`}>
                        <AlertTriangle className={`w-5 h-5 ${
                          alert.status === 'critical' ? 'text-[#DC2626]' : 'text-[#F59E0B]'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-base text-[#1F2933] mb-1">{alert.item}</p>
                        <p className="text-2xl font-black text-[#1F2933]">{alert.remaining}</p>
                        <p className="text-xs text-[#6B7280] font-bold">Portionen verbleibend</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                        alert.status === 'critical' 
                          ? 'bg-[#FEE2E2] text-[#7F1D1D]' 
                          : 'bg-[#FEF3C7] text-[#92400E]'
                      }`}>
                        <AlertTriangle className={`w-3 h-3 ${
                          alert.status === 'critical' ? 'text-[#DC2626]' : 'text-[#F59E0B]'
                        }`} />
                        {alert.status === 'critical' ? 'KRITISCH' : 'NIEDRIG'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
