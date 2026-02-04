'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { ArrowLeft, Users, ShoppingCart } from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
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

export default function TestSplitBillPage() {
  const router = useRouter();
  
  // Test order data
  const testOrder: Order = {
    id: 'test_order_123',
    customerName: 'Test Customer',
    tableNumber: '1',
    status: 'Pending',
    items: [
      {
        id: 'item_1',
        name: 'Margherita Pizza',
        quantity: 1,
        unitPrice: 12.99,
        total: 15.49,
        addons: [
          { id: 'addon_1', name: 'Extra Cheese', price: 2.50 }
        ]
      },
      {
        id: 'item_2',
        name: 'Caesar Salad',
        quantity: 2,
        unitPrice: 8.99,
        total: 17.98,
        addons: []
      },
      {
        id: 'item_3',
        name: 'Chicken Burger',
        quantity: 1,
        unitPrice: 15.99,
        total: 18.99,
        addons: [
          { id: 'addon_2', name: 'Bacon', price: 3.00 }
        ]
      }
    ],
    subtotal: 52.46,
    tax: 9.97,
    total: 62.43,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const [payers, setPayers] = useState<Array<{
    id: string;
    name: string;
    selectedDishes: string[];
  }>>([{ id: 'payer-1', name: 'Payer 1', selectedDishes: [] }]);

  const [currentPayerIndex, setCurrentPayerIndex] = useState(0);

  const handleBack = () => {
    router.push('/orders');
  };

  const handleDishToggle = (dishId: string) => {
    console.log('🔧 Toggling dish:', dishId, 'for payer:', currentPayerIndex);
    
    setPayers(prevPayers => {
      const newPayers = [...prevPayers];
      const currentPayer = newPayers[currentPayerIndex];
      
      const dishIndex = currentPayer.selectedDishes.indexOf(dishId);
      if (dishIndex > -1) {
        // Remove dish
        currentPayer.selectedDishes.splice(dishIndex, 1);
        console.log('🔧 Removed dish:', dishId, 'from payer:', currentPayerIndex);
      } else {
        // Add dish
        currentPayer.selectedDishes.push(dishId);
        console.log('🔧 Added dish:', dishId, 'to payer:', currentPayerIndex);
      }
      
      console.log('🔧 Updated payers:', newPayers);
      return newPayers;
    });
  };

  const handleAddNextPayer = () => {
    const newPayerId = `payer-${payers.length + 1}`;
    setPayers(prevPayers => [...prevPayers, {
      id: newPayerId,
      name: `Payer ${payers.length + 1}`,
      selectedDishes: []
    }]);
    setCurrentPayerIndex(payers.length);
  };

  const getAvailableDishes = () => {
    const allSelectedDishes = payers.flatMap(payer => payer.selectedDishes);
    return testOrder.items.filter(item => !allSelectedDishes.includes(item.id));
  };

  const calculatePayerTotal = (payerIndex: number) => {
    const payer = payers[payerIndex];
    return payer.selectedDishes.reduce((total, dishId) => {
      const item = testOrder.items.find(i => i.id === dishId);
      return total + (item ? item.total : 0);
    }, 0);
  };

  const calculateTotalSplitAmount = () => {
    return payers.reduce((total, _, index) => total + calculatePayerTotal(index), 0);
  };

  const currentPayer = payers[currentPayerIndex];
  const availableDishes = getAvailableDishes();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Orders</span>
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-semibold text-gray-900">Split Bill</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Order #{testOrder.id}
              </div>
              <div className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                {testOrder.status}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Order Details Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span>Order Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-900">Customer</div>
                  <div className="text-sm text-gray-600">{testOrder.customerName}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Table</div>
                  <div className="text-sm text-gray-600">{testOrder.tableNumber}</div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <div className="text-sm font-medium text-gray-900 mb-2">Items</div>
                  <div className="space-y-2">
                    {testOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                        <Checkbox
                          checked={currentPayer.selectedDishes.includes(item.id)}
                          onCheckedChange={() => handleDishToggle(item.id)}
                          disabled={!currentPayer.selectedDishes.includes(item.id) && !availableDishes.some(d => d.id === item.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{item.name}</div>
                          <div className="text-xs text-gray-500">
                            Qty: {item.quantity} × €{item.unitPrice.toFixed(2)}
                          </div>
                          {item.addons && item.addons.length > 0 && (
                            <div className="text-xs text-gray-500">
                              +{item.addons.map(addon => addon.name).join(', ')}
                            </div>
                          )}
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          €{item.total.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">€{testOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax:</span>
                    <span className="font-medium">€{testOrder.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold pt-2 border-t border-gray-200">
                    <span>Total:</span>
                    <span>€{testOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              
              {/* Current Payer Section */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-blue-900">
                    <Users className="h-5 w-5" />
                    <span>Current Payer: {currentPayer.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold text-blue-900">
                    Total: €{calculatePayerTotal(currentPayerIndex).toFixed(2)}
                  </div>
                  <div className="text-sm text-blue-700 mt-1">
                    Selected {currentPayer.selectedDishes.length} item(s)
                  </div>
                </CardContent>
              </Card>

              {/* Available Dishes */}
              <Card>
                <CardHeader>
                  <CardTitle>Available Dishes</CardTitle>
                </CardHeader>
                <CardContent>
                  {availableDishes.length > 0 ? (
                    <div className="space-y-2">
                      {availableDishes.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-gray-500">
                              Qty: {item.quantity} × €{item.unitPrice.toFixed(2)}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="font-medium">€{item.total.toFixed(2)}</span>
                            <Button
                              size="sm"
                              onClick={() => handleDishToggle(item.id)}
                            >
                              Select
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No dishes available for selection
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Selected Dishes for Current Payer */}
              {currentPayer.selectedDishes.length > 0 && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-green-900">Selected Dishes for {currentPayer.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {currentPayer.selectedDishes.map((dishId) => {
                        const item = testOrder.items.find(i => i.id === dishId);
                        return item ? (
                          <div key={dishId} className="flex items-center justify-between p-2 bg-white rounded border border-green-200">
                            <span className="font-medium">{item.name}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">€{item.total.toFixed(2)}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDishToggle(dishId)}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex space-x-4">
                <Button
                  onClick={handleAddNextPayer}
                  disabled={currentPayer.selectedDishes.length === 0}
                  className="flex items-center space-x-2"
                >
                  <Users className="h-4 w-4" />
                  <span>Add Next Payer</span>
                </Button>
              </div>

              {/* Split Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Split Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {payers.map((payer, index) => (
                      <div
                        key={payer.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          index === currentPayerIndex 
                            ? 'border-blue-300 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setCurrentPayerIndex(index)}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{payer.name}</span>
                          <span className="font-semibold">€{calculatePayerTotal(index).toFixed(2)}</span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {payer.selectedDishes.length} item(s)
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200 mt-4">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total Split Amount:</span>
                      <span>€{calculateTotalSplitAmount().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mt-1">
                      <span>Original Order Total:</span>
                      <span>€{testOrder.subtotal.toFixed(2)}</span>
                    </div>
                    {Math.abs(calculateTotalSplitAmount() - testOrder.subtotal) > 0.01 && (
                      <div className="text-sm text-red-600 mt-2">
                        ⚠️ Split amounts don't match original order
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}











