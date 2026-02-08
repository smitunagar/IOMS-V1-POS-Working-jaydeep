import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

type WasteSnapshotItem = {
  label: string;
  valueKg: number;
  deltaPct: number;
  bgColor: string;
  deltaColor: string;
};

type WasteSnapshotSmallProps = {
  items?: WasteSnapshotItem[];
  reflection?: {
    label: string;
    valueKg: number;
    deltaPct: number;
  };
};

const defaultItems: WasteSnapshotItem[] = [
  { label: 'Plate Waste', valueKg: 32, deltaPct: 8, bgColor: '#133E28', deltaColor: '#4da167' },
  { label: 'Prep Waste', valueKg: 18, deltaPct: 4, bgColor: '#7fb58c', deltaColor: '#ffffff' },
  { label: 'Unsold Food', valueKg: 25, deltaPct: 23, bgColor: '#c53030', deltaColor: '#fee2e2' },
];

export const WasteSnapshotSmall: React.FC<WasteSnapshotSmallProps> = ({ items = defaultItems, reflection }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 ml-1">Waste KPIs</h3>
        <span className="text-xs text-gray-400">Yesterday – reflection only</span>
      </div>
      {reflection && (
        <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-400">{reflection.label}</p>
            <p className="text-lg font-semibold text-gray-900">{reflection.valueKg} kg</p>
            <p className="text-[10px] text-gray-400">Customer plate waste</p>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-sm font-semibold ${
              reflection.deltaPct < 0
                ? 'bg-[#e5f5ec] text-[#2d5a3f]'
                : reflection.deltaPct >= 10
                ? 'bg-[#fee2e2] text-[#b91c1c]'
                : 'bg-[#fef3c7] text-[#b45309]'
            }`}
          >
            {reflection.deltaPct < 0 ? '↓' : '↑'} {Math.abs(reflection.deltaPct)}%
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {items.map((item) => {
          const isPositive = item.deltaPct >= 0;
          const DeltaIcon = isPositive ? ArrowUp : ArrowDown;
          return (
            <div
              key={item.label}
              className="rounded-xl p-4 text-white flex flex-col justify-between shadow-sm"
              style={{ backgroundColor: item.bgColor }}
            >
              <div>
                <p className="text-xs opacity-80 mb-1">{item.label}:</p>
                <p className="text-2xl font-bold">{item.valueKg} kg</p>
              </div>
              <div className="mt-2 flex items-center text-xs font-medium" style={{ color: item.deltaColor }}>
                <DeltaIcon size={12} strokeWidth={3} className="mr-0.5" />
                <span>{isPositive ? '+' : ''}{item.deltaPct}%</span>
              </div>
              <p className="text-[10px] opacity-70 mt-2">vs previous period</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
