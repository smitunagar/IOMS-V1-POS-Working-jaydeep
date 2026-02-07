import React from 'react';
import { ChevronDown, Bell, Package } from 'lucide-react';

export const DashboardHeader: React.FC = () => {
  return (
    <div className="flex flex-col w-full">
      {/* Top Dark Header */}
      <div className="bg-[#133E28] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-[#8ecca3] p-1.5 rounded-md text-[#133E28]">
              <Package size={24} strokeWidth={2.5} />
            </div>
            <h1 className="text-xl font-semibold tracking-wide">Managr Dashboard</h1>
          </div>
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
                <button className="bg-[#133E28] text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm hover:bg-[#1a4d38] transition-colors">
                    <Package size={18} />
                    <span>Site Name</span>
                    <ChevronDown size={16} className="ml-1 opacity-70" />
                </button>
                
                <div className="flex items-center bg-white px-4 py-2 rounded-lg text-gray-700 shadow-sm font-medium">
                    <span>Tue 12:30</span>
                    <Bell size={18} className="ml-3 text-gray-400 fill-current" />
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
