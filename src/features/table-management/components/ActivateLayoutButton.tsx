'use client';

import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Play, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useTableStore } from '@/features/table-management/stores/tableStore';
import { cn } from '@/server/lib/utils';
import { useToast } from '@/shared/hooks/use-toast';

interface ActivateLayoutButtonProps {
  className?: string;
  onSuccess?: () => void;
}

export function ActivateLayoutButton({ className, onSuccess }: ActivateLayoutButtonProps) {
  const { tables, validationErrors, isDraftMode, activateLayout } = useTableStore();
  const [isActivating, setIsActivating] = useState(false);
  const { toast } = useToast();

  const handleActivateLayout = async () => {
    if (isActivating) return;
    
    setIsActivating(true);

    try {
      // Validate layout before activation
      if (tables.length === 0) {
        throw new Error('Layout must contain at least one table');
      }

      if (validationErrors.length > 0) {
        throw new Error('Cannot activate layout with validation errors');
      }

      await activateLayout('main-floor');
      
      toast({
        title: "Layout Activated",
        description: "Your table layout is now live and ready for use.",
      });

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      console.error('Error activating layout:', error);
      toast({
        title: "Activation Failed",
        description: error instanceof Error ? error.message : "Failed to activate layout",
        variant: "destructive",
      });
    } finally {
      setIsActivating(false);
    }
  };

  const hasErrors = validationErrors.length > 0;
  const isEmpty = tables.length === 0;

  return (
    <Button
      onClick={handleActivateLayout}
      disabled={isActivating || hasErrors || isEmpty || !isDraftMode}
      className={cn(className)}
      size="sm"
      variant={isDraftMode ? "default" : "secondary"}
    >
      {isActivating ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Activating...
        </>
      ) : isDraftMode ? (
        <>
          <Play className="w-4 h-4 mr-2" />
          Activate Layout
        </>
      ) : (
        <>
          <CheckCircle className="w-4 h-4 mr-2" />
          Layout Active
        </>
      )}
    </Button>
  );
}
