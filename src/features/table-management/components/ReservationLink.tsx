'use client';

import React, { useState } from 'react';
import { useTableStore } from '@/features/table-management/stores/tableStore';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Badge } from '@/shared/components/ui/badge';
import { Calendar, Clock, Users, Plus, AlertTriangle, Check } from 'lucide-react';
import { cn } from '@/server/lib/utils';

interface ReservationLinkProps {
  className?: string;
}

interface Reservation {
  id: string;
  tableId: string;
  customerName: string;
  partySize: number;
  startAt: string;
  endAt: string;
  status: string;
  notes?: string;
}

export function ReservationLink({ className }: ReservationLinkProps) {
  // const { selectedTable } = useTableStore();
  const selectedTable = null;
  const [isCreating, setIsCreating] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    customerName: '',
    partySize: 2,
    date: '',
    startTime: '',
    endTime: '',
    notes: '',
  });

  // Load reservations for selected table
  React.useEffect(() => {
    // Load reservations when component mounts
    // if (selectedTable) {
    //   loadReservations(selectedTable.id);
    // }
  }, []);

  const loadReservations = async (tableId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/pos/reservation?tableId=${tableId}`, {
        headers: {
          'x-tenant-id': 'default-tenant',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReservations(data.reservations || []);
      }
    } catch (error) {
      console.error('Failed to load reservations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // if (!selectedTable) return;

    setError(null);
    setIsLoading(true);

    try {
      // Combine date and time
      const startAt = new Date(`${formData.date}T${formData.startTime}:00`).toISOString();
      const endAt = new Date(`${formData.date}T${formData.endTime}:00`).toISOString();

      const response = await fetch('/api/pos/reservation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'default-tenant',
        },
        body: JSON.stringify({
          tableId: 'default-table',
          customerName: formData.customerName,
          partySize: formData.partySize,
          startAt,
          endAt,
          notes: formData.notes || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Reset form and refresh reservations
        setFormData({
          customerName: '',
          partySize: 2,
          date: '',
          startTime: '',
          endTime: '',
          notes: '',
        });
        setIsCreating(false);
        // loadReservations(selectedTable.id);
      } else {
        setError(data.message || 'Failed to create reservation');
      }
    } catch (error) {
      setError('Failed to create reservation');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'NO_SHOW': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center">
          <Calendar className="h-4 w-4 mr-2" />
          Reservations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!selectedTable ? (
          <p className="text-xs text-gray-500">
            Select a table to manage reservations
          </p>
        ) : (
          <>
            {/* Current Reservations */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium">
                  Table Reservations
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsCreating(!isCreating)}
                  className="h-6 px-2"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  New
                </Button>
              </div>

              {isLoading ? (
                <div className="text-xs text-gray-500 py-2">Loading...</div>
              ) : reservations.length > 0 ? (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {reservations.map(reservation => {
                    const startDateTime = formatDateTime(reservation.startAt);
                    const endDateTime = formatDateTime(reservation.endAt);
                    
                    return (
                      <div
                        key={reservation.id}
                        className="p-2 bg-gray-50 border border-gray-200 rounded text-xs"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{reservation.customerName}</span>
                          <Badge className={cn('text-xs', getStatusColor(reservation.status))}>
                            {reservation.status}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-3 text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span>{reservation.partySize}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{startDateTime.date}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{startDateTime.time}-{endDateTime.time}</span>
                          </div>
                        </div>
                        {reservation.notes && (
                          <p className="mt-1 text-gray-600 text-xs">
                            {reservation.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-500 py-2">
                  No reservations for this table
                </p>
              )}
            </div>

            {/* Create Reservation Form */}
            {isCreating && (
              <form onSubmit={handleSubmit} className="space-y-3 border-t pt-3">
                <div className="space-y-2">
                  <Label htmlFor="customerName" className="text-xs">Customer Name</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      customerName: e.target.value
                    }))}
                    placeholder="Enter customer name"
                    className="h-8 text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="partySize" className="text-xs">Party Size</Label>
                    <Input
                      id="partySize"
                      type="number"
                      min="1"
                      max="20"
                      value={formData.partySize}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        partySize: parseInt(e.target.value) || 1
                      }))}
                      className="h-8 text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="date" className="text-xs">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        date: e.target.value
                      }))}
                      className="h-8 text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="startTime" className="text-xs">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        startTime: e.target.value
                      }))}
                      className="h-8 text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="endTime" className="text-xs">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        endTime: e.target.value
                      }))}
                      className="h-8 text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="notes" className="text-xs">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      notes: e.target.value
                    }))}
                    placeholder="Special requests, allergies, etc."
                    className="h-16 text-xs resize-none"
                  />
                </div>

                {error && (
                  <div className="flex items-start space-x-2 p-2 bg-red-50 border border-red-200 rounded">
                    <AlertTriangle className="h-3 w-3 text-red-600 mt-0.5" />
                    <p className="text-xs text-red-700">{error}</p>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <div className="h-3 w-3 animate-spin border border-white border-r-transparent rounded-full mr-1" />
                    ) : (
                      <Check className="h-3 w-3 mr-1" />
                    )}
                    Create Reservation
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setIsCreating(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default ReservationLink;
