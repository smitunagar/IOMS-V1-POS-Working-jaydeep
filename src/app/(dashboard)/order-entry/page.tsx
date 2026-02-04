'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  User, 
  Phone, 
  MapPin,
  Search,
  Filter,
  Receipt,
  Package
} from 'lucide-react';
import { validateOrderInventory, getInventoryImpact } from '@/server/lib/inventoryValidation';
import { saveDishes, getDishes } from '@/server/lib/menuService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';

// DishCard component
function DishCard({ item, orderItems, onAddToOrder, formatPrice }: { 
  item: MenuItem; 
  orderItems: OrderItem[];
  onAddToOrder: (menuItem: MenuItem, selectedSize?: { size: string; price: string }) => void;
  formatPrice: (price: string | number) => string; 
}) {
  const [selectedSize, setSelectedSize] = useState(item.sizes && item.sizes.length > 0 ? item.sizes[0] : undefined);

  // Determine price to display
  const displayPrice = selectedSize ? selectedSize.price : item.price;

  // Only mark as added if product+size is in the order
  const alreadyAdded = orderItems.some(oi => {
    if (item.sizes && selectedSize) {
      return oi.menuItem.id === item.id && oi.selectedSize?.size === selectedSize.size;
    } else {
      return oi.menuItem.id === item.id;
    }
  });

  return (
    <Card className="hover:shadow-md transition-shadow flex flex-col min-h-[180px]">
      <CardContent className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1" style={{lineHeight:1.4}}>{item.name}</h3>
            <p className="text-xs text-muted-foreground mb-1">{item.category || 'Uncategorized'}</p>
            {item.image && <img src={item.image} alt="thumb" className="w-12 h-12 object-cover rounded mb-1" />}
          </div>
          <Badge variant="outline" className="ml-2">
            €{formatPrice(displayPrice)}
          </Badge>
        </div>
        {item.sizes && item.sizes.length > 1 && (
          <div className="mb-2">
            <select
              className="border rounded px-2 py-1 text-sm"
              value={selectedSize?.size}
              onChange={e => {
                const sz = item.sizes?.find(s => s.size === e.target.value);
                setSelectedSize(sz);
              }}
            >
              {item.sizes.map(sz => (
                <option key={sz.size} value={sz.size}>{sz.size} ({sz.price})</option>
              ))}
            </select>
          </div>
        )}
        {(() => {
          const cleanIngredients = item.ingredients
            ? item.ingredients.map(ing => typeof ing === 'string' ? ing : ing.inventoryItemName).filter(Boolean)
            : [];
          if (cleanIngredients.length === 0) return null;
          return (
            <p className="text-xs text-muted-foreground mb-3 truncate" title={cleanIngredients.join(', ')}>
              {cleanIngredients.slice(0, 3).join(', ')}
              {cleanIngredients.length > 3 ? '...' : ''}
            </p>
          );
        })()}
        <div className="flex-1" />
        <Button
          size="sm"
          onClick={() => onAddToOrder(item, selectedSize)}
          className={`w-full transition-all ${alreadyAdded ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
          variant={alreadyAdded ? 'default' : 'outline'}
          aria-label={alreadyAdded ? 'Added' : 'Add to Order'}
        >
          <span className="flex items-center justify-center">
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden md:inline">{alreadyAdded ? 'Added' : 'Add to Order'}</span>
          </span>
        </Button>
      </CardContent>
    </Card>
  );
}

// MenuItem type
interface MenuItem {
  id: string;
  name: string;
  price: number | string;
  category?: string;
  image?: string;
  aiHint?: string;
  ingredients?: (string | { inventoryItemName: string })[];
  sizes?: Array<{ size: string; price: string }>;
}

// OrderItem type
interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
  selectedSize?: { size: string; price: string };
}

interface CustomerInfo {
  name: string;
  phone: string;
  tableNumber: string;
  email?: string;
}

export default function OrderEntryPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    tableNumber: '',
    email: ''
  });
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  // Add order type state
  const [orderType, setOrderType] = useState<'dine-in' | 'take-away' | 'home-delivery'>('dine-in');
  const [driver, setDriver] = useState('');
  const drivers = ['John Doe', 'Jane Smith', 'Alex Rider', 'Priya Patel']; // Example drivers
  const [availableTables, setAvailableTables] = useState<any[]>([]); // Changed to any[] to store all tables
  
  // Inventory validation state
  const [inventoryValidation, setInventoryValidation] = useState<any>(null);
  const [inventoryImpact, setInventoryImpact] = useState<any>(null);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [validatingInventory, setValidatingInventory] = useState(false);

  // Load menu data on component mount (client-side only)
  useEffect(() => {
    // Only load on client side, not during SSR
    if (typeof window === 'undefined') return;
    loadMenuData();
  }, [currentUser]); // Depend on currentUser so menu is reloaded when user changes

  // Filter items when search term or category changes
  useEffect(() => {
    let filtered = menuItems;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setFilteredItems(filtered);
  }, [menuItems, selectedCategory, searchTerm]);

  // Validate inventory whenever order items change
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
        console.log('🔍 [ORDER-ENTRY] Validating inventory for userId:', userId);
        console.log('🔍 [ORDER-ENTRY] CurrentUser:', currentUser);
        console.log('🔍 [ORDER-ENTRY] LocalStorage contents:', typeof window !== 'undefined' ? Object.keys(localStorage) : 'SSR');
        
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

  // Fetch all tables on mount (client-side only)
  useEffect(() => {
    // Only fetch on client side, not during SSR
    if (typeof window === 'undefined') return;
    
    async function fetchTables() {
      try {
        const res = await fetch('/api/tables');
        const data = await res.json();
        setAvailableTables(data.tables); // Now stores all tables, not just available ones
      } catch (error) {
        setAvailableTables([]);
      }
    }
    fetchTables();
  }, []);

  const loadMenuData = async () => {
    try {
      setLoading(true);
      const userId = currentUser?.id || 'default_user';
      
      // First try to load from localStorage (saved menu data)
      const menuDataKey = `menu_data_${userId}`;
      const storedMenuData = localStorage.getItem(menuDataKey);
      
      if (storedMenuData) {
        const menuData = JSON.parse(storedMenuData);
        console.log('📋 [ORDER-ENTRY] Loading saved menu data:', menuData);
        setMenuItems(menuData.menuItems || []);
        setCategories(menuData.categories || []);
        return;
      }
      
      // Try to load from menu service as fallback
      try {
        const savedDishes = getDishes(userId);
        if (savedDishes && savedDishes.length > 0) {
          console.log('📋 [ORDER-ENTRY] Loading menu from menu service:', savedDishes.length, 'items');
          setMenuItems(savedDishes);
          const uniqueCategories = [...new Set(savedDishes.map((item: MenuItem) => item.category).filter(Boolean))] as string[];
          setCategories(uniqueCategories);
          return;
        }
      } catch (serviceError) {
        console.error('Error loading from menu service:', serviceError);
      }
      
      // Finally try to load from API as last resort
      try {
        const response = await fetch('/api/menuCsv');
        const data = await response.json();
        
        if (data.menu && Array.isArray(data.menu)) {
          // Convert menu items to proper format for the menu service
          const convertedMenu = data.menu.map((item: any) => ({
            ...item,
            price: typeof item.price === 'string' ? 
              parseFloat(item.price.replace(/[^\d.,]/g, '').replace(',', '.')) : 
              item.price
          }));
          
          setMenuItems(data.menu); // Keep original format for UI
          const uniqueCategories = [...new Set(data.menu.map((item: MenuItem) => item.category))] as string[];
          setCategories(uniqueCategories);
          
          // Save converted menu data to localStorage for inventory validation
          console.log('💾 [ORDER-ENTRY] Saving menu data to localStorage for userId:', userId);
          saveDishes(userId, convertedMenu);
        } else {
          setMenuItems([]);
          setCategories([]);
        }
      } catch (apiError) {
        console.error('Error loading menu from API:', apiError);
        setMenuItems([]);
        setCategories([]);
      }
    } catch (error) {
      console.error('Error loading menu data:', error);
      setMenuItems([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const addToOrder = (menuItem: MenuItem, selectedSize?: { size: string; price: string }) => {
    setOrderItems(prev => {
      const existingItem = prev.find(item => item.menuItem.id === menuItem.id && (!selectedSize || item.selectedSize?.size === selectedSize.size));
      
      if (existingItem) {
        return prev.map(item => 
          item.menuItem.id === menuItem.id && (!selectedSize || item.selectedSize?.size === selectedSize.size)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { menuItem, quantity: 1, selectedSize }];
      }
    });
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromOrder(itemId);
      return;
    }
    
    setOrderItems(prev => 
      prev.map(item => 
        item.menuItem.id === itemId 
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeFromOrder = (itemId: string) => {
    setOrderItems(prev => prev.filter(item => item.menuItem.id !== itemId));
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => {
      const priceStr = item.menuItem.price;
      if (!priceStr || typeof priceStr !== 'string') return total;
      const price = parseFloat(priceStr.replace(/[^\d.,]/g, '').replace(',', '.'));
      return total + (price * item.quantity);
    }, 0);
  };

  const handlePlaceOrder = async () => {
    if (orderItems.length === 0) {
      alert('Please add items to your order');
      return;
    }

    // Validate inventory first
    if (inventoryValidation && !inventoryValidation.canFulfill) {
      const errorMessage = `Cannot fulfill order due to insufficient inventory:\n\n${inventoryValidation.errors.join('\n')}`;
      alert(errorMessage);
      setShowInventoryModal(true); // Show detailed inventory modal
      return;
    }

    if (orderType === 'dine-in') {
      if (!customerInfo.tableNumber) {
        alert('Please enter table number');
        return;
      }
      // Mark table as occupied
      await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'occupy', tableId: customerInfo.tableNumber })
      });
    } else if (orderType === 'take-away') {
      if (!customerInfo.name || !customerInfo.phone) {
        alert('Please enter customer name and phone');
        return;
      }
    } else if (orderType === 'home-delivery') {
      if (!customerInfo.name || !customerInfo.phone || !customerInfo.email || !driver) {
        alert('Please enter all delivery details and assign a driver');
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
        unitPrice: item.menuItem.price, // Keep original format with EUR
        notes: item.notes,
        selectedSize: item.selectedSize
      })),
      totalAmount: calculateTotal(),
      createdAt: new Date().toISOString(),
      status: 'Pending',
      source: 'order-entry',
      channel: 'On premise',
      currency: 'EUR', // Always use EUR for European restaurant
      tableId: customerInfo.tableNumber || 'N/A'
    };
    try {
      // Add order to active orders
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
      // Clear current order state
      setOrderItems([]);
      setCustomerInfo({ name: '', phone: '', tableNumber: '', email: '' });
      setDriver('');
      setOrderType('dine-in');
      
      // Refresh available tables
      const res = await fetch('/api/tables');
      const data = await res.json();
      setAvailableTables(data.tables.filter((t: any) => t.status === 'Available').map((t: any) => t.id));
      
      // Redirect to payment page
      router.push('/payment');
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order. Please try again.');
    }
  };

  const formatPrice = (price: string | number) => {
    if (!price) return '0';
    if (typeof price === 'number') return price.toString();
    if (typeof price !== 'string') return '0';
    return price.replace(/[^\d.,]/g, '').replace(',', '.');
  };

  if (loading) {
    return (
      
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading menu...</p>
          </div>
        </div>
      
    );
  }

  return (
    
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Menu Items
                </CardTitle>
                <CardDescription>
                  Select items to add to your order
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                  {/* 3. Category badges horizontally scrollable, highlight active */}
                  <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2 mb-2">
                    <Badge
                      variant={selectedCategory === 'all' ? 'default' : 'secondary'}
                      className={`cursor-pointer whitespace-nowrap ${selectedCategory === 'all' ? 'border-blue-500 border-b-2' : ''}`}
                      onClick={() => setSelectedCategory('all')}
                    >
                      All Categories
                    </Badge>
                    {categories.map(category => (
                      <Badge
                        key={category}
                        variant={selectedCategory === category ? 'default' : 'secondary'}
                        className={`cursor-pointer whitespace-nowrap ${selectedCategory === category ? 'border-blue-500 border-b-2' : ''}`}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredItems.map((item, index) => {
                      // Ensure unique key - use item.id if available and unique, otherwise generate one
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

          {/* Order Section */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Current Order
                </CardTitle>
                <CardDescription>
                  {orderItems.length} item{orderItems.length !== 1 ? 's' : ''} in order | Total: <span className="font-bold">€{calculateTotal().toFixed(2)}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Type */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Order Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input type="radio" name="orderType" value="dine-in" checked={orderType === 'dine-in'} onChange={() => setOrderType('dine-in')} />
                        Dine In
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="radio" name="orderType" value="take-away" checked={orderType === 'take-away'} onChange={() => setOrderType('take-away')} />
                        Take Away
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="radio" name="orderType" value="home-delivery" checked={orderType === 'home-delivery'} onChange={() => setOrderType('home-delivery')} />
                        Home Delivery
                      </label>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Information */}
                {(orderType === 'take-away' || orderType === 'home-delivery') && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Customer Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <Label htmlFor="customerName">Customer Name *</Label>
                        <Input
                          id="customerName"
                          value={customerInfo.name}
                          onChange={e => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                          required={true}
                        />
                      </div>
                      <div className="mb-4">
                        <Label htmlFor="customerPhone">Phone Number *</Label>
                        <Input
                          id="customerPhone"
                          value={customerInfo.phone}
                          onChange={e => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                          required={true}
                        />
                      </div>
                      {orderType === 'home-delivery' && (
                        <>
                          <div className="mb-4">
                            <Label htmlFor="customerAddress">Address *</Label>
                            <Input
                              id="customerAddress"
                              value={customerInfo.email || ''}
                              onChange={e => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                              required={true}
                            />
                          </div>
                          <div className="mb-4">
                            <Label htmlFor="driver">Assign Driver *</Label>
                            <select id="driver" className="w-full border rounded px-2 py-2" value={driver} onChange={e => setDriver(e.target.value)} required>
                              <option value="">Select driver</option>
                              {drivers.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Table selection for Dine In */}
                {orderType === 'dine-in' && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Table Selection</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <Label htmlFor="tableNumber">Table Number *</Label>
                        <Input
                          id="tableNumberSearch"
                          placeholder="Search table..."
                          className="mb-2"
                          onChange={e => {
                            const val = e.target.value.toLowerCase();
                            setAvailableTables(prev => prev.map(t => ({ ...t, _hidden: !(t.number && t.number.toString().toLowerCase().includes(val)) })));
                          }}
                        />
                        <select
                          id="tableNumber"
                          className="w-full border rounded px-2 py-2"
                          value={customerInfo.tableNumber}
                          onChange={e => setCustomerInfo({ ...customerInfo, tableNumber: e.target.value })}
                          required
                        >
                          <option value="">Select table</option>
                          {availableTables.filter(t => !t._hidden).map((table: any) => (
                            <option key={table.id} value={table.id}>
                              Table {table.number} ({table.status.charAt(0).toUpperCase() + table.status.slice(1)})
                            </option>
                          ))}
                        </select>
                        {availableTables.length === 0 && (
                          <p className="text-sm text-red-500 mt-1">No tables found</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Separator />

                {/* Order Items */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Order Items</h4>
                  {orderItems.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No items in order</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {orderItems.map((item) => (
                        <div key={item.menuItem.id} className="flex items-center justify-between p-2 border rounded bg-white">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.menuItem.name}</p>
                            <p className="text-xs text-muted-foreground">€{formatPrice(item.menuItem.price)} × {item.quantity}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}>-</Button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <Button size="sm" variant="outline" onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}>+</Button>
                            <Button size="sm" variant="destructive" onClick={() => removeFromOrder(item.menuItem.id)}>Remove</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Inventory Validation Status */}
                {orderItems.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">Inventory Status:</span>
                      {validatingInventory ? (
                        <span className="text-sm text-gray-500">Checking...</span>
                      ) : inventoryValidation ? (
                        <div className="flex items-center gap-2">
                          {inventoryValidation.canFulfill ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              ✓ Available
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              ⚠ Insufficient Stock
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowInventoryModal(true)}
                          >
                            <Info className="h-3 w-3 mr-1" />
                            Details
                          </Button>
                        </div>
                      ) : null}
                    </div>

                    {/* Quick inventory alerts */}
                    {inventoryValidation && inventoryValidation.errors.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-2">
                        <p className="text-xs text-red-700 font-medium">Stock Issues:</p>
                        {inventoryValidation.errors.slice(0, 2).map((error: string, idx: number) => (
                          <p key={idx} className="text-xs text-red-600">• {error}</p>
                        ))}
                        {inventoryValidation.errors.length > 2 && (
                          <p className="text-xs text-red-600">... and {inventoryValidation.errors.length - 2} more</p>
                        )}
                      </div>
                    )}

                    {/* Quick inventory warnings */}
                    {inventoryValidation && inventoryValidation.warnings.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2">
                        <p className="text-xs text-yellow-700 font-medium">Warnings:</p>
                        {inventoryValidation.warnings.slice(0, 2).map((warning: string, idx: number) => (
                          <p key={idx} className="text-xs text-yellow-600">• {warning}</p>
                        ))}
                        {inventoryValidation.warnings.length > 2 && (
                          <p className="text-xs text-yellow-600">... and {inventoryValidation.warnings.length - 2} more</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <Separator />

                {/* Order Total */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-lg">€{calculateTotal().toFixed(2)}</span>
                  </div>
                  
                  {/* 8. Place Order: tooltip/message when disabled, animate enablement */}
                  <Button 
                    onClick={handlePlaceOrder}
                    disabled={
                      orderItems.length === 0 || 
                      (orderType === 'dine-in' && !customerInfo.tableNumber) ||
                      (inventoryValidation && !inventoryValidation.canFulfill) ||
                      validatingInventory
                    }
                    className={`w-full transition-all ${
                      orderItems.length === 0 || 
                      (orderType === 'dine-in' && !customerInfo.tableNumber) || 
                      (inventoryValidation && !inventoryValidation.canFulfill) ||
                      validatingInventory
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:scale-105'
                    }`}
                    title={
                      validatingInventory ? 'Checking inventory...' :
                      orderItems.length === 0 ? 'Add items to order' : 
                      (orderType === 'dine-in' && !customerInfo.tableNumber ? 'Select a table' : 
                      (inventoryValidation && !inventoryValidation.canFulfill ? 'Insufficient inventory - check details' :
                      'Place Order and Go to Payment'))
                    }
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {validatingInventory ? 'Checking Inventory...' : 'Place Order & Pay'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Inventory Impact Modal */}
        <Dialog open={showInventoryModal} onOpenChange={setShowInventoryModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Inventory Impact Analysis
              </DialogTitle>
            </DialogHeader>

            {inventoryValidation && (
              <div className="space-y-6">
                {/* Overall Status */}
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Order Fulfillment Status</h3>
                    {inventoryValidation.canFulfill ? (
                      <Badge className="bg-green-100 text-green-800">✓ Can Fulfill</Badge>
                    ) : (
                      <Badge variant="destructive">⚠ Cannot Fulfill</Badge>
                    )}
                  </div>
                  
                  {inventoryValidation.errors.length > 0 && (
                    <div className="mb-3">
                      <h4 className="font-medium text-red-700 mb-2">Critical Issues:</h4>
                      <ul className="space-y-1">
                        {inventoryValidation.errors.map((error: string, idx: number) => (
                          <li key={idx} className="text-sm text-red-600 flex items-start gap-2">
                            <span>•</span>
                            <span>{error}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {inventoryValidation.warnings.length > 0 && (
                    <div>
                      <h4 className="font-medium text-yellow-700 mb-2">Warnings:</h4>
                      <ul className="space-y-1">
                        {inventoryValidation.warnings.map((warning: string, idx: number) => (
                          <li key={idx} className="text-sm text-yellow-600 flex items-start gap-2">
                            <span>•</span>
                            <span>{warning}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Detailed Ingredient Analysis */}
                {inventoryImpact && inventoryImpact.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Ingredient Requirements & Impact</h3>
                    <div className="grid gap-3">
                      {inventoryImpact.map((ingredient: any, idx: number) => (
                        <div key={idx} className={`p-3 rounded-lg border ${
                          ingredient.sufficient ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{ingredient.ingredientName}</h4>
                            {ingredient.sufficient ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">✓ Available</Badge>
                            ) : (
                              <Badge variant="destructive">⚠ Insufficient</Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="text-gray-600">Required:</span>
                              <span className="ml-1 font-medium">{ingredient.required.toFixed(2)} {ingredient.unit}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Available:</span>
                              <span className="ml-1 font-medium">{ingredient.available.toFixed(2)} {ingredient.unit}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Remaining:</span>
                              <span className={`ml-1 font-medium ${
                                ingredient.remainingAfterOrder < 0 ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {ingredient.remainingAfterOrder.toFixed(2)} {ingredient.unit}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Usage:</span>
                              <span className="ml-1 font-medium">{ingredient.percentageUsed.toFixed(1)}%</span>
                            </div>
                          </div>
                          
                          {/* Visual bar */}
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  ingredient.percentageUsed > 100 ? 'bg-red-500' : 
                                  ingredient.percentageUsed > 80 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(ingredient.percentageUsed, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={() => setShowInventoryModal(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    
  );
} 