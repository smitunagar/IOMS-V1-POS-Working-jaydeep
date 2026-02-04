"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { useToast } from '@/shared/hooks/use-toast';
import { ArrowLeft, Receipt, Users, Calculator, Euro } from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  addons?: Array<{
    id: string;
    name: string;
    price: number;
  }>;
}

interface Order {
  id: string;
  tableNumber: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function SplitBillPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams?.get('orderId');
  const { toast } = useToast();
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [payers, setPayers] = useState<Array<{
    id: string;
    name: string;
    selectedDishes: string[];
  }>>([{ id: 'payer-1', name: 'Payer 1', selectedDishes: [] }]);

  const [currentPayerIndex, setCurrentPayerIndex] = useState(0);

  useEffect(() => {
    try {
      if (orderId) {
        console.log('🔄 [SPLIT-BILL] Loading fresh order data for:', orderId);
        
        // Clear any cached data to prevent using old split bill data
        localStorage.removeItem('selectedOrderForSplit');
        console.log('🧹 [SPLIT-BILL] Cleared cached data to prevent old split bills');
        
        // Always fetch the most current order data from localStorage orders array
        const userId = localStorage.getItem('userId') || 'default_user';
        const ordersKey = `orders_${userId}`;
        const allOrders = JSON.parse(localStorage.getItem(ordersKey) || '[]');
        
        console.log('🔍 [SPLIT-BILL] All orders in storage:', allOrders.length);
        console.log('🔍 [SPLIT-BILL] All order IDs in storage:', allOrders.map((o: any) => ({ id: o.id, isSplitBill: o.isSplitBill, status: o.status })));
        
        // Find the current order (not split bills, but the original order)
        const currentOrder = allOrders.find((order: any) => 
          order.id === orderId && !order.isSplitBill
        );
        
        console.log('🔍 [SPLIT-BILL] Looking for order:', orderId);
        console.log('🔍 [SPLIT-BILL] All orders with matching ID:', allOrders.filter((o: any) => o.id === orderId));
        console.log('🔍 [SPLIT-BILL] Non-split orders with matching ID:', allOrders.filter((o: any) => o.id === orderId && !o.isSplitBill));
        console.log('🔍 [SPLIT-BILL] Found current order:', currentOrder ? 'YES' : 'NO');
        
        // If order not found, try to find it even if it's a split bill (for debugging)
        const anyOrderWithId = allOrders.find((order: any) => order.id === orderId);
        if (anyOrderWithId) {
          console.log('🔍 [SPLIT-BILL] Found order but it might be a split bill:', {
            id: anyOrderWithId.id,
            isSplitBill: anyOrderWithId.isSplitBill,
            status: anyOrderWithId.status
          });
        }
        
        if (currentOrder) {
          console.log('✅ [SPLIT-BILL] Found fresh order data:', {
            id: currentOrder.id,
            status: currentOrder.status,
            items: currentOrder.items?.map((item: any) => ({
              name: item.name,
              id: item.id,
              unitPrice: item.unitPrice,
              quantity: item.quantity
            })),
            totalAmount: currentOrder.totalAmount
          });
          
          // Ensure all items have unique IDs
          const orderWithUniqueIds = {
            ...currentOrder,
            items: currentOrder.items.map((item: any, index: number) => ({
              ...item,
              id: item.id || `${currentOrder.id}_item_${index}_${item.name.replace(/\s+/g, '_')}`
            }))
          };
          
          console.log('🔍 [SPLIT-BILL] Order items with prices:', orderWithUniqueIds.items.map((item: any) => ({
            name: item.name,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            total: typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) * (typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity) : item.unitPrice * item.quantity
          })));
          
          setSelectedOrder(orderWithUniqueIds);
          setLoading(false);
          return;
        } else {
          console.log('❌ [SPLIT-BILL] Original order not found, checking if it exists as split bill...');
          
          // Check if the order exists but is marked as a split bill
          const orderAsSplitBill = allOrders.find((order: any) => order.id === orderId);
          if (orderAsSplitBill) {
            console.log('⚠️ [SPLIT-BILL] Order found but marked as split bill:', {
              id: orderAsSplitBill.id,
              isSplitBill: orderAsSplitBill.isSplitBill,
              status: orderAsSplitBill.status,
              parentOrderId: orderAsSplitBill.parentOrderId
            });
            
            // If this is a split bill, try to find the parent order
            if (orderAsSplitBill.parentOrderId) {
              const parentOrder = allOrders.find((order: any) => 
                order.id === orderAsSplitBill.parentOrderId && !order.isSplitBill
              );
              if (parentOrder) {
                console.log('✅ [SPLIT-BILL] Found parent order, using it for splitting:', parentOrder.id);
                setSelectedOrder(parentOrder);
                setLoading(false);
                return;
              }
            }
          }
          
          console.log('❌ [SPLIT-BILL] Order not found in fresh data!');
          console.log('🔍 [SPLIT-BILL] Available order IDs:', allOrders.map((o: any) => o.id));
          console.log('🔍 [SPLIT-BILL] Orders with matching ID:', allOrders.filter((o: any) => o.id === orderId));
          setSelectedOrder(null);
          setLoading(false);
          return;
        }
      } else {
        console.log('❌ [SPLIT-BILL] No orderId provided');
        setSelectedOrder(null);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error in split bill useEffect:', error);
      setLoading(false);
    }
  }, [orderId]);

  const handleBack = () => {
    router.push('/orders');
  };

  const handleDishToggle = (dishId: string) => {
    console.log('🔄 [SPLIT-BILL] Toggling dish:', dishId);
    console.log('🔄 [SPLIT-BILL] Current payer index:', currentPayerIndex);
    
    setPayers(prevPayers => {
      console.log('📊 [SPLIT-BILL] Previous payers state:', prevPayers);
      
      const updatedPayers = [...prevPayers];
      const currentPayer = updatedPayers[currentPayerIndex];
      
      console.log('👤 [SPLIT-BILL] Current payer:', currentPayer);
      console.log('📋 [SPLIT-BILL] Current payer selected dishes before:', currentPayer.selectedDishes);
      
      const newSelectedDishes = [...currentPayer.selectedDishes];
      
      const dishIndex = newSelectedDishes.indexOf(dishId);
      if (dishIndex > -1) {
        console.log('➖ [SPLIT-BILL] Removing dish:', dishId);
        newSelectedDishes.splice(dishIndex, 1);
      } else {
        console.log('➕ [SPLIT-BILL] Adding dish:', dishId);
        newSelectedDishes.push(dishId);
      }
      
      console.log('📋 [SPLIT-BILL] Current payer selected dishes after:', newSelectedDishes);
      
      updatedPayers[currentPayerIndex] = {
        ...currentPayer,
        selectedDishes: newSelectedDishes
      };
      
      console.log('✅ [SPLIT-BILL] Updated payers state:', updatedPayers);
      
      return updatedPayers;
    });
  };

  const handleAddNextPayer = () => {
    const newPayerId = `payer-${payers.length + 1}`;
    const newPayer = {
      id: newPayerId,
      name: `Payer ${payers.length + 1}`,
      selectedDishes: []
    };
    setPayers([...payers, newPayer]);
    setCurrentPayerIndex(payers.length);
  };

  const handleSwitchPayer = (payerIndex: number) => {
    setCurrentPayerIndex(payerIndex);
  };

  const calculateItemTotal = (item: OrderItem) => {
    const unitPrice = typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice;
    const quantity = typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity;
    return (unitPrice * quantity) + (item.addons?.reduce((sum, addon) => {
      const addonPrice = typeof addon.price === 'string' ? parseFloat(addon.price) : addon.price;
      return sum + addonPrice;
    }, 0) || 0);
  };

  const calculatePayerTotal = (payerIndex: number) => {
    if (!selectedOrder) return 0;
    const payer = payers[payerIndex];
    if (!payer) return 0;
    
    return selectedOrder.items
      .filter(item => payer.selectedDishes.includes(item.id))
      .reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  const calculateTotalSplitAmount = () => {
    return payers.reduce((total, _, index) => total + calculatePayerTotal(index), 0);
  };

  const getAvailableDishes = () => {
    if (!selectedOrder) return [];
    const otherPayerSelectedDishes: string[] = [];
    
    // Only exclude dishes selected by OTHER payers (not current payer)
    payers.forEach((payer, index) => {
      if (index !== currentPayerIndex) {
        otherPayerSelectedDishes.push(...payer.selectedDishes);
      }
    });
    
    // Return all dishes that are not selected by other payers
    // This allows current payer to see and toggle ALL available dishes
    return selectedOrder.items.filter(item => !otherPayerSelectedDishes.includes(item.id));
  };

  const calculateOrderSubtotal = () => {
    if (!selectedOrder) return 0;
    return selectedOrder.items.reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  const calculateOrderTax = () => {
    const subtotal = calculateOrderSubtotal();
    // German tax rates: 7% for food, 19% for drinks/alcohol
    // For simplicity, using 19% for all items
    return subtotal * 0.19;
  };

  const calculateOrderTotal = () => {
    return calculateOrderSubtotal() + calculateOrderTax();
  };

  const handleCreateSplitBills = async () => {
    if (!selectedOrder) return;
    
    // Validate that all dishes are assigned
    const totalAssignedDishes = payers.reduce((total, payer) => total + payer.selectedDishes.length, 0);
    if (totalAssignedDishes !== selectedOrder.items.length) {
      toast({
        title: 'Incomplete Split',
        description: 'Please assign all dishes to payers before creating split bills.',
        variant: 'destructive'
      });
      return;
    }

    // Validate that split amount matches original
    const splitTotal = calculateTotalSplitAmount();
    const originalTotal = calculateOrderSubtotal();
    if (Math.abs(splitTotal - originalTotal) > 0.01) {
      toast({
        title: 'Amount Mismatch',
        description: 'Split amount does not match the original total.',
        variant: 'destructive'
      });
      return;
    }

    setCreating(true);
    console.log('🔄 [SPLIT-BILL] Creating split bills for order:', selectedOrder.id);

    try {
      const userId = localStorage.getItem('userId') || 'default_user';
      const splitBills: any[] = [];

      // Create a sub-order for each payer
      payers.forEach((payer, index) => {
        if (payer.selectedDishes.length === 0) return;

        const payerItems = selectedOrder.items.filter(item => 
          payer.selectedDishes.includes(item.id)
        );

        const payerSubtotal = payerItems.reduce((total, item) => total + calculateItemTotal(item), 0);
        const payerTax = payerSubtotal * 0.19; // 19% German tax
        const payerTotal = payerSubtotal + payerTax;

        console.log(`🔍 [SPLIT-BILL-DEBUG] Payer ${payer.name} calculation:`, {
          payerItems: payerItems.map(item => ({
            id: item.id,
            name: item.name,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            addons: item.addons,
            calculatedTotal: calculateItemTotal(item)
          })),
          payerSubtotal,
          payerTax,
          payerTotal
        });

        const splitBill = {
          id: `${selectedOrder.id}_split_${index + 1}`,
          parentOrderId: selectedOrder.id,
          splitNumber: index + 1,
          totalSplits: payers.length,
          payerName: payer.name,
          orderType: selectedOrder.orderType || 'dine-in',
          customerInfo: {
            name: payer.name,
            phone: selectedOrder.customerInfo?.phone || '',
            tableNumber: selectedOrder.tableNumber || selectedOrder.customerInfo?.tableNumber || '',
            email: selectedOrder.customerInfo?.email || ''
          },
          items: payerItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            notes: item.notes || '',
            addOns: item.addons || []
          })),
          subtotal: payerSubtotal,
          tax: payerTax,
          totalAmount: payerTotal,
          createdAt: new Date().toISOString(),
          status: 'Pending Payment',
          source: 'split-bill',
          channel: 'On premise',
          currency: 'EUR',
          tableId: selectedOrder.tableNumber || selectedOrder.customerInfo?.tableNumber || 'N/A',
          isSplitBill: true
        };

        splitBills.push(splitBill);
        console.log(`✅ [SPLIT-BILL] Created split bill ${index + 1}/${payers.length} for ${payer.name}:`, splitBill.id);
      });

      // Load existing orders
      const existingOrders = JSON.parse(localStorage.getItem(`orders_${userId}`) || '[]');

      // Check if split bills already exist for this order
      const existingSplitBills = existingOrders.filter((order: any) => 
        order.isSplitBill && order.parentOrderId === selectedOrder.id
      );
      
      if (existingSplitBills.length > 0) {
        console.log('⚠️ [SPLIT-BILL] Split bills already exist for this order, removing duplicates:', existingSplitBills.length);
        // Remove existing split bills for this order
        const filteredOrders = existingOrders.filter((order: any) => 
          !(order.isSplitBill && order.parentOrderId === selectedOrder.id)
        );
        existingOrders.length = 0;
        existingOrders.push(...filteredOrders);
      }

      // Update original order status
      const updatedOrders = existingOrders.map((order: any) => {
        if (order.id === selectedOrder.id) {
          return {
            ...order,
            status: 'Split',
            splitInto: payers.length,
            splitBillIds: splitBills.map(bill => bill.id),
            updatedAt: new Date().toISOString()
          };
        }
        return order;
      });

      // Add split bills to orders
      splitBills.forEach(bill => {
        updatedOrders.push(bill);
      });

      // Save updated orders
      localStorage.setItem(`orders_${userId}`, JSON.stringify(updatedOrders));
      console.log('✅ [SPLIT-BILL] All split bills saved to localStorage');
      console.log('📋 [SPLIT-BILL] Total orders in storage:', updatedOrders.length);
      console.log('📋 [SPLIT-BILL] Split bills:', splitBills.map(b => ({ id: b.id, status: b.status, isSplitBill: b.isSplitBill })));
      console.log('📋 [SPLIT-BILL] Parent order:', updatedOrders.find((o: any) => o.id === selectedOrder.id));

      // Dispatch event to notify other parts of the system
      const splitBillCreatedEvent = new CustomEvent('splitBillCreated', {
        detail: {
          parentOrderId: selectedOrder.id,
          splitBills: splitBills.map(bill => ({
            id: bill.id,
            payerName: bill.payerName,
            total: bill.totalAmount
          })),
          timestamp: new Date().toISOString(),
          totalSplitBills: splitBills.length
        }
      });
      window.dispatchEvent(splitBillCreatedEvent);
      console.log('📢 [SPLIT-BILL] Split bill created event dispatched');
      
      // Also dispatch on parent window if it exists
      if (window.opener) {
        window.opener.dispatchEvent(splitBillCreatedEvent);
        console.log('📢 [SPLIT-BILL] Split bill created event dispatched to parent window');
      }
      
      // Also dispatch a storage event to trigger refresh in other tabs/windows
      window.dispatchEvent(new StorageEvent('storage', {
        key: `orders_${userId}`,
        newValue: JSON.stringify(updatedOrders),
        url: window.location.href
      }));

      toast({
        title: 'Split Bills Created! 🎉',
        description: `Successfully created ${splitBills.length} separate bills. The payment section will now show the split bills.`
      });

        // Force refresh the parent window if it exists
        if (window.opener) {
          console.log('📢 [SPLIT-BILL] Refreshing parent window immediately');
          
          // Send message to parent window
          window.opener.postMessage({ 
            type: 'SPLIT_BILL_CREATED', 
            orderId: selectedOrder.id,
            splitBills: splitBills.map(bill => ({
              id: bill.id,
              payerName: bill.payerName,
              total: bill.totalAmount
            }))
          }, '*');
          
          // Force refresh the parent window's payment section
          try {
            if (window.opener.fetchOrdersForPayment) {
              window.opener.fetchOrdersForPayment();
            }
            
            // Also try to trigger a storage event in the parent window
            window.opener.dispatchEvent(new StorageEvent('storage', {
              key: `orders_${userId}`,
              newValue: JSON.stringify(updatedOrders),
              url: window.opener.location.href
            }));
          } catch (e) {
            console.log('Could not call parent refresh function directly');
          }
        }

      // If opened in a new tab/window, close it and refresh the parent
      setTimeout(() => {
        if (window.opener) {
          // This was opened from another window
          console.log('📢 [SPLIT-BILL] Closing window after refresh');
          // Give extra time for events to propagate
          setTimeout(() => {
            window.close();
          }, 1000);
        } else {
          // Standalone page, redirect to payment section
          console.log('📢 [SPLIT-BILL] Redirecting to payment section');
          router.push('/orders?section=payment');
        }
      }, 3000);

    } catch (error) {
      console.error('❌ [SPLIT-BILL] Error creating split bills:', error);
      toast({
        title: 'Error',
        description: 'Failed to create split bills. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!selectedOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Receipt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Order Not Found</h2>
          <p className="text-gray-500 mb-4">The selected order could not be found.</p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleBack}
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Split Bill</h1>
              <p className="text-sm text-gray-500">Table {selectedOrder.tableNumber} • {selectedOrder.customerName}</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {selectedOrder.status}
          </Badge>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar - Order Details */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>
            
            {/* Order Summary */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-medium">{selectedOrder.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Table:</span>
                <span className="font-medium">{selectedOrder.tableNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Customer:</span>
                <span className="font-medium">{selectedOrder.customerName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Items:</span>
                <span className="font-medium">{selectedOrder.items.length}</span>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="flex-1 overflow-y-auto p-6">
            <h3 className="text-md font-medium text-gray-900 mb-4">Select Dishes for Current Payer</h3>
            <div className="space-y-4">
              {selectedOrder.items.map((item, itemIndex) => {
                // A dish is available if it's not selected by OTHER payers (not current payer)
                const otherPayerSelectedDishes: string[] = [];
                payers.forEach((payer, payerIndex) => {
                  if (payerIndex !== currentPayerIndex) {
                    otherPayerSelectedDishes.push(...payer.selectedDishes);
                  }
                });
                const isAvailable = !otherPayerSelectedDishes.includes(item.id);
                const isSelected = payers[currentPayerIndex]?.selectedDishes.includes(item.id) || false;
                
                
                return (
                  <div 
                    key={item.id || `item-${itemIndex}`} 
                    className={`border rounded-lg p-4 transition-all ${
                      isSelected 
                        ? 'border-green-300 bg-green-50' 
                        : isAvailable 
                          ? 'border-gray-200 hover:border-blue-300 cursor-pointer' 
                          : 'border-gray-100 bg-gray-50 opacity-60'
                    }`}
                    onClick={() => isAvailable && handleDishToggle(item.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={!isAvailable}
                        className={`w-4 h-4 mt-0.5 ${
                          isAvailable 
                            ? 'text-blue-600 border-gray-300 rounded focus:ring-blue-500' 
                            : 'text-gray-400 border-gray-200'
                        }`}
                        readOnly
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className={`font-medium text-sm ${
                            isAvailable ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {item.name}
                          </h4>
                          <span className={`text-sm font-medium ${
                            isAvailable ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            €{calculateItemTotal(item).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mb-2">
                          <span>Qty: {item.quantity}</span>
                          <span>€{parseFloat(item.unitPrice.toString()).toFixed(2)} each</span>
                        </div>
                        {item.addons && item.addons.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">Add-ons:</p>
                            {item.addons.map((addon, addonIndex) => (
                              <div key={addon.id || `addon-${addonIndex}`} className="flex justify-between text-xs text-gray-600">
                                <span>+ {addon.name}</span>
                                <span>€{parseFloat(addon.price.toString()).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {!isAvailable && (
                          <div className="mt-2 text-xs text-orange-600 font-medium">
                            Already assigned to another payer
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Total */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">€{calculateOrderSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium">€{calculateOrderTax().toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span className="text-gray-900">Total:</span>
                <span className="text-blue-600">€{calculateOrderTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Split Bill Interface */}
        <div className="flex-1 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Split Bill</h2>
            <p className="text-gray-600">Select dishes for each payer and create separate bills.</p>
          </div>

          <div className="flex-1 p-6">
            <div className="space-y-6">
              {/* Current Payer Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">
                      {payers[currentPayerIndex]?.name}
                    </h3>
                    <p className="text-sm text-blue-700">
                      Select dishes for this payer
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-900">
                      €{calculatePayerTotal(currentPayerIndex).toFixed(2)}
                    </p>
                    <p className="text-xs text-blue-600">Current Total</p>
                  </div>
                </div>

              </div>

              {/* Selected Dishes for Current Payer */}
                {payers[currentPayerIndex]?.selectedDishes.length > 0 && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-green-900 mb-3">
                      Selected for {payers[currentPayerIndex]?.name}
                    </h4>
                    <div className="space-y-2">
                        {selectedOrder?.items
                          .filter(item => payers[currentPayerIndex]?.selectedDishes.includes(item.id))
                          .map((item, itemIndex) => (
                          <div key={item.id || `selected-item-${itemIndex}`} className="flex items-center justify-between p-2 bg-white rounded border">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                              {item.addons && item.addons.length > 0 && (
                                <p className="text-xs text-gray-600">
                                  + {item.addons.map(addon => addon.name).join(', ')}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <p className="font-semibold text-gray-900 text-sm">
                                €{calculateItemTotal(item).toFixed(2)}
                              </p>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDishToggle(item.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <Button
                  onClick={handleAddNextPayer}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                      disabled={payers[currentPayerIndex]?.selectedDishes.length === 0}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Add Next Payer
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCreateSplitBills}
                  disabled={creating || Math.abs(calculateTotalSplitAmount() - calculateOrderSubtotal()) > 0.01}
                >
                  {creating ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                      Creating Split Bills...
                    </>
                  ) : (
                    <>
                      <Receipt className="h-4 w-4 mr-2" />
                      Create Split Bills
                    </>
                  )}
                </Button>
              </div>

              {/* Split Summary */}
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Split Summary</h4>
                  <div className="space-y-2">
                    {payers.map((payer, index) => (
                      <div 
                        key={payer.id || `payer-${index}`} 
                        className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors ${
                          index === currentPayerIndex 
                            ? 'bg-blue-100 border-blue-300' 
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => handleSwitchPayer(index)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${index === currentPayerIndex ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                          <span className={`font-medium ${index === currentPayerIndex ? 'text-blue-900' : 'text-gray-900'}`}>
                            {payer.name}
                          </span>
                              <span className="text-sm text-gray-600">
                                ({payer.selectedDishes.length} items)
                              </span>
                        </div>
                        <span className="font-semibold text-gray-900">
                          €{calculatePayerTotal(index).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-3" />
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">Total Split Amount:</span>
                    <span className="font-bold text-gray-900">€{calculateTotalSplitAmount().toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">Original Total:</span>
                    <span className="font-bold text-gray-900">€{calculateOrderSubtotal().toFixed(2)}</span>
                  </div>
                  {Math.abs(calculateTotalSplitAmount() - calculateOrderSubtotal()) > 0.01 && (
                    <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-800">
                      ⚠️ Split amount doesn't match original total. Please adjust selections.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
