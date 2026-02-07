"use client";

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
              <p className="text-[#6B7280] text-base font-normal">
                Echtzeit-Überwachung der Service-Linie und Leistungskennzahlen
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-[#6B7280]">
                Zuletzt aktualisiert <span className="font-semibold text-[#1F2933]">{new Date().toLocaleTimeString()}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Service-Linie Section - Most Time-Critical */}
        <div className="mb-6">
          <h2 className="text-lg font-black text-[#2563EB] mb-4 uppercase tracking-wider">Service-Linie</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Live Queue Load */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-all duration-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="text-xs font-black text-[#1F2933] uppercase tracking-wider mb-2">Warteschlangenlast</p>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-right">
                      <p className="text-3xl font-black text-[#1F2933]">{kpiData.liveQueueLoad}</p>
                    </div>
                    <div className="flex-1">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        kpiData.liveQueueLoad < 10 
                          ? 'bg-[#DCFCE7] text-[#166534]' 
                          : kpiData.liveQueueLoad < 20 
                          ? 'bg-[#FEF3C7] text-[#92400E]' 
                          : 'bg-[#FEE2E2] text-[#7F1D1D]'
                      }`}>
                        {queueStatus.label}
                      </span>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden mt-2">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            kpiData.liveQueueLoad < 10 ? 'bg-[#16A34A]' :
                            kpiData.liveQueueLoad < 20 ? 'bg-[#F59E0B]' : 'bg-[#DC2626]'
                          }`}
                          style={{ width: `${Math.min((kpiData.liveQueueLoad / 20) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-gray-100">
                  <Activity className="w-4 h-4 text-[#6B7280]" />
                </div>
              </div>
            </div>

            {/* Average Service Time */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-all duration-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="text-xs font-black text-[#1F2933] uppercase tracking-wider mb-2">Ø Servicezeit (15 min)</p>
                  <div className="mb-3">
                    <div className="flex items-baseline justify-end gap-2 mb-2">
                      <p className="text-3xl font-black text-[#1F2933] text-right">{formatGermanNumber(kpiData.averageServiceTime)}</p>
                      <span className="text-sm font-bold text-[#6B7280]">Sek</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden mb-2">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          kpiData.averageServiceTime <= 18 ? 'bg-[#16A34A]' :
                          kpiData.averageServiceTime <= 25 ? 'bg-[#F59E0B]' : 'bg-[#DC2626]'
                        }`}
                        style={{ width: `${Math.min((kpiData.averageServiceTime / 30) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] text-[#6B7280] font-bold">Ziel: 18-25 Sek</p>
                      <span className={`text-[10px] font-black flex items-center gap-1 px-2 py-0.5 rounded-full ${
                        kpiData.averageServiceTime <= 25 
                          ? 'bg-[#DCFCE7] text-[#166534]' 
                          : 'bg-[#FEE2E2] text-[#7F1D1D]'
                      }`}>
                        {kpiData.averageServiceTime <= 25 
                          ? (() => {
                              const targetMid = 21.5;
                              const diff = kpiData.averageServiceTime - targetMid;
                              const sign = diff >= 0 ? '+' : '';
                              return `Im Ziel (${sign}${formatGermanNumber(Math.abs(diff))} Sek)`;
                            })()
                          : `Über Ziel (+${formatGermanNumber(kpiData.averageServiceTime - 25)} Sek)`
                        }
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-gray-100">
                  <Clock className="w-4 h-4 text-[#6B7280]" />
                </div>
              </div>
            </div>

            {/* Orders Processed Today */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-all duration-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="text-xs font-black text-[#1F2933] uppercase tracking-wider mb-2">Bestellungen heute</p>
                  <div className="mb-3">
                    <p className="text-3xl font-black text-[#1F2933] text-right mb-2">{kpiData.ordersProcessedToday}</p>
                    <div className="pt-3 border-t border-[#E5E7EB]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#6B7280] font-bold">Aktuelle Schicht</span>
                        <span className="text-base font-black text-[#1F2933]">{kpiData.ordersProcessedShift}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-gray-100">
                  <ShoppingCart className="w-4 h-4 text-[#6B7280]" />
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Finanzen Section - Less Urgent */}
        <div className="mb-6">
          <h2 className="text-lg font-black text-[#2563EB] mb-4 uppercase tracking-wider">Finanzen</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Payment Success Rate */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-all duration-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="text-xs font-black text-[#1F2933] uppercase tracking-wider mb-2">Zahlungserfolg</p>
                  <p className="text-3xl font-black text-[#1F2933] text-right mb-3">{formatGermanNumber(kpiData.paymentSuccessRate.overall)}%</p>
                  <div className="space-y-1.5 pt-3 border-t border-[#E5E7EB]">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#6B7280] font-bold">Bargeld</span>
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
