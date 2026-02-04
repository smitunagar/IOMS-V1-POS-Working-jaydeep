"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { useToast } from '@/shared/hooks/use-toast';
import { 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Receipt, 
  CheckCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  Users,
  Package,
  TrendingDown,
  Printer,
  QrCode,
  FileText
} from 'lucide-react';
import { getPendingOrders, updateOrderStatus, type Order } from '@/server/lib/orderService';
import { getInventory } from '@/server/lib/inventoryService';
import { getInventoryImpact } from '@/server/lib/inventoryValidation';

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

const paymentMethods: PaymentMethod[] = [
  { id: 'cash', name: 'Cash', icon: <Banknote className="h-5 w-5" />, color: 'bg-green-500' },
  { id: 'card', name: 'Credit/Debit Card', icon: <CreditCard className="h-5 w-5" />, color: 'bg-blue-500' },
  { id: 'mobile', name: 'Mobile Payment', icon: <Smartphone className="h-5 w-5" />, color: 'bg-purple-500' },
];

export default function PaymentPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [tipAmount, setTipAmount] = useState<string>('0');
  const [processing, setProcessing] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<string[]>([]);
  const [showBill, setShowBill] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [inventoryImpactData, setInventoryImpactData] = useState<any>(null);

  // Get user ID from localStorage or use default
  const getUserId = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userId') || 'default_user';
    }
    return 'default_user';
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // Fetch orders from API instead of localStorage
        const response = await fetch('/api/orders');
        if (response.ok) {
          const data = await response.json();
          const pendingOrders = data.orders.filter((order: Order) => order.status === 'Pending');
          setOrders(pendingOrders);
        } else {
          console.error('Failed to fetch orders from API');
          // Fallback to localStorage
          const userId = getUserId();
          const pendingOrders = getPendingOrders(userId);
          setOrders(pendingOrders);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        // Fallback to localStorage
        const userId = getUserId();
        const pendingOrders = getPendingOrders(userId);
        setOrders(pendingOrders);
      }
      
      // Get inventory
      const userId = getUserId();
      const currentInventory = getInventory(userId);
      setInventory(currentInventory);
    };

    fetchOrders();
  }, []);

  // Calculate inventory impact when order is selected
  useEffect(() => {
    const calculateImpact = async () => {
      if (!selectedOrder) {
        setInventoryImpactData(null);
        return;
      }

      try {
        const userId = getUserId();
        const orderItems = selectedOrder.items.map(item => ({
          name: item.name,
          quantity: item.quantity
        }));

        const impact = await getInventoryImpact(userId, orderItems);
        setInventoryImpactData(impact);
      } catch (error) {
        console.error('Error calculating inventory impact:', error);
      }
    };

    calculateImpact();
  }, [selectedOrder]);

  const calculateChange = (): number => {
    if (!selectedOrder || !amountReceived) return 0;
    const received = parseFloat(amountReceived) || 0;
    const tip = parseFloat(tipAmount) || 0;
    const total = selectedOrder.totalAmount + tip;
    return Math.max(0, received - total);
  };

  const getTotalWithTip = (): number => {
    if (!selectedOrder) return 0;
    return selectedOrder.totalAmount + (parseFloat(tipAmount) || 0);
  };

  const generateBill = (order: Order, paymentDetails: any) => {
    const billData = {
      id: `BILL-${order.id}-${Date.now()}`,
      orderId: order.id,
      date: new Date().toLocaleDateString('de-DE'),
      time: new Date().toLocaleTimeString('de-DE'),
      tableId: order.tableId,
      items: order.items,
      subtotal: order.totalAmount,
      tip: paymentDetails.tipAmount || 0,
      total: order.totalAmount + (paymentDetails.tipAmount || 0),
      paymentMethod: paymentDetails.paymentMethod,
      amountPaid: paymentDetails.amountPaid,
      change: paymentDetails.change || 0,
      companyName: "IOMS Restaurant",
      address: "123 Restaurant Street, City",
      phone: "+49 123 456 789",
      email: "info@ioms-restaurant.com"
    };
    return billData;
  };

  const generateQRCode = (billData: any) => {
    // Generate QR code data with bill information
    const qrData = {
      billId: billData.id,
      orderId: billData.orderId,
      total: billData.total,
      date: billData.date,
      restaurant: billData.companyName
    };
    return JSON.stringify(qrData);
  };

  const printReceipt = (billData: any) => {
    // Create a printable receipt
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
              <h2>${billData.companyName}</h2>
              <p>${billData.address}</p>
              <p>Tel: ${billData.phone}</p>
              <p>Email: ${billData.email}</p>
            </div>
            <div class="line"></div>
            <p><strong>Bill ID:</strong> ${billData.id}</p>
            <p><strong>Order ID:</strong> ${billData.orderId}</p>
            <p><strong>Date:</strong> ${billData.date} ${billData.time}</p>
            <p><strong>Table:</strong> ${billData.tableId || 'N/A'}</p>
            <div class="line"></div>
            <h3>Items:</h3>
            ${billData.items.map((item: any) => `
              <div class="item">
                <span>${item.name} x${item.quantity}</span>
                <span>€${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            `).join('')}
            <div class="line"></div>
            <div class="item">
              <span>Subtotal:</span>
              <span>€${billData.subtotal.toFixed(2)}</span>
            </div>
            <div class="item">
              <span>Tip:</span>
              <span>€${billData.tip.toFixed(2)}</span>
            </div>
            <div class="item total">
              <span>Total:</span>
              <span>€${billData.total.toFixed(2)}</span>
            </div>
            <div class="line"></div>
            <p><strong>Payment Method:</strong> ${billData.paymentMethod}</p>
            <p><strong>Amount Paid:</strong> €${billData.amountPaid.toFixed(2)}</p>
            ${billData.change > 0 ? `<p><strong>Change:</strong> €${billData.change.toFixed(2)}</p>` : ''}
            <div class="qr-info">
              <p>QR Code: ${generateQRCode(billData).substring(0, 50)}...</p>
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

    if (selectedPaymentMethod === 'cash' && received < totalAmount) {
      toast({
        title: "Insufficient Payment",
        description: `Received: €${received.toFixed(2)}, Required: €${totalAmount.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    try {
      // Final inventory check before processing payment
      const userId = getUserId();
      const orderItems = selectedOrder.items.map(item => ({
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
        console.log('✅ Order status updated successfully');

        // Handle inventory deduction after successful payment
        try {
          if (userId && orderItems && orderItems.length > 0) {
            console.log('🔄 Starting inventory deduction for completed order');
            
            // Get menu data from localStorage (synchronized by order-entry page)
            const menuDataKey = `menu_data_${userId}`;
            const menuData = localStorage.getItem(menuDataKey);
            
            if (menuData) {
              const menu = JSON.parse(menuData);
              console.log(`📋 Found menu data with ${menu.length} items for inventory deduction`);
              
              // Import and call inventory deduction function
              const { deductInventoryForOrder } = await import('@/server/lib/inventoryService');
              const deductionResult = deductInventoryForOrder(userId, orderItems, menu);
              
              if (deductionResult.success) {
                // Show detailed success message in console
                console.log('✅ Inventory deduction successful:', deductionResult.deductions);
                
                const deductionSummary = deductionResult.deductions.length > 0 
                  ? `${deductionResult.deductions.length} ingredients deducted from inventory`
                  : 'No inventory changes needed';
                
                toast({
                  title: "Payment & Inventory Updated! 🎉",
                  description: `Order completed successfully. ${deductionSummary}`,
                });
              } else {
                // Show errors but continue with order completion
                console.warn('⚠️ Inventory deduction had errors:', deductionResult.errors);
                toast({
                  title: "Payment Successful ⚠️",
                  description: `Order completed but inventory not fully updated: ${deductionResult.errors.slice(0, 2).join(', ')}`,
                  variant: "destructive",
                });
              }
            } else {
              console.warn('⚠️ No menu data found for inventory deduction');
              toast({
                title: "Payment Successful ⚠️",
                description: "Order completed but inventory could not be updated (menu data not found)",
                variant: "destructive",
              });
            }
          } else {
            console.warn('⚠️ Missing user ID or order items for inventory deduction');
          }
        } catch (inventoryError) {
          console.error('❌ Error during inventory deduction:', inventoryError);
          toast({
            title: "Payment Successful ⚠️",
            description: "Order completed but inventory update failed",
            variant: "destructive",
          });
        }

        // Generate bill and receipt data
        const paymentDetails = {
          paymentMethod: selectedPaymentMethod,
          tipAmount: parseFloat(tipAmount) || 0,
          amountPaid: selectedPaymentMethod === 'cash' ? received : totalAmount,
          change: selectedPaymentMethod === 'cash' ? calculateChange() : 0
        };

        const billData = generateBill(selectedOrder, paymentDetails);
        setReceiptData(billData);
        setCompletedOrder(selectedOrder);
        setShowBill(true);

        // Check for low stock after completion
        const updatedInventory = getInventory(userId);
        const alerts: string[] = [];
        updatedInventory.forEach(item => {
          if (item.lowStockThreshold && item.quantity <= item.lowStockThreshold) {
            alerts.push(`${item.name}: ${item.quantity} ${item.unit} remaining`);
          }
        });
        setLowStockAlerts(alerts);

        // Show change if cash payment
        if (selectedPaymentMethod === 'cash' && calculateChange() > 0) {
          toast({
            title: "Change Due",
            description: `Return €${calculateChange().toFixed(2)} to customer`,
          });
        }

        // Show low stock alerts
        if (alerts.length > 0) {
          setTimeout(() => {
            toast({
              title: "⚠️ Low Stock Alert",
              description: `${alerts.length} items need restocking`,
              variant: "destructive",
            });
          }, 1000);
        }

        // Reset form
        setSelectedOrder(null);
        setSelectedPaymentMethod('');
        setAmountReceived('');
        setTipAmount('0');

        // Refresh orders from API
        const ordersResponse = await fetch('/api/orders');
        if (ordersResponse.ok) {
          const data = await ordersResponse.json();
          const pendingOrders = data.orders.filter((order: Order) => order.status === 'Pending');
          setOrders(pendingOrders);
        }
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

  const getOrderItemsWithIngredients = (order: Order) => {
    // Use the getDishes function from menuService instead of localStorage
    const userId = getUserId();
    const dishes = JSON.parse(localStorage.getItem(`dishes_${userId}`) || '[]');
    
    return order.items.map(item => {
      const dish = dishes.find((d: any) => d.name === item.name);
      const ingredients = dish?.ingredients || [];
      return {
        ...item,
        ingredients: ingredients.map((ing: any) => {
          const name = typeof ing === 'string' ? ing : ing.inventoryItemName;
          const quantity = typeof ing === 'string' ? 1 : ing.quantityPerDish;
          const unit = typeof ing === 'string' ? 'unit' : ing.unit;
          return { name, quantity: quantity * (item.quantity || 1), unit };
        })
      };
    });
  };

  return (
    
      <div className="container mx-auto p-6 space-y-6">
        
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Pending Orders</p>
                  <p className="text-2xl font-bold">{orders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Pending</p>
                  <p className="text-2xl font-bold">
                                  <p className="text-2xl font-bold">
                €{orders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2)}
              </p>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Inventory Items</p>
                  <p className="text-2xl font-bold">{inventory.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
          <div>
                  <p className="text-sm text-muted-foreground">Low Stock Items</p>
                  <p className="text-2xl font-bold">{lowStockAlerts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="payment" className="space-y-4">
          <TabsList>
            <TabsTrigger value="payment">Process Payment</TabsTrigger>
            <TabsTrigger value="orders">Order Details</TabsTrigger>
            <TabsTrigger value="inventory">Inventory Impact</TabsTrigger>
          </TabsList>

          <TabsContent value="payment" className="space-y-4">
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
                    <div className="space-y-2">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          onClick={() => setSelectedOrder(order)}
                          className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                            selectedOrder?.id === order.id
                              ? 'border-primary bg-primary/10'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                          <div>
                              <p className="font-medium">Order #{order.id}</p>
                              <p className="text-sm text-muted-foreground">
                                {order.items?.length || 0} items • Table {order.tableId || 'N/A'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(order.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">€{order.totalAmount.toFixed(2)}</p>
                              <Badge variant="outline">
                                {order.status}
                              </Badge>
                          </div>
                          </div>
                        </div>
                      ))}
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
                          <span>Subtotal:</span>
                          <span>€{selectedOrder.totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tip:</span>
                          <span>€{(parseFloat(tipAmount) || 0).toFixed(2)}</span>
                        </div>
                        <hr />
                        <div className="flex justify-between font-bold">
                          <span>Total:</span>
                          <span>€{getTotalWithTip().toFixed(2)}</span>
                        </div>
                      </div>                      {/* Tip Input */}
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
                    </>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Select an order to process payment
                    </p>
                  )}
                      </CardContent>
                    </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Order Details & Ingredients</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedOrder ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <strong>Order ID:</strong> {selectedOrder.id}
                      </div>
                      <div>
                        <strong>Table:</strong> {selectedOrder.tableId || 'N/A'}
                      </div>
                      <div>
                        <strong>Status:</strong> {selectedOrder.status}
                      </div>
                      <div>
                        <strong>Created:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Ingredients Required</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getOrderItemsWithIngredients(selectedOrder).map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>€{(item.price * item.quantity).toFixed(2)}</TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {item.ingredients.map((ing: any, ingIdx: number) => (
                                  <div key={ingIdx} className="text-sm">
                                    {ing.name}: {ing.quantity} {ing.unit}
                                  </div>
                  ))}
                </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Select an order to view details
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  Inventory Impact Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedOrder && inventoryImpactData ? (
                  <div className="space-y-6">
                    {/* Order Validation Status */}
                    <div className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">Order Fulfillment Status</h3>
                        {inventoryImpactData.validation.canFulfill ? (
                          <Badge className="bg-green-100 text-green-800">✓ Can Fulfill</Badge>
                        ) : (
                          <Badge variant="destructive">⚠ Cannot Fulfill</Badge>
                        )}
                      </div>
                      
                      {inventoryImpactData.validation.errors.length > 0 && (
                        <div className="mb-3">
                          <h4 className="font-medium text-red-700 mb-2">Critical Issues:</h4>
                          <ul className="space-y-1">
                            {inventoryImpactData.validation.errors.map((error: string, idx: number) => (
                              <li key={idx} className="text-sm text-red-600 flex items-start gap-2">
                                <span>•</span>
                                <span>{error}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {inventoryImpactData.validation.warnings.length > 0 && (
                        <div>
                          <h4 className="font-medium text-yellow-700 mb-2">Warnings:</h4>
                          <ul className="space-y-1">
                            {inventoryImpactData.validation.warnings.map((warning: string, idx: number) => (
                              <li key={idx} className="text-sm text-yellow-600 flex items-start gap-2">
                                <span>•</span>
                                <span>{warning}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Detailed Ingredient Impact */}
                    {inventoryImpactData.impact && inventoryImpactData.impact.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3">Ingredient Requirements & Impact</h3>
                        <div className="grid gap-3">
                          {inventoryImpactData.impact.map((ingredient: any, idx: number) => (
                            <div key={idx} className={`p-4 rounded-lg border ${
                              ingredient.sufficient ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                            }`}>
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium">{ingredient.ingredientName}</h4>
                                {ingredient.sufficient ? (
                                  <Badge variant="secondary" className="bg-green-100 text-green-800">✓ Available</Badge>
                                ) : (
                                  <Badge variant="destructive">⚠ Insufficient</Badge>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                                <div className="text-center">
                                  <div className="text-gray-600 text-xs">Required</div>
                                  <div className="font-bold text-lg">{ingredient.required.toFixed(1)}</div>
                                  <div className="text-gray-500 text-xs">{ingredient.unit}</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-gray-600 text-xs">Available</div>
                                  <div className="font-bold text-lg">{ingredient.available.toFixed(1)}</div>
                                  <div className="text-gray-500 text-xs">{ingredient.unit}</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-gray-600 text-xs">After Order</div>
                                  <div className={`font-bold text-lg ${
                                    ingredient.remainingAfterOrder < 0 ? 'text-red-600' : 'text-green-600'
                                  }`}>
                                    {ingredient.remainingAfterOrder.toFixed(1)}
                                  </div>
                                  <div className="text-gray-500 text-xs">{ingredient.unit}</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-gray-600 text-xs">Usage</div>
                                  <div className="font-bold text-lg">{ingredient.percentageUsed.toFixed(1)}%</div>
                                  <div className="text-gray-500 text-xs">of stock</div>
                                </div>
                              </div>
                              
                              {/* Visual progress bar */}
                              <div className="space-y-2">
                                <div className="flex justify-between text-xs text-gray-600">
                                  <span>Stock Usage</span>
                                  <span>{ingredient.percentageUsed.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                  <div 
                                    className={`h-3 rounded-full transition-all ${
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
                ) : (
                  <div className="text-center py-8">
                    {selectedOrder ? (
                      <div>
                        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Calculating inventory impact...</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Select an order to view inventory impact</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Low Stock Alerts */}
        {lowStockAlerts.length > 0 && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lowStockAlerts.map((alert, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{alert}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bill & Receipt Modal */}
        {showBill && receiptData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Receipt className="h-6 w-6" />
                  Payment Completed - Bill Generated
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Receipt Preview */}
                <div className="bg-gray-50 p-6 rounded-lg font-mono text-sm">
                  <div className="text-center mb-4">
                    <h3 className="font-bold text-lg">{receiptData.companyName}</h3>
                    <p>{receiptData.address}</p>
                    <p>Tel: {receiptData.phone}</p>
                    <p>Email: {receiptData.email}</p>
                  </div>
                  
                  <div className="border-b border-dashed border-gray-400 my-4"></div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <span><strong>Bill ID:</strong></span>
                    <span>{receiptData.id}</span>
                    <span><strong>Order ID:</strong></span>
                    <span>{receiptData.orderId}</span>
                    <span><strong>Date:</strong></span>
                    <span>{receiptData.date} {receiptData.time}</span>
                    <span><strong>Table:</strong></span>
                    <span>{receiptData.tableId || 'N/A'}</span>
                  </div>
                  
                  <div className="border-b border-dashed border-gray-400 my-4"></div>
                  
                  <h4 className="font-bold mb-2">Items:</h4>
                  {receiptData.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between">
                      <span>{item.name} x{item.quantity}</span>
                      <span>€{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  
                  <div className="border-b border-dashed border-gray-400 my-4"></div>
                  
                  <div className="space-y-1">
                      <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>€{receiptData.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                      <span>Tip:</span>
                      <span>€{receiptData.tip.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>€{receiptData.total.toFixed(2)}</span>
                      </div>
                      </div>
                  
                  <div className="border-b border-dashed border-gray-400 my-4"></div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Payment Method:</span>
                      <span className="capitalize">{receiptData.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Amount Paid:</span>
                      <span>€{receiptData.amountPaid.toFixed(2)}</span>
                    </div>
                    {receiptData.change > 0 && (
                      <div className="flex justify-between text-green-600 font-bold">
                        <span>Change:</span>
                        <span>€{receiptData.change.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center mt-6">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <QrCode className="h-5 w-5" />
                      <span>QR Code Data</span>
                    </div>
                    <p className="text-xs bg-white p-2 rounded border">
                      {generateQRCode(receiptData)}
                    </p>
                    <p className="mt-4 font-bold">Thank you for your visit!</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => printReceipt(receiptData)}
                    className="flex items-center gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Print Receipt
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      const qrData = generateQRCode(receiptData);
                      navigator.clipboard.writeText(qrData);
                      toast({
                        title: "QR Code Copied",
                        description: "QR code data copied to clipboard"
                      });
                    }}
                    className="flex items-center gap-2"
                  >
                    <QrCode className="h-4 w-4" />
                    Copy QR Code
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      const billText = `
Bill ID: ${receiptData.id}
Order ID: ${receiptData.orderId}
Date: ${receiptData.date} ${receiptData.time}
Table: ${receiptData.tableId || 'N/A'}

Items:
${receiptData.items.map((item: any) => `${item.name} x${item.quantity} - €${(item.price * item.quantity).toFixed(2)}`).join('\n')}

Subtotal: €${receiptData.subtotal.toFixed(2)}
Tip: €${receiptData.tip.toFixed(2)}
Total: €${receiptData.total.toFixed(2)}

Payment: ${receiptData.paymentMethod}
Paid: €${receiptData.amountPaid.toFixed(2)}
${receiptData.change > 0 ? `Change: €${receiptData.change.toFixed(2)}` : ''}

QR: ${generateQRCode(receiptData)}
                      `;
                      
                      const blob = new Blob([billText], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `bill-${receiptData.orderId}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Download Bill
                  </Button>
                  
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowBill(false);
                      setReceiptData(null);
                      setCompletedOrder(null);
                    }}
                  >
                    Close
                    </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    
  );
}