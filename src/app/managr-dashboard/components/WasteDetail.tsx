import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

type WasteDetailRow = {
    label: string;
    valueKg: number;
    deltaPct: number;
    accentColor: string;
    panelColor: string;
    textColor: string;
    dotColor: string;
};

type WasteDetailTrend = {
    day: string;
    value: number;
    color: string;
};

type WasteDetailProps = {
    rows?: WasteDetailRow[];
    weeklyTrend?: WasteDetailTrend[];
};

const defaultRows: WasteDetailRow[] = [
    { label: 'Plate Waste', valueKg: 32, deltaPct: 8, accentColor: '#4da167', panelColor: '#2d5a3f', textColor: '#ffffff', dotColor: '#2d5a3f' },
    { label: 'Prep Waste', valueKg: 18, deltaPct: 4, accentColor: '#133E28', panelColor: '#fcd34d', textColor: '#133E28', dotColor: '#4da167' },
    { label: 'Unsold Food', valueKg: 25, deltaPct: 12, accentColor: '#fee2e2', panelColor: '#ef4444', textColor: '#ffffff', dotColor: '#ef4444' },
];

const defaultTrend: WasteDetailTrend[] = [
    { day: 'M', value: 28, color: '#a7d6a9' },
    { day: 'T', value: 34, color: '#a7d6a9' },
    { day: 'W', value: 22, color: '#fcd34d' },
    { day: 'T', value: 40, color: '#a7d6a9' },
    { day: 'F', value: 30, color: '#a7d6a9' },
    { day: 'S', value: 26, color: '#a7d6a9' },
    { day: 'S', value: 44, color: '#2d6a4f' },
];

export const WasteDetail: React.FC<WasteDetailProps> = ({ rows = defaultRows, weeklyTrend = defaultTrend }) => {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Waste breakdown</h3>
                <div className="space-y-3">
                    {rows.map((row) => {
                        const isPositive = row.deltaPct >= 0;
                        const DeltaIcon = isPositive ? ArrowUp : ArrowDown;
                        return (
                            <div key={row.label} className="bg-[#fcfdfd] border border-gray-100 rounded-lg p-0 flex overflow-hidden shadow-sm">
                                <div className="w-32 p-4 flex flex-col justify-center" style={{ backgroundColor: row.panelColor, color: row.textColor }}>
                                    <p className="font-medium text-sm">{row.label}:</p>
                                    <div className="flex items-center text-xs mt-1 font-medium" style={{ color: row.accentColor }}>
                                        <DeltaIcon size={12} strokeWidth={3} className="mr-0.5" />
                                        <span>{isPositive ? '+' : ''}{row.deltaPct}%</span>
                                    </div>
                                </div>
                                <div className="flex-1 p-3 flex items-center justify-between bg-[#fcfdfd]">
                                    <div>
                                        <span className="text-xl font-bold text-gray-800">{row.valueKg} kg</span>
                                        <div className="h-2 w-2 rounded-full inline-block ml-3 align-middle" style={{ backgroundColor: row.dotColor }}></div>
                                    </div>
                                    <div className="text-[10px] text-gray-400 flex items-center">
                                        <span className="text-gray-300 mr-1">▲</span> Week trend
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Waste change vs last week</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {rows.map((row) => {
                        const isImprovement = row.deltaPct < 0;
                        const arrow = isImprovement ? '↓' : '↑';
                        const color = isImprovement
                            ? 'text-[#2d5a3f]'
                            : row.deltaPct >= 10
                            ? 'text-[#b91c1c]'
                            : 'text-[#b45309]';
                        return (
                            <div key={row.label} className="bg-white rounded-lg border border-gray-100 px-3 py-2">
                                <p className="text-[10px] uppercase tracking-wide text-gray-400">{row.label}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span
                                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-semibold ${
                                            isImprovement
                                                ? 'bg-[#e5f5ec] text-[#2d5a3f]'
                                                : row.deltaPct >= 10
                                                ? 'bg-[#fee2e2] text-[#b91c1c]'
                                                : 'bg-[#fef3c7] text-[#b45309]'
                                        }`}
                                    >
                                        {arrow}
                                    </span>
                                    <p className={`text-sm font-semibold ${color}`}>{Math.abs(row.deltaPct)}%</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
