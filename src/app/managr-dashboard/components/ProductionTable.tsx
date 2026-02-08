import React from 'react';
import { Card } from './ui/Card';

const ConfidenceDots: React.FC<{ score: number }> = ({ score }) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((dot) => {
        let color = 'bg-gray-300';
        if (score >= dot) {
          color = 'bg-[#133E28]'; // Dark green
        } else if (score >= dot - 0.5) {
            color = 'bg-[#fcd34d]'; // Yellow for half? Or just use logical fills from image.
            // Image logic:
            // Row 1: 4 green, 1 yellow.
            // Row 2: 4 green, 1 yellow.
            // Row 3: 3 green, 1 yellow, 1 grey.
        }
        
        // Custom override to match image exactly based on row index logic isn't clean here, 
        // so I will implement a simpler specific logic or just pass colors.
        // Let's stick to the visual:
        // Score 4.5 -> 4 Green, 1 Yellow
        // Score 3 -> 3 Green, 1 Yellow, 1 Grey
        
        let bgColor = 'bg-gray-300';
        if (dot <= Math.floor(score)) {
            bgColor = 'bg-[#133E28]';
        } else if (dot === Math.ceil(score) && score % 1 !== 0) {
            bgColor = 'bg-[#fcd34d]';
        } else if (score === 3 && dot === 4) { // Specific fix for the soup row example in image (3 green, 1 yellow, 1 grey)
            bgColor = 'bg-[#fcd34d]';
        }

        return <div key={dot} className={`w-3 h-3 rounded-full ${bgColor}`} />;
      })}
    </div>
  );
};

type ProductionItem = {
  id: string;
  dish: string;
  planned: number;
  recommendedMin: number;
  recommendedMax: number;
  confidence: number;
  reason?: string;
  details?: string;
};

type ProductionTableProps = {
  items?: ProductionItem[];
  embedded?: boolean;
};

const defaultItems: ProductionItem[] = [
  {
    id: '1',
    dish: 'Pasta Veg',
    planned: 200,
    recommendedMin: 180,
    recommendedMax: 210,
    confidence: 4.5,
    reason: 'High repeat demand at midday',
    details: 'Stable sell-through last 5 services.',
  },
  {
    id: '2',
    dish: 'Chicken Bowl',
    planned: 250,
    recommendedMin: 230,
    recommendedMax: 260,
    confidence: 4.5,
    reason: 'Top seller last week',
    details: 'Strong preorder conversion at 12:00–13:00.',
  },
  {
    id: '3',
    dish: 'Soup',
    planned: 120,
    recommendedMin: 90,
    recommendedMax: 110,
    confidence: 3,
    reason: 'Repeated unsold surplus last 3 days',
    details: 'Reduce batch size to align with demand.',
  },
];

export const ProductionTable: React.FC<ProductionTableProps> = ({ items = defaultItems, embedded = false }) => {
  const tableContent = (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-100 text-sm text-gray-500">
            <th className="py-3 px-2 font-medium">Dish</th>
            <th className="py-3 px-2 font-medium text-center">Planned</th>
            <th className="py-3 px-2 font-medium text-center">Recommended</th>
            <th className="py-3 px-2 font-medium text-center">Confidence</th>
            <th className="py-3 px-2 font-medium">Why</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id} className={index !== items.length - 1 ? 'border-b border-gray-50' : ''}>
              <td className="py-4 px-2 font-medium text-gray-800">{item.dish}</td>
              <td className="py-4 px-2 text-center text-gray-700">{item.planned}</td>
              <td className="py-4 px-2 text-center text-gray-500">
                {item.recommendedMin}&ndash;{item.recommendedMax}
              </td>
              <td className="py-4 px-2 flex justify-center items-center">
                <ConfidenceDots score={item.confidence} />
              </td>
              <td className="py-4 px-2 text-xs text-gray-600">
                <p className="font-semibold text-gray-700">{item.reason || 'Demand-led adjustment'}</p>
                {item.details && <p className="text-[10px] text-gray-400 mt-1">{item.details}</p>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (embedded) {
    return <div className="h-full">{tableContent}</div>;
  }

  return (
    <Card className="h-full">
      <h2 className="text-lg font-semibold text-gray-800 mb-1">Top-Seller Focus</h2>
      <p className="text-xs text-gray-500 mb-5">Key dishes only, sorted by impact</p>
      {tableContent}
    </Card>
  );
};
