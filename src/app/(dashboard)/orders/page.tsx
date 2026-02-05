'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useToast } from '@/shared/hooks/use-toast';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Separator } from '@/shared/components/ui/separator';
import { 
  ShoppingCart, 
  CreditCard, 
  History, 
  BarChart3,
  ArrowLeft,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Plus,
  Minus,
  Trash2,
  Receipt,
  Package,
  User,
  Users,
  Phone,
  MapPin,
  Banknote,
  Smartphone,
  Printer,
  Car,
  Store,
  RefreshCw,
  Loader2,
  Edit3,
  Layers,
  Sparkles,
  MoreVertical,
  Settings,
  Bell,
  ChefHat,
  Globe2,
  X,
  AlertTriangle,
  Cloud,
  Leaf,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { saveInventory, type InventoryItem } from '@/server/lib/inventoryService';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/shared/components/ui/table';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/shared/components/ui/dialog';
import { Textarea } from '@/shared/components/ui/textarea';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/shared/components/ui/dropdown-menu';
import { SmartChefNotification } from '@/shared/components/SmartChefNotifications';
// Import the actual components from other pages
import { getPendingOrders, getCompletedOrders } from '@/server/lib/orderService';
import { validateOrderInventory, getInventoryImpact } from '@/server/lib/inventoryValidation';
import { GermanTaxService, TaxableItem, TaxCalculation } from '@/server/lib/germanTaxService';
import { getDishes } from '@/server/lib/menuService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';

// Types

interface Subsection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'active' | 'completed' | 'pending';
}

type ThirdPartyPartner = 'Wolt' | 'Lieferando' | 'Uber Eats';
type ThirdPartyOrderStatus = 'Preparing' | 'Accepted' | 'Incoming';

interface ThirdPartyOrder {
  id: string;
  partner: ThirdPartyPartner;
  items: string;
  eta: string;
  status: ThirdPartyOrderStatus;
}

const partnerStyles: Record<ThirdPartyPartner, { accentBar: string; avatar: string; pill: string }> = {
  Wolt: {
    accentBar: 'bg-sky-500',
    avatar: 'bg-sky-100 text-sky-700',
    pill: 'border-sky-200 bg-sky-50 text-sky-700',
  },
  Lieferando: {
    accentBar: 'bg-orange-500',
    avatar: 'bg-orange-100 text-orange-700',
    pill: 'border-orange-200 bg-orange-50 text-orange-700',
  },
  'Uber Eats': {
    accentBar: 'bg-emerald-500',
    avatar: 'bg-emerald-100 text-emerald-700',
    pill: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
};

const statusStyles: Record<ThirdPartyOrderStatus, string> = {
  Preparing: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
  Accepted: 'border border-amber-200 bg-amber-50 text-amber-700',
  Incoming: 'border border-slate-200 bg-slate-50 text-slate-700',
};

interface MarketplaceOrdersSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  orders: ThirdPartyOrder[];
  summary: {
    total: number;
    statusCounts: Record<ThirdPartyOrderStatus, number>;
    partnerBreakdown: Record<ThirdPartyPartner, number>;
  };
}

function MarketplaceOrdersSidebar({
  isOpen,
  onClose,
  orders,
  summary,
}: MarketplaceOrdersSidebarProps) {
  if (!isOpen) return null;

  const activePartners = Object.entries(summary.partnerBreakdown).filter(([, count]) => count > 0);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />
      <div
        className="fixed top-0 right-0 h-full w-[420px] bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out translate-x-0"
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <Globe2 className="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Marketplace Orders</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Live feed from Wolt, Lieferando, Uber Eats
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0 hover:bg-gray-100"
              onClick={onClose}
            >
              <X className="w-4 h-4 text-gray-500" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 gap-3">
                <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Total incoming
                  </p>
                  <p className="mt-1 text-3xl font-semibold text-gray-900">{summary.total}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Across {activePartners.length}{' '}
                    partner{activePartners.length === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
                    Preparing in kitchen
                  </p>
                  <p className="mt-1 text-3xl font-semibold text-emerald-700">
                    {summary.statusCounts.Preparing}
                  </p>
                  <p className="mt-1 text-xs text-emerald-600">
                    Smart queue auto-adjusts prep flow
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    Courier activity
                  </p>
                  <p className="mt-1 text-3xl font-semibold text-slate-800">
                    {summary.statusCounts.Incoming}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Waiting for pickup or en route
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-600">
                    Awaiting acceptance
                  </p>
                  <p className="mt-1 text-3xl font-semibold text-amber-700">
                    {summary.statusCounts.Accepted}
                  </p>
                  <p className="mt-1 text-xs text-amber-600">
                    Pending kitchen confirmation
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {activePartners.map(([partner, count]) => {
                  const styles = partnerStyles[partner as ThirdPartyPartner];
                  return (
                    <span
                      key={partner}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full ${styles.pill}`}
                    >
                      {partner} · {count}
                    </span>
                  );
                })}
                {activePartners.length === 0 && (
                  <span className="text-xs text-gray-500">
                    No partner orders in queue right now
                  </span>
                )}
              </div>

              <Separator />

              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const partnerMeta = partnerStyles[order.partner];
                    const statusMeta = statusStyles[order.status];
                    const initials = order.partner
                      .split(' ')
                      .filter(Boolean)
                      .map((word) => word.charAt(0))
                      .join('');

                    return (
                      <div
                        key={order.id}
                        className="rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className={`h-1.5 rounded-t-2xl ${partnerMeta.accentBar}`} />
                        <div className="p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div className="flex items-start gap-3">
                            <div
                              className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-semibold ${partnerMeta.avatar}`}
                            >
                              {initials}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-gray-900">{order.partner}</p>
                                <Badge className={`text-[11px] font-semibold ${statusMeta}`}>
                                  {order.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">#{order.id}</p>
                              <p className="mt-2 text-sm text-gray-700">{order.items}</p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-3 text-sm text-gray-600 md:items-end md:text-right">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span>{order.eta}</span>
                            </div>
                            <Button variant="outline" size="sm" className="text-xs self-start md:self-end">
                              Open Order
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-10 text-center">
                  <p className="text-sm font-medium text-gray-700">No incoming marketplace orders</p>
                  <p className="mt-1 text-xs text-gray-500">
                    New orders from Wolt, Lieferando, and Uber Eats will appear here instantly.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </>
  );
}

const ordersSubsections: Subsection[] = [
  {
    id: 'pos',
    title: 'POS',
    description: '',
    icon: ShoppingCart,
    status: 'active'
  },
  {
    id: 'payment',
    title: 'Payment',
    description: '',
    icon: CreditCard,
    status: 'pending'
  },
  {
    id: 'order-history',
    title: 'Order History',
    description: '',
    icon: History,
    status: 'pending'
  },
  {
    id: 'order-analytics',
    title: 'Order Analytics',
    description: '',
    icon: BarChart3,
    status: 'pending'
  }
];

// DishCard component
function DishCard({ item, orderItems, onAddToOrder, formatPrice }: { 
  item: MenuItem; 
  orderItems: OrderItem[];
  onAddToOrder: (menuItem: MenuItem, selectedSize?: { size: string; price: string | number }) => void;
  formatPrice: (price: string | number) => string; 
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState(item.sizes && item.sizes.length > 0 ? item.sizes[0] : undefined);


  const displayPrice = selectedSize ? selectedSize.price : item.price;
  console.log('🍽️ [DishCard] Item:', item.name, 'Price:', displayPrice, 'Type:', typeof displayPrice);
  const alreadyAdded = orderItems.some(oi => {
    if (item.sizes && selectedSize) {
      return oi.menuItem.id === item.id && oi.selectedSize?.size === selectedSize.size;
    } else {
      return oi.menuItem.id === item.id;
    }
  });

  return (
    <Card className="border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col h-full">
      <CardContent className="p-3 flex flex-col flex-1">
        {/* Header with name and price */}
        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-gray-900 line-clamp-2" style={{lineHeight:1.3}}>{item.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{item.category}</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-gray-900">€{formatPrice(displayPrice)}</span>
        </div>
        </div>

        {/* Image */}
        {item.image && (
          <div className="mb-2">
            <img src={item.image} alt={item.name} className="w-full h-24 object-cover rounded" />
          </div>
        )}

        {/* Size selector */}
        {item.sizes && item.sizes.length > 1 && (
          <div className="mb-2">
            <select
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
              value={selectedSize?.size}
              onChange={e => {
                const sz = item.sizes?.find(s => s.size === e.target.value);
                setSelectedSize(sz);
              }}
            >
              {item.sizes.map(sz => (
                <option key={sz.size} value={sz.size}>{sz.size} - €{formatPrice(sz.price)}</option>
              ))}
            </select>
          </div>
        )}

        {/* Ingredients */}
        {(() => {
          const cleanIngredients = item.ingredients
            ? item.ingredients.map(ing => typeof ing === 'string' ? ing : (ing.name || ing.inventoryItemName)).filter(Boolean)
            : [];
          if (cleanIngredients.length === 0) return null;
          return (
            <p className="text-xs text-gray-500 mb-2 line-clamp-2" title={cleanIngredients.join(', ')}>
              {cleanIngredients.slice(0, 3).join(', ')}
              {cleanIngredients.length > 3 ? '...' : ''}
            </p>
          );
        })()}

        <div className="flex-1" />

        {/* Add button */}
            <Button
              size="sm"
              onClick={() => onAddToOrder(item, selectedSize)}
          className={`w-full h-8 text-xs font-medium transition-all ${
            alreadyAdded 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-gray-900 hover:bg-gray-800 text-white'
          }`}
        >
          <Plus className="h-3 w-3 mr-1" />
          {alreadyAdded ? 'Added' : 'Add to Order'}
            </Button>
      </CardContent>
    </Card>
  );
}

export default function OrdersPage() {
  const MENU_DATA_VERSION = 'mensa-v1';
  const { currentUser, isLoading, isInitialized } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [activeSubsection, setActiveSubsection] = useState<string>('pos');
  const [showSmartChefNotifications, setShowSmartChefNotifications] = useState<boolean>(false);
  const [showDeliveryNotifications, setShowDeliveryNotifications] = useState<boolean>(false);
  
  const thirdPartyOrders = useMemo<ThirdPartyOrder[]>(
    () => [
      {
        id: 'wolt-2519',
        partner: 'Wolt',
        items: '2 × Margherita Pizza, 1 × Caesar Salad',
        eta: 'Arrives in 12 min',
        status: 'Preparing',
      },
      {
        id: 'lieferando-8821',
        partner: 'Lieferando',
        items: '1 × Vegan Bowl, 3 × Fresh Juices',
        eta: 'Arrives in 18 min',
        status: 'Accepted',
      },
      {
        id: 'ubereats-7304',
        partner: 'Uber Eats',
        items: '4 × Burger Deluxe, 4 × Fries',
        eta: 'Courier picking up',
        status: 'Incoming',
      },
    ],
    [],
  );

  const thirdPartySummary = useMemo(() => {
    const statusCounts = thirdPartyOrders.reduce<Record<ThirdPartyOrderStatus, number>>(
      (acc, order) => {
        acc[order.status] = (acc[order.status] ?? 0) + 1;
        return acc;
      },
      { Preparing: 0, Accepted: 0, Incoming: 0 },
    );

    const partnerBreakdown = thirdPartyOrders.reduce<Record<ThirdPartyPartner, number>>(
      (acc, order) => {
        acc[order.partner] = (acc[order.partner] ?? 0) + 1;
        return acc;
      },
      { Wolt: 0, Lieferando: 0, 'Uber Eats': 0 },
    );

    return {
      total: thirdPartyOrders.length,
      statusCounts,
      partnerBreakdown,
    };
  }, [thirdPartyOrders]);
  
  // SmartChefBot Notifications
  const [smartChefNotifications, setSmartChefNotifications] = useState<SmartChefNotification[]>([
    {
      id: '1',
      type: 'forecast',
      title: 'Forecast Check',
      message: 'Only 12 portions predicted for lunch — adjust prep accordingly.',
      timestamp: new Date(Date.now() - 15 * 60000),
      priority: 'medium',
      actionRequired: true
    },
    {
      id: '2',
      type: 'demand',
      title: 'Demand Trending Below Average',
      message: 'Delay batch cooking for 15 min.',
      timestamp: new Date(Date.now() - 30 * 60000),
      priority: 'low',
      actionRequired: false
    },
    {
      id: '3',
      type: 'variance',
      title: 'High Variance Alert',
      message: "Yesterday's prep exceeded forecast by 18%. Reduce today's portion size.",
      timestamp: new Date(Date.now() - 45 * 60000),
      priority: 'high',
      actionRequired: true
    },
    {
      id: '4',
      type: 'stock',
      title: 'Low Stock Warning',
      message: "Ingredient 'chicken breast' projected to run out by 14:30.",
      timestamp: new Date(Date.now() - 60 * 60000),
      priority: 'high',
      actionRequired: true
    },
    {
      id: '5',
      type: 'weather',
      title: 'Weather Pattern Detected',
      message: 'Rainy-day pattern detected — dessert demand likely +25%.',
      timestamp: new Date(Date.now() - 90 * 60000),
      priority: 'medium',
      actionRequired: false
    },
    {
      id: '6',
      type: 'waste',
      title: 'WasteWatchDog Alert',
      message: "WasteWatchDog shows 1.8 kg side-dish waste yesterday — consider smaller servings today.",
      timestamp: new Date(Date.now() - 120 * 60000),
      priority: 'medium',
      actionRequired: true
    },
    {
      id: '7',
      type: 'efficiency',
      title: 'Great Job!',
      message: "Yesterday's prep efficiency ↑ 12%, food waste ↓ 0.7 kg.",
      timestamp: new Date(Date.now() - 180 * 60000),
      priority: 'low',
      actionRequired: false
    },
    {
      id: '8',
      type: 'surplus',
      title: 'Forecasted Surplus Warning',
      message: 'Forecasted surplus > 2 kg for dinner. Suggest scaling menu item quantities.',
      timestamp: new Date(Date.now() - 240 * 60000),
      priority: 'high',
      actionRequired: true
    },
    {
      id: '9',
      type: 'dish-flag',
      title: 'High-Waste Dish Flagged',
      message: "Dish 'Lasagna' flagged as high-waste — SmartChef recommends batch size of 8 instead of 10.",
      timestamp: new Date(Date.now() - 300 * 60000),
      priority: 'high',
      actionRequired: true
    },
    {
      id: '10',
      type: 'co2',
      title: 'CO₂ Impact Report',
      message: 'Total CO₂ impact from overproduction last week: 14 kg CO₂e. Target < 10 kg this week.',
      timestamp: new Date(Date.now() - 360 * 60000),
      priority: 'medium',
      actionRequired: true
    }
  ]);


  // Handle URL parameters to automatically switch to payment section
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const section = urlParams.get('section');
      
      if (section === 'payment') {
        console.log('🎯 [ORDERS-PAGE] URL parameter detected, switching to payment section');
        setActiveSubsection('payment');
        
        // Clear the URL parameter after switching
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, []);


  // Listen for split bill creation messages from child windows
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'SPLIT_BILL_CREATED') {
        console.log('📢 [ORDERS-PAGE] Received split bill created message:', event.data);
        console.log('🔄 [ORDERS-PAGE] Switching to payment section');
        
        // Switch to payment section
        setActiveSubsection('payment');
        
        // Force refresh the payment section orders
        setTimeout(() => {
          const userId = getUserId();
          const ordersKey = `orders_${userId}`;
          const storedOrders = localStorage.getItem(ordersKey);
          if (storedOrders) {
            try {
              const allOrders = JSON.parse(storedOrders);
              console.log('📦 [MESSAGE-HANDLER] Total orders in storage:', allOrders.length);
              console.log('📦 [MESSAGE-HANDLER] All orders:', allOrders.map((o: any) => ({ 
                id: o.id, 
                status: o.status, 
                isSplitBill: o.isSplitBill,
                orderType: o.orderType 
              })));
              
              const pendingOrders = filterOrdersForPayment(allOrders);
              
              console.log('🔄 [ORDERS-PAGE] Refreshing orders after split bill creation:', pendingOrders.length);
              console.log('📋 [ORDERS-PAGE] Split bills found:', pendingOrders.filter((o: any) => o.isSplitBill).length);
              setOrders(pendingOrders);
            } catch (error) {
              console.error('❌ [ORDERS-PAGE] Error refreshing orders:', error);
            }
          }
        }, 500); // Small delay to ensure localStorage is updated
        
        // Show notification
        toast({
          title: 'Split Bills Ready! 🎉',
          description: 'The split bills are now available in the payment section.'
        });
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [toast]);
  
  // POS State
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    tableNumber: '',
    email: '',
    address: {
      street: '',
      city: '',
      pinCode: ''
    }
  });
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [orderType, setOrderType] = useState<'dine-in' | 'take-away' | 'home-delivery'>('dine-in');
  const [driver, setDriver] = useState('');
  const [availableTables, setAvailableTables] = useState<any[]>([]);
  const [inventoryValidation, setInventoryValidation] = useState<any>(null);
  const [inventoryImpact, setInventoryImpact] = useState<any>(null);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [validatingInventory, setValidatingInventory] = useState(false);

  // Payment-related state
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [tipAmount, setTipAmount] = useState<string>('0');
  const [discountPercentage, setDiscountPercentage] = useState<string>('0');
  const [taxCalculation, setTaxCalculation] = useState<TaxCalculation | null>(null);
  const [processing, setProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [showBill, setShowBill] = useState(false);

  // Order History state
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(true);
  const [tables, setTables] = useState<any[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Cancellation dialog state
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [orderToCancel, setOrderToCancel] = useState<any>(null);

  // Customer edit dialog state
  const [showCustomerEditDialog, setShowCustomerEditDialog] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [editCustomerInfo, setEditCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    tableNumber: '',
    email: '',
    address: {
      street: '',
      city: '',
      pinCode: ''
    }
  });

  // Order details dialog state
  const [showOrderDetailsDialog, setShowOrderDetailsDialog] = useState(false);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<any>(null);

  // Split bill dialog state
  const [showSplitBillDialog, setShowSplitBillDialog] = useState(false);
  const [numberOfPayees, setNumberOfPayees] = useState<number>(2);
  const [payeeAssignments, setPayeeAssignments] = useState<{[key: number]: number}>({});

  // Order history expanded state
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Custom add-on state
  const [customAddOnInputs, setCustomAddOnInputs] = useState<{[key: string]: string}>({});
  const [showCustomAddOnInput, setShowCustomAddOnInput] = useState<{[key: string]: boolean}>({});
  const [showAddOnsDropdown, setShowAddOnsDropdown] = useState<{[key: string]: boolean}>({});

  // Combo state
  const [combos, setCombos] = useState<Combo[]>([]);
  const [showComboRecommendations, setShowComboRecommendations] = useState<{[key: string]: boolean}>({});
  const [showComboCreator, setShowComboCreator] = useState(false);
  const [comboCreatorItems, setComboCreatorItems] = useState<ComboItem[]>([]);
  const [comboCreatorForm, setComboCreatorForm] = useState({
    name: '',
    description: '',
    category: 'Value Combos',
    discount: 0,
    image: ''
  });
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);
  const [showComboSidebar, setShowComboSidebar] = useState(false);
  const [showAllCombos, setShowAllCombos] = useState(false);
  
  // Real-time update state for payment section
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [showNewOrderNotification, setShowNewOrderNotification] = useState(false);
  
  // Real-time update state for order history section
  const [lastHistoryCount, setLastHistoryCount] = useState(0);
  const [showNewHistoryNotification, setShowNewHistoryNotification] = useState(false);
  

  const drivers = ['John Doe', 'Jane Smith', 'Alex Rider', 'Priya Patel'];

  // Real-time order updates for payment section
  useEffect(() => {
    if (activeSubsection !== 'payment') return;

    const fetchOrdersForPayment = () => {
      console.log('🔄 [PAYMENT-SECTION] Fetching orders for payment section...');
      const userId = getUserId();
      
      // Read orders directly from localStorage since API returns empty array
      const ordersKey = `orders_${userId}`;
      const storedOrders = localStorage.getItem(ordersKey);
      let allOrders = [];
      
      if (storedOrders) {
        try {
          allOrders = JSON.parse(storedOrders);
          console.log('📦 [PAYMENT-SECTION] Loaded orders from localStorage:', allOrders.length);
        } catch (error) {
          console.error('❌ [PAYMENT-SECTION] Error parsing orders from localStorage:', error);
          allOrders = [];
        }
      }
      
      // Filter for pending orders using centralized function
      const pendingOrders = filterOrdersForPayment(allOrders);
      
      // Log filtered results
      pendingOrders.forEach((order: any) => {
        if (order.isSplitBill) {
          console.log(`✅ [PAYMENT-FILTER] Included split bill ${order.id}`);
        } else {
          console.log(`✅ [PAYMENT-FILTER] Included regular order ${order.id}`);
        }
      });
      
      console.log(`📊 [PAYMENT-SECTION] Found ${pendingOrders.length} pending orders for payment`);
      console.log('📋 [PAYMENT-SECTION] All orders in storage:', allOrders.length);
      console.log('📋 [PAYMENT-SECTION] Split bills in pending:', pendingOrders.filter((o: any) => o.isSplitBill).length);
      console.log('📋 [PAYMENT-SECTION] Order details:', pendingOrders.map((order: any) => ({
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        orderType: order.orderType,
        isSplitBill: order.isSplitBill,
        parentOrderId: order.parentOrderId,
        payerName: order.payerName,
        createdAt: order.createdAt
      })));
      
      // Only update if orders have actually changed (prevent infinite re-renders)
      const currentOrderIds = orders.map((o: any) => o.id).sort().join(',');
      const newOrderIds = pendingOrders.map((o: any) => o.id).sort().join(',');
      const ordersChanged = currentOrderIds !== newOrderIds;
      
      if (ordersChanged) {
        console.log('🔄 [PAYMENT-SECTION] Orders changed, updating state');
        
        // Check if new orders were added
        if (pendingOrders.length > lastOrderCount && lastOrderCount > 0) {
          console.log('🆕 [PAYMENT-SECTION] New orders detected in payment section!');
          setShowNewOrderNotification(true);
          setTimeout(() => setShowNewOrderNotification(false), 3000);
        }
        
        setOrders(pendingOrders);
        setLastOrderCount(pendingOrders.length);
      } else {
        console.log('⏸️ [PAYMENT-SECTION] No changes, skipping update');
      }
    };

    fetchOrdersForPayment();
    
    // Listen for custom events (for same-tab updates)
    const handleOrderCreated = (event: CustomEvent) => {
      console.log('🔄 [PAYMENT-SECTION] Order created event received:', event.detail);
      console.log('🔄 [PAYMENT-SECTION] Refreshing orders due to new order creation');
      fetchOrdersForPayment();
    };

    const handleOrderStatusUpdated = (event: CustomEvent) => {
      console.log('🔄 [PAYMENT-SECTION] Order status updated event received:', event.detail);
      console.log('🔄 [PAYMENT-SECTION] Refreshing orders due to status change');
      fetchOrdersForPayment();
    };

    const handleSplitBillCreated = (event: CustomEvent) => {
      console.log('🔄 [PAYMENT-SECTION] Split bill created event received:', event.detail);
      console.log('🔄 [PAYMENT-SECTION] Refreshing orders due to split bill creation');
      fetchOrdersForPayment();
    };

    // Handle storage events (for cross-tab communication)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === `orders_${getUserId()}` && event.newValue) {
        console.log('🔄 [PAYMENT-SECTION] Storage change detected, refreshing orders');
        fetchOrdersForPayment();
      }
    };

    // Add event listeners
    window.addEventListener('orderCreated', handleOrderCreated as EventListener);
    window.addEventListener('orderStatusUpdated', handleOrderStatusUpdated as EventListener);
    window.addEventListener('splitBillCreated', handleSplitBillCreated as EventListener);
    window.addEventListener('storage', handleStorageChange);
    
    // DISABLED: Periodic refresh causes split bills to disappear
    // Only refresh on actual events now
    
    return () => {
      window.removeEventListener('orderCreated', handleOrderCreated as EventListener);
      window.removeEventListener('orderStatusUpdated', handleOrderStatusUpdated as EventListener);
      window.removeEventListener('splitBillCreated', handleSplitBillCreated as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [activeSubsection, lastOrderCount]);

  // Real-time order updates for order history section
  useEffect(() => {
    if (activeSubsection !== 'order-history') return;

    const fetchOrdersForHistory = () => {
      console.log('🔄 Fetching orders for history section...');
      const userId = getUserId();
      const allOrders = JSON.parse(localStorage.getItem(`orders_${userId}`) || '[]');
      
      // Sort by creation date (newest first)
      const sortedOrders = allOrders.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      console.log(`📊 Found ${sortedOrders.length} total orders for history`);
      
      // Check if new orders were added
      if (sortedOrders.length > lastHistoryCount && lastHistoryCount > 0) {
        console.log('🆕 New orders detected in history section!');
        setShowNewHistoryNotification(true);
        setTimeout(() => setShowNewHistoryNotification(false), 3000);
      }
      
      setCompletedOrders(sortedOrders);
      setLastHistoryCount(sortedOrders.length);
      setLastRefresh(new Date());
    };

    fetchOrdersForHistory();
    
    // Listen for custom events (for same-tab updates)
    const handleOrderCreated = (event: CustomEvent) => {
      console.log('🔄 [HISTORY-SECTION] Order created event received:', event.detail);
      fetchOrdersForHistory();
    };

    const handlePaymentCompleted = (event: CustomEvent) => {
      console.log('🔄 [HISTORY-SECTION] Payment completed event received:', event.detail);
      console.log('🔄 [HISTORY-SECTION] Refreshing history due to payment completion');
      fetchOrdersForHistory();
    };

    const handleOrderStatusUpdated = (event: CustomEvent) => {
      console.log('🔄 [HISTORY-SECTION] Order status updated event received:', event.detail);
      console.log('🔄 [HISTORY-SECTION] Refreshing history due to status change');
      fetchOrdersForHistory();
    };

    // Add event listeners
    window.addEventListener('orderCreated', handleOrderCreated as EventListener);
    window.addEventListener('paymentCompleted', handlePaymentCompleted as EventListener);
    window.addEventListener('orderStatusUpdated', handleOrderStatusUpdated as EventListener);
    
    // Set up interval to refresh orders every 3 seconds as backup
    const interval = setInterval(() => {
      console.log('⏰ [HISTORY-SECTION] Periodic refresh triggered');
      fetchOrdersForHistory();
    }, 3000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('orderCreated', handleOrderCreated as EventListener);
      window.removeEventListener('paymentCompleted', handlePaymentCompleted as EventListener);
      window.removeEventListener('orderStatusUpdated', handleOrderStatusUpdated as EventListener);
    };
  }, [activeSubsection, lastHistoryCount]);

  // Get add-ons for a specific dish from menu data
  const getDishAddOns = (menuItem: MenuItem): AddOn[] => {
    if (!menuItem.addons || menuItem.addons.length === 0) {
      return [];
    }
    
    return menuItem.addons.map((addon: { id: string; name: string; price: string | number }) => ({
      id: addon.id,
      name: addon.name,
      price: parseFloat(addon.price.toString()) || 0,
      type: 'extra' as const
    }));
  };

  // Payment methods
  const paymentMethods = [
    { id: 'cash', name: 'Cash', icon: <Banknote className="h-5 w-5" />, color: 'bg-green-500' },
    { id: 'card', name: 'Credit/Debit Card', icon: <CreditCard className="h-5 w-5" />, color: 'bg-blue-500' },
    { id: 'mobile', name: 'Mobile Payment', icon: <Smartphone className="h-5 w-5" />, color: 'bg-purple-500' },
  ];

  // Load menu data
  useEffect(() => {
    if (typeof window === 'undefined') return;
    loadMenuData();
  }, [currentUser]);

  // Load orders for payment
  useEffect(() => {
    if (typeof window === 'undefined') return;
    loadOrders();
    fetchOrderHistory();
  }, [currentUser]);

  // Filter items
  useEffect(() => {
    let filtered = menuItems;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredItems(filtered);
  }, [menuItems, selectedCategory, searchTerm]);

  // Validate inventory
  useEffect(() => {
    const validateInventory = async () => {
      if (orderItems.length === 0) {
        setInventoryValidation(null);
        setInventoryImpact(null);
        return;
      }

      setValidatingInventory(true);
      try {
        const userId = currentUser?.id || 'default_user';
        const orderItemsForValidation = orderItems.map(item => ({
          name: item.menuItem.name,
          quantity: item.quantity
        }));

        const impact = await getInventoryImpact(userId, orderItemsForValidation);
        setInventoryValidation(impact.validation);
        setInventoryImpact(impact.impact);
      } catch (error) {
        console.error('Error validating inventory:', error);
      } finally {
        setValidatingInventory(false);
      }
    };

    validateInventory();
  }, [orderItems]);

  // Fetch tables
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    async function fetchTables() {
      try {
        const res = await fetch('/api/tables');
        const data = await res.json();
        console.log('📊 Fetched tables:', data.tables);
        
        if (data.tables && data.tables.length > 0) {
        setAvailableTables(data.tables);
        } else {
          // If no tables in database, create default tables
          console.log('⚠️ No tables found, using default tables');
          const defaultTables = Array.from({ length: 20 }, (_, i) => ({
            id: `table-${i + 1}`,
            number: i + 1,
            status: 'available',
            capacity: 4
          }));
          setAvailableTables(defaultTables);
        }
      } catch (error) {
        console.error('❌ Error fetching tables:', error);
        // Fallback to default tables on error
        const defaultTables = Array.from({ length: 20 }, (_, i) => ({
          id: `table-${i + 1}`,
          number: i + 1,
          status: 'available',
          capacity: 4
        }));
        setAvailableTables(defaultTables);
      }
    }
    fetchTables();
  }, []);

  const seedInventoryFromMenu = (userId: string, menu: MenuItem[]) => {
    try {
      const ingredientMap = new Map<string, InventoryItem>();
      menu.forEach((item) => {
        if (!item.ingredients || !Array.isArray(item.ingredients)) return;
        item.ingredients.forEach((ingredient: any) => {
          if (typeof ingredient === 'string') {
            if (!ingredientMap.has(ingredient)) {
              ingredientMap.set(ingredient, {
                id: ingredient,
                name: ingredient,
                quantity: 10000,
                unit: 'g',
                category: 'Ingredients',
                lowStockThreshold: 500
              });
            }
            return;
          }
          const name = ingredient.inventoryItemName || ingredient.name;
          if (!name) return;
          if (!ingredientMap.has(name)) {
            ingredientMap.set(name, {
              id: name,
              name,
              quantity: 10000,
              unit: ingredient.unit || 'g',
              category: 'Ingredients',
              lowStockThreshold: 500
            });
          }
        });
      });
      saveInventory(userId, Array.from(ingredientMap.values()));
    } catch (inventoryError) {
      console.error('Error seeding inventory from menu:', inventoryError);
    }
  };

  const loadMenuData = async () => {
    setLoading(true);
    try {
      const userId = currentUser?.id || 'default_user';
      const menuDataKey = `menu_data_${userId}`;
      const storedMenuData = localStorage.getItem(menuDataKey);
      
      if (storedMenuData) {
        const menuData = JSON.parse(storedMenuData);
        if (menuData?.version !== MENU_DATA_VERSION) {
          localStorage.removeItem(menuDataKey);
        } else {
        console.log('📋 [ORDERS] Loading saved menu data:', menuData);
        console.log('📋 [ORDERS] Sample menu item price:', menuData.menuItems?.[0]?.price, typeof menuData.menuItems?.[0]?.price);
        
        // Convert number prices back to strings for display
        const convertedMenuItems = (menuData.menuItems || []).map((item: any) => ({
          ...item,
          price: typeof item.price === 'number' ? item.price.toString() : item.price,
          sizes: item.sizes?.map((size: any) => ({
            ...size,
            price: typeof size.price === 'number' ? size.price.toString() : size.price
          }))
        }));
        
        setMenuItems(convertedMenuItems);
        setCategories(menuData.categories || []);
        seedInventoryFromMenu(userId, convertedMenuItems);
        
        // Load combos
        const combosKey = `combos_data_${userId}`;
        const storedCombos = localStorage.getItem(combosKey);
        if (storedCombos) {
          setCombos(JSON.parse(storedCombos));
        }
      } else {
        // Try to load from menu service as fallback
        try {
          const { getDishes } = await import('@/server/lib/menuService');
          const savedDishes = getDishes(userId);
          if (savedDishes && savedDishes.length > 0) {
            console.log('📋 [ORDERS] Loading menu from menu service:', savedDishes.length, 'items');
            
            // Convert number prices to strings for display
            const convertedDishes = savedDishes.map((item: any) => ({
              ...item,
              price: typeof item.price === 'number' ? item.price.toString() : item.price,
              sizes: item.sizes?.map((size: any) => ({
                ...size,
                price: typeof size.price === 'number' ? size.price.toString() : size.price
              }))
            }));
            
            setMenuItems(convertedDishes);
            const uniqueCategories = [...new Set(convertedDishes.map((item: MenuItem) => item.category))];
            setCategories(uniqueCategories);
            seedInventoryFromMenu(userId, convertedDishes);
          } else {
            // Load from sessionStorage as final fallback
            const sessionMenuData = sessionStorage.getItem('extractedMenuItems');
            if (sessionMenuData) {
              const menuData = JSON.parse(sessionMenuData);
              console.log('📋 [ORDERS] Loading menu from sessionStorage:', menuData.length, 'items');
              setMenuItems(menuData);
              const uniqueCategories = [...new Set(menuData.map((item: MenuItem) => item.category))] as string[];
              setCategories(uniqueCategories);
            } else {
              // Try to load from API as final fallback
              try {
                const response = await fetch('/api/menuCsv');
                const data = await response.json();

                if (data.menu && Array.isArray(data.menu) && data.menu.length > 0) {
                  console.log('📋 [ORDERS] Loading menu from API:', data.menu.length, 'items');

                  const menuItemsFromApi = data.menu.map((item: any) => ({
                    ...item,
                    price: typeof item.price === 'number' ? item.price.toString() : item.price,
                    sizes: item.sizes?.map((size: any) => ({
                      ...size,
                      price: typeof size.price === 'number' ? size.price.toString() : size.price
                    }))
                  }));

                  const uniqueCategories = [...new Set(menuItemsFromApi.map((item: MenuItem) => item.category).filter(Boolean))] as string[];
                  setMenuItems(menuItemsFromApi);
                  setCategories(uniqueCategories);
                  seedInventoryFromMenu(userId, menuItemsFromApi);

                  const menuData = {
                    menuItems: menuItemsFromApi,
                    categories: uniqueCategories,
                    lastUpdated: new Date().toISOString()
                  };
                  localStorage.setItem(menuDataKey, JSON.stringify(menuData));

                  try {
                    const { saveDishes } = await import('@/server/lib/menuService');
                    const convertedMenu = menuItemsFromApi.map((item: any) => ({
                      ...item,
                      price: typeof item.price === 'string'
                        ? parseFloat(item.price.replace(/[^\d.,]/g, '').replace(',', '.'))
                        : item.price
                    }));
                    saveDishes(userId, convertedMenu);
                  } catch (saveError) {
                    console.error('Error saving menu from API:', saveError);
                  }

                  seedInventoryFromMenu(userId, menuItemsFromApi);
                } else {
                  console.log('📋 [ORDERS] No menu data found');
                  setMenuItems([]);
                  setCategories([]);
                }
              } catch (apiError) {
                console.error('Error loading menu from API:', apiError);
                setMenuItems([]);
                setCategories([]);
              }
            }
          }
        } catch (serviceError) {
          console.error('Error loading from menu service:', serviceError);
          setMenuItems([]);
          setCategories([]);
        }
      }
    } catch (error) {
      console.error('Error loading menu data:', error);
      setMenuItems([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const addToOrder = (menuItem: MenuItem, selectedSize?: { size: string; price: string | number }) => {
    setOrderItems(prev => {
      const existingItem = prev.find(item => 
        item.menuItem.id === menuItem.id && 
        (!selectedSize || item.selectedSize?.size === selectedSize.size)
      );

      if (existingItem) {
        return prev.map(item =>
          item.menuItem.id === menuItem.id && 
          (!selectedSize || item.selectedSize?.size === selectedSize.size)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );

            // Load combos
            const combosKey = `combos_data_${userId}`;
            const storedCombos = localStorage.getItem(combosKey);
            if (storedCombos) {
              setCombos(JSON.parse(storedCombos));
            }
            return;
            }
          }

          // Try to load from API first for canonical data
          try {
            const response = await fetch('/api/menuCsv');
            const data = await response.json();

            if (data.menu && Array.isArray(data.menu) && data.menu.length > 0) {
              console.log('📋 [ORDERS] Loading menu from API:', data.menu.length, 'items');

              const menuItemsFromApi = data.menu.map((item: any) => ({
                ...item,
                price: typeof item.price === 'number' ? item.price.toString() : item.price,
                sizes: item.sizes?.map((size: any) => ({
                  ...size,
                  price: typeof size.price === 'number' ? size.price.toString() : size.price
                }))
              }));

              const uniqueCategories = [...new Set(menuItemsFromApi.map((item: MenuItem) => item.category).filter(Boolean))] as string[];
              setMenuItems(menuItemsFromApi);
              setCategories(uniqueCategories);
              seedInventoryFromMenu(userId, menuItemsFromApi);

              const menuData = {
                version: MENU_DATA_VERSION,
                menuItems: menuItemsFromApi,
                categories: uniqueCategories,
                lastUpdated: new Date().toISOString()
              };
              localStorage.setItem(menuDataKey, JSON.stringify(menuData));

              try {
                const { saveDishes } = await import('@/server/lib/menuService');
                const convertedMenu = menuItemsFromApi.map((item: any) => ({
                  ...item,
                  price: typeof item.price === 'string'
                    ? parseFloat(item.price.replace(/[^\d.,]/g, '').replace(',', '.'))
                    : item.price
                }));
                saveDishes(userId, convertedMenu);
              } catch (saveError) {
                console.error('Error saving menu from API:', saveError);
              }
              return;
            }
          } catch (apiError) {
            console.error('Error loading menu from API:', apiError);
          }

          // Fallback to menu service
          try {
            const { getDishes } = await import('@/server/lib/menuService');
            const savedDishes = getDishes(userId);
            if (savedDishes && savedDishes.length > 0) {
              console.log('📋 [ORDERS] Loading menu from menu service:', savedDishes.length, 'items');

              const convertedDishes = savedDishes.map((item: any) => ({
                ...item,
                price: typeof item.price === 'number' ? item.price.toString() : item.price,
                sizes: item.sizes?.map((size: any) => ({
                  ...size,
                  price: typeof size.price === 'number' ? size.price.toString() : size.price
                }))
              }));

              setMenuItems(convertedDishes);
              const uniqueCategories = [...new Set(convertedDishes.map((item: MenuItem) => item.category))];
              setCategories(uniqueCategories);
              seedInventoryFromMenu(userId, convertedDishes);
              return;
            }
          } catch (serviceError) {
            console.error('Error loading from menu service:', serviceError);
          }

          // Final fallback to sessionStorage
          const sessionMenuData = sessionStorage.getItem('extractedMenuItems');
          if (sessionMenuData) {
            const menuData = JSON.parse(sessionMenuData);
            console.log('📋 [ORDERS] Loading menu from sessionStorage:', menuData.length, 'items');
            setMenuItems(menuData);
            const uniqueCategories = [...new Set(menuData.map((item: MenuItem) => item.category))] as string[];
            setCategories(uniqueCategories);
            return;
          }

          console.log('📋 [ORDERS] No menu data found');
          setMenuItems([]);
          setCategories([]);
          comboId: combo.id,
          comboName: combo.name,
          comboDiscount: combo.discount,
          discountedPrice: discountedPrice
        }
      };
    });

    setOrderItems(prev => [...prev, ...newOrderItems]);
    
    toast({
      title: 'Combo Added!',
      description: `"${combo.name}" has been added to your order with ${combo.discount}% discount.`
    });
  };

  const toggleComboRecommendations = (menuItemId: string) => {
    setShowComboRecommendations(prev => ({
      ...prev,
      [menuItemId]: !prev[menuItemId]
    }));
  };

  // Combo creator functions
  const addItemToComboCreator = (menuItem: MenuItem) => {
    const existingItem = comboCreatorItems.find(item => item.menuItem.id === menuItem.id);
    if (existingItem) {
      setComboCreatorItems(prev => 
        prev.map(item => 
          item.menuItem.id === menuItem.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      const newComboItem: ComboItem = {
        id: `combo_item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        menuItem,
        quantity: 1
      };
      setComboCreatorItems(prev => [...prev, newComboItem]);
    }
  };

  const removeItemFromComboCreator = (itemId: string) => {
    setComboCreatorItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateComboCreatorItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromComboCreator(itemId);
      return;
    }
    setComboCreatorItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const calculateComboCreatorPrice = () => {
    const totalPrice = comboCreatorItems.reduce((total, item) => {
      const itemPrice = parseFloat(item.menuItem.price.toString()) || 0;
      return total + (itemPrice * item.quantity);
    }, 0);
    
    const discountAmount = (totalPrice * comboCreatorForm.discount) / 100;
    const finalPrice = totalPrice - discountAmount;
    
    return { totalPrice, discountAmount, finalPrice };
  };

  const saveComboFromCreator = () => {
    if (!comboCreatorForm.name.trim() || comboCreatorItems.length === 0) {
      toast({
        title: 'Error',
        description: 'Please provide a combo name and add at least one item.',
        variant: 'destructive'
      });
      return;
    }

    const { totalPrice, discountAmount, finalPrice } = calculateComboCreatorPrice();
    
    const newCombo: Combo = {
      id: editingCombo ? editingCombo.id : `combo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: comboCreatorForm.name,
      description: comboCreatorForm.description,
      items: comboCreatorItems,
      totalPrice,
      discount: comboCreatorForm.discount,
      finalPrice,
      category: comboCreatorForm.category,
      image: comboCreatorForm.image,
      isActive: true
    };

    if (editingCombo) {
      // Update existing combo
      setCombos(prev => prev.map(combo => combo.id === editingCombo.id ? newCombo : combo));
      toast({
        title: 'Combo Updated!',
        description: `"${newCombo.name}" has been updated.`
      });
    } else {
      // Add new combo
      setCombos(prev => [...prev, newCombo]);
      toast({
        title: 'Combo Created!',
        description: `"${newCombo.name}" has been created and saved.`
      });
    }
    
    // Save to localStorage
    const userId = currentUser?.id || 'default_user';
    const combosKey = `combos_data_${userId}`;
    const updatedCombos = editingCombo 
      ? combos.map(combo => combo.id === editingCombo.id ? newCombo : combo)
      : [...combos, newCombo];
    localStorage.setItem(combosKey, JSON.stringify(updatedCombos));

    // Reset form
    setComboCreatorForm({
      name: '',
      description: '',
      category: 'Value Combos',
      discount: 0,
      image: ''
    });
    setComboCreatorItems([]);
    setShowComboCreator(false);
    setEditingCombo(null);
  };

  // Combo management functions
  const editCombo = (combo: Combo) => {
    setEditingCombo(combo);
    setComboCreatorForm({
      name: combo.name,
      description: combo.description,
      category: combo.category,
      discount: combo.discount,
      image: combo.image
    });
    setComboCreatorItems(combo.items);
    setShowComboCreator(true);
    setShowComboSidebar(false);
  };

  const deleteCombo = (comboId: string) => {
    if (window.confirm('Are you sure you want to delete this combo?')) {
      setCombos(prev => prev.filter(combo => combo.id !== comboId));
      
      // Update localStorage
      const userId = currentUser?.id || 'default_user';
      const combosKey = `combos_data_${userId}`;
      const updatedCombos = combos.filter(combo => combo.id !== comboId);
      localStorage.setItem(combosKey, JSON.stringify(updatedCombos));
      
      toast({
        title: 'Combo Deleted',
        description: 'The combo has been removed.'
      });
    }
  };

  const toggleComboActiveStatus = (comboId: string) => {
    setCombos(prev => prev.map(combo => 
      combo.id === comboId ? { ...combo, isActive: !combo.isActive } : combo
    ));
    
    // Update localStorage
    const userId = currentUser?.id || 'default_user';
    const combosKey = `combos_data_${userId}`;
    const updatedCombos = combos.map(combo => 
      combo.id === comboId ? { ...combo, isActive: !combo.isActive } : combo
    );
    localStorage.setItem(combosKey, JSON.stringify(updatedCombos));
  };

  // Get cross-selling combo recommendations based on current order
  const getCrossSellingCombos = (): Combo[] => {
    if (orderItems.length === 0) return [];
    
    const orderItemIds = orderItems.map(item => item.menuItem.id);
    
    return combos.filter(combo => 
      combo.isActive && 
      combo.items.some(comboItem => orderItemIds.includes(comboItem.menuItem.id)) &&
      !combo.items.every(comboItem => orderItemIds.includes(comboItem.menuItem.id))
    );
  };


  // Add-ons dropdown management
  const toggleAddOnsDropdown = (menuItemId: string) => {
    setShowAddOnsDropdown(prev => ({
      ...prev,
      [menuItemId]: !prev[menuItemId]
    }));
  };

  // Custom add-on management functions
  const toggleCustomAddOnInput = (menuItemId: string) => {
    setShowCustomAddOnInput(prev => ({
      ...prev,
      [menuItemId]: !prev[menuItemId]
    }));
  };

  const handleCustomAddOnInput = (menuItemId: string, value: string) => {
    setCustomAddOnInputs(prev => ({
      ...prev,
      [menuItemId]: value
    }));
  };

  const addCustomAddOn = (menuItemId: string) => {
    const customText = customAddOnInputs[menuItemId]?.trim();
    if (!customText) return;

    const customAddOn: AddOn = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: customText,
      price: 0, // Custom add-ons are free by default
      type: 'custom'
    };

    addAddOn(menuItemId, customAddOn);
    
    // Clear the input and hide the input field
    setCustomAddOnInputs(prev => ({
      ...prev,
      [menuItemId]: ''
    }));
    setShowCustomAddOnInput(prev => ({
      ...prev,
      [menuItemId]: false
    }));
  };

  const removeCustomAddOn = (menuItemId: string, addOnId: string) => {
    removeAddOn(menuItemId, addOnId);
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => {
      // Use combo discounted price if item is from a combo, otherwise use regular price
      const basePrice = item.comboInfo 
        ? item.comboInfo.discountedPrice 
        : parseFloat(formatPrice(item.selectedSize?.price || item.menuItem.price));
      const addOnsPrice = (item.addOns || []).reduce((addOnTotal, addOn) => addOnTotal + addOn.price, 0);
      const itemTotal = (basePrice + addOnsPrice) * item.quantity;
      return total + itemTotal;
    }, 0);
  };

  const formatPrice = (price: string | number) => {
    if (!price) return '0';
    if (typeof price === 'number') return price.toString();
    if (typeof price === 'string') {
      // If it's already a clean number string, return it
      if (/^\d+\.?\d*$/.test(price)) return price;
      // If it's a string with currency symbols, clean it up
      const cleaned = price.replace(/[^\d.,]/g, '').replace(',', '.');
      return cleaned || '0';
    }
    return '0';
  };

  // Function to deduct inventory when order is placed
  const deductInventoryForOrder = (userId: string, orderData: any) => {
    console.log('🔄 [INVENTORY-DEDUCTION] Starting inventory deduction for order:', orderData.id);
    
    // Get current inventory and menu
    const inventory = JSON.parse(localStorage.getItem(`inventory_${userId}`) || '[]');
    const dishes = getDishes(userId);
    
    if (!inventory || inventory.length === 0) {
      console.warn('⚠️ [INVENTORY-DEDUCTION] No inventory found');
      return;
    }
    
    if (!dishes || dishes.length === 0) {
      console.warn('⚠️ [INVENTORY-DEDUCTION] No dishes found');
      return;
    }
    
    console.log('📦 [INVENTORY-DEDUCTION] Current inventory items:', inventory.length);
    console.log('🍽️ [INVENTORY-DEDUCTION] Available dishes:', dishes.length);
    
    // Build deduction plan
    const deductionPlan: any[] = [];
    
    for (const orderItem of orderData.items) {
      const dish = dishes.find((d: any) => d.name.toLowerCase() === orderItem.name.toLowerCase());
      
      if (!dish) {
        console.warn(`⚠️ [INVENTORY-DEDUCTION] Dish not found in menu: ${orderItem.name}`);
        continue;
      }
      
      console.log(`🍽️ [INVENTORY-DEDUCTION] Processing dish: ${orderItem.name} (quantity: ${orderItem.quantity})`);
      
      // Process ingredients for this dish
      if (Array.isArray(dish.ingredients)) {
        for (const ingredient of dish.ingredients) {
          let ingredientName = '';
          let quantityPerDish = 1;
          
          // Handle different ingredient formats
          if (typeof ingredient === 'string') {
            ingredientName = ingredient;
            quantityPerDish = 1;
          } else if (ingredient && typeof ingredient === 'object') {
            // TypeScript check for ingredient properties
            const ingObj = ingredient as any;
            ingredientName = ingObj.inventoryItemName || ingObj.name || '';
            quantityPerDish = ingObj.quantityPerDish || ingObj.quantity || 1;
          }
          
          if (!ingredientName) continue;
          
          // Find inventory item
          const invIdx = inventory.findIndex((item: any) => 
            item.name.toLowerCase() === ingredientName.toLowerCase()
          );
          
          if (invIdx !== -1) {
            const invItem = inventory[invIdx];
            const totalDeduct = quantityPerDish * orderItem.quantity;
            
            console.log(`📊 [INVENTORY-DEDUCTION] ${ingredientName}: ${quantityPerDish} x ${orderItem.quantity} = ${totalDeduct} ${invItem.unit}`);
            
            deductionPlan.push({
              idx: invIdx,
              name: ingredientName,
              required: totalDeduct,
              available: invItem.quantity || 0,
              unit: invItem.unit || 'pieces'
            });
          } else {
            console.warn(`⚠️ [INVENTORY-DEDUCTION] Ingredient not found in inventory: ${ingredientName}`);
          }
        }
      }
    }
    
    // Execute deductions
    let totalDeductions = 0;
    for (const deduction of deductionPlan) {
      const invItem = inventory[deduction.idx];
      const oldQuantity = invItem.quantity || 0;
      const newQuantity = Math.max(0, oldQuantity - deduction.required);
      
      invItem.quantity = newQuantity;
      invItem.quantityUsed = (invItem.quantityUsed || 0) + deduction.required;
      invItem.totalUsed = (invItem.totalUsed || 0) + deduction.required;
      invItem.lastUpdated = new Date().toISOString();
      
      console.log(`✅ [INVENTORY-DEDUCTION] ${deduction.name}: ${oldQuantity} → ${newQuantity} ${deduction.unit}`);
      totalDeductions++;
    }
    
    // Save updated inventory
    localStorage.setItem(`inventory_${userId}`, JSON.stringify(inventory));
    console.log(`✅ [INVENTORY-DEDUCTION] Inventory updated! Total deductions: ${totalDeductions}`);
    
    // Dispatch inventory updated event
    const inventoryUpdatedEvent = new CustomEvent('inventoryUpdated', {
      detail: {
        orderId: orderData.id,
        deductionsCount: totalDeductions,
        timestamp: new Date().toISOString()
      }
    });
    window.dispatchEvent(inventoryUpdatedEvent);
    console.log('📢 [INVENTORY-DEDUCTION] Inventory updated event dispatched');
  };

  const handlePlaceOrder = async () => {
    if (orderType === 'dine-in') {
      if (!customerInfo.tableNumber) {
        alert('Please enter table number');
        return;
      }
    } else if (orderType === 'take-away') {
      if (!customerInfo.name || !customerInfo.phone) {
        alert('Please enter customer name and phone');
        return;
      }
    } else if (orderType === 'home-delivery') {
      if (!customerInfo.name || !customerInfo.phone || !customerInfo.address?.street || !customerInfo.address?.city || !customerInfo.address?.pinCode || !driver) {
        alert('Please enter all delivery details including address and assign a driver');
        return;
      }
    }

    const orderData = {
      id: `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      orderType,
      driver: orderType === 'home-delivery' ? driver : undefined,
      customerInfo,
      items: orderItems.map(item => ({
        name: item.menuItem.name,
        quantity: item.quantity,
        unitPrice: item.menuItem.price,
        notes: item.notes,
        selectedSize: item.selectedSize,
        addOns: item.addOns || []
      })),
      totalAmount: calculateTotal(),
      createdAt: new Date().toISOString(),
      status: 'Order Received', // All orders (dine-in, take-away, delivery) start with "Order Received"
      source: 'order-entry',
      channel: 'On premise',
      currency: 'EUR',
      tableId: customerInfo.tableNumber || 'N/A'
    };

    try {
      // Store order in localStorage
      const userId = getUserId();
      const existingOrders = JSON.parse(localStorage.getItem(`orders_${userId}`) || '[]');
      existingOrders.push(orderData);
      localStorage.setItem(`orders_${userId}`, JSON.stringify(existingOrders));
      
      // Deduct inventory immediately when order is placed
      deductInventoryForOrder(userId, orderData);
      
      // Dispatch custom event to notify other components
      console.log('📡 Dispatching orderCreated event...');
      const event = new CustomEvent('orderCreated', { 
        detail: { orderId: orderData.id, orderType: orderData.orderType }
      });
      window.dispatchEvent(event);
      console.log('✅ Order created event dispatched:', event.detail);
      
      console.log('✅ Order created successfully:', orderData.id);
      
      // Show success message
      toast({
        title: "Order Created Successfully! 🎉",
        description: `Order #${orderData.id} has been created. Inventory has been updated automatically.`,
      });
      
      // Also call API for any server-side processing
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
      // If dine-in order, mark table as occupied
      if (orderType === 'dine-in' && customerInfo.tableNumber) {
        try {
          await fetch('/api/tables', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'occupy',
              tableId: customerInfo.tableNumber
            })
          });
          console.log(`✅ Table ${customerInfo.tableNumber} marked as occupied`);
        } catch (error) {
          console.error('Error updating table status:', error);
        }
      }
      
      setOrderItems([]);
      setCustomerInfo({ 
        name: '', 
        phone: '', 
        tableNumber: '', 
        email: '',
        address: {
          street: '',
          city: '',
          pinCode: ''
        }
      });
      setDriver('');
      setOrderType('dine-in');
      
      // Refresh orders and order history after placing new order
      loadOrders();
      fetchOrderHistory();
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order. Please try again.');
    }
  };

  // Payment functions
  const loadOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        // Use centralized filter to include split bills
        const pendingOrders = filterOrdersForPayment(data.orders).sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setOrders(pendingOrders);
      } else {
        console.error('Failed to fetch orders from API');
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    }
  };

  // Order History functions
  const fetchOrderHistory = async () => {
    if (currentUser) {
      setIsHistoryLoading(true);
      try {
        // Get orders from localStorage instead of API
        const userId = getUserId();
        const allOrders = JSON.parse(localStorage.getItem(`orders_${userId}`) || '[]');
        
        // Sort by creation date (newest first)
        const sortedOrders = allOrders.sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setCompletedOrders(sortedOrders);
        
        // Get tables from localStorage or API
        try {
        const resTables = await fetch('/api/tables');
        const dataTables = await resTables.json();
        setTables(dataTables.tables);
        } catch (error) {
          console.warn('Could not fetch tables, using empty array');
          setTables([]);
        }
        
        setLastRefresh(new Date());
        console.log(`📊 Order history refreshed: ${sortedOrders.length} orders found`);
      } catch (error) {
        console.error('Error fetching order history:', error);
      } finally {
        setIsHistoryLoading(false);
      }
    } else {
      setCompletedOrders([]);
      setTables([]);
      setIsHistoryLoading(false);
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    // If cancelling, show dialog for reason
    if (newStatus === 'Cancelled') {
      const order = completedOrders.find(o => o.id === orderId);
      setOrderToCancel({ id: orderId, order });
      setCancelReason('');
      setShowCancelDialog(true);
      return;
    }

    // For other statuses, update directly
    await performStatusUpdate(orderId, newStatus);
  };

  // Perform the actual status update
  const performStatusUpdate = async (orderId: string, newStatus: string, reason?: string) => {
    try {
      console.log('🔄 [STATUS-UPDATE] Updating order status:', orderId, 'to', newStatus);
      
      // Update order in localStorage
      const userId = getUserId();
      const ordersKey = `orders_${userId}`;
      const storedOrders = localStorage.getItem(ordersKey);
      
      if (storedOrders) {
        try {
          const allOrders = JSON.parse(storedOrders);
          const updatedOrders = allOrders.map((order: any) => {
            if (order.id === orderId) {
              return {
                ...order,
                status: newStatus,
                cancellationReason: reason || order.cancellationReason || '',
                updatedAt: new Date().toISOString()
              };
            }
            return order;
          });
          
          localStorage.setItem(ordersKey, JSON.stringify(updatedOrders));
          console.log('✅ [STATUS-UPDATE] Order updated in localStorage');
          console.log('🔍 [STATUS-UPDATE] Updated order details:', updatedOrders.find((o: any) => o.id === orderId));
        } catch (error) {
          console.error('❌ [STATUS-UPDATE] Error updating order in localStorage:', error);
        }
      }

      // Also update via API for consistency
      try {
        const response = await fetch('/api/orders', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: orderId,
            status: newStatus,
            cancellationReason: reason || '',
            userId: userId
          })
        });

        if (response.ok) {
          console.log('✅ [STATUS-UPDATE] Order updated via API');
        } else {
          console.warn('⚠️ [STATUS-UPDATE] API update failed, but localStorage was updated');
        }
      } catch (apiError) {
        console.warn('⚠️ [STATUS-UPDATE] API update failed, but localStorage was updated:', apiError);
      }

      toast({
        title: "Status Updated",
        description: `Order ${orderId} status updated to ${newStatus}`,
      });
      
      // Dispatch custom event to notify other parts of the system
      const statusUpdatedEvent = new CustomEvent('orderStatusUpdated', {
        detail: {
          orderId: orderId,
          newStatus: newStatus,
          previousStatus: completedOrders.find(o => o.id === orderId)?.status || 'Unknown',
          timestamp: new Date().toISOString()
        }
      });
      window.dispatchEvent(statusUpdatedEvent);
      console.log('📢 [STATUS-UPDATE] Order status updated event dispatched');
      
      // Refresh the order history
      fetchOrderHistory();
      
      // Also refresh payment section if it's active (in case order status affects pending orders)
      if (activeSubsection === 'payment') {
        console.log('🔄 [STATUS-UPDATE] Refreshing payment section due to status change');
        const updatedStoredOrders = localStorage.getItem(ordersKey);
        if (updatedStoredOrders) {
          const allOrders = JSON.parse(updatedStoredOrders);
          const pendingOrders = filterOrdersForPayment(allOrders);
          setOrders(pendingOrders);
          setLastOrderCount(pendingOrders.length);
        }
      }
      
    } catch (error) {
      console.error('❌ [STATUS-UPDATE] Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  // Handle edit order
  const handleEditOrder = (order: any) => {
    // Switch to POS tab and populate with order data
    setActiveSubsection('pos');
    
    // Populate order items
    const orderItems = order.items.map((item: any) => ({
      menuItem: {
        id: item.name,
        name: item.name,
        price: item.unitPrice,
        category: 'Edit Mode'
      },
      quantity: item.quantity,
      notes: item.notes || '',
      selectedSize: item.selectedSize || ''
    }));
    
    setOrderItems(orderItems);
    setCustomerInfo({
      name: order.customerInfo?.name || '',
      phone: order.customerInfo?.phone || '',
      tableNumber: order.customerInfo?.tableNumber || order.tableId || '',
      email: order.customerInfo?.email || '',
      address: order.customerInfo?.address || {
        street: '',
        city: '',
        pinCode: ''
      }
    });
    setOrderType(order.orderType || 'dine-in');
    
    toast({
      title: "Order Loaded for Editing",
      description: `Order ${order.id} loaded in POS. You can modify items and place a new order.`,
    });
  };

  // Handle cancellation dialog
  const handleCancelOrder = async () => {
    if (orderToCancel) {
      await performStatusUpdate(orderToCancel.id, 'Cancelled', cancelReason);
      setShowCancelDialog(false);
      setCancelReason('');
      setOrderToCancel(null);
    }
  };

  const handleCancelDialogClose = () => {
    setShowCancelDialog(false);
    setCancelReason('');
    setOrderToCancel(null);
  };

  // Handle customer edit
  const handleEditCustomer = (order: any) => {
    setEditingOrder(order);
    setEditCustomerInfo({
      name: order.customerInfo?.name || order.customerName || '',
      phone: order.customerInfo?.phone || '',
      tableNumber: order.customerInfo?.tableNumber || order.tableId || '',
      email: order.customerInfo?.email || '',
      address: order.customerInfo?.address || {
        street: '',
        city: '',
        pinCode: ''
      }
    });
    setShowCustomerEditDialog(true);
  };

  const handleSaveCustomerEdit = async () => {
    if (!editingOrder) return;

    try {
      const response = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingOrder.id,
          customerInfo: editCustomerInfo,
          userId: currentUser?.id || 'default_user'
        })
      });

      if (response.ok) {
        toast({
          title: "Customer Details Updated",
          description: `Customer information for order ${editingOrder.id} has been updated`,
        });
        // Refresh the order history
        fetchOrderHistory();
        setShowCustomerEditDialog(false);
        setEditingOrder(null);
      } else {
        throw new Error('Failed to update customer details');
      }
    } catch (error) {
      console.error('Error updating customer details:', error);
      toast({
        title: "Error",
        description: "Failed to update customer details",
        variant: "destructive",
      });
    }
  };

  const handleCustomerEditDialogClose = () => {
    setShowCustomerEditDialog(false);
    setEditingOrder(null);
    setEditCustomerInfo({
      name: '',
      phone: '',
      tableNumber: '',
      email: '',
      address: {
        street: '',
        city: '',
        pinCode: ''
      }
    });
  };

  // Handle order details dialog
  const handleViewOrderDetails = (order: any) => {
    setSelectedOrderForDetails(order);
    setShowOrderDetailsDialog(true);
  };

  const handleOrderDetailsDialogClose = () => {
    setShowOrderDetailsDialog(false);
    setSelectedOrderForDetails(null);
  };

  // Handle simple split bill creation for testing
  const handleSimpleSplitBill = (order: any) => {
    if (!order || order.status === 'Split') return;
    
    try {
      const userId = getUserId();
      const ordersKey = `orders_${userId}`;
      const existingOrders = JSON.parse(localStorage.getItem(ordersKey) || '[]');
      
      // Create two split bills
      const splitBill1 = {
        ...order,
        id: `${order.id}_split_1`,
        parentOrderId: order.id,
        splitNumber: 1,
        totalSplits: 2,
        payerName: 'Payer 1',
        items: order.items.slice(0, Math.ceil(order.items.length / 2)),
        totalAmount: Math.round((order.totalAmount / 2) * 100) / 100, // Round to 2 decimal places
        status: 'Pending Payment',
        isSplitBill: true
      };
      
      const splitBill2 = {
        ...order,
        id: `${order.id}_split_2`,
        parentOrderId: order.id,
        splitNumber: 2,
        totalSplits: 2,
        payerName: 'Payer 2',
        items: order.items.slice(Math.ceil(order.items.length / 2)),
        totalAmount: Math.round((order.totalAmount / 2) * 100) / 100, // Round to 2 decimal places
        status: 'Pending Payment',
        isSplitBill: true
      };
      
      // Update original order status
      const updatedOrders = existingOrders.map((o: any) => {
        if (o.id === order.id) {
          return { ...o, status: 'Split', splitInto: 2 };
        }
        return o;
      });
      
      // Add split bills
      updatedOrders.push(splitBill1, splitBill2);
      
      // Save back to localStorage
      localStorage.setItem(ordersKey, JSON.stringify(updatedOrders));
      
      toast({
        title: "Split Bills Created! 🎉",
        description: `Order split into 2 separate bills for ${splitBill1.payerName} and ${splitBill2.payerName}`
      });
      
      // Refresh the orders list - include split bills in pending orders
      const pendingOrders = updatedOrders.filter((order: any) => 
        (order.status === 'Pending' || order.status === 'Order Received' || order.status === 'Pending Payment') &&
        order.orderType !== 'home-delivery' &&
        (order.status !== 'Split' || order.isSplitBill) // Include split bills but exclude parent orders
      );
      
      console.log('🔄 [QUICK-SPLIT] Updated orders:', updatedOrders.length);
      console.log('🔄 [QUICK-SPLIT] Pending orders after split:', pendingOrders.length);
      console.log('🔄 [QUICK-SPLIT] Split bills created:', pendingOrders.filter((o: any) => o.isSplitBill));
      
      setOrders(pendingOrders);
      
      // Clear selected order so user can see the new split bills
      setSelectedOrder(null);
      
    } catch (error) {
      console.error('Error creating split bills:', error);
      toast({
        title: "Error",
        description: "Failed to create split bills. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle print bill for any order
  const handlePrintBill = (order: any) => {
    console.log('🔄 [PRINT-BILL] Starting print process for order:', {
      id: order.id,
      payerName: order.payerName,
      totalAmount: order.totalAmount,
      status: order.status,
      isSplitBill: order.isSplitBill,
      parentOrderId: order.parentOrderId
    });

    const paymentDetails = {
      paymentMethod: order.paymentMode || 'cash',
      tipAmount: order.tipAmount || 0,
      discountPercentage: order.discountPercentage || 0,
      discountAmount: order.discountAmount || 0,
      amountPaid: order.amountPaid || order.totalAmount,
      change: order.change || 0
    };

    const billData = generateBill(order, paymentDetails);
    setReceiptData(billData);
    setShowBill(true);
    
    // Open bill in new tab
    printReceipt(billData);
    
    // Update order status to completed and remove from payment section
    console.log('🔄 [PRINT-BILL] Marking order as completed:', order.id);
    
    // Use the performStatusUpdate function directly to ensure it works
    performStatusUpdate(order.id, 'Completed');
    
    // If this is a split bill, check if all split bills are completed
    if (order.isSplitBill && order.parentOrderId) {
      console.log('🔄 [PRINT-BILL] Checking if all split bills are completed for parent:', order.parentOrderId);
      checkAndUpdateParentOrderStatus(order.parentOrderId);
    }
    
    // Show success message
    toast({
      title: "Bill Printed! 🧾",
      description: `Split bill for ${order.payerName} has been printed and marked as completed.`,
    });

    // Force refresh the payment section after a short delay
    setTimeout(() => {
      console.log('🔄 [PRINT-BILL] Force refreshing payment section...');
      refreshOrdersForPayment();
    }, 1000);
  };

  // Check if all split bills are completed and update parent order status
  const checkAndUpdateParentOrderStatus = (parentOrderId: string) => {
    const userId = getUserId();
    const ordersKey = `orders_${userId}`;
    const storedOrders = localStorage.getItem(ordersKey);
    
    if (storedOrders) {
      try {
        const allOrders = JSON.parse(storedOrders);
        
        // Find all split bills for this parent order
        const splitBills = allOrders.filter((order: any) => 
          order.isSplitBill && order.parentOrderId === parentOrderId
        );
        
        console.log(`🔍 [PARENT-CHECK] Found ${splitBills.length} split bills for parent ${parentOrderId}`);
        console.log(`🔍 [PARENT-CHECK] Split bill statuses:`, splitBills.map((bill: any) => ({ id: bill.id, status: bill.status })));
        
        // Check if all split bills are completed
        const allCompleted = splitBills.every((bill: any) => bill.status === 'Completed');
        
        if (allCompleted && splitBills.length > 0) {
          console.log('✅ [PARENT-CHECK] All split bills completed, updating parent order status');
          
          // Update parent order status to completed
          const updatedOrders = allOrders.map((order: any) => {
            if (order.id === parentOrderId) {
              return {
                ...order,
                status: 'Completed',
                updatedAt: new Date().toISOString()
              };
            }
            return order;
          });
          
          localStorage.setItem(ordersKey, JSON.stringify(updatedOrders));
          
          // Show notification
          toast({
            title: "All Split Bills Completed! 🎉",
            description: `All split bills for order ${parentOrderId} have been completed. The group will now disappear from the payment section.`,
          });
        } else {
          console.log(`⏳ [PARENT-CHECK] Not all split bills completed yet (${splitBills.filter((bill: any) => bill.status === 'Completed').length}/${splitBills.length})`);
        }
      } catch (error) {
        console.error('❌ [PARENT-CHECK] Error checking parent order status:', error);
      }
    }
  };

  // Helper to get table status
  const getTableStatus = (tableNumber: string) => {
    const table = tables.find((t: any) => t.id === tableNumber);
    return table ? table.status : 'Unknown';
  };

  // Helper to group split bills by parent order ID
  const groupSplitBills = (orders: any[]) => {
    const splitBillGroups = new Map<string, any[]>();
    const regularOrders: any[] = [];
    const processedOrderIds = new Set<string>(); // Track processed order IDs to prevent duplicates

    console.log('🔍 [GROUP-SPLIT-BILLS] Grouping orders:', orders.length);
    console.log('🔍 [GROUP-SPLIT-BILLS] Orders data:', orders.map(o => ({
      id: o.id,
      isSplitBill: o.isSplitBill,
      parentOrderId: o.parentOrderId,
      status: o.status,
      payerName: o.payerName
    })));

    orders.forEach((order) => {
      // Skip if this order ID has already been processed (prevents duplicate key errors)
      if (processedOrderIds.has(order.id)) {
        console.log(`⚠️ [GROUP-SPLIT-BILLS] Skipped duplicate order ID ${order.id}`);
        return;
      }

      if (order.isSplitBill && order.parentOrderId) {
        // This is a split bill - add it to the group (with deduplication)
        const existing = splitBillGroups.get(order.parentOrderId) || [];
        // Check if this bill is already in the group (deduplication)
        const alreadyExists = existing.some(bill => bill.id === order.id);
        if (!alreadyExists) {
          existing.push(order);
          splitBillGroups.set(order.parentOrderId, existing);
          processedOrderIds.add(order.id);
          console.log(`✅ [GROUP-SPLIT-BILLS] Added split bill ${order.id} to group ${order.parentOrderId}`);
        } else {
          console.log(`⚠️ [GROUP-SPLIT-BILLS] Skipped duplicate split bill ${order.id}`);
        }
      } else if (order.status !== 'Split' && !order.isSplitBill) {
        // This is a regular order (not split, not a split bill)
        regularOrders.push(order);
        processedOrderIds.add(order.id);
        console.log(`✅ [GROUP-SPLIT-BILLS] Added regular order ${order.id}`);
      } else {
        console.log(`⏭️ [GROUP-SPLIT-BILLS] Skipped order ${order.id} (status: ${order.status}, isSplitBill: ${order.isSplitBill})`);
        processedOrderIds.add(order.id); // Still mark as processed to prevent duplicates
      }
    });

    console.log('📊 [GROUP-SPLIT-BILLS] Result:', {
      splitBillGroupsCount: splitBillGroups.size,
      regularOrdersCount: regularOrders.length,
      processedOrderIds: Array.from(processedOrderIds),
      splitBillGroups: Array.from(splitBillGroups.entries()).map(([parentId, bills]) => ({
        parentId,
        billCount: bills.length,
        bills: bills.map(b => ({ id: b.id, payer: b.payerName }))
      }))
    });

    return { splitBillGroups, regularOrders };
  };

  const getUserId = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userId') || currentUser?.id || 'default_user';
    }
    return 'default_user';
  };

  // Centralized filter function for payment section orders
  const filterOrdersForPayment = (allOrders: any[]) => {
    return allOrders.filter((order: any) => {
      const notDelivery = order.orderType !== 'home-delivery';
      
      // Special handling for split bills - include them if parent order still has pending split bills
      if (order.isSplitBill && order.parentOrderId) {
        // Check if all split bills for this parent order are completed
        const parentOrderSplitBills = allOrders.filter((o: any) => 
          o.isSplitBill && o.parentOrderId === order.parentOrderId
        );
        const allSplitBillsCompleted = parentOrderSplitBills.every((bill: any) => bill.status === 'Completed');
        
        // Include this split bill only if not all split bills in the group are completed
        return notDelivery && !allSplitBillsCompleted;
      }
      
      // For regular orders and parent orders
      const statusMatch = order.status === 'Pending' || order.status === 'Order Received' || order.status === 'Pending Payment';
      const notSplitParent = order.status !== 'Split';
      
      return statusMatch && notDelivery && notSplitParent;
    });
  };

  // Global function to refresh orders (can be called from split bill page)
  const refreshOrdersForPayment = () => {
    const userId = getUserId();
    const ordersKey = `orders_${userId}`;
    const storedOrders = localStorage.getItem(ordersKey);
    if (storedOrders) {
      try {
        const allOrders = JSON.parse(storedOrders);
        console.log('🔍 [GLOBAL-REFRESH] All orders in localStorage:', allOrders.map((o: any) => ({
          id: o.id,
          status: o.status,
          isSplitBill: o.isSplitBill,
          parentOrderId: o.parentOrderId,
          totalAmount: o.totalAmount
        })));
        
        const pendingOrders = filterOrdersForPayment(allOrders);
        console.log('🔍 [GLOBAL-REFRESH] Filtered pending orders:', pendingOrders.map((o: any) => ({
          id: o.id,
          status: o.status,
          isSplitBill: o.isSplitBill,
          parentOrderId: o.parentOrderId,
          totalAmount: o.totalAmount
        })));
        
        setOrders(pendingOrders);
        console.log('🔄 [GLOBAL-REFRESH] Orders refreshed:', pendingOrders.length);
        console.log('🔄 [GLOBAL-REFRESH] Split bills:', pendingOrders.filter((o: any) => o.isSplitBill).length);
      } catch (error) {
        console.error('❌ [GLOBAL-REFRESH] Error refreshing orders:', error);
      }
    }
  };

        // Make the function globally available
        useEffect(() => {
          (window as any).fetchOrdersForPayment = refreshOrdersForPayment;
          
          // Also listen for window focus to refresh when split bill page closes
          const handleFocus = () => {
            console.log('🔄 [ORDERS-PAGE] Window focused, refreshing orders');
            refreshOrdersForPayment();
          };
          
          window.addEventListener('focus', handleFocus);
          
          return () => {
            delete (window as any).fetchOrdersForPayment;
            window.removeEventListener('focus', handleFocus);
          };
        }, []);



  const getTotalWithTip = (): number => {
    if (!selectedOrder) return 0;
    const baseAmount = selectedOrder.totalAmount;
    const tip = parseFloat(tipAmount) || 0;
    const discount = parseFloat(discountPercentage) || 0;
    const discountAmount = (baseAmount * discount) / 100;
    
    // Calculate VAT on items only (excluding tips)
    if (taxCalculation) {
      return GermanTaxService.calculateFinalOrderTotal(taxCalculation, tip, discountAmount);
    }
    
    // Fallback to simple calculation if no tax calculation available
    return baseAmount + tip - discountAmount;
  };

  const calculateChange = (): number => {
    if (!selectedOrder || !amountReceived) return 0;
    const received = parseFloat(amountReceived) || 0;
    const total = getTotalWithTip();
    return Math.max(0, received - total);
  };

  const getDiscountAmount = (): number => {
    if (!selectedOrder) return 0;
    const baseAmount = selectedOrder.totalAmount;
    const discount = parseFloat(discountPercentage) || 0;
    return (baseAmount * discount) / 100;
  };

  // Calculate German tax for selected order
  const calculateGermanTax = (order: any): TaxCalculation => {
    const taxableItems: TaxableItem[] = order.items.map((item: any) => ({
      id: item.name,
      name: item.name,
      price: parseFloat(item.unitPrice) || 0,
      category: item.category === 'beverage' ? 'beverage' : 'food',
      isAlcoholic: item.isAlcoholic || false,
      isTakeaway: order.orderType === 'takeaway' || order.orderType === 'delivery'
    }));

    return GermanTaxService.calculateOrderVATWithQuantities(
      taxableItems.map(item => ({
        item,
        quantity: order.items.find((i: any) => i.name === item.name)?.quantity || 1
      }))
    );
  };

  // Update tax calculation when selected order changes
  useEffect(() => {
    if (selectedOrder) {
      const tax = calculateGermanTax(selectedOrder);
      setTaxCalculation(tax);
    } else {
      setTaxCalculation(null);
    }
  }, [selectedOrder]);

  const generateBill = (order: any, paymentDetails: any) => {
    const discountAmount = paymentDetails.discountAmount || 0;
    const discountPercentage = paymentDetails.discountPercentage || 0;
    const subtotal = order.totalAmount;
    const tip = paymentDetails.tipAmount || 0;

    // Calculate German tax for the order (excluding tips)
    const taxCalc = calculateGermanTax(order);
    
    // Calculate final total with tips (tips are tax-exempt)
    const total = GermanTaxService.calculateFinalOrderTotal(taxCalc, tip, discountAmount);
    
    const billData = {
      id: GermanTaxService.generateReceiptId(order.id),
      orderId: order.id,
      date: GermanTaxService.formatDate(new Date()),
      time: GermanTaxService.formatTime(new Date()),
      tableId: order.tableId,
      items: order.items,
      subtotal: subtotal,
      discountPercentage: discountPercentage,
      discountAmount: discountAmount,
      tip: tip,
      total: total,
      paymentMethod: paymentDetails.paymentMethod,
      amountPaid: paymentDetails.amountPaid,
      change: paymentDetails.change || 0,
      // German tax information
      taxCalculation: taxCalc,
      businessInfo: GermanTaxService.getBusinessInfo(),
      // Split bill information
      isSplitBill: order.isSplitBill || false,
      parentOrderId: order.parentOrderId || null,
      splitNumber: order.splitNumber || null,
      totalSplits: order.totalSplits || null,
      payerName: order.payerName || null,
      // Legacy fields for compatibility
      companyName: GermanTaxService.getBusinessInfo().name,
      address: GermanTaxService.getBusinessInfo().address,
      phone: GermanTaxService.getBusinessInfo().phone,
      email: GermanTaxService.getBusinessInfo().email
    };
    return billData;
  };

  const printReceipt = (billData: any) => {
    const receiptWindow = window.open('', '_blank');
    if (receiptWindow) {
      receiptWindow.document.write(`
        <html>
          <head>
            <title>Receipt - Order ${billData.orderId}</title>
            <style>
              body { font-family: monospace; padding: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .line { border-bottom: 1px dashed #000; margin: 10px 0; }
              .item { display: flex; justify-content: space-between; margin: 5px 0; }
              .total { font-weight: bold; font-size: 18px; }
              .qr-info { text-align: center; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>${billData.businessInfo.name}</h2>
              <p>${billData.businessInfo.address}</p>
              <p>Tel: ${billData.businessInfo.phone}</p>
              <p>Email: ${billData.businessInfo.email}</p>
              <p><strong>USt-IdNr.:</strong> ${billData.businessInfo.vatId}</p>
            </div>
            <div class="line"></div>
            ${billData.isSplitBill ? `
            <div style="background-color: #f3f4f6; padding: 10px; margin-bottom: 10px; border-radius: 5px;">
              <p style="margin: 0; font-weight: bold; color: #7c3aed;">SPLIT BILL</p>
              <p style="margin: 0;"><strong>Parent Order:</strong> #${billData.parentOrderId}</p>
              <p style="margin: 0;"><strong>Split Bill:</strong> ${billData.splitNumber} of ${billData.totalSplits}</p>
              <p style="margin: 0;"><strong>Payer:</strong> ${billData.payerName}</p>
            </div>
            <div class="line"></div>
            ` : ''}
            <p><strong>Beleg-ID:</strong> ${billData.id}</p>
            <p><strong>Datum:</strong> ${billData.date} ${billData.time}</p>
            <p><strong>Tisch:</strong> ${billData.tableId || 'N/A'}</p>
            <div class="line"></div>
            <h3>Items:</h3>
            ${billData.items.map((item: any) => `
              <div class="item">
                <div>
                  <span>${item.name} x${item.quantity}</span>
                  ${item.notes ? `<div style="font-size: 10px; color: #666; margin-top: 2px; font-style: italic;">Note: ${item.notes}</div>` : ''}
                </div>
                <span>€${(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}</span>
              </div>
            `).join('')}
            <div class="line"></div>
            <div class="item">
              <span>Zwischensumme (Netto):</span>
              <span>€${billData.subtotal.toFixed(2)}</span>
            </div>
            
            <!-- German Tax Breakdown -->
            ${billData.taxCalculation ? `
            <div class="line"></div>
            <h4>Umsatzsteuer-Aufschlüsselung:</h4>
            ${billData.taxCalculation.vatBreakdown.rate7.net > 0 ? `
            <div class="item">
              <span>7% MwSt. (Netto):</span>
              <span>€${billData.taxCalculation.vatBreakdown.rate7.net.toFixed(2)}</span>
            </div>
            <div class="item">
              <span>7% MwSt. (Steuer):</span>
              <span>€${billData.taxCalculation.vatBreakdown.rate7.vat.toFixed(2)}</span>
            </div>
            ` : ''}
            ${billData.taxCalculation.vatBreakdown.rate19.net > 0 ? `
            <div class="item">
              <span>19% MwSt. (Netto):</span>
              <span>€${billData.taxCalculation.vatBreakdown.rate19.net.toFixed(2)}</span>
            </div>
            <div class="item">
              <span>19% MwSt. (Steuer):</span>
              <span>€${billData.taxCalculation.vatBreakdown.rate19.vat.toFixed(2)}</span>
            </div>
            ` : ''}
            <div class="item" style="font-weight: bold; border-top: 1px solid #000;">
              <span>Gesamt MwSt.:</span>
              <span>€${billData.taxCalculation.totalVat.toFixed(2)}</span>
            </div>
            ` : ''}
            
            ${billData.discountPercentage > 0 ? `
            <div class="item" style="color: #16a34a;">
              <span>Rabatt (${billData.discountPercentage}%):</span>
              <span>-€${billData.discountAmount.toFixed(2)}</span>
            </div>
            ` : ''}
            <div class="item" style="color: #6b7280; font-style: italic;">
              <span>Trinkgeld (steuerfrei):</span>
              <span>€${billData.tip.toFixed(2)}</span>
            </div>
            <div class="line"></div>
            <div class="item total">
              <span>Gesamtbetrag (Brutto):</span>
              <span>€${billData.total.toFixed(2)}</span>
            </div>
            <div class="line"></div>
            <p><strong>Zahlungsart:</strong> ${billData.paymentMethod === 'cash' ? 'Bar' : billData.paymentMethod === 'card' ? 'Karte' : billData.paymentMethod}</p>
            <p><strong>Bezahlt:</strong> €${billData.amountPaid.toFixed(2)}</p>
            ${billData.change > 0 ? `<p><strong>Wechselgeld:</strong> €${billData.change.toFixed(2)}</p>` : ''}
            <div class="qr-info">
              <p>Thank you for your visit!</p>
            </div>
          </body>
        </html>
      `);
      receiptWindow.document.close();
      receiptWindow.print();
    }
  };

  const processPayment = async () => {
    if (!selectedOrder || !selectedPaymentMethod) {
      toast({
        title: "Payment Error",
        description: "Please select an order and payment method",
        variant: "destructive",
      });
      return;
    }

    const totalAmount = getTotalWithTip();
    const received = parseFloat(amountReceived) || 0;

    // For cash payments, validate amount received
    if (selectedPaymentMethod === 'cash') {
      if (!amountReceived || received < totalAmount) {
        toast({
          title: "Insufficient Payment",
          description: `Received: €${received.toFixed(2)}, Required: €${totalAmount.toFixed(2)}`,
          variant: "destructive",
        });
        return;
      }
    }

    setProcessing(true);

    try {
      const userId = getUserId();
      const orderItems = selectedOrder.items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity
      }));

      const { validation } = await getInventoryImpact(userId, orderItems);
      if (!validation.canFulfill) {
        throw new Error(`Cannot process payment - insufficient inventory: ${validation.errors.join(', ')}`);
      }

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update order status via API
      const response = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedOrder.id,
          status: 'Completed',
          paymentMode: selectedPaymentMethod,
          tipAmount: parseFloat(tipAmount) || 0,
          amountPaid: selectedPaymentMethod === 'cash' ? received : totalAmount,
          userId: userId
        })
      });

      if (response.ok) {
        console.log('✅ [PAYMENT-PROCESSING] Order status updated successfully');

        // Update order in localStorage to mark as completed
        const userId = getUserId();
        const ordersKey = `orders_${userId}`;
        const storedOrders = localStorage.getItem(ordersKey);
        
        if (storedOrders) {
          try {
            const allOrders = JSON.parse(storedOrders);
            const updatedOrders = allOrders.map((order: any) => {
              if (order.id === selectedOrder.id) {
                return {
                  ...order,
                  status: 'Completed',
                  paymentMode: selectedPaymentMethod,
                  tipAmount: parseFloat(tipAmount) || 0,
                  amountPaid: selectedPaymentMethod === 'cash' ? received : totalAmount,
                  completedAt: new Date().toISOString(),
                  discountPercentage: parseFloat(discountPercentage) || 0,
                  discountAmount: getDiscountAmount(),
                  change: selectedPaymentMethod === 'cash' ? calculateChange() : 0
                };
              }
              return order;
            });
            
            localStorage.setItem(ordersKey, JSON.stringify(updatedOrders));
            console.log('✅ [PAYMENT-PROCESSING] Order updated in localStorage');
          } catch (error) {
            console.error('❌ [PAYMENT-PROCESSING] Error updating order in localStorage:', error);
          }
        }

        // Generate bill and receipt data
        const paymentDetails = {
          paymentMethod: selectedPaymentMethod,
          tipAmount: parseFloat(tipAmount) || 0,
          discountPercentage: parseFloat(discountPercentage) || 0,
          discountAmount: getDiscountAmount(),
          amountPaid: selectedPaymentMethod === 'cash' ? received : totalAmount,
          change: selectedPaymentMethod === 'cash' ? calculateChange() : 0
        };

        const billData = generateBill(selectedOrder, paymentDetails);
        setReceiptData(billData);
        setCompletedOrder(selectedOrder);
        setShowBill(true);
        
        // Open bill in new tab
        printReceipt(billData);

        toast({
          title: "Payment Successful",
          description: `Order ${selectedOrder.id} completed successfully`,
        });

        // Refresh payment section orders (this will remove the completed order from pending list)
        console.log('🔄 [PAYMENT-PROCESSING] Refreshing payment section...');
        const updatedStoredOrders = localStorage.getItem(ordersKey);
        if (updatedStoredOrders) {
          const allOrders = JSON.parse(updatedStoredOrders);
          const pendingOrders = filterOrdersForPayment(allOrders);
          setOrders(pendingOrders);
          setLastOrderCount(pendingOrders.length);
          console.log(`📊 [PAYMENT-PROCESSING] Updated payment section: ${pendingOrders.length} pending orders`);
        }

        // Refresh order history section
        fetchOrderHistory();

        // Dispatch custom event to notify other parts of the system
        const paymentCompletedEvent = new CustomEvent('paymentCompleted', {
          detail: {
            orderId: selectedOrder.id,
            status: 'Completed',
            paymentMethod: selectedPaymentMethod,
            totalAmount: totalAmount,
            timestamp: new Date().toISOString()
          }
        });
        window.dispatchEvent(paymentCompletedEvent);
        console.log('📢 [PAYMENT-PROCESSING] Payment completed event dispatched');

        // If dine-in order, free the table
        if (selectedOrder.orderType === 'dine-in' && selectedOrder.tableId) {
          try {
            await fetch('/api/tables', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'free',
                tableId: selectedOrder.tableId
              })
            });
            console.log(`✅ Table ${selectedOrder.tableId} marked as available`);
          } catch (error) {
            console.error('Error freeing table:', error);
          }
        }

        // Reset form
        setSelectedOrder(null);
        setSelectedPaymentMethod('');
        setAmountReceived('');
        setTipAmount('0');
        setDiscountPercentage('0');
      } else {
        throw new Error('Failed to update order status');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      toast({
        title: "Payment Failed",
        description: "An error occurred while processing payment",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading || !isInitialized) {
    return (
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading orders...</p>
            </div>
          </div>
        </div>
    );
  }

  if (!currentUser) {
    router.push('/login');
    return null;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="text-xs">Active</Badge>;
      case 'completed':
        return <Badge variant="success" className="text-xs">Completed</Badge>;
      case 'pending':
        return <Badge variant="warning" className="text-xs">Pending</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
      <div className="max-w-7xl mx-auto p-6">
        {/* Page Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Orders</h1>
            <p className="text-gray-600">Create, manage, and analyze orders</p>
          </div>
        </div>

        {/* Subsection Navigation */}
        <div className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ordersSubsections.map((subsection) => {
              const IconComponent = subsection.icon;
              const isActive = activeSubsection === subsection.id;
              
              // Define color themes for each card
              const getCardTheme = (id: string) => {
                switch(id) {
                  case 'pos': return {
                    gradient: 'from-orange-500 to-red-500',
                    bg: 'from-orange-50 to-red-50',
                    iconBg: 'bg-orange-100',
                    iconColor: 'text-orange-600',
                    textColor: 'text-orange-800',
                    ring: 'ring-orange-500'
                  };
                  case 'payment': return {
                    gradient: 'from-green-500 to-emerald-500',
                    bg: 'from-green-50 to-emerald-50',
                    iconBg: 'bg-green-100',
                    iconColor: 'text-green-600',
                    textColor: 'text-green-800',
                    ring: 'ring-green-500'
                  };
                  case 'order-history': return {
                    gradient: 'from-blue-500 to-purple-500',
                    bg: 'from-blue-50 to-purple-50',
                    iconBg: 'bg-blue-100',
                    iconColor: 'text-blue-600',
                    textColor: 'text-blue-800',
                    ring: 'ring-blue-500'
                  };
                  case 'order-analytics': return {
                    gradient: 'from-purple-500 to-pink-500',
                    bg: 'from-purple-50 to-pink-50',
                    iconBg: 'bg-purple-100',
                    iconColor: 'text-purple-600',
                    textColor: 'text-purple-800',
                    ring: 'ring-purple-500'
                  };
                  default: return {
                    gradient: 'from-gray-500 to-gray-600',
                    bg: 'from-gray-50 to-gray-100',
                    iconBg: 'bg-gray-100',
                    iconColor: 'text-gray-600',
                    textColor: 'text-gray-800',
                    ring: 'ring-gray-500'
                  };
                }
              };
              
              const theme = getCardTheme(subsection.id);
              
              return (
                <Card 
                  key={subsection.id}
                  className={`cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                    isActive 
                      ? 'ring-2 ' + theme.ring + ' shadow-lg bg-gradient-to-br ' + theme.bg
                      : 'hover:shadow-lg bg-gradient-to-br ' + theme.bg
                  }`}
                  onClick={() => setActiveSubsection(subsection.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className={`p-3 rounded-xl ${theme.iconBg} shadow-md`}>
                        <IconComponent className={`h-6 w-6 ${theme.iconColor}`} />
                        </div>
                        <div>
                        <CardTitle className={`text-base font-bold ${theme.textColor}`}>
                            {subsection.title}
                          </CardTitle>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Active Subsection Content */}
          {activeSubsection === 'pos' && (
          <div className="flex flex-col">
              {/* Notification Bars - Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* SmartChefBot Notification Bar - Dropdown */}
                <Card className="border border-navy-800/50 shadow-lg bg-navy-900 rounded-xl overflow-hidden">
                  <CardHeader 
                    className="pb-4 cursor-pointer hover:bg-navy-800/30 transition-colors border-b border-navy-800/50"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowSmartChefNotifications(prev => !prev);
                    }}
                  >
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-600/80 to-indigo-600/80 rounded-xl flex items-center justify-center shadow-md border border-purple-500/20">
                          <ChefHat className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">SmartChefBot Notifications</h3>
                          <p className="text-xs text-navy-300">AI-Powered Insights & Forecasts</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {smartChefNotifications.filter(n => n.priority === 'high').length > 0 && (
                          <Badge 
                            variant="destructive" 
                            className="text-xs font-semibold bg-red-600/90 hover:bg-red-600 border-red-500/30 pointer-events-none"
                          >
                            {smartChefNotifications.filter(n => n.priority === 'high').length} Urgent
                          </Badge>
                        )}
                        <Badge 
                          variant="secondary" 
                          className="text-xs bg-navy-800/60 text-navy-100 border-navy-700/50 pointer-events-none"
                        >
                          {smartChefNotifications.length} Total
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-navy-200 hover:bg-navy-800/40 hover:text-white"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowSmartChefNotifications(prev => !prev);
                          }}
                        >
                          {showSmartChefNotifications ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  {showSmartChefNotifications && (
                    <CardContent 
                      className="pt-4 pb-6 bg-navy-900"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                        {smartChefNotifications.map((notification) => {
                          const getIcon = () => {
                            switch (notification.type) {
                              case 'forecast': return <TrendingUp className="h-4 w-4" />;
                              case 'demand': return <TrendingDown className="h-4 w-4" />;
                              case 'variance': return <AlertTriangle className="h-4 w-4" />;
                              case 'stock': return <Package className="h-4 w-4" />;
                              case 'weather': return <Cloud className="h-4 w-4" />;
                              case 'waste': return <Leaf className="h-4 w-4" />;
                              case 'efficiency': return <CheckCircle className="h-4 w-4" />;
                              case 'surplus': return <AlertTriangle className="h-4 w-4" />;
                              case 'dish-flag': return <Info className="h-4 w-4" />;
                              case 'co2': return <Leaf className="h-4 w-4" />;
                              default: return <Info className="h-4 w-4" />;
                            }
                          };
                          const getPriorityColor = () => {
                            switch (notification.priority) {
                              case 'high': return 'bg-red-600/15 border-red-500/30';
                              case 'medium': return 'bg-yellow-600/15 border-yellow-500/30';
                              case 'low': return 'bg-blue-600/15 border-blue-500/30';
                              default: return 'bg-navy-800/40 border-navy-700/50';
                            }
                          };
                          return (
                            <div key={notification.id} className={`p-3 rounded-lg border ${getPriorityColor()} backdrop-blur-sm transition-colors hover:border-opacity-60`}>
                              <div className="flex items-start gap-2">
                                <div className="text-navy-200 mt-0.5">{getIcon()}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-sm text-white">{notification.title}</h4>
                                    {notification.priority === 'high' && (
                                      <Badge variant="destructive" className="text-xs bg-red-600/90 border-red-500/30">Urgent</Badge>
                                    )}
                                    {notification.actionRequired && (
                                      <Badge variant="outline" className="text-xs border-orange-500/40 text-orange-200 bg-orange-600/15">
                                        Action Needed
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-navy-300 mb-1">{notification.message}</p>
                                  <p className="text-xs text-navy-400">
                                    {new Date(notification.timestamp).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  )}
                </Card>

                {/* Delivery Orders Notification Bar - Dropdown */}
                <Card className="border border-navy-800/50 shadow-lg bg-navy-900 rounded-xl overflow-hidden">
                  <CardHeader 
                    className="pb-4 cursor-pointer hover:bg-navy-800/30 transition-colors border-b border-navy-800/50"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowDeliveryNotifications(prev => !prev);
                    }}
                  >
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-600/80 to-teal-600/80 rounded-xl flex items-center justify-center shadow-md border border-emerald-500/20">
                          <Globe2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">Delivery Orders</h3>
                          <p className="text-xs text-navy-300">Marketplace Feed - Wolt, Lieferando, Uber Eats</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {thirdPartySummary.total > 0 && (
                          <Badge 
                            variant="secondary" 
                            className="text-xs bg-navy-800/60 text-navy-100 border-navy-700/50 font-semibold pointer-events-none"
                          >
                            {thirdPartySummary.total} Active
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-navy-200 hover:bg-navy-800/40 hover:text-white"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowDeliveryNotifications(prev => !prev);
                          }}
                        >
                          {showDeliveryNotifications ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  {showDeliveryNotifications && (
                    <CardContent 
                      className="pt-4 pb-6 bg-navy-900"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {thirdPartyOrders.length > 0 ? (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {thirdPartyOrders.map((order) => {
                            const partnerMeta = partnerStyles[order.partner];
                            const statusMeta = statusStyles[order.status];
                            const initials = order.partner
                              .split(' ')
                              .filter(Boolean)
                              .map((word) => word.charAt(0))
                              .join('');
                            return (
                              <div key={order.id} className="rounded-lg border border-navy-700/50 bg-navy-800/40 backdrop-blur-sm p-4 transition-colors hover:border-navy-700/70 hover:bg-navy-800/50">
                                <div className="flex items-start gap-3">
                                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-semibold ${partnerMeta.avatar}`}>
                                    {initials}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="text-sm font-semibold text-white">{order.partner}</p>
                                      <Badge className={`text-[11px] font-semibold ${statusMeta}`}>
                                        {order.status}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-navy-400 mb-1">#{order.id}</p>
                                    <p className="text-sm text-navy-200 mb-2">{order.items}</p>
                                    <div className="flex items-center gap-2 text-sm text-navy-400">
                                      <Clock className="h-4 w-4" />
                                      <span>{order.eta}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-navy-400 text-sm">
                          No incoming marketplace orders
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              </div>
              
              {/* Combo Section - Moved to bottom */}
              <div className="order-2 pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Combo Management</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Combo Creator Card */}
                  <Card className="cursor-pointer transition-all duration-300 hover:shadow-lg" onClick={() => {
                    setShowComboCreator(!showComboCreator);
                    setShowComboSidebar(false);
                    setShowAllCombos(false);
                  }}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-blue-600" />
                          <span>Combo Creator</span>
              </div>
                        <Button
                          size="sm"
                          variant={showComboCreator ? "default" : "outline"}
                          className="h-6 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowComboCreator(!showComboCreator);
                            setShowComboSidebar(false);
                            setShowAllCombos(false);
                          }}
                        >
                          {showComboCreator ? 'Hide' : 'Create'}
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-gray-600">Create custom combos with discounts</p>
                    </CardContent>
                  </Card>

                  {/* Combo Suggestions Card */}
                  <Card className="cursor-pointer transition-all duration-300 hover:shadow-lg" onClick={() => {
                    setShowComboSidebar(!showComboSidebar);
                    setShowComboCreator(false);
                    setShowAllCombos(false);
                  }}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-purple-600" />
                          <span>Smart Suggestions</span>
                        </div>
                  <Button
                          size="sm"
                          variant={showComboSidebar ? "default" : "outline"}
                          className="h-6 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowComboSidebar(!showComboSidebar);
                            setShowComboCreator(false);
                            setShowAllCombos(false);
                          }}
                        >
                          {showComboSidebar ? 'Hide' : 'View'}
                  </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-gray-600">AI-powered combo recommendations</p>
                    </CardContent>
                  </Card>

                  {/* All Combos Card */}
                  <Card className="cursor-pointer transition-all duration-300 hover:shadow-lg" onClick={() => {
                    setShowAllCombos(!showAllCombos);
                    setShowComboCreator(false);
                    setShowComboSidebar(false);
                  }}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-green-600" />
                          <span>Active Combos</span>
                        </div>
                        <Button
                          size="sm"
                          variant={showAllCombos ? "default" : "outline"}
                          className="h-6 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowAllCombos(!showAllCombos);
                            setShowComboCreator(false);
                            setShowComboSidebar(false);
                          }}
                        >
                          {combos.filter(combo => combo.isActive).length}
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-gray-600">View and manage all combos</p>
                    </CardContent>
                  </Card>
                </div>

                {showComboCreator && (
                  <Card className="mt-6 border border-blue-300 shadow-md rounded-xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 px-6 py-4">
                      <CardTitle className="flex items-center gap-2 text-lg text-blue-900 font-semibold">
                        <Layers className="h-5 w-5" />
                        {editingCombo ? 'Edit Combo' : 'Create New Combo'}
                      </CardTitle>
                      <p className="text-xs text-blue-700 mt-1">Configure your combo details and select menu items</p>
                    </CardHeader>
                    <CardContent className="p-6 bg-white">
                      <div className="space-y-6">
                        {/* Combo Form - Professional Grid */}
                        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                          <h3 className="text-sm font-semibold text-gray-700 mb-4">Combo Details</h3>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                              <Label htmlFor="combo-name" className="text-xs font-medium text-gray-700 mb-1.5 block">
                                Combo Name <span className="text-red-500">*</span>
                              </Label>
                          <Input
                            id="combo-name"
                            value={comboCreatorForm.name}
                            onChange={(e) => setComboCreatorForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., Family Feast"
                                className="h-9 text-sm border-gray-300 focus:border-blue-500 rounded-lg"
                          />
                        </div>
                        <div>
                              <Label htmlFor="combo-category" className="text-xs font-medium text-gray-700 mb-1.5 block">Category</Label>
                          <select
                            id="combo-category"
                            value={comboCreatorForm.category}
                            onChange={(e) => setComboCreatorForm(prev => ({ ...prev, category: e.target.value }))}
                                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          >
                            <option value="Value Combos">Value Combos</option>
                            <option value="Family Combos">Family Combos</option>
                            <option value="Lunch Combos">Lunch Combos</option>
                            <option value="Dinner Combos">Dinner Combos</option>
                            <option value="Special Combos">Special Combos</option>
                          </select>
                        </div>
                        <div>
                              <Label htmlFor="combo-discount" className="text-xs font-medium text-gray-700 mb-1.5 block">Discount (%)</Label>
                            <Input
                              id="combo-discount"
                              type="number"
                              min="0"
                              max="100"
                              value={comboCreatorForm.discount}
                              onChange={(e) => setComboCreatorForm(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                              placeholder="0"
                                className="h-9 text-sm border-gray-300 focus:border-blue-500 rounded-lg"
                            />
                          </div>
                          <div>
                              <Label htmlFor="combo-image" className="text-xs font-medium text-gray-700 mb-1.5 block">Image URL</Label>
                            <Input
                              id="combo-image"
                              value={comboCreatorForm.image}
                              onChange={(e) => setComboCreatorForm(prev => ({ ...prev, image: e.target.value }))}
                                placeholder="https://..."
                                className="h-9 text-sm border-gray-300 focus:border-blue-500 rounded-lg"
                            />
                          </div>
                        </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                              <Label htmlFor="combo-description" className="text-xs font-medium text-gray-700 mb-1.5 block">Description</Label>
                              <Textarea
                                id="combo-description"
                                value={comboCreatorForm.description}
                                onChange={(e) => setComboCreatorForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Describe this combo..."
                                rows={3}
                                className="text-sm border-gray-300 focus:border-blue-500 resize-none rounded-lg"
                              />
                            </div>
                            <div>
                              <Label htmlFor="menu-items-select" className="text-xs font-medium text-gray-700 mb-1.5 block">
                                Add Menu Items
                              </Label>
                              <select
                                id="menu-items-select"
                                value=""
                                className="w-full h-[76px] px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                onChange={(e) => {
                                  const item = menuItems.find(item => item.id === e.target.value);
                                  if (item) {
                                    addItemToComboCreator(item);
                                  }
                                }}
                              >
                                <option value="">-- Select item to add --</option>
                                {menuItems
                                  .filter(item => !comboCreatorItems.some(ci => ci.menuItem.id === item.id))
                                  .map(item => (
                                    <option key={item.id} value={item.id}>
                                      {item.name} - €{item.price}
                                    </option>
                                  ))
                                }
                              </select>
                              {menuItems.filter(item => !comboCreatorItems.some(ci => ci.menuItem.id === item.id)).length === 0 && (
                                <p className="text-xs text-amber-600 mt-1">All items have been added</p>
                              )}
                          </div>
                        </div>
                      </div>

                      {/* Selected Items */}
                      {comboCreatorItems.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-xl p-5">
                          <h3 className="text-sm font-semibold text-gray-700 mb-4">Selected Items ({comboCreatorItems.length})</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {comboCreatorItems.map((item) => (
                              <div key={item.id} className="flex items-center gap-2 p-3 bg-gradient-to-r from-blue-50 to-white border border-blue-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                {item.menuItem.image && (
                                  <img
                                    src={item.menuItem.image}
                                    alt={item.menuItem.name}
                                    className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm truncate text-gray-900">{item.menuItem.name}</p>
                                  <p className="text-xs text-gray-600">€{item.menuItem.price} each</p>
                                  </div>
                                <div className="flex items-center gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateComboCreatorItemQuantity(item.id, item.quantity - 1)}
                                    className="h-7 w-7 p-0 text-sm font-semibold hover:bg-blue-50 rounded-lg"
                                  >
                                    -
                                  </Button>
                                  <span className="w-6 text-center text-sm font-bold text-blue-600">{item.quantity}</span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateComboCreatorItemQuantity(item.id, item.quantity + 1)}
                                    className="h-7 w-7 p-0 text-sm font-semibold hover:bg-blue-50 rounded-lg"
                                  >
                                    +
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => removeItemFromComboCreator(item.id)}
                                    className="h-7 w-7 p-0 text-sm text-red-600 hover:bg-red-50 hover:border-red-300 rounded-lg"
                                  >
                                    ×
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      </div>

                      {/* Price Summary & Actions */}
                      <div className="bg-gradient-to-r from-blue-50 to-white border border-blue-300 rounded-xl p-5 mt-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-8">
                            {comboCreatorItems.length > 0 ? (
                              <>
                                <div className="text-sm">
                                  <span className="text-gray-600 font-medium">Total: </span>
                                  <span className="font-semibold text-gray-900">€{calculateComboCreatorPrice().totalPrice.toFixed(2)}</span>
                          </div>
                          {comboCreatorForm.discount > 0 && (
                                  <div className="text-sm">
                                    <span className="text-gray-600 font-medium">Discount: </span>
                                    <span className="font-semibold text-green-600">-€{calculateComboCreatorPrice().discountAmount.toFixed(2)}</span>
                            </div>
                          )}
                                <div className="text-sm">
                                  <span className="text-gray-600 font-medium">Final Price: </span>
                                  <span className="font-bold text-blue-600 text-lg">€{calculateComboCreatorPrice().finalPrice.toFixed(2)}</span>
                          </div>
                              </>
                            ) : (
                              <div className="flex items-center gap-2 text-gray-500">
                                <Layers className="h-4 w-4" />
                                <p className="text-sm font-medium">No items selected yet</p>
                        </div>
                      )}
                          </div>

                          <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowComboCreator(false);
                            setComboCreatorForm({
                              name: '',
                              description: '',
                              category: 'Value Combos',
                              discount: 0,
                              image: ''
                            });
                            setComboCreatorItems([]);
                            setEditingCombo(null);
                          }}
                              className="h-9 px-4 text-sm border-gray-300 hover:bg-gray-50 rounded-lg"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={saveComboFromCreator}
                          disabled={!comboCreatorForm.name.trim() || comboCreatorItems.length === 0}
                              className="h-9 px-6 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm rounded-lg"
                        >
                              <Layers className="h-4 w-4 mr-2" />
                          {editingCombo ? 'Update Combo' : 'Save Combo'}
                        </Button>
                      </div>
              </div>
                          </div>
                    </CardContent>
                  </Card>
                )}

                {showComboSidebar && (
                  <Card className="mt-4 border-2 border-purple-200 bg-purple-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base text-purple-800">
                        <Sparkles className="h-4 w-4" />
                        Smart Combo Suggestions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      {orderItems.length === 0 ? (
                        <div className="text-center py-6 text-gray-500">
                          <Layers className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-xs">Add items to see combo suggestions</p>
                        </div>
                      ) : (
                        <>
                          {/* Individual Dish Suggestions */}
                          {getCrossSellingCombos().length > 0 && (
                            <div className="space-y-2">
                              <h4 className="font-semibold text-xs text-gray-700">Suggested Additions</h4>
                              {getCrossSellingCombos().flatMap(combo => 
                                combo.items
                                  .filter(item => !orderItems.some(orderItem => orderItem.menuItem.id === item.menuItem.id))
                                  .map(item => ({ ...item, comboDiscount: combo.discount, comboFinalPrice: combo.finalPrice, comboTotalPrice: combo.totalPrice }))
                              ).slice(0, 5).map((item, index) => (
                                <div key={`${item.menuItem.id}-${index}`} className="border border-blue-200 rounded-lg p-2 bg-blue-50">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2">
                                        {item.menuItem.image && (
                                          <img
                                            src={item.menuItem.image}
                                            alt={item.menuItem.name}
                                            className="w-6 h-6 object-cover rounded"
                                          />
                                        )}
                                        <div>
                                          <h5 className="font-medium text-xs text-blue-800">{item.menuItem.name}</h5>
                                          <div className="flex items-center space-x-1">
                                            <span className="text-xs text-gray-500 line-through">€{parseFloat(item.menuItem.price.toString()).toFixed(2)}</span>
                                            <span className="font-bold text-xs text-green-600">€{item.comboDiscount > 0 ? (parseFloat(item.menuItem.price.toString()) * (1 - item.comboDiscount / 100)).toFixed(2) : parseFloat(item.menuItem.price.toString()).toFixed(2)}</span>
                                            {item.comboDiscount > 0 && (
                                              <Badge variant="success" className="text-xs px-1 py-0">
                                                {item.comboDiscount}% off
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={() => addToOrder(item.menuItem)}
                                      className="food-button-primary text-xs h-6 px-2"
                                    >
                                      Add
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* All Available Combos */}
                        <div>
                          <h4 className="font-semibold text-xs text-gray-700 mb-3">All Combos</h4>
                            {combos.filter(combo => combo.isActive).length === 0 ? (
                              <div className="text-center py-3 text-gray-500">
                                <p className="text-xs">No combos available</p>
                                <Button
                                  size="sm"
                                  onClick={() => setShowComboCreator(true)}
                                  className="mt-1 text-xs h-6"
                                >
                                  Create Combo
                                </Button>
                              </div>
                            ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {combos.filter(combo => combo.isActive).map((combo) => (
                                <Card key={combo.id} className="hover:shadow-md transition-shadow">
                                  <CardContent className="p-3">
                                    {/* Header with image */}
                                    <div className="flex items-start gap-2 mb-2">
                                      {combo.image && (
                                        <img
                                          src={combo.image}
                                          alt={combo.name}
                                          className="w-12 h-12 object-cover rounded"
                                        />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <h5 className="font-medium text-xs text-gray-800 truncate">{combo.name}</h5>
                                        <p className="text-xs text-gray-600 line-clamp-2">{combo.description}</p>
                                      </div>
                                    </div>
                                    
                                    {/* Items count and discount */}
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                                        {combo.items.length} items
                                      </Badge>
                                          {combo.discount > 0 && (
                                        <Badge variant="success" className="text-xs px-1.5 py-0">
                                              {combo.discount}% off
                                            </Badge>
                                          )}
                                        </div>

                                    {/* Items preview */}
                                    <div className="text-xs text-gray-600 mb-2">
                                          {combo.items.slice(0, 2).map((item, index) => (
                                            <div key={item.menuItem.id} className="flex items-center justify-between">
                                          <span className="truncate">{item.menuItem.name}</span>
                                          <span className="font-medium ml-2">€{item.menuItem.price}</span>
                                      </div>
                                          ))}
                                          {combo.items.length > 2 && (
                                        <div className="text-xs text-gray-500 italic">+{combo.items.length - 2} more items</div>
                                          )}
                                      </div>
                                      
                                    {/* Price */}
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="text-xs">
                                          <span className="text-gray-500 line-through">€{combo.totalPrice.toFixed(2)}</span>
                                          <span className="ml-1 font-bold text-green-600">€{combo.finalPrice.toFixed(2)}</span>
                                        </div>
                                      </div>
                                      
                                    {/* Actions */}
                                    <div className="flex gap-1">
                                        <Button
                                          size="sm"
                                          onClick={() => addComboToOrder(combo)}
                                        className="flex-1 food-button-primary text-xs h-7"
                                        >
                                          Add Combo
                                        </Button>
                                        {showComboSidebar && (
                                          <>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => editCombo(combo)}
                                            className="text-xs h-7 w-7 p-0"
                                            >
                                              <Edit3 className="h-3 w-3" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => deleteCombo(combo.id)}
                                            className="text-xs text-red-600 hover:bg-red-50 h-7 w-7 p-0"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </>
                                        )}
                                      </div>
                                  </CardContent>
                                </Card>
                                ))}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}

                {showAllCombos && (
                  <Card className="mt-4 border-2 border-green-200 bg-green-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base text-green-800">
                        <Layers className="h-4 w-4" />
                        All Active Combos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {combos.filter(combo => combo.isActive).length === 0 ? (
                        <div className="text-center py-6 text-gray-500">
                          <Layers className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-xs">No combos available</p>
                          <Button
                            size="sm"
                            onClick={() => setShowComboCreator(true)}
                            className="mt-2 text-xs h-6"
                          >
                            Create Combo
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {combos.filter(combo => combo.isActive).map((combo) => (
                            <Card key={combo.id} className="hover:shadow-md transition-shadow">
                              <CardContent className="p-3">
                                {/* Header with image */}
                                <div className="flex items-start gap-2 mb-2">
                                      {combo.image && (
                                        <img
                                          src={combo.image}
                                          alt={combo.name}
                                      className="w-12 h-12 object-cover rounded"
                                        />
                                      )}
                                  <div className="flex-1 min-w-0">
                                    <h5 className="font-medium text-xs text-gray-800 truncate">{combo.name}</h5>
                                    <p className="text-xs text-gray-600 line-clamp-2">{combo.description}</p>
                                  </div>
                                    </div>
                                    
                                {/* Items count and discount */}
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                                    {combo.items.length} items
                                  </Badge>
                                  {combo.discount > 0 && (
                                    <Badge variant="success" className="text-xs px-1.5 py-0">
                                      {combo.discount}% off
                                    </Badge>
                                  )}
                                </div>

                                {/* Items preview */}
                                <div className="text-xs text-gray-600 mb-2">
                                          {combo.items.slice(0, 2).map((item, index) => (
                                            <div key={item.menuItem.id} className="flex items-center justify-between">
                                      <span className="truncate">{item.menuItem.name}</span>
                                      <span className="font-medium ml-2">€{item.menuItem.price}</span>
                                            </div>
                                          ))}
                                          {combo.items.length > 2 && (
                                    <div className="text-xs text-gray-500 italic">+{combo.items.length - 2} more items</div>
                                          )}
                                      </div>
                                      
                                {/* Price */}
                                <div className="flex items-center justify-between mb-2">
                                  <div className="text-xs">
                                          <span className="text-gray-500 line-through">€{combo.totalPrice.toFixed(2)}</span>
                                          <span className="ml-1 font-bold text-green-600">€{combo.finalPrice.toFixed(2)}</span>
                                        </div>
                                      </div>
                                      
                                {/* Actions */}
                                <div className="flex gap-1">
                                        <Button
                                          size="sm"
                                          onClick={() => addComboToOrder(combo)}
                                    className="flex-1 food-button-primary text-xs h-7"
                                        >
                                          Add Combo
                                        </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => editCombo(combo)}
                                    className="text-xs h-7 w-7 p-0"
                                            >
                                              <Edit3 className="h-3 w-3" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => deleteCombo(combo.id)}
                                    className="text-xs text-red-600 hover:bg-red-50 h-7 w-7 p-0"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                                        )}
                                      </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 order-1 mb-6">
                {/* Menu Section - 2/3 width */}
                <div className="lg:col-span-2">
                  <Card className="shadow-sm border border-gray-200 rounded-xl overflow-hidden">
                    <CardHeader className="bg-white border-b border-gray-200">
                      <CardTitle className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg">
                          <ShoppingCart className="h-4 w-4 text-gray-700" />
                                    </div>
                        <span className="text-base font-bold text-gray-900">Menu Items</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 bg-gray-50">
                      {/* Search and Filter */}
                      <div className="mb-6 space-y-4">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search menu items..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-10"
                            />
                                  </div>
                          <Button variant="outline" size="icon">
                            <Filter className="h-4 w-4" />
                          </Button>
                                  </div>
                        
                        {/* Category Filter */}
                        <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2 mb-2">
                          <Badge
                            variant="outline"
                            className={`cursor-pointer whitespace-nowrap transition-colors ${
                              selectedCategory === 'all' 
                                ? 'bg-gray-200 text-gray-900 border-gray-300' 
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                            onClick={() => setSelectedCategory('all')}
                          >
                            All Categories
                          </Badge>
                          {categories.map(category => (
                            <Badge
                              key={category}
                              variant="outline"
                              className={`cursor-pointer whitespace-nowrap transition-colors ${
                                selectedCategory === category 
                                  ? 'bg-gray-200 text-gray-900 border-gray-300' 
                                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                              }`}
                              onClick={() => setSelectedCategory(category)}
                            >
                              {category}
                            </Badge>
                                ))}
                              </div>
                          </div>

                      {/* Menu Items Grid */}
                      {filteredItems.length === 0 ? (
                        <div className="text-center py-12">
                          <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">
                            {menuItems.length === 0 
                              ? 'No menu items available. Please upload a menu first.'
                              : 'No items match your search criteria.'
                            }
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                          {filteredItems.map((item, index) => {
                            const uniqueKey = item.id && item.id.length > 0 ? item.id : `${item.name}__${item.category}__${item.price}__${index}`;
                            return (
                              <DishCard 
                                key={uniqueKey} 
                                item={item} 
                                orderItems={orderItems} 
                                onAddToOrder={addToOrder} 
                                formatPrice={formatPrice}
                              />
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Current Order Section - 1/3 width */}
                <div className="lg:col-span-1">
                  <Card className="sticky top-6 shadow-sm border border-gray-200 rounded-xl overflow-hidden">
                    <CardHeader className="bg-white border-b border-gray-200">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg">
                            <Receipt className="h-4 w-4 text-gray-700" />
                          </div>
                          <span className="text-base font-bold text-gray-900">Current Order</span>
                        </div>
                        {orderItems.length > 0 && (
                          <span className="text-xs font-semibold bg-gray-900 text-white px-2 py-1 rounded-full">
                            {orderItems.length}
                          </span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4 bg-gray-50">
                      {/* Order Type */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">Order Type</label>
                        <div className="grid grid-cols-3 gap-1 p-1 bg-gray-100 rounded-lg">
                          <button
                            type="button"
                            onClick={() => setOrderType('dine-in')}
                            className={`px-2 py-2 rounded-md text-xs font-medium transition-all ${
                              orderType === 'dine-in'
                                ? 'bg-white text-gray-900 shadow-md'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                              Dine In
                          </button>
                          <button
                            type="button"
                            onClick={() => setOrderType('take-away')}
                            className={`px-2 py-2 rounded-md text-xs font-medium transition-all ${
                              orderType === 'take-away'
                                ? 'bg-white text-gray-900 shadow-md'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            Takeaway
                          </button>
                          <button
                            type="button"
                            onClick={() => setOrderType('home-delivery')}
                            className={`px-2 py-2 rounded-md text-xs font-medium transition-all ${
                              orderType === 'home-delivery'
                                ? 'bg-white text-gray-900 shadow-md'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            Delivery
                          </button>
                          </div>
                      </div>

                      {/* Customer Information */}
                      {(orderType === 'take-away' || orderType === 'home-delivery') && (
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <label className="text-xs font-semibold text-gray-700">Customer Info</label>
                              {orderType === 'home-delivery' && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-medium">
                                Delivery
                                </span>
                              )}
                          </div>
                          <div className="space-y-2">
                            <div>
                              <Label htmlFor="customerName" className="text-xs text-gray-600 font-medium">Name *</Label>
                              <Input
                                id="customerName"
                                value={customerInfo.name}
                                onChange={e => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                                required={true}
                                className="h-9 text-sm"
                              />
                            </div>
                            <div>
                              <Label htmlFor="customerPhone" className="text-xs text-gray-600 font-medium">Phone *</Label>
                              <Input
                                id="customerPhone"
                                value={customerInfo.phone}
                                onChange={e => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                                required={true}
                                className="h-9 text-sm"
                              />
                            </div>
                            {orderType === 'home-delivery' && (
                              <>
                                {console.log('Rendering home delivery fields, orderType:', orderType)}
                                <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                  <h4 className="font-medium text-xs text-blue-800">Delivery Information</h4>
                                </div>
                                <div className="mb-3">
                                  <Label htmlFor="customerEmail" className="text-xs">Email *</Label>
                                  <Input
                                    id="customerEmail"
                                    type="email"
                                    value={customerInfo.email || ''}
                                    onChange={e => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                                    required={true}
                                  />
                                </div>
                                <div className="mb-3">
                                  <Label htmlFor="customerStreet" className="text-xs">Street Address *</Label>
                                  <Input
                                    id="customerStreet"
                                    value={customerInfo.address?.street || ''}
                                    onChange={e => setCustomerInfo({ 
                                      ...customerInfo, 
                                      address: { 
                                        ...(customerInfo.address || { street: '', city: '', pinCode: '' }), 
                                        street: e.target.value 
                                      } 
                                    })}
                                    required={true}
                                    placeholder="Enter street address"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                  <div>
                                    <Label htmlFor="customerCity" className="text-xs">City *</Label>
                                    <Input
                                      id="customerCity"
                                      value={customerInfo.address?.city || ''}
                                      onChange={e => setCustomerInfo({ 
                                        ...customerInfo, 
                                        address: { 
                                          ...(customerInfo.address || { street: '', city: '', pinCode: '' }), 
                                          city: e.target.value 
                                        } 
                                      })}
                                      required={true}
                                      placeholder="Enter city"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="customerPinCode" className="text-xs">Pin Code *</Label>
                                    <Input
                                      id="customerPinCode"
                                      value={customerInfo.address?.pinCode || ''}
                                      onChange={e => setCustomerInfo({ 
                                        ...customerInfo, 
                                        address: { 
                                          ...(customerInfo.address || { street: '', city: '', pinCode: '' }), 
                                          pinCode: e.target.value 
                                        } 
                                      })}
                                      required={true}
                                      placeholder="Enter pin code"
                                    />
                                  </div>
                                </div>
                                <div className="mb-3">
                                  <Label htmlFor="driver" className="text-xs">Assign Driver *</Label>
                                  <select id="driver" className="w-full border rounded px-2 py-1.5 text-sm" value={driver} onChange={e => setDriver(e.target.value)} required>
                                    <option value="">Select driver</option>
                                    {drivers.map(d => <option key={d} value={d}>{d}</option>)}
                                  </select>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Table selection for Dine In */}
                      {orderType === 'dine-in' && (
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <label className="block text-xs font-semibold text-gray-700 mb-2">Table Selection</label>
                          <div>
                            <Label htmlFor="tableNumber" className="text-xs text-gray-600 font-medium">Table *</Label>
                              <select
                                id="tableNumber"
                                className="w-full border rounded px-2 py-1.5 text-sm"
                                value={customerInfo.tableNumber}
                                onChange={e => setCustomerInfo({ ...customerInfo, tableNumber: e.target.value })}
                                required
                              >
                                <option value="">Select table</option>
                                {availableTables.map((table: any) => (
                                  <option key={table.id} value={table.id}>
                                    Table {table.number} - {table.capacity} seats ({table.status.charAt(0).toUpperCase() + table.status.slice(1)})
                                  </option>
                                ))}
                              </select>
                            </div>
                        </div>
                      )}

                      <div className="border-t border-gray-200 my-4"></div>

                      {/* Order Items */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-700 mb-3">Items</h4>
                        {orderItems.length === 0 ? (
                          <div className="text-center py-8 text-gray-400">
                            <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-30" />
                            <p className="text-xs">No items added</p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                            {orderItems.map((item) => (
                              <div key={item.menuItem.id} className="p-2.5 border border-gray-200 rounded-lg bg-white hover:border-orange-300 transition-colors">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-gray-900 truncate">
                                      {item.menuItem.name}
                                      {item.comboInfo && (
                                        <Badge variant="success" className="ml-2 text-xs">
                                          {item.comboInfo.comboDiscount}% OFF
                                        </Badge>
                                      )}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      {item.comboInfo ? (
                                        <>
                                          <span className="text-xs text-gray-400 line-through">€{formatPrice(item.menuItem.price)}</span>
                                          <span className="text-xs font-bold text-green-600">€{formatPrice(item.comboInfo.discountedPrice)}</span>
                                        </>
                                      ) : (
                                        <span className="text-xs font-bold text-gray-900">€{formatPrice(item.menuItem.price)}</span>
                                      )}
                                      <span className="text-xs text-gray-500">× {item.quantity}</span>
                                      <span className="text-xs font-bold text-orange-600 ml-auto">
                                        €{formatPrice(item.comboInfo ? item.comboInfo.discountedPrice * item.quantity : parseFloat(item.menuItem.price as any) * item.quantity)}
                                      </span>
                                  </div>
                                    {item.comboInfo && (
                                      <p className="text-xs text-blue-600 italic mt-0.5">Combo: {item.comboInfo.comboName}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button 
                                      onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                                      className="h-7 w-7 flex items-center justify-center text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded font-bold text-sm"
                                    >-</button>
                                    <span className="w-8 text-center text-xs font-bold text-gray-900">{item.quantity}</span>
                                    <button 
                                      onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                                      className="h-7 w-7 flex items-center justify-center text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded font-bold text-sm"
                                    >+</button>
                                    <button 
                                      onClick={() => removeFromOrder(item.menuItem.id)}
                                      className="ml-1 h-7 px-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded"
                                    >×</button>
                                  </div>
                                </div>
                                
                                {/* Add-ons Section - Compact */}
                                    {getFilteredAddOns(item.menuItem).length > 0 && (
                                  <div className="pt-2 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => toggleAddOnsDropdown(item.menuItem.id)}
                                      className="text-xs font-medium text-orange-600 hover:text-orange-700"
                                      >
                                      {showAddOnsDropdown[item.menuItem.id] ? '− Hide Customize' : '+ Customize'}
                                    </button>
                                  </div>
                                )}
                                  
                                  {/* Add-ons Dropdown */}
                                  {showAddOnsDropdown[item.menuItem.id] && getFilteredAddOns(item.menuItem).length > 0 && (
                                    <div className="space-y-1 border border-orange-200 rounded-lg p-2 bg-orange-50">
                                      {getFilteredAddOns(item.menuItem).map((addOn) => {
                                        const isSelected = (item.addOns || []).some(selected => selected.id === addOn.id);
                                        return (
                                          <div key={addOn.id} className="flex items-center justify-between p-1.5 border border-orange-200 rounded hover:bg-orange-100">
                                            <div className="flex items-center space-x-2">
                                              <input
                                                type="checkbox"
                                                id={`${item.menuItem.id}-${addOn.id}`}
                                                checked={isSelected}
                                                onChange={(e) => {
                                                  if (e.target.checked) {
                                                    addAddOn(item.menuItem.id, addOn);
                                                  } else {
                                                    removeAddOn(item.menuItem.id, addOn.id);
                                                  }
                                                }}
                                                className="h-4 w-4 text-orange-600 border-orange-300 rounded focus:ring-orange-500"
                                              />
                                              <label 
                                                htmlFor={`${item.menuItem.id}-${addOn.id}`}
                                                className="text-xs font-medium text-gray-700 cursor-pointer"
                                              >
                                                {addOn.name}
                                              </label>
                                              {addOn.price > 0 && (
                                                <span className="text-xs text-orange-600 font-semibold">
                                                  +€{addOn.price.toFixed(2)}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                      
                                      {/* Custom Add-on Input */}
                                      <div className="space-y-1">
                                      {!showCustomAddOnInput[item.menuItem.id] ? (
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => toggleCustomAddOnInput(item.menuItem.id)}
                                          className="w-full text-xs font-medium border border-dashed border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400 h-8"
                                        >
                                          + Add Custom Request
                                        </Button>
                                      ) : (
                                        <div className="p-2 border border-orange-200 rounded-lg bg-orange-50">
                                          <div className="flex items-center space-x-1">
                                            <input
                                              type="text"
                                              placeholder="e.g., Extra crispy, No salt..."
                                              value={customAddOnInputs[item.menuItem.id] || ''}
                                              onChange={(e) => handleCustomAddOnInput(item.menuItem.id, e.target.value)}
                                              className="flex-1 px-2 py-1 text-xs border border-orange-300 rounded focus:border-orange-400 focus:ring-1 focus:ring-orange-200 h-7"
                                              onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                  addCustomAddOn(item.menuItem.id);
                                                }
                                              }}
                                            />
                                            <Button
                                              type="button"
                                              size="sm"
                                              onClick={() => addCustomAddOn(item.menuItem.id)}
                                              disabled={!customAddOnInputs[item.menuItem.id]?.trim()}
                                              className="px-2 py-1 text-xs font-semibold food-button-primary h-7"
                                            >
                                              Add
                                            </Button>
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant="outline"
                                              onClick={() => toggleCustomAddOnInput(item.menuItem.id)}
                                              className="px-2 py-1 text-xs font-semibold border-orange-300 text-orange-600 hover:bg-orange-100 h-7"
                                            >
                                              Cancel
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Display selected custom add-ons */}
                                      {(item.addOns || []).filter(addOn => addOn.type === 'custom').map((customAddOn) => (
                                        <div key={customAddOn.id} className="flex items-center justify-between p-1.5 bg-blue-50 border border-blue-200 rounded text-xs">
                                          <div className="flex items-center space-x-1">
                                            <span className="font-medium text-blue-800">
                                              {customAddOn.name}
                                            </span>
                                            <span className="text-blue-600 font-semibold">
                                              Custom
                                            </span>
                                          </div>
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => removeCustomAddOn(item.menuItem.id, customAddOn.id)}
                                            className="h-5 w-5 p-0 text-red-600 border-red-300 hover:bg-red-50 text-xs"
                                          >
                                            ×
                                          </Button>
                                        </div>
                                      ))}
                                      </div>
                                    </div>
                                  )}
                                
                                {/* Notes Section */}
                                {showAddOnsDropdown[item.menuItem.id] && (
                                  <div className="pt-2 border-t border-gray-100">
                                  <Label htmlFor={`notes-${item.menuItem.id}`} className="text-xs font-semibold text-gray-700">
                                      Special Instructions
                                  </Label>
                                  <Textarea
                                    id={`notes-${item.menuItem.id}`}
                                      placeholder="e.g., No onions, Extra spicy..."
                                    value={item.notes || ''}
                                    onChange={(e) => updateNotes(item.menuItem.id, e.target.value)}
                                      className="min-h-[50px] text-xs resize-none border border-gray-200 rounded focus:border-orange-400 focus:ring-1 focus:ring-orange-200 mt-1"
                                    rows={2}
                                  />
                                </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="border-t border-gray-200 my-4"></div>

                      {/* Inventory Validation Status */}
                      {orderItems.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-base text-gray-800">Inventory Status:</span>
                            {validatingInventory ? (
                              <span className="text-base font-semibold text-orange-600">Checking...</span>
                            ) : inventoryValidation ? (
                              <div className="flex items-center gap-2">
                                {inventoryValidation.canFulfill ? (
                                  <Badge variant="success" className="text-sm font-bold px-4 py-2">
                                    ✓ Available
                                  </Badge>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <Badge variant="destructive" className="text-sm font-bold px-4 py-2">
                                      ⚠ Insufficient Stock
                                    </Badge>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setShowInventoryModal(true)}
                                      className="text-xs"
                                    >
                                      View Details
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )}

                      {/* Order Summary - Clean & Simple */}
                      <div className="border-t border-gray-200 pt-4 space-y-3">
                        <div className="flex justify-between items-center text-xs text-gray-600">
                          <span>Subtotal</span>
                          <span className="font-medium text-gray-900">€{calculateTotal().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-600">
                          <span>Tax</span>
                          <span className="font-medium text-gray-900">€0.00</span>
                        </div>
                        
                        {/* Total - Clean Design */}
                        <div className="bg-gray-100 rounded-lg p-3 border border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-700">Total</span>
                            <span className="text-xl font-bold text-gray-900">€{calculateTotal().toFixed(2)}</span>
                          </div>
                        </div>
                        
                        {/* Place Order Button - Clean Design */}
                        <Button 
                          onClick={handlePlaceOrder}
                          disabled={
                            orderItems.length === 0 || 
                            (orderType === 'dine-in' && !customerInfo.tableNumber) ||
                            (inventoryValidation && !inventoryValidation.canFulfill) ||
                            validatingInventory
                          }
                          className="w-full h-11 text-sm font-semibold rounded-lg bg-gray-900 hover:bg-gray-800 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {validatingInventory ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Checking Inventory...
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-4 w-4 mr-2" />
                              Place Order & Pay
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Inventory Details Modal */}
              {showInventoryModal && inventoryValidation && !inventoryValidation.canFulfill && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-red-600">⚠️ Insufficient Inventory</h3>
                      <button
                        onClick={() => setShowInventoryModal(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <span className="text-2xl">&times;</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 overflow-y-auto max-h-[60vh]">
                    <p className="text-gray-600 mb-4">
                      The following items have insufficient stock to fulfill this order:
                    </p>
                    
                    <div className="space-y-3">
                      {inventoryValidation.errors.map((error: string, index: number) => (
                        <div
                          key={index}
                          className="p-4 bg-red-50 border border-red-200 rounded-lg"
                        >
                          <p className="text-sm text-red-800">{error}</p>
                        </div>
                      ))}
                    </div>

                    {inventoryImpact && inventoryImpact.items && inventoryImpact.items.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-lg font-semibold text-gray-800 mb-3">
                          Detailed Inventory Impact
                        </h4>
                        <div className="space-y-3">
                          {inventoryImpact.items.map((item: any, index: number) => (
                            <div
                              key={index}
                              className={`p-4 rounded-lg border ${
                                item.hasEnough
                                  ? 'bg-green-50 border-green-200'
                                  : 'bg-red-50 border-red-200'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-gray-800">
                                  {item.itemName}
                                </span>
                                {item.hasEnough ? (
                                  <Badge variant="success" className="text-xs">
                                    ✓ Available
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive" className="text-xs">
                                    ⚠ Insufficient
                                  </Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-gray-600">Required:</span>
                                  <span className="ml-2 font-medium text-gray-800">
                                    {item.required.toFixed(2)} {item.unit}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Available:</span>
                                  <span className={`ml-2 font-medium ${
                                    item.hasEnough ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {item.available.toFixed(2)} {item.unit}
                                  </span>
                                </div>
                              </div>
                              {!item.hasEnough && (
                                <div className="mt-2 text-sm text-red-600 font-medium">
                                  Shortage: {(item.required - item.available).toFixed(2)} {item.unit}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Suggestion:</strong> Please restock the insufficient items before placing this order,
                        or adjust the order quantities to match available inventory.
                      </p>
                    </div>
                  </div>

                  <div className="p-6 border-t border-gray-200 bg-gray-50">
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setShowInventoryModal(false)}
                        className="flex-1"
                      >
                        Close
                      </Button>
                      <Button
                        onClick={() => {
                          setShowInventoryModal(false);
                          // Optionally navigate to inventory page
                          window.open('/inventory', '_blank');
                        }}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        Go to Inventory
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              )}
            </div>
          )}

          {activeSubsection === 'payment' && (
            <div className="space-y-6">
              {/* New Order Notification */}
              {showNewOrderNotification && (
                <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
                  <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">New order received!</span>
                  </div>
                </div>
              )}
              
              {/* Payment Section Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Payment</h2>
                  <p className="text-sm text-gray-600 mt-1">Process payments and manage orders</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Tools
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Order Tools</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        console.log('🔄 [PAYMENT-SECTION] Manual refresh triggered');
                        const userId = getUserId();
                        const ordersKey = `orders_${userId}`;
                        const storedOrders = localStorage.getItem(ordersKey);
                        let allOrders = [];
                        if (storedOrders) {
                          try {
                            allOrders = JSON.parse(storedOrders);
                          } catch (error) {
                            console.error('❌ [PAYMENT-SECTION] Error parsing orders:', error);
                            allOrders = [];
                          }
                        }
                        const pendingOrders = allOrders.filter((order: any) => 
                          (order.status === 'Pending' || order.status === 'Order Received' || order.status === 'Pending Payment') &&
                          order.orderType !== 'home-delivery' &&
                          (order.status !== 'Split' || order.isSplitBill)
                        );
                        setOrders(pendingOrders);
                        setLastOrderCount(pendingOrders.length);
                        toast({
                          title: "Orders Refreshed",
                          description: `Found ${pendingOrders.length} pending orders`,
                        });
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Orders
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        const userId = getUserId();
                        const ordersKey = `orders_${userId}`;
                        const allOrders = JSON.parse(localStorage.getItem(ordersKey) || '[]');
                        console.log('🔍 [DEBUG] Total orders:', allOrders.length);
                        console.log('🔍 [DEBUG] Order IDs:', allOrders.map((o: any) => o.id));
                        const splitBills = allOrders.filter((o: any) => o.isSplitBill);
                        console.log('🔍 [DEBUG] Split bills:', splitBills.length);
                        toast({
                          title: "Debug Complete",
                          description: `${allOrders.length} orders, ${splitBills.length} splits. Check console.`,
                        });
                      }}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Debug All Data
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        console.log('🔄 [MANUAL-REFRESH] Manually refreshing orders...');
                        refreshOrdersForPayment();
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Force Refresh
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        const userId = getUserId();
                        const ordersKey = `orders_${userId}`;
                        const existingOrders = JSON.parse(localStorage.getItem(ordersKey) || '[]');
                        const uniqueOrders = new Map();
                        existingOrders.forEach((order: any) => {
                          if (!uniqueOrders.has(order.id)) {
                            uniqueOrders.set(order.id, order);
                          }
                        });
                        const deduplicatedOrders = Array.from(uniqueOrders.values());
                        localStorage.setItem(ordersKey, JSON.stringify(deduplicatedOrders));
                        refreshOrdersForPayment();
                        toast({
                          title: "Duplicates Removed",
                          description: `Removed ${existingOrders.length - deduplicatedOrders.length} duplicates.`,
                        });
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Remove Duplicates
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        const userId = getUserId();
                        const ordersKey = `orders_${userId}`;
                        const storedOrders = localStorage.getItem(ordersKey);
                        if (storedOrders) {
                          const allOrders = JSON.parse(storedOrders);
                          const filteredOrders = allOrders.filter((order: any) => {
                            if (order.isSplitBill) return false;
                            if (order.status === 'Split') {
                              order.status = 'Pending Payment';
                              order.splitInto = undefined;
                              order.splitBillIds = undefined;
                            }
                            return true;
                          });
                          localStorage.setItem(ordersKey, JSON.stringify(filteredOrders));
                          refreshOrdersForPayment();
                        }
                      }}
                      className="text-orange-600"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Clear ALL Splits
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        const userId = getUserId();
                        const ordersKey = `orders_${userId}`;
                        localStorage.removeItem(ordersKey);
                        localStorage.removeItem('selectedOrderForSplit');
                        refreshOrdersForPayment();
                        toast({
                          title: "Nuclear Clear Complete",
                          description: "All data cleared. Create new orders.",
                          variant: "destructive"
                        });
                      }}
                      className="text-red-600"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Nuclear Clear
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        // Create test order
                        const userId = getUserId();
                        const ordersKey = `orders_${userId}`;
                        const existingOrders = JSON.parse(localStorage.getItem(ordersKey) || '[]');
                        const testOrder = {
                          id: `test_order_${Date.now()}`,
                          tableId: '1',
                          status: 'Pending Payment',
                          items: [{ name: 'Test Item', quantity: 1, unitPrice: 10.00 }],
                          totalAmount: 10.00,
                          createdAt: new Date().toISOString(),
                          orderType: 'dine-in'
                        };
                        existingOrders.push(testOrder);
                        localStorage.setItem(ordersKey, JSON.stringify(existingOrders));
                        refreshOrdersForPayment();
                        toast({
                          title: "Test Order Created",
                          description: `Order ${testOrder.id} created`,
                        });
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Create Test Order
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="hidden">
                  <Button
                    onClick={() => {
                      console.log('🔄 [PAYMENT-SECTION] Manual refresh triggered');
                      const userId = getUserId();
                      
                      // Read orders directly from localStorage
                      const ordersKey = `orders_${userId}`;
                      const storedOrders = localStorage.getItem(ordersKey);
                      let allOrders = [];
                      
                      if (storedOrders) {
                        try {
                          allOrders = JSON.parse(storedOrders);
                        } catch (error) {
                          console.error('❌ [PAYMENT-SECTION] Error parsing orders:', error);
                          allOrders = [];
                        }
                      }
                      
                      const pendingOrders = allOrders.filter((order: any) => 
                        (order.status === 'Pending' || order.status === 'Order Received' || order.status === 'Pending Payment') &&
                        order.orderType !== 'home-delivery' &&
                        (order.status !== 'Split' || order.isSplitBill) // Include split bills but exclude parent orders
                      );
                      
                      console.log('📊 [PAYMENT-SECTION] Manual refresh found orders:', pendingOrders.length);
                      console.log('📦 [PAYMENT-SECTION] All orders in storage:', allOrders.length);
                      console.log('📋 [PAYMENT-SECTION] Split bills found:', pendingOrders.filter((o: any) => o.isSplitBill).length);
                      setOrders(pendingOrders);
                      setLastOrderCount(pendingOrders.length);
                      toast({
                        title: "Orders Refreshed",
                        description: `Found ${pendingOrders.length} pending orders out of ${allOrders.length} total orders`,
                      });
                    }}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh Orders
                  </Button>
                  
                  <Button
                    onClick={() => {
                      // Comprehensive debug function
                      const userId = getUserId();
                      const ordersKey = `orders_${userId}`;
                      const allOrders = JSON.parse(localStorage.getItem(ordersKey) || '[]');
                      
                      console.log('🔍 [DEBUG] === COMPREHENSIVE LOCALSTORAGE DEBUG ===');
                      console.log('🔍 [DEBUG] User ID:', userId);
                      console.log('🔍 [DEBUG] Orders Key:', ordersKey);
                      console.log('🔍 [DEBUG] Total orders in localStorage:', allOrders.length);
                      console.log('🔍 [DEBUG] All order IDs:', allOrders.map((o: any) => o.id));
                      
                      // Check for the specific order that's failing
                      const failingOrderId = 'order_1760041903044_zalzg';
                      const failingOrder = allOrders.find((o: any) => o.id === failingOrderId);
                      
                      console.log('🔍 [DEBUG] Looking for failing order:', failingOrderId);
                      console.log('🔍 [DEBUG] Failing order found:', failingOrder ? 'YES' : 'NO');
                      if (failingOrder) {
                        console.log('🔍 [DEBUG] Failing order details:', {
                          id: failingOrder.id,
                          status: failingOrder.status,
                          isSplitBill: failingOrder.isSplitBill,
                          totalAmount: failingOrder.totalAmount,
                          items: failingOrder.items?.length || 0
                        });
                      } else {
                        console.log('❌ [DEBUG] ORDER NOT FOUND IN LOCALSTORAGE!');
                        console.log('❌ [DEBUG] This explains why split bill page shows "Order Not Found"');
                        console.log('❌ [DEBUG] Available orders:', allOrders.map((o: any) => o.id));
                      }
                      
                      // Show split bills
                      const splitBills = allOrders.filter((o: any) => o.isSplitBill);
                      console.log('🔍 [DEBUG] Split bills found:', splitBills.length);
                      console.log('🔍 [DEBUG] Split bill IDs:', splitBills.map((o: any) => o.id));
                      
                      // Show regular orders
                      const regularOrders = allOrders.filter((o: any) => !o.isSplitBill);
                      console.log('🔍 [DEBUG] Regular orders found:', regularOrders.length);
                      console.log('🔍 [DEBUG] Regular order IDs:', regularOrders.map((o: any) => o.id));
                      
                      toast({
                        title: "Debug Complete",
                        description: `Found ${allOrders.length} total orders, ${splitBills.length} split bills. Check console for details.`,
                      });
                    }}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Debug All Data
                  </Button>
                  
                  <Button
                    onClick={() => {
                      console.log('🔄 [MANUAL-REFRESH] Manually refreshing orders...');
                      refreshOrdersForPayment();
                    }}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Force Refresh
                  </Button>
                  
                  <Button
                    onClick={() => {
                      // Clear ALL split bills and duplicates for debugging
                      const userId = getUserId();
                      const ordersKey = `orders_${userId}`;
                      const storedOrders = localStorage.getItem(ordersKey);
                      if (storedOrders) {
                        const allOrders = JSON.parse(storedOrders);
                        console.log('🧹 [DEBUG] Before clearing - Total orders:', allOrders.length);
                        console.log('🧹 [DEBUG] Split bills found:', allOrders.filter((o: any) => o.isSplitBill).length);
                        
                        // Remove ALL split bills and reset parent orders
                        const filteredOrders = allOrders.filter((order: any) => {
                          if (order.isSplitBill) {
                            return false; // Remove all split bills
                          }
                          // Reset parent orders that were split back to their original status
                          if (order.status === 'Split') {
                            order.status = 'Pending Payment';
                            order.splitInto = undefined;
                            order.splitBillIds = undefined;
                          }
                          return true;
                        });
                        
                        localStorage.setItem(ordersKey, JSON.stringify(filteredOrders));
                        console.log('🧹 [DEBUG] After clearing - Total orders:', filteredOrders.length);
                        console.log('🧹 [DEBUG] Remaining orders:', filteredOrders.map((o: any) => ({ id: o.id, status: o.status })));
                        refreshOrdersForPayment();
                      }
                    }}
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Clear ALL Splits
                  </Button>
                  
                  <Button
                    onClick={() => {
                      // Nuclear option: Clear everything and start fresh
                      const userId = getUserId();
                      const ordersKey = `orders_${userId}`;
                      localStorage.removeItem(ordersKey);
                      localStorage.removeItem('selectedOrderForSplit');
                      console.log('💥 [NUCLEAR] Cleared ALL localStorage data');
                      console.log('💥 [NUCLEAR] User ID:', userId);
                      console.log('💥 [NUCLEAR] Orders key:', ordersKey);
                      refreshOrdersForPayment();
                      toast({
                        title: "Nuclear Clear Complete",
                        description: "All localStorage data has been cleared. You'll need to create new orders.",
                        variant: "destructive"
                      });
                    }}
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Nuclear Clear
                  </Button>
                  
                  <Button
                    onClick={() => {
                      // Remove duplicate orders from localStorage
                      const userId = getUserId();
                      const ordersKey = `orders_${userId}`;
                      const existingOrders = JSON.parse(localStorage.getItem(ordersKey) || '[]');
                      
                      console.log('🧹 [DEDUP] Before deduplication:', existingOrders.length);
                      
                      // Create a Map to track unique orders by ID
                      const uniqueOrders = new Map();
                      existingOrders.forEach((order: any) => {
                        if (!uniqueOrders.has(order.id)) {
                          uniqueOrders.set(order.id, order);
                        } else {
                          console.log('🧹 [DEDUP] Removing duplicate order:', order.id);
                        }
                      });
                      
                      const deduplicatedOrders = Array.from(uniqueOrders.values());
                      localStorage.setItem(ordersKey, JSON.stringify(deduplicatedOrders));
                      
                      console.log('✅ [DEDUP] After deduplication:', deduplicatedOrders.length);
                      console.log('✅ [DEDUP] Removed', existingOrders.length - deduplicatedOrders.length, 'duplicates');
                      
                      refreshOrdersForPayment();
                      toast({
                        title: "Duplicates Removed",
                        description: `Removed ${existingOrders.length - deduplicatedOrders.length} duplicate orders.`,
                      });
                    }}
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Remove Duplicates
                  </Button>
                  
                  <Button
                    onClick={() => {
                      // Create the missing order for testing
                      const userId = getUserId();
                      const ordersKey = `orders_${userId}`;
                      const existingOrders = JSON.parse(localStorage.getItem(ordersKey) || '[]');
                      
                      const testOrder = {
                        id: 'order_1760041903044_zalzg',
                        customerName: 'Test Customer',
                        tableNumber: '5',
                        status: 'Order Received',
                        orderType: 'dine-in',
                        items: [
                          {
                            id: 'item_1',
                            name: 'Chicken Biryani',
                            quantity: 1,
                            unitPrice: 12.90,
                            total: 12.90,
                            addons: []
                          },
                          {
                            id: 'item_2',
                            name: 'Dal Masoor Tadka',
                            quantity: 1,
                            unitPrice: 9.90,
                            total: 9.90,
                            addons: []
                          }
                        ],
                        subtotal: 22.80,
                        tax: 4.33,
                        totalAmount: 27.13,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        isSplitBill: false
                      };
                      
                      existingOrders.push(testOrder);
                      localStorage.setItem(ordersKey, JSON.stringify(existingOrders));
                      
                      console.log('✅ [CREATE-TEST] Created missing order:', testOrder.id);
                      console.log('✅ [CREATE-TEST] Order details:', {
                        id: testOrder.id,
                        items: testOrder.items.length,
                        totalAmount: testOrder.totalAmount
                      });
                      
                      refreshOrdersForPayment();
                      toast({
                        title: "Test Order Created",
                        description: `Created order ${testOrder.id} for testing split functionality.`,
                      });
                    }}
                    variant="default"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Create Test Order
                  </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Order Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="h-5 w-5" />
                      Select Order
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {orders.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No pending orders</p>
                    ) : (
                      <div className="space-y-4">
                        {/* Regular Orders */}
                        {(() => {
                          const { splitBillGroups, regularOrders } = groupSplitBills(orders);
                          
                          console.log('🎨 [RENDER] About to render:', {
                            regularOrdersCount: regularOrders.length,
                            splitBillGroupsCount: splitBillGroups.size,
                            splitBillGroupDetails: Array.from(splitBillGroups.entries()).map(([parentId, bills]) => ({
                              parentId,
                              billsCount: bills.length,
                              billIds: bills.map(b => b.id)
                            }))
                          });
                          
                          return (
                            <>
                              {regularOrders.map((order) => {
                                const isSelected = selectedOrder?.id === order.id;
                                return (
                                <Card
                                  key={order.id}
                                  className={`overflow-hidden transition-all duration-200 cursor-pointer ${
                                    isSelected
                                      ? 'ring-2 ring-blue-500 shadow-lg'
                                      : 'hover:shadow-md'
                                  }`}
                                  onClick={() => {
                                    setSelectedOrder(isSelected ? null : order);
                                  }}
                                >
                                  <CardContent className="p-0">
                                    {/* Compact Header */}
                                    <div className={`p-4 ${isSelected ? 'bg-blue-50' : 'bg-white'}`}>
                                      <div className="flex items-start justify-between gap-4">
                                        {/* Left: Order Info */}
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-2">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
                                              <Receipt className="h-4 w-4 text-blue-600" />
                                      </div>
                                            <div className="flex-1 min-w-0">
                                              <p className="font-semibold text-sm text-gray-900 truncate">
                                                #{order.id.split('_').pop()}
                                      </p>
                                              <p className="text-xs text-gray-500">
                                                Table {order.tableId || 'N/A'}
                                      </p>
                                    </div>
                                          </div>
                                          
                                          <div className="flex items-center gap-3 text-xs text-gray-600">
                                            <span className="flex items-center gap-1">
                                              <Package className="h-3 w-3" />
                                              {order.items?.length || 0} items
                                            </span>
                                            <span className="flex items-center gap-1">
                                              <Clock className="h-3 w-3" />
                                              {new Date(order.createdAt).toLocaleTimeString()}
                                            </span>
                                          </div>
                                        </div>

                                        {/* Right: Price & Status */}
                                    <div className="text-right">
                                          <div className="font-bold text-xl text-gray-900 mb-1">
                                            €{order.totalAmount.toFixed(2)}
                                          </div>
                                          <Badge 
                                            variant={
                                        order.status === 'Completed' ? 'default' : 
                                        order.status === 'Preparation' ? 'secondary' : 
                                        order.status === 'Cancelled' ? 'destructive' :
                                        'outline'
                                            }
                                            className="text-xs"
                                          >
                                        {order.status}
                                      </Badge>
                                    </div>
                                      </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {isSelected && (
                                      <div className="border-t border-gray-200 bg-gray-50">
                                        {/* Order Details */}
                                        <div className="p-4 bg-white border-b border-gray-200">
                                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                            Order Details
                                          </h4>
                                          <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                              <span className="text-gray-500">Order ID:</span>
                                              <p className="font-medium text-gray-900 mt-0.5 text-xs">{order.id}</p>
                                            </div>
                                            <div>
                                              <span className="text-gray-500">Created:</span>
                                              <p className="font-medium text-gray-900 mt-0.5 text-xs">
                                                {new Date(order.createdAt).toLocaleString()}
                                              </p>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Items List */}
                                        <div className="p-4">
                                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                            Items ({order.items?.length || 0})
                                          </h4>
                                          <div className="space-y-2">
                                            {order.items.map((item: any, idx: number) => (
                                              <div 
                                                key={idx} 
                                                className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200"
                                              >
                                                <div className="flex-1 min-w-0 mr-3">
                                                  <p className="font-medium text-sm text-gray-900 truncate">
                                                    {item.name}
                                                  </p>
                                                  <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-gray-500">
                                                      €{item.unitPrice} × {item.quantity}
                                                    </span>
                                                    {item.notes && (
                                                      <span className="text-xs text-blue-600 italic truncate">
                                                        • {item.notes}
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                                <div className="font-semibold text-sm text-gray-900 whitespace-nowrap">
                                                  €{(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}
                                  </div>
                                </div>
                              ))}
                                          </div>

                                          {/* Total */}
                                          <div className="mt-4 pt-3 border-t border-gray-300">
                                            <div className="flex items-center justify-between">
                                              <span className="text-sm font-semibold text-gray-700">Total Amount</span>
                                              <span className="text-lg font-bold text-blue-600">
                                                €{order.totalAmount.toFixed(2)}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              );})}

                              {/* Split Bill Groups */}
                              {Array.from(splitBillGroups.entries()).map(([parentOrderId, splitBills]) => {
                                console.log(`🎨 [RENDER-GROUP] Rendering split bill group ${parentOrderId} with ${splitBills.length} bills`);
                                const firstBill = splitBills[0];
                                const totalAmount = splitBills.reduce((sum, bill) => sum + bill.totalAmount, 0);
                                const completedBills = splitBills.filter(bill => bill.status === 'Completed');
                                const allCompleted = completedBills.length === splitBills.length && splitBills.length > 0;
                                
                                return (
                                  <div 
                                    key={parentOrderId}
                                    className={`border-4 rounded-lg p-4 shadow-lg mb-4 ${
                                      allCompleted 
                                        ? 'border-green-500 bg-green-100' 
                                        : 'border-purple-500 bg-purple-100'
                                    }`}
                                  >
                                    {/* Group Header */}
                                    <div className={`flex items-center justify-between mb-3 pb-2 border-b ${
                                      allCompleted ? 'border-green-200' : 'border-purple-200'
                                    }`}>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <Users className={`h-4 w-4 ${allCompleted ? 'text-green-600' : 'text-purple-600'}`} />
                                          <p className={`font-semibold ${allCompleted ? 'text-green-900' : 'text-purple-900'}`}>
                                            Split Bill Group
                                          </p>
                                          {allCompleted && (
                                            <Badge variant="default" className="text-xs bg-green-500 text-white">
                                              ✓ All Paid
                                            </Badge>
                                          )}
                                        </div>
                                        <p className={`text-xs mt-1 ${allCompleted ? 'text-green-700' : 'text-purple-700'}`}>
                                          Parent Order: #{parentOrderId} • Table {firstBill.tableId || 'N/A'}
                                        </p>
                                        {!allCompleted && (
                                          <p className="text-xs text-purple-600 mt-1">
                                            Progress: {completedBills.length}/{splitBills.length} bills completed
                                          </p>
                                        )}
                                      </div>
                                      <div className="text-right">
                                        <p className={`text-sm font-medium ${allCompleted ? 'text-green-700' : 'text-purple-700'}`}>
                                          {splitBills.length} {splitBills.length === 1 ? 'bill' : 'bills'}
                                          {!allCompleted && (
                                            <span className="text-green-600"> ({completedBills.length} paid)</span>
                                          )}
                                        </p>
                                        <p className={`text-xs ${allCompleted ? 'text-green-600' : 'text-purple-600'}`}>
                                          Total: €{totalAmount.toFixed(2)}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    {/* Individual Split Bills */}
                                    <div className="space-y-2">
                                      {splitBills.map((bill, billIndex) => {
                                        const isCompleted = bill.status === 'Completed';
                                        return (
                                          <div
                                            key={`${parentOrderId}-${bill.id}-${billIndex}`}
                                            className={`p-3 rounded-lg border-2 transition-all ${
                                              isCompleted
                                                ? 'border-green-300 bg-green-50 opacity-75'
                                                : selectedOrder?.id === bill.id
                                                  ? 'border-primary bg-white shadow-md'
                                                  : 'border-purple-200 bg-white hover:border-purple-300 hover:shadow-sm'
                                            }`}
                                          >
                                            <div className="flex justify-between items-start gap-3">
                                              <div 
                                                className={`flex-1 ${isCompleted ? 'cursor-default' : 'cursor-pointer'}`}
                                                onClick={() => !isCompleted && setSelectedOrder(bill)}
                                              >
                                                <div className="flex items-center gap-2 mb-1">
                                                  <Badge 
                                                    variant="secondary" 
                                                    className={`text-xs font-semibold ${
                                                      isCompleted 
                                                        ? 'bg-green-100 text-green-700' 
                                                        : 'bg-purple-100 text-purple-700'
                                                    }`}
                                                  >
                                                    Split {bill.splitNumber}/{bill.totalSplits}
                                                  </Badge>
                                                  <span className="text-xs text-gray-500">#{bill.id}</span>
                                                  {isCompleted && (
                                                    <Badge variant="default" className="text-xs bg-green-500 text-white">
                                                      ✓ Paid
                                                    </Badge>
                                                  )}
                                                </div>
                                                <p className={`text-sm font-semibold mb-1 ${
                                                  isCompleted ? 'text-green-700' : 'text-purple-900'
                                                }`}>
                                                  {bill.payerName}
                                                </p>
                                                <p className="text-xs text-gray-600">
                                                  {bill.items?.length || 0} items
                                                </p>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <div className="text-right">
                                                  <p className={`font-bold text-lg ${
                                                    isCompleted ? 'text-green-700' : 'text-purple-900'
                                                  }`}>
                                                    €{bill.totalAmount.toFixed(2)}
                                                  </p>
                                                  <Badge 
                                                    variant={isCompleted ? "default" : "outline"} 
                                                    className={`text-xs mt-1 ${
                                                      isCompleted 
                                                        ? 'bg-green-500 text-white' 
                                                        : ''
                                                    }`}
                                                  >
                                                    {bill.status}
                                                  </Badge>
                                                </div>
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlePrintBill(bill);
                                                  }}
                                                  className={`h-8 w-8 p-0 ${
                                                    isCompleted 
                                                      ? 'border-green-300 text-green-600 hover:bg-green-100' 
                                                      : ''
                                                  }`}
                                                  title="Print Bill"
                                                >
                                                  <Printer className="h-4 w-4" />
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Payment Processing */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedOrder ? (
                      <>
                        {/* Order Summary */}
                        <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between">
                            <span>Subtotal (Net):</span>
                            <span>€{selectedOrder.totalAmount.toFixed(2)}</span>
                          </div>
                          
                          {/* German Tax Breakdown */}
                          {taxCalculation && (
                            <>
                              <div className="text-sm text-gray-600 border-t pt-2">
                                {/* 7% VAT (Reduced Rate) */}
                                {taxCalculation.vatBreakdown.rate7.net > 0 && (
                                  <>
                                    <div className="flex justify-between">
                                      <span>VAT 7% (Net):</span>
                                      <span>€{taxCalculation.vatBreakdown.rate7.net.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>VAT 7% (Tax):</span>
                                      <span>€{taxCalculation.vatBreakdown.rate7.vat.toFixed(2)}</span>
                                    </div>
                                  </>
                                )}
                                
                                {/* 19% VAT (Standard Rate) */}
                                {taxCalculation.vatBreakdown.rate19.net > 0 && (
                                  <>
                                    <div className="flex justify-between">
                                      <span>VAT 19% (Net):</span>
                                      <span>€{taxCalculation.vatBreakdown.rate19.net.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>VAT 19% (Tax):</span>
                                      <span>€{taxCalculation.vatBreakdown.rate19.vat.toFixed(2)}</span>
                                    </div>
                                  </>
                                )}
                              </div>
                              <div className="flex justify-between font-semibold border-t pt-1">
                                <span>Total VAT:</span>
                                <span>€{taxCalculation.totalVat.toFixed(2)}</span>
                              </div>
                            </>
                          )}

                          {parseFloat(discountPercentage) > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Discount ({discountPercentage}%):</span>
                              <span>-€{getDiscountAmount().toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-gray-600 italic">
                            <span>Tip (tax-exempt):</span>
                            <span>€{(parseFloat(tipAmount) || 0).toFixed(2)}</span>
                          </div>
                          <hr />
                          <div className="flex justify-between font-bold">
                            <span>Total (Gross):</span>
                            <span>€{getTotalWithTip().toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Tip Input */}
                        <div className="space-y-2">
                          <Label htmlFor="tip">Tip Amount (€)</Label>
                          <Input
                            id="tip"
                            type="number"
                            step="0.01"
                            min="0"
                            value={tipAmount}
                            onChange={(e) => setTipAmount(e.target.value)}
                            placeholder="0.00"
                          />
                        </div>

                        {/* Discount Input */}
                        <div className="space-y-2">
                          <Label htmlFor="discount">Discount (%)</Label>
                          <Input
                            id="discount"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={discountPercentage}
                            onChange={(e) => setDiscountPercentage(e.target.value)}
                            placeholder="0.00"
                          />
                          {parseFloat(discountPercentage) > 0 && (
                            <p className="text-sm text-green-600">
                              Discount: -€{getDiscountAmount().toFixed(2)}
                            </p>
                          )}
                        </div>

                        {/* Payment Method Selection */}
                        <div className="space-y-2">
                          <Label>Payment Method</Label>
                          <div className="grid grid-cols-1 gap-2">
                            {paymentMethods.map((method) => (
                              <Button
                                key={method.id}
                                variant={selectedPaymentMethod === method.id ? "default" : "outline"}
                                className="justify-start"
                                onClick={() => setSelectedPaymentMethod(method.id)}
                              >
                                <div className={`w-3 h-3 rounded-full ${method.color} mr-2`} />
                                {method.icon}
                                <span className="ml-2">{method.name}</span>
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Cash Payment Details */}
                        {selectedPaymentMethod === 'cash' && (
                          <div className="space-y-2">
                            <Label htmlFor="amount">Amount Received (€)</Label>
                            <Input
                              id="amount"
                              type="number"
                              step="0.01"
                              min="0"
                              value={amountReceived}
                              onChange={(e) => setAmountReceived(e.target.value)}
                              placeholder={getTotalWithTip().toFixed(2)}
                            />
                            {amountReceived && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">Change: </span>
                                <span className="font-medium text-green-600">
                                  €{calculateChange().toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Payment Action Buttons */}
                        <div className="space-y-3">
                          {/* Process Payment Button */}
                          <Button
                            onClick={processPayment}
                            disabled={!selectedPaymentMethod || processing}
                            className="w-full"
                            size="lg"
                          >
                            {processing ? (
                              <>
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Process Payment (€{getTotalWithTip().toFixed(2)})
                              </>
                            )}
                          </Button>

                          {/* Debug: Show selected order info */}
                          {selectedOrder && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                              <p className="text-sm font-medium text-blue-800">Selected Order:</p>
                              <p className="text-xs text-blue-600">
                                ID: {selectedOrder.id} | Status: {selectedOrder.status} | Amount: €{selectedOrder.totalAmount}
                              </p>
                            </div>
                          )}
                          
                          {/* Split Bill Options */}
                          {selectedOrder && selectedOrder.status !== 'Split' && (
                            <div className="space-y-2">
                              <Button
                                variant="outline"
                                className="w-full"
                                size="lg"
                                disabled={!selectedOrder || processing}
                                onClick={() => {
                                  if (selectedOrder) {
                                    // Initialize assignments - all items assigned to payee 1 by default
                                    const initialAssignments: {[key: number]: number} = {};
                                    selectedOrder.items.forEach((_: any, idx: number) => {
                                      initialAssignments[idx] = 1;
                                    });
                                    setPayeeAssignments(initialAssignments);
                                    setShowSplitBillDialog(true);
                                  } else {
                                    toast({
                                      title: "No Order Selected",
                                      description: "Please select an order first before splitting the bill.",
                                      variant: "destructive"
                                    });
                                  }
                                }}
                              >
                                <Users className="h-4 w-4 mr-2" />
                                Split Bill by Items
                              </Button>
                              
                              <Button
                                variant="outline"
                                className="w-full"
                                size="sm"
                                disabled={!selectedOrder || processing}
                                onClick={() => handleSimpleSplitBill(selectedOrder)}
                              >
                                <Receipt className="h-4 w-4 mr-2" />
                                Quick Split (Auto 50/50)
                              </Button>
                              
                            </div>
                          )}
                          
                          {/* Show split bill options if order is already split */}
                          {selectedOrder && selectedOrder.status === 'Split' && (
                            <div className="space-y-2">
                              <div className="text-center text-sm font-medium text-purple-700 bg-purple-50 p-2 rounded">
                                This order has been split into {selectedOrder.splitInto} separate bills
                              </div>
                              <Button
                                variant="outline"
                                className="w-full"
                                size="lg"
                                onClick={() => {
                                  // Refresh orders to show split bills
                                  const userId = getUserId();
                                  const ordersKey = `orders_${userId}`;
                                  const storedOrders = localStorage.getItem(ordersKey);
                                  if (storedOrders) {
                                    const allOrders = JSON.parse(storedOrders);
                                    const pendingOrders = allOrders.filter((order: any) => 
                                      (order.status === 'Pending' || order.status === 'Order Received' || order.status === 'Pending Payment') &&
                                      order.orderType !== 'home-delivery' &&
                                      order.status !== 'Split'
                                    );
                                    setOrders(pendingOrders);
                                    toast({
                                      title: "Orders Refreshed",
                                      description: "Split bills should now be visible in the order list"
                                    });
                                  }
                                }}
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Show Split Bills
                              </Button>
                            </div>
                          )}
                        </div>

                      </>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        Select an order to process payment
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>


            </div>
          )}

          {activeSubsection === 'order-history' && (
            <div className="space-y-6">
              {/* New Order Notification */}
              {showNewHistoryNotification && (
                <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
                  <div className="bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
                    <History className="h-5 w-5" />
                    <span className="font-medium">New order added to history!</span>
                  </div>
                </div>
              )}
              
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Order History
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Review all past completed transactions for your restaurant.
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchOrderHistory}
                    disabled={isHistoryLoading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isHistoryLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isHistoryLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2">Loading order history...</p>
                  </div>
                ) : completedOrders.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <History className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No completed orders yet</p>
                    <p className="text-sm mt-2">Completed orders will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-500 mb-4">
                      Showing {completedOrders.length} orders • Last updated: {lastRefresh.toLocaleTimeString()}
                    </p>
                    {completedOrders.map((order, idx) => {
                      const isExpanded = expandedOrderId === order.id;
                      
                      return (
                        <Card
                          key={order.id || `order-${idx}`}
                          className="overflow-hidden hover:shadow-md transition-shadow"
                        >
                          <CardContent className="p-0">
                            {/* Compact Header */}
                            <div 
                              className="p-4 cursor-pointer hover:bg-gray-50"
                              onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                            >
                              <div className="flex items-start justify-between gap-4">
                                {/* Left: Order Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-sm text-gray-900 truncate" title={order.id}>
                                        #{order.id.split('_').pop()}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {new Date(order.createdAt).toLocaleDateString()} • {new Date(order.createdAt).toLocaleTimeString()}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 flex-wrap">
                              {order.orderType === 'delivery' || order.orderType === 'home-delivery' ? 
                                      <Badge variant="secondary" className="flex items-center gap-1 w-fit text-xs">
                                        <Car className="h-3 w-3"/>Delivery
                                      </Badge> : 
                                order.orderType === 'take-away' ?
                                      <Badge variant="destructive" className="flex items-center gap-1 w-fit text-xs">
                                        <Store className="h-3 w-3"/>Take Away
                                      </Badge> :
                                      <Badge variant="outline" className="flex items-center gap-1 w-fit text-xs">
                                        <Store className="h-3 w-3"/>Dine-In
                                      </Badge>
                                    }
                                    
                                    <Badge variant="secondary" className="text-xs">
                                      {order.status || 'Completed'}
                                    </Badge>
                                    
                                    <span className="text-xs text-gray-500">
                                      {order.items?.length || 0} items
                                    </span>
                                </div>
                                </div>

                                {/* Right: Price & Actions */}
                                <div className="text-right">
                                  <div className="font-bold text-xl text-green-600 mb-2">
                                    {(() => {
                              const orderCurrency = order.currency || 'EUR';
                              const currencySymbol = orderCurrency === 'EUR' ? '€' : orderCurrency === 'USD' ? '$' : '€';
                              let totalAmount = 0;
                              let hasValidItems = false;
                              
                              if (order.items && order.items.length > 0) {
                                order.items.forEach((item: any) => {
                                  let priceStr = item.unitPrice && item.unitPrice.toString().trim() ? item.unitPrice : item.name && item.name.match(/(\d+[.,]?\d*)\s*(EUR|€)/i)?.[0];
                                  if (priceStr) {
                                    hasValidItems = true;
                                    const match = priceStr.toString().match(/(\d+[.,]?\d*)/);
                                    if (match) {
                                      totalAmount += parseFloat(match[1].replace(',', '.')) * item.quantity;
                                    }
                                  }
                                });
                              }
                              
                              if (hasValidItems && totalAmount > 0) {
                                return `${currencySymbol}${totalAmount.toFixed(2)}`;
                              } else {
                                const amount = typeof order.totalAmount === 'number' && !isNaN(order.totalAmount) ? order.totalAmount : parseFloat(order.totalAmount) || 0;
                                return `${currencySymbol}${amount.toFixed(2)}`;
                              }
                                    })()}
                                  </div>
                                  
                                <Button
                                    variant="ghost"
                                  size="sm"
                                    className="text-xs h-7"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewOrderDetails(order);
                                    }}
                                >
                                  View Details
                                </Button>
                                </div>
                              </div>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                              <div className="border-t border-gray-200 bg-gray-50 p-4">
                                {/* Customer/Table Info */}
                                <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                    {order.orderType === 'delivery' || order.orderType === 'home-delivery' ? 'Delivery Details' : 
                                     order.orderType === 'take-away' ? 'Customer Details' : 'Table Details'}
                                  </h4>
                                  {order.orderType === 'delivery' || order.orderType === 'home-delivery' ? (
                                    <div className="space-y-1 text-sm">
                                      <p className="font-medium text-gray-900">{order.customerName ?? order.customerInfo?.name ?? 'N/A'}</p>
                                      <p className="text-xs text-gray-600">
                                        {order.customerInfo?.address ? 
                                          `${order.customerInfo.address.street}, ${order.customerInfo.address.city} - ${order.customerInfo.address.pinCode}` :
                                          order.customerAddress ?? 'No address'}
                                      </p>
                                      <p className="text-xs text-gray-600">{order.customerInfo?.phone ?? 'No phone'}</p>
                                    </div>
                                  ) : order.orderType === 'take-away' ? (
                                    <div className="space-y-1 text-sm">
                                      <p className="font-medium text-gray-900">{order.customerInfo?.name ?? order.customerName ?? 'Unknown'}</p>
                                      <p className="text-xs text-gray-600">{order.customerInfo?.phone ?? 'No phone'}</p>
                                    </div>
                                  ) : (
                                    <div className="space-y-1 text-sm">
                                      <p className="font-medium text-gray-900">Table {order.table ?? order.customerInfo?.tableNumber ?? 'N/A'}</p>
                                      <p className="text-xs text-gray-600">Status: {getTableStatus(order.table ?? order.customerInfo?.tableNumber ?? '')}</p>
                                    </div>
                                  )}
                                </div>

                                {/* Order Items */}
                                <div className="mb-4">
                                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                    Order Items ({order.items?.length || 0})
                                  </h4>
                                  <div className="space-y-2">
                                    {order.items?.map((item: any, itemIdx: number) => (
                                      <div key={itemIdx} className="flex justify-between items-center p-2 bg-white rounded-lg border border-gray-200">
                                        <div className="flex-1">
                                          <p className="font-medium text-sm text-gray-900">{item.name}</p>
                                          <p className="text-xs text-gray-500">€{item.unitPrice} × {item.quantity}</p>
                                        </div>
                                        <p className="font-semibold text-sm text-gray-900">
                                          €{(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-3 border-t border-gray-200">
                                <Button
                                  variant="outline"
                                  size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditOrder(order);
                                    }}
                                    className="flex-1"
                                  >
                                    <Edit3 className="h-3 w-3 mr-1" />
                                    Edit Order
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditCustomer(order);
                                    }}
                                    className="flex-1"
                                  >
                                    <User className="h-3 w-3 mr-1" />
                                    Edit Customer
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePrintBill(order);
                                    }}
                                    className="flex-1"
                                  >
                                    <Printer className="h-3 w-3 mr-1" />
                                    Print Bill
                                </Button>
                              </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
            </div>
          )}

          {activeSubsection === 'order-analytics' && (
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <Button onClick={() => router.push('/order-analytics')} className="bg-blue-600 hover:bg-blue-700">
                View Analytics
              </Button>
            </div>
          )}

        {/* Split Bill Dialog */}
        <Dialog open={showSplitBillDialog} onOpenChange={setShowSplitBillDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Users className="h-5 w-5 text-blue-600" />
                Split Bill by Items
              </DialogTitle>
              <DialogDescription>
                Assign items to different payees. Each payee will pay only for their assigned items.
              </DialogDescription>
            </DialogHeader>
            
            {selectedOrder && (
              <div className="space-y-6 py-4">
                {/* Number of Payees Selector */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <Label htmlFor="num-payees" className="text-sm font-semibold text-gray-900 mb-2 block">
                    Number of Payees
                  </Label>
                  <select
                    id="num-payees"
                    value={numberOfPayees}
                    onChange={(e) => {
                      const newNum = parseInt(e.target.value);
                      setNumberOfPayees(newNum);
                      // Reset all assignments to payee 1
                      const resetAssignments: {[key: number]: number} = {};
                      selectedOrder.items.forEach((_: any, idx: number) => {
                        resetAssignments[idx] = 1;
                      });
                      setPayeeAssignments(resetAssignments);
                    }}
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {[2, 3, 4, 5, 6, 7, 8].map(num => (
                      <option key={num} value={num}>{num} Payees</option>
                    ))}
                  </select>
        </div>

                {/* Items Assignment */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Assign Items to Payees</h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item: any, idx: number) => (
                      <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900 truncate">{item.name}</p>
                            <p className="text-xs text-gray-600">€{item.unitPrice} × {item.quantity}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Assign to:</span>
                            <select
                              value={payeeAssignments[idx] || 1}
                              onChange={(e) => {
                                setPayeeAssignments(prev => ({
                                  ...prev,
                                  [idx]: parseInt(e.target.value)
                                }));
                              }}
                              className="h-8 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                              {Array.from({length: numberOfPayees}, (_, i) => i + 1).map(num => (
                                <option key={num} value={num}>Payee {num}</option>
                              ))}
                            </select>
                            <div className="text-right min-w-[60px]">
                              <p className="font-bold text-sm text-gray-900">€{(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
        </div>
                
                {/* Payee Summary */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Bill Summary per Payee</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Array.from({length: numberOfPayees}, (_, i) => i + 1).map(payeeNum => {
                      const payeeItems = selectedOrder.items.filter((_: any, idx: number) => 
                        payeeAssignments[idx] === payeeNum
                      );
                      const payeeTotal = payeeItems.reduce((sum: number, item: any) => 
                        sum + (parseFloat(item.unitPrice) * item.quantity), 0
                      );
                      
                      return (
                        <div key={payeeNum} className="bg-white border border-gray-300 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-blue-600" />
                            <p className="font-semibold text-sm text-gray-900">Payee {payeeNum}</p>
        </div>
                          <p className="text-xs text-gray-600 mb-1">{payeeItems.length} items</p>
                          <p className="font-bold text-lg text-blue-600">€{payeeTotal.toFixed(2)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowSplitBillDialog(false);
                  setPayeeAssignments({});
                  setNumberOfPayees(2);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // Create split bills based on assignments
                  if (!selectedOrder) return;
                  
                  const userId = getUserId();
                  const ordersKey = `orders_${userId}`;
                  const existingOrders = JSON.parse(localStorage.getItem(ordersKey) || '[]');
                  
                  // Group items by payee
                  const payeeGroups: {[key: number]: any[]} = {};
                  selectedOrder.items.forEach((item: any, idx: number) => {
                    const payeeNum = payeeAssignments[idx] || 1;
                    if (!payeeGroups[payeeNum]) {
                      payeeGroups[payeeNum] = [];
                    }
                    payeeGroups[payeeNum].push(item);
                  });
                  
                  // Create split bills for each payee
                  const splitBills = Object.entries(payeeGroups).map(([payeeNum, items]) => {
                    const payeeTotal = items.reduce((sum, item) => 
                      sum + (parseFloat(item.unitPrice) * item.quantity), 0
                    );
                    
                    return {
                      ...selectedOrder,
                      id: `${selectedOrder.id}_split_${payeeNum}`,
                      parentOrderId: selectedOrder.id,
                      splitNumber: parseInt(payeeNum),
                      totalSplits: numberOfPayees,
                      payerName: `Payee ${payeeNum}`,
                      items: items,
                      totalAmount: payeeTotal,
                      status: 'Pending Payment',
                      isSplitBill: true
                    };
                  });
                  
                  // Update original order to Split status
                  const updatedOrders = existingOrders.map((o: any) => 
                    o.id === selectedOrder.id ? { ...o, status: 'Split', splitInto: numberOfPayees } : o
                  );
                  
                  // Add all split bills
                  updatedOrders.push(...splitBills);
                  
                  // Save to localStorage
                  localStorage.setItem(ordersKey, JSON.stringify(updatedOrders));
                  
                  toast({
                    title: "Bill Split Successfully!",
                    description: `Order split into ${numberOfPayees} separate bills based on item assignments.`,
                  });
                  
                  // Refresh and close
                  const pendingOrders = updatedOrders.filter((order: any) => 
                    (order.status === 'Pending' || order.status === 'Order Received' || order.status === 'Pending Payment') &&
                    order.orderType !== 'home-delivery' &&
                    (order.status !== 'Split' || order.isSplitBill)
                  );
                  setOrders(pendingOrders);
                  setSelectedOrder(null);
                  setShowSplitBillDialog(false);
                  setPayeeAssignments({});
                  setNumberOfPayees(2);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Users className="h-4 w-4 mr-2" />
                Create Split Bills
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancellation Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Cancel Order</DialogTitle>
              <DialogDescription>
                Please provide a reason for cancelling order {orderToCancel?.id}. This field is optional.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="cancel-reason">Cancellation Reason (Optional)</Label>
                <Textarea
                  id="cancel-reason"
                  placeholder="Enter reason for cancellation..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCancelDialogClose}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelOrder}
              >
                Confirm Cancellation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Customer Edit Dialog */}
        <Dialog open={showCustomerEditDialog} onOpenChange={setShowCustomerEditDialog}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Customer Details</DialogTitle>
              <DialogDescription>
                Update customer information for order {editingOrder?.id}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-customer-name">Customer Name *</Label>
                  <Input
                    id="edit-customer-name"
                    value={editCustomerInfo.name}
                    onChange={(e) => setEditCustomerInfo({ ...editCustomerInfo, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-customer-phone">Phone Number *</Label>
                  <Input
                    id="edit-customer-phone"
                    value={editCustomerInfo.phone}
                    onChange={(e) => setEditCustomerInfo({ ...editCustomerInfo, phone: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-customer-email">Email</Label>
                  <Input
                    id="edit-customer-email"
                    type="email"
                    value={editCustomerInfo.email || ''}
                    onChange={(e) => setEditCustomerInfo({ ...editCustomerInfo, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-customer-table">Table Number</Label>
                  <Input
                    id="edit-customer-table"
                    value={editCustomerInfo.tableNumber}
                    onChange={(e) => setEditCustomerInfo({ ...editCustomerInfo, tableNumber: e.target.value })}
                  />
                </div>
              </div>

              {/* Address fields for delivery orders */}
              {editingOrder?.orderType === 'home-delivery' && (
                <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800">Delivery Address</h4>
                  <div>
                    <Label htmlFor="edit-customer-street">Street Address *</Label>
                    <Input
                      id="edit-customer-street"
                      value={editCustomerInfo.address?.street || ''}
                      onChange={(e) => setEditCustomerInfo({ 
                        ...editCustomerInfo, 
                        address: { 
                          ...(editCustomerInfo.address || { street: '', city: '', pinCode: '' }), 
                          street: e.target.value 
                        } 
                      })}
                      required
                      placeholder="Enter street address"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-customer-city">City *</Label>
                      <Input
                        id="edit-customer-city"
                        value={editCustomerInfo.address?.city || ''}
                        onChange={(e) => setEditCustomerInfo({ 
                          ...editCustomerInfo, 
                          address: { 
                            ...(editCustomerInfo.address || { street: '', city: '', pinCode: '' }), 
                            city: e.target.value 
                          } 
                        })}
                        required
                        placeholder="Enter city"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-customer-pincode">Pin Code *</Label>
                      <Input
                        id="edit-customer-pincode"
                        value={editCustomerInfo.address?.pinCode || ''}
                        onChange={(e) => setEditCustomerInfo({ 
                          ...editCustomerInfo, 
                          address: { 
                            ...(editCustomerInfo.address || { street: '', city: '', pinCode: '' }), 
                            pinCode: e.target.value 
                          } 
                        })}
                        required
                        placeholder="Enter pin code"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCustomerEditDialogClose}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveCustomerEdit}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Order Details Dialog */}
        <Dialog open={showOrderDetailsDialog} onOpenChange={setShowOrderDetailsDialog}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Order Details - {selectedOrderForDetails?.id}
              </DialogTitle>
              <DialogDescription>
                Complete information about this order including special instructions
              </DialogDescription>
            </DialogHeader>
            
            {selectedOrderForDetails && (
              <div className="space-y-6">
                {/* Order Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        selectedOrderForDetails.orderType === 'delivery' || selectedOrderForDetails.orderType === 'home-delivery' ? 'secondary' :
                        selectedOrderForDetails.orderType === 'take-away' ? 'destructive' : 'outline'
                      }>
                        {selectedOrderForDetails.orderType === 'delivery' || selectedOrderForDetails.orderType === 'home-delivery' ? 'Delivery' :
                         selectedOrderForDetails.orderType === 'take-away' ? 'Take Away' : 'Dine-In'}
                      </Badge>
                      <Badge variant="outline">
                        {selectedOrderForDetails.status}
                      </Badge>
                    </div>
                    <p><strong>Order ID:</strong> {selectedOrderForDetails.id}</p>
                    <p><strong>Created:</strong> {new Date(selectedOrderForDetails.createdAt).toLocaleString()}</p>
                    <p><strong>Channel:</strong> {selectedOrderForDetails.channel || 'On premise'}</p>
                  </div>
                  <div className="space-y-2">
                    <p><strong>Total Amount:</strong> €{selectedOrderForDetails.totalAmount?.toFixed(2) || '0.00'}</p>
                    <p><strong>Items:</strong> {selectedOrderForDetails.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0}</p>
                    {selectedOrderForDetails.paymentMode && (
                      <p><strong>Payment:</strong> {selectedOrderForDetails.paymentMode}</p>
                    )}
                  </div>
                </div>

                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                    {selectedOrderForDetails.orderType === 'delivery' || selectedOrderForDetails.orderType === 'home-delivery' ? (
                      <>
                        <div>
                          <p><strong>Name:</strong> {selectedOrderForDetails.customerName ?? selectedOrderForDetails.customerInfo?.name ?? 'N/A'}</p>
                          <p><strong>Phone:</strong> {selectedOrderForDetails.customerInfo?.phone ?? 'N/A'}</p>
                          <p><strong>Email:</strong> {selectedOrderForDetails.customerInfo?.email ?? 'N/A'}</p>
                        </div>
                        <div>
                          <p><strong>Address:</strong></p>
                          <p className="text-sm text-muted-foreground">
                            {selectedOrderForDetails.customerInfo?.address ? 
                              `${selectedOrderForDetails.customerInfo.address.street}, ${selectedOrderForDetails.customerInfo.address.city} - ${selectedOrderForDetails.customerInfo.address.pinCode}` :
                              selectedOrderForDetails.customerAddress ?? 'N/A'
                            }
                          </p>
                        </div>
                      </>
                    ) : selectedOrderForDetails.orderType === 'take-away' ? (
                      <div>
                        <p><strong>Name:</strong> {selectedOrderForDetails.customerInfo?.name ?? selectedOrderForDetails.customerName ?? 'N/A'}</p>
                        <p><strong>Phone:</strong> {selectedOrderForDetails.customerInfo?.phone ?? 'N/A'}</p>
                        <p><strong>Email:</strong> {selectedOrderForDetails.customerInfo?.email ?? 'N/A'}</p>
                      </div>
                    ) : (
                      <div>
                        <p><strong>Table:</strong> {selectedOrderForDetails.table ?? selectedOrderForDetails.customerInfo?.tableNumber ?? 'N/A'}</p>
                        <p><strong>Table Status:</strong> {getTableStatus(selectedOrderForDetails.table ?? selectedOrderForDetails.customerInfo?.tableNumber ?? '')}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items with Special Instructions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Order Items</h3>
                  <div className="space-y-3">
                    {selectedOrderForDetails.items?.map((item: any, idx: number) => (
                      <div key={idx} className="p-4 border rounded-lg space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              €{item.unitPrice} × {item.quantity} = €{(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}
                            </p>
                            {/* Add-ons display */}
                            {item.addOns && item.addOns.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-semibold text-gray-600 mb-1">Customizations:</p>
                                <div className="flex flex-wrap gap-1">
                                  {item.addOns.map((addOn: any, addOnIdx: number) => (
                                    <Badge 
                                      key={addOnIdx} 
                                      variant={addOn.type === 'remove' ? 'destructive' : addOn.type === 'extra' ? 'default' : 'secondary'}
                                      className="text-xs"
                                    >
                                      {addOn.name}
                                      {addOn.type === 'extra' && addOn.price > 0 && ` (+€${addOn.price.toFixed(2)})`}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <Badge variant="outline">
                            Qty: {item.quantity}
                          </Badge>
                        </div>
                        
                        {/* Special Instructions */}
                        {item.notes && item.notes.trim() && (
                          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm font-medium text-blue-800 mb-1">Special Instructions:</p>
                            <p className="text-sm text-blue-700">{item.notes}</p>
                          </div>
                        )}
                      </div>
                    )) || <p className="text-muted-foreground">No items found</p>}
                  </div>
                </div>

                {/* Payment Information */}
                {selectedOrderForDetails.paymentMode && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Payment Information</h3>
                    <div className="p-4 border rounded-lg space-y-2">
                      <p><strong>Payment Method:</strong> {selectedOrderForDetails.paymentMode}</p>
                      {selectedOrderForDetails.tipAmount && (
                        <p><strong>Tip:</strong> €{selectedOrderForDetails.tipAmount.toFixed(2)}</p>
                      )}
                      {selectedOrderForDetails.discountPercentage && (
                        <p><strong>Discount:</strong> {selectedOrderForDetails.discountPercentage}%</p>
                      )}
                      {selectedOrderForDetails.amountPaid && (
                        <p><strong>Amount Paid:</strong> €{selectedOrderForDetails.amountPaid.toFixed(2)}</p>
                      )}
                      {selectedOrderForDetails.change && (
                        <p><strong>Change:</strong> €{selectedOrderForDetails.change.toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleOrderDetailsDialogClose}
              >
                Close
              </Button>
              {selectedOrderForDetails && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleEditOrder(selectedOrderForDetails)}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Order
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handlePrintBill(selectedOrderForDetails)}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print Bill
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
  );
}