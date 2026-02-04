'use client';

import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Save, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useTableStore } from '@/features/table-management/stores/tableStore';
import { cn } from '@/server/lib/utils';
import { useToast } from '@/shared/hooks/use-toast';

interface SaveDraftButtonProps {
  className?: string;
}

export function SaveDraftButton({ className }: SaveDraftButtonProps) {
  const { tables, validationErrors, saveDraft } = useTableStore();
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSaveDraft = async () => {
    if (isSaving) return;
    
    setIsSaving(true);

    try {
      // Validate layout before saving
      if (tables.length === 0) {
        throw new Error('Layout must contain at least one table');
      }

      if (validationErrors.length > 0) {
        throw new Error('Cannot save layout with validation errors');
      }

      await saveDraft('main-floor');
      
      toast({
        title: "Draft Saved",
        description: "Your table layout has been saved successfully.",
      });

    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save draft",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasErrors = validationErrors.length > 0;
  const isEmpty = tables.length === 0;

  return (
    <Button
      onClick={handleSaveDraft}
      disabled={isSaving || hasErrors || isEmpty}
      className={cn(className)}
      size="sm"
    >
      {isSaving ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Saving...
        </>
      ) : (
        <>
          <Save className="w-4 h-4 mr-2" />
          Save Draft
        </>
      )}
    </Button>
  );
}
