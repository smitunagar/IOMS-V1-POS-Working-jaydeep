'use client';

import React, { useRef, useMemo, useState } from 'react';
import { useTableManagementStore, useTables, useFixtures, useFloorPlan, useCamera } from '@/stores/tableManagementStore';

interface MiniMap2DProps {
  width?: number;
  height?: number;
  className?: string;
}

export function MiniMap2D({ 
  width = 200, 
  height = 150, 
  className = '' 
}: MiniMap2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const tables = useTables();
  const fixtures = useFixtures();
  const floorPlan = useFloorPlan();
  const camera = useCamera();
  const { updateCamera, focusOnObject } = useTableManagementStore();

  // Calculate scale to fit the floor plan in the minimap
  const scale = useMemo(() => {
    const scaleX = (width - 20) / floorPlan.width;
    const scaleY = (height - 20) / floorPlan.height;
    return Math.min(scaleX, scaleY);
  }, [width, height, floorPlan.width, floorPlan.height]);

  // Convert 3D coordinates to 2D minimap coordinates
  const to2D = (x: number, z: number) => ({
    x: (x + floorPlan.width / 2) * scale + 10,
    y: (z + floorPlan.height / 2) * scale + 10
  });

  // Convert minimap coordinates back to 3D coordinates
  const to3D = (x: number, y: number) => ({
    x: (x - 10) / scale - floorPlan.width / 2,
    z: (y - 10) / scale - floorPlan.height / 2
  });

  // Draw the minimap
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);

    // Draw floor boundary
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, floorPlan.width * scale, floorPlan.height * scale);

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;
    const gridSpacing = floorPlan.gridSize * scale;
    for (let x = 10; x <= 10 + floorPlan.width * scale; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 10);
      ctx.lineTo(x, 10 + floorPlan.height * scale);
      ctx.stroke();
    }
    for (let y = 10; y <= 10 + floorPlan.height * scale; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(10, y);
      ctx.lineTo(10 + floorPlan.width * scale, y);
      ctx.stroke();
    }

    // Draw fixtures
    fixtures.forEach(fixture => {
      const pos = to2D(fixture.x, fixture.y);
      const fixtureWidth = fixture.width * scale;
      const fixtureHeight = fixture.depth * scale;

      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(fixture.rotation);

      // Fixture colors
      const fixtureColors: Record<string, string> = {
        door: '#8b4513',
        window: '#87ceeb',
        bar: '#d2691e',
        restroom: '#9333ea',
        stage: '#dc2626',
        column: '#6b7280',
        kitchen: '#ef4444'
      };

      ctx.fillStyle = fixtureColors[fixture.type] || '#6b7280';
      ctx.fillRect(-fixtureWidth / 2, -fixtureHeight / 2, fixtureWidth, fixtureHeight);

      ctx.restore();
    });

    // Draw tables
    tables.forEach(table => {
      const pos = to2D(table.x, table.y);
      const tableWidth = table.width * scale;
      const tableHeight = table.height * scale;

      // Table status colors
      const statusColors = {
        FREE: '#10b981',
        SEATED: '#ef4444',
        DIRTY: '#f59e0b',
        RESERVED: '#3b82f6'
      };

      ctx.fillStyle = statusColors[table.status];
      
      if (table.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, Math.max(tableWidth, tableHeight) / 2, 0, 2 * Math.PI);
        ctx.fill();
      } else {
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(table.rotation);
        ctx.fillRect(-tableWidth / 2, -tableHeight / 2, tableWidth, tableHeight);
        ctx.restore();
      }

      // Table number
      ctx.fillStyle = 'white';
      ctx.font = `${Math.max(8, Math.min(tableWidth, tableHeight) / 3)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(table.number, pos.x, pos.y);
    });

    // Draw camera view indicator
    const cameraPos = to2D(camera.target[0], camera.target[2]);
    const viewRadius = 20;

    // Camera position
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(cameraPos.x, cameraPos.y, 3, 0, 2 * Math.PI);
    ctx.fill();

    // View cone/area
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.arc(cameraPos.x, cameraPos.y, viewRadius, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);

  }, [tables, fixtures, floorPlan, camera, scale, width, height]);

  // Handle click to focus camera
  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if clicking on a table
    for (const table of tables) {
      const tablePos = to2D(table.x, table.y);
      const distance = Math.sqrt(
        Math.pow(x - tablePos.x, 2) + Math.pow(y - tablePos.y, 2)
      );
      
      if (distance <= Math.max(table.width, table.height) * scale / 2 + 5) {
        focusOnObject(table.id, 'table');
        return;
      }
    }

    // Otherwise, focus camera on clicked position
    const worldPos = to3D(x, y);
    updateCamera({
      target: [worldPos.x, 0, worldPos.z],
      position: [worldPos.x, 10, worldPos.z + 10]
    });
  };

  // Handle mouse down for camera dragging
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    handleClick(event);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    handleClick(event);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg border ${className}`}>
      {/* Header */}
      <div className="p-2 border-b bg-gray-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-gray-700">Floor Overview</h3>
          <div className="flex gap-1">
            <button
              className="text-xs text-blue-600 hover:text-blue-800"
              onClick={() => updateCamera({
                position: [0, 30, 0],
                target: [0, 0, 0]
              })}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="cursor-pointer"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
        
        {/* Legend */}
        <div className="absolute bottom-2 left-2 bg-white bg-opacity-90 rounded p-1 text-xs">
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded"></div>
              <span>Free</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded"></div>
              <span>Occupied</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded"></div>
              <span>Dirty</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded"></div>
              <span>Reserved</span>
            </div>
          </div>
        </div>

        {/* Camera indicator */}
        <div className="absolute top-2 right-2 bg-blue-500 bg-opacity-20 rounded p-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        </div>
      </div>

      {/* Statistics */}
      <div className="p-2 border-t bg-gray-50 rounded-b-lg">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-600">Tables:</span>
            <span className="ml-1 font-medium">{tables.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Seats:</span>
            <span className="ml-1 font-medium">
              {tables.reduce((sum, t) => sum + t.seats, 0)}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Free:</span>
            <span className="ml-1 font-medium text-green-600">
              {tables.filter(t => t.status === 'FREE').length}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Occupied:</span>
            <span className="ml-1 font-medium text-red-600">
              {tables.filter(t => t.status === 'SEATED').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MiniMap2D;
