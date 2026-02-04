'use client';

import React from 'react';

interface GridLayerProps {
  gridSize: number;
}

export function GridLayer({ gridSize }: GridLayerProps) {
  return (
    <div 
      className="absolute inset-0 pointer-events-none opacity-30"
      style={{
        backgroundImage: `
          linear-gradient(to right, #e2e8f0 1px, transparent 1px),
          linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
        `,
        backgroundSize: `${gridSize}px ${gridSize}px`
      }}
    />
  );
}
