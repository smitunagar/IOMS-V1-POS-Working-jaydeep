'use client';

import React from 'react';

interface ZoneLegendProps {
  className?: string;
  onCreateZone?: () => void;
  onEditZone?: (zoneId: string) => void;
}

export function ZoneLegend({ className, onCreateZone, onEditZone }: ZoneLegendProps) {
  // Simplified zone legend - functionality can be added later
  return null;
}