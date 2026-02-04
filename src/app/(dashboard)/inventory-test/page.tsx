'use client';

import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { useToast } from '@/shared/hooks/use-toast';

export default function InventoryTestPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const setupSampleData = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId') || 'default_user';
      
      const response = await fetch('/api/sample-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'setup-sample-data'
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        // Also set up sample menu data in localStorage
        const sampleMenuData = [
          {
            id: 'menu_001',
            name: 'Chicken Curry',
            price: '12.50',
            category: 'Main Course',
            ingredients: [
              { inventoryItemName: 'Chicken', quantityPerDish: 0.25, unit: 'kg' },
              { inventoryItemName: 'Onions', quantityPerDish: 0.1, unit: 'kg' },
              { inventoryItemName: 'Tomatoes', quantityPerDish: 0.05, unit: 'kg' },
              { inventoryItemName: 'Coconut Milk', quantityPerDish: 0.1, unit: 'l' },
              { inventoryItemName: 'Garlic', quantityPerDish: 0.01, unit: 'kg' },
              { inventoryItemName: 'Ginger', quantityPerDish: 0.01, unit: 'kg' },
              { inventoryItemName: 'Curry Powder', quantityPerDish: 0.01, unit: 'kg' }
            ]
          },
          {
            id: 'menu_002',
            name: 'Basmati Rice',
            price: '3.50',
            category: 'Side Dish',
            ingredients: [
              { inventoryItemName: 'Basmati Rice', quantityPerDish: 0.15, unit: 'kg' }
            ]
          },
          {
            id: 'menu_003',
            name: 'Naan Bread',
            price: '2.50',
            category: 'Bread',
            ingredients: [
              { inventoryItemName: 'Naan Bread', quantityPerDish: 1, unit: 'pcs' }
            ]
          },
          {
            id: 'menu_004',
            name: 'Fish Curry',
            price: '14.00',
            category: 'Main Course',
            ingredients: [
              { inventoryItemName: 'Onions', quantityPerDish: 0.08, unit: 'kg' },
              { inventoryItemName: 'Tomatoes', quantityPerDish: 0.06, unit: 'kg' },
              { inventoryItemName: 'Coconut Milk', quantityPerDish: 0.12, unit: 'l' },
              { inventoryItemName: 'Garlic', quantityPerDish: 0.01, unit: 'kg' },
              { inventoryItemName: 'Ginger', quantityPerDish: 0.01, unit: 'kg' },
              { inventoryItemName: 'Curry Powder', quantityPerDish: 0.015, unit: 'kg' }
            ]
          }
        ];

        localStorage.setItem(`dishes_${userId}`, JSON.stringify(sampleMenuData));
        
        toast({
          title: 'Success! 🎉',
          description: `Sample data created: ${result.inventoryItems} inventory items, ${result.menuItems} menu items`
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to setup sample data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const testInventoryValidation = async () => {
    try {
      const userId = localStorage.getItem('userId') || 'default_user';
      
      // Test with a large order that should exceed inventory
      const testOrder = [
        { name: 'Chicken Curry', quantity: 15 }, // This should exceed chicken stock
        { name: 'Basmati Rice', quantity: 10 }   // This should exceed rice stock
      ];

      const { validateOrderInventory } = await import('@/server/lib/inventoryValidation');
      const result = await validateOrderInventory(userId, testOrder);
      
      console.log('Inventory Validation Result:', result);
      
      toast({
        title: result.canFulfill ? 'Order Can Be Fulfilled ✅' : 'Order Cannot Be Fulfilled ❌',
        description: `${result.errors.length} errors, ${result.warnings.length} warnings, ${result.requiredIngredients.length} ingredients analyzed`
      });
    } catch (error) {
      console.error('Validation test error:', error);
      toast({
        title: 'Test Error',
        description: 'Failed to run validation test',
        variant: 'destructive'
      });
    }
  };

  return (
    
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold">Inventory Validation Test</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Setup Sample Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              This will create sample inventory and menu data to test the inventory validation system.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Sample Inventory Items:</h3>
                <ul className="text-sm space-y-1">
                  <li>• Rice (2.5 kg)</li>
                  <li>• Chicken (3.0 kg)</li>
                  <li>• Onions (1.5 kg)</li>
                  <li>• Tomatoes (0.8 kg) - Low stock</li>
                  <li>• Coconut Milk (1.2 l)</li>
                  <li>• Garlic, Ginger, Spices</li>
                  <li>• Naan Bread (20 pieces)</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Sample Menu Items:</h3>
                <ul className="text-sm space-y-1">
                  <li>• Chicken Curry (€12.50)</li>
                  <li>• Fish Curry (€14.00)</li>
                  <li>• Basmati Rice (€3.50)</li>
                  <li>• Naan Bread (€2.50)</li>
                </ul>
                <p className="text-xs text-gray-500 mt-2">
                  Each dish has proper ingredient mappings
                </p>
              </div>
            </div>
            
            <Button 
              onClick={setupSampleData} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Setting up...' : 'Setup Sample Data'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Inventory Validation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Test the inventory validation system with a large order that should exceed available stock.
            </p>
            
            <div className="p-4 border rounded-lg bg-yellow-50">
              <h4 className="font-medium mb-2">Test Scenario:</h4>
              <ul className="text-sm space-y-1">
                <li>• 15x Chicken Curry (requires 3.75kg chicken - exceeds 3kg stock)</li>
                <li>• 10x Basmati Rice (requires 1.5kg rice - within 1.8kg stock)</li>
              </ul>
              <p className="text-xs text-gray-600 mt-2">
                Expected: Order should fail due to insufficient chicken
              </p>
            </div>
            
            <Button 
              onClick={testInventoryValidation}
              variant="outline"
              className="w-full"
            >
              Run Validation Test
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Setup sample data using the button above</li>
              <li>Go to <a href="/orders" className="text-blue-600 underline">Orders</a> page</li>
              <li>Add dishes to your order and see real-time inventory validation</li>
              <li>Try adding many items to trigger insufficient stock warnings</li>
              <li>Go to <a href="/orders" className="text-blue-600 underline">Orders</a> page to see inventory impact analysis</li>
              <li>Complete a payment to see inventory get automatically updated</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    
  );
}