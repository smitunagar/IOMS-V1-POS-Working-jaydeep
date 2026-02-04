'use client';

import React from 'react';
import { Button } from '@/shared/components/ui/button';
import { useTableStore } from '@/features/table-management/stores/tableStore';
import { Circle, Square, RectangleHorizontal, Users } from 'lucide-react';

export function BottomToolbar() {
  const { addTable } = useTableStore();

  const tableTypes = [
    {
      shape: 'round' as const,
      label: 'Round Table',
      icon: Circle,
      capacity: 4,
      description: '4-person round table'
    },
    {
      shape: 'square' as const,
      label: 'Square Table',
      icon: Square,
      capacity: 4,
      description: '4-person square table'
    },
    {
      shape: 'rect' as const,
      label: 'Rectangle Table',
      icon: RectangleHorizontal,
      capacity: 6,
      description: '6-person rectangular table'
    }
  ];

  const handleAddTable = (shape: 'round' | 'square' | 'rect', capacity: number) => {
    // Add table at random position in 3D space
    const x = Math.random() * 400 + 200;
    const y = Math.random() * 300 + 150;
    
    addTable({ 
      x, 
      y, 
      shape,
      capacity
    });
  };

  return (
    <div className="space-y-3">
      {tableTypes.map((tableType) => {
        const IconComponent = tableType.icon;
        return (
          <Button
            key={tableType.shape}
            variant="outline"
            className="w-full h-auto p-4 flex flex-col items-center space-y-2 hover:bg-blue-50 hover:border-blue-300 transition-all group"
            onClick={() => handleAddTable(tableType.shape, tableType.capacity)}
          >
            <div className="flex items-center space-x-2">
              <IconComponent className="h-5 w-5 text-blue-600 group-hover:text-blue-700" />
              <span className="font-medium text-sm">{tableType.label}</span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-slate-500">
              <Users className="h-3 w-3" />
              <span>{tableType.description}</span>
            </div>
          </Button>
        );
      })}
      
      <div className="pt-2 border-t border-slate-200">
        <p className="text-xs text-slate-500 text-center">
          Click any button above to add a 3D table to your floor plan
        </p>
      </div>
    </div>
  );
} 