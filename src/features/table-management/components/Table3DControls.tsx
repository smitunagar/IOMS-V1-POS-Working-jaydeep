'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Slider } from '@/shared/components/ui/slider';
import { Switch } from '@/shared/components/ui/switch';
import { useTableStore } from '@/features/table-management/stores/tableStore';
import { 
  Camera, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut,
  Move3D,
  Eye,
  Sun,
  Lightbulb,
  Users,
  Grid3X3
} from 'lucide-react';

export function Table3DControls() {
  const { 
    viewMode,
    tables,
    selectedTableIds,
    addTable,
    moveTable
  } = useTableStore();

  if (viewMode !== '3D') return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center">
          <Camera className="h-4 w-4 mr-2" />
          3D Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 3D Demo Actions */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Add a random table to showcase 3D
                const shapes = ['round', 'square', 'rect'] as const;
                const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
                
                addTable({
                  x: Math.random() * 400 + 100,
                  y: Math.random() * 300 + 100,
                  shape: randomShape,
                  capacity: Math.floor(Math.random() * 6) + 2
                });
              }}
              className="flex items-center space-x-1"
            >
              <RotateCcw className="h-3 w-3" />
              <span className="text-xs">Add Random</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Animate all tables (demo)
                tables.forEach((table, index) => {
                  setTimeout(() => {
                    const newX = Math.random() * 400 + 100;
                    const newY = Math.random() * 300 + 100;
                    moveTable(table.id, newX, newY);
                  }, index * 200);
                });
              }}
              className="flex items-center space-x-1"
            >
              <Move3D className="h-3 w-3" />
              <span className="text-xs">Shuffle All</span>
            </Button>
          </div>
          
          <div className="text-xs text-slate-500 text-center py-2 border-t">
            ✨ Real-time 3D visualization with physics and shadows
          </div>
        </div>

        {/* Camera Presets */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-600">Camera Views</label>
          <div className="grid grid-cols-1 gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs justify-start"
            >
              <Eye className="h-3 w-3 mr-1" />
              Dining Room Overview
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs justify-start"
            >
              <ZoomIn className="h-3 w-3 mr-1" />
              Close-up View
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs justify-start"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Bird's Eye View
            </Button>
          </div>
        </div>

        {/* 3D Settings */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm flex items-center">
              <Sun className="h-3 w-3 mr-1" />
              Lighting
            </span>
            <span className="text-xs text-slate-500">Bright</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Shadows</span>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Grid</span>
            <Switch defaultChecked />
          </div>
        </div>

        {/* 3D Stats */}
        <div className="space-y-2 text-xs border-t pt-3">
          <div className="flex justify-between">
            <span className="text-slate-500">Total Tables:</span>
            <span className="font-medium">{tables.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Total Capacity:</span>
            <span className="font-medium">{tables.reduce((sum, t) => sum + t.capacity, 0)} guests</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Selected:</span>
            <span className="font-medium text-blue-600">
              {selectedTableIds.length} table{selectedTableIds.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Performance Info */}
        <div className="text-xs text-slate-500 text-center py-2 border-t">
          <div className="flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>3D Rendering: Active</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
