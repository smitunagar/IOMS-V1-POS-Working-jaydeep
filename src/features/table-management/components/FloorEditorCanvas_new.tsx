'use client';

import React from 'react';

interface FloorEditorCanvasProps {
  width?: number;
  height?: number;
  className?: string;
}

export function FloorEditorCanvas({ 
  width = 800, 
  height = 600, 
  className 
}: FloorEditorCanvasProps) {
  return (
    <div 
      className={`border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center ${className}`}
      style={{ width, height }}
    >
      <div className="text-gray-500 text-lg">
        Click to add tables - Canvas Loading...
      </div>
    </div>
  );
}
