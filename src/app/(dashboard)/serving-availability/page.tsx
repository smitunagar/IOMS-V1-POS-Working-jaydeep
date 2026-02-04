'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  Clock,
  Calendar,
  UtensilsCrossed,
  AlertCircle,
  ShieldCheck,
  Info,
  ChefHat,
  CheckCircle,
  Download,
  Printer,
  Leaf,
} from 'lucide-react';

export default function ServingAvailabilityPage() {
  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    // In a real implementation, this would generate a PDF
    // For now, we'll use the browser's print to PDF functionality
    window.print();
  };

  // Get today's date info for snapshot
  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const isFriday = dayName === 'Friday';
  const isSunday = dayName === 'Sunday';

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 print:p-4">
      {/* Page Header */}
      <div className="mb-6 flex items-start justify-between print:mb-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Serving Availability</h1>
          <p className="text-[#475569] text-sm">
            Use this as a reference when planning menus and communicating with guests
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="border-[rgba(27,31,59,0.1)] text-[#475569] hover:bg-[rgba(27,31,59,0.05)]"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            className="border-[rgba(27,31,59,0.1)] text-[#475569] hover:bg-[rgba(27,31,59,0.05)]"
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Info Block */}
      <Card className="bg-[#E0F2F1] border border-[#2A9D8F]/20 print:bg-white print:border-[rgba(27,31,59,0.1)]">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-[#2A9D8F] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#475569]">
              <strong className="text-[#0F172A]">Note:</strong> This page contains static reference information, not live availability. Use for staff training and daily briefing.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Today's Snapshot */}
      <Card className="bg-white border border-[rgba(27,31,59,0.05)] shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-[#0F172A] flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#2A9D8F]" />
            Today's Snapshot ({dayName})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-[#E0F2F1] text-[#2A9D8F] border-[#2A9D8F]">Lunch + Dinner</Badge>
            {isFriday && <Badge className="bg-[rgba(230,57,70,0.1)] text-[#E63946] border-[#E63946]">No hot meals</Badge>}
            {isSunday && <Badge className="bg-[#E0F2F1] text-[#2A9D8F] border-[#2A9D8F]">Sunday Brunch</Badge>}
            <Badge className="bg-[#E0F2F1] text-[#2A9D8F] border-[#2A9D8F]">Vegetarian-Only Day</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Meal Periods & Times */}
      <Card className="bg-white border border-[rgba(27,31,59,0.05)] shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#E0F2F1] text-[#2A9D8F] flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl text-[#0F172A]">Meal Periods & Times</CardTitle>
              <p className="text-sm text-[#64748B] mt-1">Standard serving times for each meal period</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[rgba(27,31,59,0.1)]">
                  <th className="text-left py-3 px-4 font-semibold text-[#0F172A]">Meal Period</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#0F172A]">Time</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#0F172A]">Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[rgba(27,31,59,0.05)]">
                  <td className="py-3 px-4 font-medium text-[#0F172A]">Breakfast</td>
                  <td className="py-3 px-4 text-[#475569]">7:30 – 10:00</td>
                  <td className="py-3 px-4 text-[#64748B] text-sm">Standard breakfast menu</td>
                </tr>
                <tr className="border-b border-[rgba(27,31,59,0.05)]">
                  <td className="py-3 px-4 font-medium text-[#0F172A]">Lunch</td>
                  <td className="py-3 px-4 text-[#475569]">11:30 – 14:00</td>
                  <td className="py-3 px-4 text-[#64748B] text-sm">Full menu available</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-[#0F172A]">Dinner</td>
                  <td className="py-3 px-4 text-[#475569]">17:30 – 21:30</td>
                  <td className="py-3 px-4 text-[#64748B] text-sm">Full menu available</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6">
            <h3 className="text-base font-semibold text-[#0F172A] mb-3">Days of Operation & Patterns</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[rgba(27,31,59,0.1)]">
                    <th className="text-left py-3 px-4 font-semibold text-[#0F172A]">Day / Pattern</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#0F172A]">Rule</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#0F172A]">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#0F172A]">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[rgba(27,31,59,0.05)]">
                    <td className="py-3 px-4 font-medium text-[#0F172A]">Fridays</td>
                    <td className="py-3 px-4 text-[#475569]">No hot meals</td>
                    <td className="py-3 px-4">
                      <Badge className="bg-[#E0F2F1] text-[#2A9D8F] border-[#2A9D8F]">Active</Badge>
                    </td>
                    <td className="py-3 px-4 text-[#64748B] text-sm">Cold meals only</td>
                  </tr>
                  <tr className="border-b border-[rgba(27,31,59,0.05)]">
                    <td className="py-3 px-4 font-medium text-[#0F172A]">Vegetarian-Only Days</td>
                    <td className="py-3 px-4 text-[#475569]">Vegetarian menu only</td>
                    <td className="py-3 px-4">
                      <Badge className="bg-[#E0F2F1] text-[#2A9D8F] border-[#2A9D8F]">Active</Badge>
                    </td>
                    <td className="py-3 px-4 text-[#64748B] text-sm">Specific days designated</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-[#0F172A]">Sunday Brunch</td>
                    <td className="py-3 px-4 text-[#475569]">Special brunch menu</td>
                    <td className="py-3 px-4">
                      <Badge className="bg-[#E0F2F1] text-[#2A9D8F] border-[#2A9D8F]">Active</Badge>
                    </td>
                    <td className="py-3 px-4 text-[#64748B] text-sm">Available on Sundays</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portion Sizes */}
      <Card className="bg-white border border-[rgba(27,31,59,0.05)] shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#E0F2F1] text-[#2A9D8F] flex items-center justify-center">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl text-[#0F172A]">Portion Sizes</CardTitle>
              <p className="text-sm text-[#64748B] mt-1">Standard portion sizes and menu rotation information</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[rgba(27,31,59,0.1)]">
                  <th className="text-left py-3 px-4 font-semibold text-[#0F172A]">Portion Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#0F172A]">Description</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#0F172A]">Multiple Servings</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[rgba(27,31,59,0.05)]">
                  <td className="py-3 px-4 font-medium text-[#0F172A]">Regular</td>
                  <td className="py-3 px-4 text-[#475569]">Standard serving size for adult guests</td>
                  <td className="py-3 px-4 text-[#64748B] text-sm">Allowed</td>
                </tr>
                <tr className="border-b border-[rgba(27,31,59,0.05)]">
                  <td className="py-3 px-4 font-medium text-[#0F172A]">Small</td>
                  <td className="py-3 px-4 text-[#475569]">Reduced serving size option</td>
                  <td className="py-3 px-4 text-[#64748B] text-sm">Allowed</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-[#0F172A]">Children's</td>
                  <td className="py-3 px-4 text-[#475569]">Specially sized for younger guests</td>
                  <td className="py-3 px-4 text-[#64748B] text-sm">One per child</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6">
            <h3 className="text-base font-semibold text-[#0F172A] mb-3">Menu Rotation</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[rgba(27,31,59,0.1)]">
                    <th className="text-left py-3 px-4 font-semibold text-[#0F172A]">Rotation Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#0F172A]">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[rgba(27,31,59,0.05)]">
                    <td className="py-3 px-4 font-medium text-[#0F172A]">Weekly Cycle</td>
                    <td className="py-3 px-4 text-[#475569]">Menu items rotate on a weekly schedule</td>
                  </tr>
                  <tr className="border-b border-[rgba(27,31,59,0.05)]">
                    <td className="py-3 px-4 font-medium text-[#0F172A]">Seasonal</td>
                    <td className="py-3 px-4 text-[#475569]">Menu changes based on seasonal availability</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-[#0F172A]">Themed Weeks</td>
                    <td className="py-3 px-4 text-[#475569]">Special themed menu weeks throughout the year</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operational Rules */}
      <Card className="bg-white border border-[rgba(27,31,59,0.05)] shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#E0F2F1] text-[#2A9D8F] flex items-center justify-center">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl text-[#0F172A]">Operational Rules</CardTitle>
              <p className="text-sm text-[#64748B] mt-1">Limits, policies, and service guidelines</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-[#0F172A] mb-3">Key Operational Rules</h3>
              <dl className="space-y-3">
                <div className="flex items-start gap-3 pb-3 border-b border-[rgba(27,31,59,0.05)]">
                  <dt className="font-semibold text-[#0F172A] min-w-[180px]">Max portions per service:</dt>
                  <dd className="text-[#475569]">20 portions for special dishes (e.g., lunch special)</dd>
                </div>
                <div className="flex items-start gap-3 pb-3 border-b border-[rgba(27,31,59,0.05)]">
                  <dt className="font-semibold text-[#0F172A] min-w-[180px]">Last order time:</dt>
                  <dd className="text-[#475569]">Breakfast: 9:45 | Lunch: 13:45 | Dinner: 21:15</dd>
                </div>
                <div className="flex items-start gap-3 pb-3 border-b border-[rgba(27,31,59,0.05)]">
                  <dt className="font-semibold text-[#0F172A] min-w-[180px]">Buffer times:</dt>
                  <dd className="text-[#475569]">30 minutes between breakfast-lunch, 3.5 hours between lunch-dinner</dd>
                </div>
                <div className="flex items-start gap-3">
                  <dt className="font-semibold text-[#0F172A] min-w-[180px]">Walk-in policy:</dt>
                  <dd className="text-[#475569]">Accepted if capacity allows, subject to availability</dd>
                </div>
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diet & DGE Guidelines */}
      <Card className="bg-white border border-[rgba(27,31,59,0.05)] shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#E0F2F1] text-[#2A9D8F] flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl text-[#0F172A]">Diet & DGE Guidelines</CardTitle>
              <p className="text-sm text-[#64748B] mt-1">Guaranteed availability and allergen rules</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-[#0F172A] mb-4">Guaranteed Daily Availability</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-[#E0F2F1] rounded-lg border border-[#2A9D8F]/20">
                  <ShieldCheck className="h-5 w-5 text-[#2A9D8F] flex-shrink-0 mt-0.5" />
                  <p className="text-[#0F172A] font-medium">
                    Vegetarian main always available at lunch and dinner
                  </p>
                </div>
                <div className="flex items-start gap-3 p-4 bg-[#E0F2F1] rounded-lg border border-[#2A9D8F]/20">
                  <ShieldCheck className="h-5 w-5 text-[#2A9D8F] flex-shrink-0 mt-0.5" />
                  <p className="text-[#0F172A] font-medium">
                    At least one DGE-compliant menu option always available per service
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-semibold text-[#0F172A] mb-4">Allergen and Substitution Rules</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-white border border-[rgba(27,31,59,0.1)] rounded-lg">
                  <Leaf className="h-5 w-5 text-[#2A9D8F] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[#0F172A] font-medium">Gluten-free alternatives</p>
                    <p className="text-sm text-[#64748B] mt-1">Only available at lunch service</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white border border-[rgba(27,31,59,0.1)] rounded-lg">
                  <Info className="h-5 w-5 text-[#2A9D8F] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[#0F172A] font-medium">Substitution policies</p>
                    <p className="text-sm text-[#64748B] mt-1">Standing rules influence when dishes can be served</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          .print\\:p-4 {
            padding: 1rem !important;
          }
          .print\\:mb-4 {
            margin-bottom: 1rem !important;
          }
          .print\\:bg-white {
            background-color: white !important;
          }
          .print\\:border-\\[rgba\\(27\\,31\\,59\\,0\\.1\\)\\] {
            border-color: rgba(27, 31, 59, 0.1) !important;
          }
          button {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
}
