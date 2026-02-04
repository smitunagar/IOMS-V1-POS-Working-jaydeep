'use client';

import React from 'react';

interface ResizeHandleProps {
  tableId: string;
  position: 'bottom-right' | 'bottom' | 'right';
  className?: string;
}

export function ResizeHandle({ tableId, position, className }: ResizeHandleProps) {
  // Simplified resize handle - functionality can be added later
  return null;
}