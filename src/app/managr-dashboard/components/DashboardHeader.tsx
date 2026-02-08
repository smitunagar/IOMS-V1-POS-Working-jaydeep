import React from 'react';
import { ChevronDown } from 'lucide-react';

export const DashboardHeader: React.FC = () => {
  return (
    <div className="flex flex-col w-full">
      {/* Top Dark Header */}
      <div className="bg-[#133E28] text-white px-6 py-4 flex items-center justify-between">
        <div className="bg-white rounded-xl px-3 py-2 shadow-sm">
          <img
            src="/images/Logo-Horizontal-Studierendenwerk-Tuebingen-Hohenheim.webp"
            alt="Studierendenwerk logo"
            className="h-8 w-auto"
          />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-semibold tracking-wide">Line Manager Dashboard</h1>
          <p className="text-xs text-[#a6c9b2]">Live operational intelligence for daily service</p>
        </div>
        <div className="bg-white rounded-xl px-3 py-2 shadow-sm">
          <img src="/images/Logo.svg" alt="Managr logo" className="h-8 w-auto" />
        </div>
      </div>
      
      {/* Sub Header Location Bar - Overlapping logic handled in parent or here visually */}
      <div className="bg-[#18452e] px-6 pb-4">
         <div className="flex items-center text-white font-medium cursor-pointer w-fit hover:opacity-90">
            <span className="text-lg mr-2">Mensa Wilhelmstraße</span>
            <ChevronDown size={20} />
         </div>
      </div>

      {/* Control Bar */}
      <div className="bg-[#f1f3f2] px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-white px-4 py-2 rounded-lg text-gray-700 shadow-sm font-medium">
                <span>Tue 12:30</span>
                <span className="ml-3 text-gray-500 text-sm">Feb 8, 2026</span>
              </div>
            </div>

            <div className="bg-[#4da167] text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-sm">
                <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                <span className="font-medium text-sm">Normal Operation</span>
            </div>
        </div>
      </div>
    </div>
  );
};
