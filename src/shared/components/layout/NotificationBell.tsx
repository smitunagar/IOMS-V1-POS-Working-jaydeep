"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { Bell, AlertTriangle, ShoppingBasket, Utensils, Sparkles, Loader2, Tag } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { useAuth } from '@/features/auth/AuthContext';
import { getInventory, InventoryItem } from '@/server/lib/inventoryService';
import { getDishes, Dish } from '@/server/lib/menuService';
import { suggestDiscountedDishes, SuggestDiscountedDishesInput, SuggestDiscountedDishesOutput } from '@/ai/flows/suggest-discounted-dishes';
import { useToast } from '@/shared/hooks/use-toast';
import { format, differenceInDays, parseISO, isValid } from 'date-fns';

export function NotificationBell() {
  return (
    <Button variant="ghost" size="icon" aria-label="Notifications">
      <Bell className="h-5 w-5" />
    </Button>
  );
} 