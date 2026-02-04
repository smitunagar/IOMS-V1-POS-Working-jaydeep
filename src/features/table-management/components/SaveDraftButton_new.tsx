'use client';

import React from 'react';
import { Button } from '@/shared/components/ui/button';
import { Save } from 'lucide-react';

interface SaveDraftButtonProps {
  className?: string;
}

export function SaveDraftButton({ className }: SaveDraftButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      onClick={() => console.log('Save Draft clicked')}
    >
      <Save className="w-4 h-4 mr-2" />
      Save Draft
    </Button>
  );
}
