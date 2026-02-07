import React from 'react';
import { Card } from './ui/Card';
import { PRODUCTION_DATA } from '../constants';

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

export const ProductionTable: React.FC = () => {
  return (
    <Card className="h-full">
      <h2 className="text-lg font-semibold text-gray-800 mb-6">Tomorrow's Suggested Production</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 text-sm text-gray-500">
              <th className="py-3 px-2 font-medium">Dish</th>
              <th className="py-3 px-2 font-medium text-center">Planned</th>
              <th className="py-3 px-2 font-medium text-center">Recommended</th>
              <th className="py-3 px-2 font-medium text-center">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {PRODUCTION_DATA.map((item, index) => (
              <tr key={item.id} className={index !== PRODUCTION_DATA.length - 1 ? 'border-b border-gray-50' : ''}>
                <td className="py-4 px-2 font-medium text-gray-800">{item.dish}</td>
                <td className="py-4 px-2 text-center text-gray-700">{item.planned}</td>
                <td className="py-4 px-2 text-center text-gray-500">
                  {item.recommendedMin}&ndash;{item.recommendedMax}
                </td>
                <td className="py-4 px-2 flex justify-center items-center">
                  <ConfidenceDots score={item.confidence} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
