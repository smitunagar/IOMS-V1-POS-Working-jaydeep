'use client';

import { useRef, useEffect, useState } from 'react';
import { useTableStore } from '@/features/table-management/stores/tableStore';

interface FloorEditorCanvasProps {
  className?: string;
}

export function FloorEditorCanvas({ className }: FloorEditorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isClient, setIsClient] = useState(false);
  
  // Basic store access - test if store is working
  const tables = useTableStore((state) => state.tables) || [];
  const selectedTableIds = useTableStore((state) => state.selectedTableIds) || [];
  const showGrid = useTableStore((state) => state.showGrid) ?? true;
  const selectTable = useTableStore((state) => state.selectTable);
  const clearSelection = useTableStore((state) => state.clearSelection);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Draw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid if enabled
    if (showGrid) {
      drawGrid(ctx, canvas.width, canvas.height);
    }

    // Draw tables
    if (tables.length === 0) {
      // Show helpful message when no tables exist
      ctx.fillStyle = '#9ca3af';
      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        '🏪 Restaurant Floor Plan Designer',
        canvas.width / 2,
        canvas.height / 2 - 40
      );
      ctx.font = '14px Inter, sans-serif';
      ctx.fillText(
        'Click "Round Table" or "Square Table" to add tables to your layout',
        canvas.width / 2,
        canvas.height / 2 - 10
      );
      ctx.fillText(
        'Use the controls on the left to customize your floor plan',
        canvas.width / 2,
        canvas.height / 2 + 15
      );
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText(
        `Tables loaded: ${tables.length} | Selected: ${selectedTableIds.length}`,
        canvas.width / 2,
        canvas.height / 2 + 40
      );
    } else {
      tables.forEach(table => {
        drawTable(ctx, table, selectedTableIds.includes(table.id));
      });
    }
  }, [isClient, tables, selectedTableIds, showGrid]);

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gridSize = 20;
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const drawTable = (ctx: CanvasRenderingContext2D, table: any, isSelected: boolean) => {
    const x = table.x || 100;
    const y = table.y || 100;
    const width = table.w || 80;
    const height = table.h || 80;

    // Table body
    ctx.fillStyle = isSelected ? '#3b82f6' : '#f8fafc';
    ctx.strokeStyle = isSelected ? '#1d4ed8' : '#94a3b8';
    ctx.lineWidth = isSelected ? 3 : 2;
    
    if (table.shape === 'round') {
      const radius = Math.min(width, height) / 2;
      ctx.beginPath();
      ctx.arc(x + radius, y + radius, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(x, y, width, height);
      ctx.strokeRect(x, y, width, height);
    }

    // Table label
    ctx.fillStyle = isSelected ? '#ffffff' : '#374151';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      table.label || `T${table.id.slice(-3)}`,
      x + width / 2,
      y + height / 2 - 8
    );
    
    // Capacity
    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = isSelected ? '#e0e7ff' : '#64748b';
    ctx.fillText(
      `${table.capacity || 4} seats`,
      x + width / 2,
      y + height / 2 + 8
    );

    // Status indicator
    if (table.status && table.status !== 'FREE') {
      ctx.fillStyle = table.status === 'SEATED' ? '#ef4444' : 
                      table.status === 'RESERVED' ? '#f59e0b' : '#9ca3af';
      ctx.beginPath();
      ctx.arc(x + width - 12, y + 12, 6, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  // Handle canvas clicks
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !selectTable || !clearSelection) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if click is on any table
    let clickedTable = null;
    for (const table of tables) {
      const tableX = table.x || 100;
      const tableY = table.y || 100;
      const tableWidth = table.w || 80;
      const tableHeight = table.h || 80;

      if (table.shape === 'round') {
        const radius = Math.min(tableWidth, tableHeight) / 2;
        const centerX = tableX + radius;
        const centerY = tableY + radius;
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        if (distance <= radius) {
          clickedTable = table;
          break;
        }
      } else {
        if (x >= tableX && x <= tableX + tableWidth && y >= tableY && y <= tableY + tableHeight) {
          clickedTable = table;
          break;
        }
      }
    }

    if (clickedTable) {
      selectTable(clickedTable.id);
    } else {
      clearSelection();
    }
  };

  if (!isClient) {
    return (
      <div className={`w-full h-96 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="text-2xl mb-2">🎯</div>
          <p className="text-gray-600">Loading Table Editor...</p>
          <p className="text-sm text-gray-500">Canvas is initializing</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-96 border border-gray-200 rounded-lg overflow-hidden bg-white ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        style={{ width: '100%', height: '100%' }}
        onClick={handleCanvasClick}
      />
    </div>
  );
}

// Default export for dynamic imports
export default FloorEditorCanvas;
