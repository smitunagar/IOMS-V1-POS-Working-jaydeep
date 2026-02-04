'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Package, Boxes, UtensilsCrossed, BarChart3, Barcode } from 'lucide-react';

interface Subsection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  route: string;
}

const inventorySubsections: Subsection[] = [
  {
    id: 'stock',
    title: 'Inventory Stock',
    description: 'Manage your inventory items',
    icon: Boxes,
    route: '/inventory',
  },
  {
    id: 'availability',
    title: 'Serving Availability',
    description: 'Control menu item availability',
    icon: UtensilsCrossed,
    route: '/serving-availability',
  },
  {
    id: 'analytics',
    title: 'Inventory Analytics',
    description: 'Track inventory trends',
    icon: BarChart3,
    route: '/inventory-analytics',
  },
  {
    id: 'scanner',
    title: 'Barcode Scanner',
    description: 'Scan items quickly',
    icon: Barcode,
    route: '/barcode-scanner',
  },
];

export default function InventoryHubPage() {
  const router = useRouter();
  const [activeSubsection, setActiveSubsection] = useState<string>('stock');

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Inventory</h1>
        <p className="text-gray-600">Manage stock, availability, and analytics</p>
      </div>

      {/* Subsection Cards */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {inventorySubsections.map((subsection) => {
          const Icon = subsection.icon;
          const isActive = activeSubsection === subsection.id;

          return (
            <Card
              key={subsection.id}
              className={`cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                isActive
                  ? 'ring-2 ring-green-500 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100'
                  : 'shadow-sm bg-gradient-to-br from-gray-50 to-gray-100'
              }`}
              onClick={() => setActiveSubsection(subsection.id)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className={`p-3 rounded-xl shadow-md ${
                    isActive ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <Icon className={`h-6 w-6 ${
                      isActive ? 'text-green-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div>
                    <div className={`tracking-tight text-base font-bold ${
                      isActive ? 'text-green-800' : 'text-gray-800'
                    }`}>
                      {subsection.title}
                    </div>
                    {subsection.description && (
                      <p className="text-xs text-gray-600 mt-1">{subsection.description}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Active Section Content */}
      <div className="mt-8">
        {inventorySubsections.map((subsection) => {
          if (activeSubsection !== subsection.id) return null;
          
          const Icon = subsection.icon;
          
          return (
            <div key={subsection.id} className="text-center py-12">
              <Icon className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{subsection.title}</h3>
              <p className="text-gray-600 mb-4">{subsection.description}</p>
              <button
                onClick={() => router.push(subsection.route)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Go to {subsection.title}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

