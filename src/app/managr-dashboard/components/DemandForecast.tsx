import React from 'react';
import { CloudRain, Info } from 'lucide-react';
import { Card } from './ui/Card';

type FoodType = 'all' | 'vegan' | 'vegetarian' | 'non-vegetarian';

type DemandForecastProps = {
  foodType: FoodType;
  onFoodTypeChange?: (value: FoodType) => void;
};

export const DemandForecast: React.FC<DemandForecastProps> = ({ foodType, onFoodTypeChange }) => {
  const foodTypeOptions: { value: FoodType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'non-vegetarian', label: 'Non-Veg' },
  ];
  const scheduledOrdersByType = {
    all: 640,
    vegan: 180,
    vegetarian: 220,
    'non-vegetarian': 240,
  };
  const walkInsByType = {
    all: 210,
    vegan: 70,
    vegetarian: 80,
    'non-vegetarian': 90,
  };
  const totalForecastByType = {
    all: 850,
    vegan: 250,
    vegetarian: 300,
    'non-vegetarian': 330,
  };
  const uncertaintyByType = {
    all: 50,
    vegan: 20,
    vegetarian: 25,
    'non-vegetarian': 30,
  };

  const scheduledOrders = scheduledOrdersByType[foodType];
  const walkIns = walkInsByType[foodType];
  const totalForecast = totalForecastByType[foodType];
  const uncertaintyRange = uncertaintyByType[foodType];
  const isHighUncertainty = uncertaintyRange >= 60;
  const timeSlotData = [
    { time: '11:30', value: 40, status: 'normal' },
    { time: '12:00', value: 50, status: 'normal' },
    { time: '12:30', value: 80, status: 'approaching' },
    { time: '12:45', value: 120, status: 'approaching' },
    { time: '13:00', value: 180, status: 'normal' },
    { time: '13:15', value: 220, status: 'normal' },
    { time: '13:30', value: 300, status: 'peak' },
    { time: '13:45', value: 180, status: 'approaching' },
    { time: '14:00', value: 150, status: 'peak' },
  ] as const;

  const maxSlotValue = Math.max(...timeSlotData.map((slot) => slot.value));

  const getSlotColorClass = (status: (typeof timeSlotData)[number]['status']) => {
    if (status === 'peak') {
      return 'bg-[#dc2626]';
    }
    if (status === 'approaching') {
      return 'bg-[#facc15]';
    }
    return 'bg-[#2d5a3f]';
  };

  const getSlotColorValue = (status: (typeof timeSlotData)[number]['status']) => {
    if (status === 'peak') {
      return '#dc2626';
    }
    if (status === 'approaching') {
      return '#facc15';
    }
    return '#2d5a3f';
  };

  return (
    <Card className="h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Demand Forecast</h2>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#eef2ff] border border-[#c7d2fe] px-3 py-1 text-xs text-[#1e3a8a]">
            <span aria-hidden className="text-[#4338ca]">💡</span>
            Smart Chef Agent suggests: Rain increases demand for hot gulasch
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onFoodTypeChange && (
            <div className="inline-flex items-center gap-1 rounded-full bg-gray-50 border border-gray-200 p-1">
              {foodTypeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onFoodTypeChange(option.value)}
                  className={`text-[10px] font-semibold px-2 py-1 rounded-full transition-colors ${
                    foodType === option.value
                      ? 'bg-[#133E28] text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  aria-pressed={foodType === option.value}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
          <Info size={18} className="text-gray-400 cursor-pointer" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#f8faf9] rounded-xl border border-[#e3efe7] px-5 py-4">
          <p className="text-[10px] uppercase tracking-wide text-gray-400">Scheduled orders</p>
          <p className="text-3xl font-semibold text-[#1f2937] mt-2">{scheduledOrders}</p>
        </div>
        <div className="bg-[#f8faf9] rounded-xl border border-[#e3efe7] px-5 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] uppercase tracking-wide text-gray-400">Expected walk-ins</p>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#facc15]" />
            </div>
            <p className="text-3xl font-semibold text-[#1f2937] mt-2">{walkIns}</p>
          </div>
          <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-[#fff7ed] text-[#c2410c]">
            ⚡ Train strike
          </span>
        </div>
        <div
          className={`rounded-xl border px-5 py-4 ${
            isHighUncertainty ? 'border-[#facc15] bg-[#fefce8]' : 'border-[#facc15] bg-[#fffbeb]'
          }`}
        >
          <p className="text-[10px] uppercase tracking-wide text-[#b45309]">Total Forecast</p>
          <p className="text-3xl font-semibold text-[#1f2937] mt-2">
            {totalForecast} <span className="text-[#b45309]">± {uncertaintyRange}</span>
          </p>
        </div>
      </div>

      <div className="mb-2" />

      <div className="flex-1 min-h-[180px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
              <span>Demand by Time Slot</span>
              <span className="px-2 py-0.5 rounded-full bg-gray-50 text-gray-500">Peak at 13:30</span>
            </div>
            <div className="grid grid-cols-9 gap-3 items-end">
              {timeSlotData.map((slot) => (
                <div key={slot.time} className="flex flex-col items-center gap-2">
                  <div
                    className={`w-full rounded-lg ${getSlotColorClass(slot.status)}`}
                    style={{ height: `${Math.round((slot.value / maxSlotValue) * 110 + 30)}px` }}
                  />
                  <div className="text-[10px] text-gray-400">{slot.value}</div>
                  <div className="text-[10px] text-gray-400">{slot.time}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-800">Smart Chef Agent Forecast</h4>
              <span className="text-[10px] text-gray-400">Service window</span>
            </div>
            <p className="text-xs italic text-[#1e3a8a] bg-[#eef2ff] border border-[#c7d2fe] rounded-lg px-3 py-2 inline-flex items-center gap-2 mt-2">
              <span aria-hidden className="text-[#4338ca]">💡</span>
              Smart Chef Agent suggests: Rain expected — higher hot dish preference.
            </p>
            <div className="mt-4 space-y-3 text-xs text-gray-600">
              <div className="flex items-start gap-2 bg-[#eef2ff] border border-[#c7d2fe] rounded-lg px-3 py-2 text-[#1e3a8a]">
                <span aria-hidden className="text-[#4338ca]">💡</span>
                Smart Chef Agent suggests: Peak load likely between 13:00–13:45; stage hot mains earlier.
              </div>
              <div className="flex items-start gap-2 bg-[#eef2ff] border border-[#c7d2fe] rounded-lg px-3 py-2 text-[#1e3a8a]">
                <span aria-hidden className="text-[#4338ca]">💡</span>
                Smart Chef Agent suggests: Cold salad demand expected to soften during rain window.
              </div>
              <div className="flex items-start gap-2 bg-[#eef2ff] border border-[#c7d2fe] rounded-lg px-3 py-2 text-[#1e3a8a]">
                <span aria-hidden className="text-[#4338ca]">💡</span>
                Smart Chef Agent suggests: Monitor gulasch stock after 13:15 to avoid late sell-out.
              </div>
            </div>
            <div className="mt-4 text-[10px] text-gray-400">Based on similar rainy weekdays in last 6 weeks.</div>
          </div>
        </div>
      </div>
    </Card>
  );
};
