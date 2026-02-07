import React from 'react';
import { Card } from './ui/Card';
import { ArrowUp } from 'lucide-react';

export const WasteSnapshotSmall: React.FC = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 ml-1">Yesterday Waste Snapshot</h3>
      <div className="grid grid-cols-3 gap-3">
        {/* Card 1 */}
        <div className="bg-[#133E28] rounded-xl p-4 text-white flex flex-col justify-between shadow-sm">
            <div>
                <p className="text-xs opacity-80 mb-1">Plate Waste:</p>
                <p className="text-2xl font-bold">32 kg</p>
            </div>
            <div className="mt-2 flex items-center text-xs font-medium text-[#4da167]">
                <ArrowUp size={12} strokeWidth={3} className="mr-0.5" />
                <span>+8%</span>
            </div>
            <p className="text-[10px] opacity-60 mt-2">From Last week</p>
        </div>

        {/* Card 2 */}
        <div className="bg-[#7fb58c] rounded-xl p-4 text-white flex flex-col justify-between shadow-sm">
            <div>
                <p className="text-xs opacity-90 mb-1">Prep Waste:</p>
                <p className="text-2xl font-bold">18 kg</p>
            </div>
            <div className="mt-2 flex items-center text-xs font-medium text-white">
                <ArrowUp size={12} strokeWidth={3} className="mr-0.5" />
                <span>+4%</span>
            </div>
            <p className="text-[10px] opacity-70 mt-2">From Last week</p>
        </div>

        {/* Card 3 */}
        <div className="bg-[#c53030] rounded-xl p-4 text-white flex flex-col justify-between shadow-sm">
             <div>
                <p className="text-xs opacity-90 mb-1">Unsold Food:</p>
                <p className="text-2xl font-bold">25 kg</p>
            </div>
            <div className="mt-2 flex items-center text-xs font-medium text-white">
                <ArrowUp size={12} strokeWidth={3} className="mr-0.5" />
                <span>+23%</span>
            </div>
            <p className="text-[10px] opacity-70 mt-2">From Last week</p>
        </div>
      </div>
    </div>
  );
};
