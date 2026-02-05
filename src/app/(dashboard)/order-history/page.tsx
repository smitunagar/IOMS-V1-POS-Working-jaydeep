"use client";

import React, { useState, useEffect } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/shared/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Loader2, Car, Store, RefreshCw } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/shared/components/ui/button';

export default function OrderHistoryPage() {
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [tables, setTables] = useState<any[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const { currentUser } = useAuth();

  const fetchData = async () => {
    if (currentUser) {
      setIsLoading(true);
      try {
        const resOrders = await fetch(`/api/orders?userId=${encodeURIComponent(currentUser.id)}`);
        const dataOrders = await resOrders.json();
        setCompletedOrders(dataOrders.orders.filter((o: any) => o.status === 'Completed'));
        
        const resTables = await fetch('/api/tables');
        const dataTables = await resTables.json();
        setTables(dataTables.tables);
        
        setLastRefresh(new Date());
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setCompletedOrders([]);
      setTables([]);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch on client side, not during SSR
    if (typeof window === 'undefined') return;
    fetchData();
  }, []);

  // Helper to get table status
  const getTableStatus = (tableNumber: string) => {
    const table = tables.find((t: any) => t.id === tableNumber);
    return table ? table.status : 'Unknown';
  };

  return (
    
      <div className="ml-0 md:ml-64 transition-all">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Completed Orders</CardTitle>
                <CardDescription>Review all past completed transactions for your restaurant.</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchData}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading order history...</p>
              </div>
            ) : completedOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No completed orders found.</p>
            ) : (
              <ScrollArea className="h-[calc(100vh-18rem)]">
                <Table>
                  <TableCaption>
                    A list of all completed orders. Last updated: {lastRefresh.toLocaleTimeString()}
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Order ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Details (Table/Customer)</TableHead>
                      <TableHead>Date Completed</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Items</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedOrders.map((order, idx) => (
                        <TableRow key={order.id || `order-${idx}`}>
                        <TableCell className="font-medium truncate max-w-[150px] block" title={order.id}>{order.id}</TableCell>
                        <TableCell>
                          {order.orderType === 'delivery' || order.orderType === 'home-delivery' ? 
                            <Badge variant="secondary" className="flex items-center gap-1 w-fit"><Car className="h-3.5 w-3.5"/>Delivery</Badge> : 
                            order.orderType === 'take-away' ?
                            <Badge variant="destructive" className="flex items-center gap-1 w-fit"><Store className="h-3.5 w-3.5"/>Take Away</Badge> :
                            <Badge variant="outline" className="flex items-center gap-1 w-fit"><Store className="h-3.5 w-3.5"/>Dine-In</Badge>
                          }
                        </TableCell>
                        <TableCell>
                          {order.channel || 'Others'}
                        </TableCell>
                        <TableCell>
                          {order.orderType === 'delivery' || order.orderType === 'home-delivery' ? (
                            <div className="text-xs">
                              <p className="font-medium">{order.customerName ?? order.customerInfo?.name ?? ''}</p>
                              <p className="text-muted-foreground">{order.customerAddress ?? order.customerInfo?.address ?? ''}</p>
                            </div>
                          ) : order.orderType === 'take-away' ? (
                            <div className="text-xs">
                              <p className="font-medium">{order.customerInfo?.name ?? order.customerName ?? 'Unknown'}</p>
                              <p className="text-muted-foreground">{order.customerInfo?.phone ?? 'No phone'}</p>
                            </div>
                          ) : (
                            <div className="text-xs">
                              <p className="font-medium">Table: {order.table ?? order.customerInfo?.tableNumber ?? ''}</p>
                              <p className="text-muted-foreground">Status: {getTableStatus(order.table ?? order.customerInfo?.tableNumber ?? '')}</p>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {order.completedAt ? new Date(order.completedAt).toLocaleString() : new Date(order.createdAt).toLocaleDateString() + ' (Pending)'}
                        </TableCell>
                        <TableCell className="text-right">{(() => {
                          // Check order currency field first, default to EUR for European restaurant
                          const orderCurrency = order.currency || 'EUR';
                          const currencySymbol = orderCurrency === 'EUR' ? '€' : orderCurrency === 'USD' ? '$' : '€';
                          
                          let totalAmount = 0;
                          let hasValidItems = false;
                          
                          // Calculate total from items if available
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
                          
                          // Use calculated total if available, otherwise use order totalAmount
                          if (hasValidItems && totalAmount > 0) {
                            return `${currencySymbol}${totalAmount.toFixed(2)}`;
                          } else {
                            const amount = typeof order.totalAmount === 'number' && !isNaN(order.totalAmount) ? order.totalAmount : parseFloat(order.totalAmount) || 0;
                            return `${currencySymbol}${amount.toFixed(2)}`;
                          }
                        })()}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={order.status === 'Completed' ? 'default' : 'secondary'}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {order.items.reduce((sum: number, item: any) => sum + item.quantity, 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    
  );
}
