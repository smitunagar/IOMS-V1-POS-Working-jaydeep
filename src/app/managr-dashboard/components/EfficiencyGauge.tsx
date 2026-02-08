import React from 'react';
import { Card } from './ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { AlertTriangle, TrendingDown, TrendingUp, Target } from 'lucide-react';

type EfficiencyGaugeProps = {
    percent?: number;
    surplusLabel?: string;
    riskTitle?: string;
    riskAction?: string;
    stats?: { label: string; value: string }[];
    paceStatus?: 'good' | 'watch' | 'risk';
    topOverproduced?: string;
};

export const EfficiencyGauge: React.FC<EfficiencyGaugeProps> = ({
    percent = 62,
    surplusLabel = '+5% surplus',
    riskTitle = 'Risk of overproduction in Pasta Veg',
    riskAction = 'Reduce next batch by ~15 portions',
    stats = [
        { label: 'Total waste', value: '75 kg' },
        { label: 'Cost impact', value: '€1,240' },
        { label: 'CO₂e', value: '0.42 t' },
    ],
    paceStatus,
    topOverproduced = 'Soup',
}) => {
    const clampedPercent = Math.max(0, Math.min(100, percent));
    const derivedPaceStatus: 'good' | 'watch' | 'risk' = paceStatus
        ? paceStatus
        : clampedPercent >= 70
        ? 'good'
        : clampedPercent >= 55
        ? 'watch'
        : 'risk';
    const paceColor =
        derivedPaceStatus === 'good'
            ? 'text-[#2d5a3f]'
            : derivedPaceStatus === 'watch'
            ? 'text-[#b45309]'
            : 'text-[#b91c1c]';
    const data = [
        { name: 'Value', value: clampedPercent, color: '#2d5a3f' },
        { name: 'Remaining', value: 100 - clampedPercent, color: '#e5e7eb' },
    ];
    const PaceIcon = derivedPaceStatus === 'good' ? TrendingUp : derivedPaceStatus === 'watch' ? Target : TrendingDown;
    const paceBg =
        derivedPaceStatus === 'good'
            ? 'bg-[#e5f5ec]'
            : derivedPaceStatus === 'watch'
            ? 'bg-[#fef3c7]'
            : 'bg-[#fee2e2]';
  return (
    <Card className="flex flex-col h-full bg-[#f9fafb]" padding="p-0">
        <div className="bg-white p-5 rounded-t-xl border-b border-gray-50 flex-1 flex flex-col items-center justify-center relative">
             <div className="w-48 h-24 relative mt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cy="100%"
                            innerRadius="80%"
                            outerRadius="100%"
                            startAngle={180}
                            endAngle={0}
                            paddingAngle={0}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                {/* Needle / Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center translate-y-8">
                                        <span className="text-3xl font-bold text-gray-800 leading-none">{clampedPercent}%</span>
                </div>
             </div>
                         <div className="mt-4 flex flex-col items-center gap-2">
                                 <p className="text-xs uppercase tracking-wide text-gray-400">Pace vs Expectation</p>
                                 <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${paceBg}`}>
                                     <PaceIcon size={14} className={paceColor} />
                                     <span className={`text-sm font-semibold ${paceColor}`}>On pace to finish: {surplusLabel}</span>
                                 </div>
                         </div>
                         <div className="grid grid-cols-3 gap-3 mt-6 w-full">
                                {stats.map((stat) => (
                                    <div key={stat.label} className="bg-[#f8faf9] border border-[#e3efe7] rounded-lg px-3 py-2 text-center">
                                        <p className="text-[10px] uppercase tracking-wide text-gray-400">{stat.label}</p>
                                        <p className="text-sm font-semibold text-gray-900">{stat.value}</p>
                                    </div>
                                ))}
                         </div>
                         <div className="mt-4">
                             <div className="inline-flex items-center gap-2 rounded-full bg-[#f3f4f6] px-3 py-1 text-xs text-gray-600">
                                 <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
                                 Top overprod: <span className="font-semibold text-gray-800">{topOverproduced}</span>
                             </div>
                         </div>
        </div>
        
        <div className="bg-[#fff9e6] p-5 rounded-b-xl">
             <div className="flex items-start gap-2">
                <AlertTriangle size={18} className="text-[#d97706] mt-0.5 shrink-0" fill="#d97706" textAnchor="middle" color="white" />
                <div>
                                        <p className="text-sm font-semibold text-gray-900 mb-1">{riskTitle}</p>
                                        <p className="text-sm text-gray-700">{riskAction}</p>
                </div>
             </div>
        </div>
    </Card>
  );
};
