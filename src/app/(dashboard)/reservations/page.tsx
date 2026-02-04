'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Badge } from '@/shared/components/ui/badge';
import { useToast } from '@/shared/hooks/use-toast';
import { Table, Calendar, History, Plus, Edit, X, CheckCircle, Users, Clock, Phone, User, Filter } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';

interface Subsection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}

interface TableData {
  id: string;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  x?: number;
  y?: number;
}

interface Reservation {
  id: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  partySize: number;
  tableId: string;
  tableNumber?: number;
  status: 'reserved' | 'seated' | 'completed' | 'canceled';
  createdAt: string;
  completedAt?: string;
}

const reservationSubsections: Subsection[] = [
  {
    id: 'reservations',
    title: 'Reservations',
    description: 'Create and manage reservations',
    icon: Calendar,
  },
  {
    id: 'table-management',
    title: 'Table Management',
    description: 'Manage tables and floor layout',
    icon: Table,
  },
  {
    id: 'history',
    title: 'Reservation History',
    description: 'View past reservations',
    icon: History,
  },
];

export default function ReservationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeSubsection, setActiveSubsection] = useState<string>('reservations');
  
  // State management
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<TableData[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: '',
    time: '',
    partySize: '',
    tableId: '',
  });
  
  // History filter state
  const [historyFilter, setHistoryFilter] = useState<string>('all');

  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Load data on mount
  useEffect(() => {
    loadReservations();
    loadTables();
  }, []);

  const loadReservations = () => {
    try {
      const stored = localStorage.getItem('reservations');
      if (stored) {
        setReservations(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading reservations:', error);
    }
  };

  const loadTables = async () => {
    try {
      const response = await fetch('/api/tables');
      if (response.ok) {
        const data = await response.json();
        setTables(data.tables || []);
      }
    } catch (error) {
      console.error('Error loading tables:', error);
    }
  };

  const saveReservations = (updatedReservations: Reservation[]) => {
    localStorage.setItem('reservations', JSON.stringify(updatedReservations));
    setReservations(updatedReservations);
  };

  const openCreateDialog = () => {
    setEditingReservation(null);
    setFormData({
      name: '',
      phone: '',
      date: '',
      time: '',
      partySize: '',
      tableId: '',
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setFormData({
      name: reservation.name,
      phone: reservation.phone,
      date: reservation.date,
      time: reservation.time,
      partySize: reservation.partySize.toString(),
      tableId: reservation.tableId,
    });
    setIsDialogOpen(true);
  };

  // Check if table is available at the requested time
  const isTableAvailable = (tableId: string, date: string, time: string, excludeReservationId?: string): boolean => {
    // Convert time to minutes for easier comparison
    const timeToMinutes = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const requestedMinutes = timeToMinutes(time);

    // Check all reservations for the same table and date
    const conflictingReservations = reservations.filter(r => {
      // Skip canceled reservations and the reservation being edited
      if (r.status === 'canceled' || r.id === excludeReservationId) return false;
      
      // Check same table and date
      if (r.tableId === tableId && r.date === date) {
        const reservationMinutes = timeToMinutes(r.time);
        
        // Check if within 1 hour window (before or after)
        const timeDifference = Math.abs(requestedMinutes - reservationMinutes);
        
        // If within 60 minutes (1 hour), it's a conflict
        return timeDifference < 60;
      }
      
      return false;
    });

    return conflictingReservations.length === 0;
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name || !formData.phone || !formData.date || !formData.time || !formData.partySize || !formData.tableId) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const partySize = parseInt(formData.partySize);
    const selectedTable = tables.find(t => t.id === formData.tableId);

    // Capacity check
    if (selectedTable && partySize > selectedTable.capacity) {
      toast({
        title: 'Capacity Exceeded',
        description: `Party size (${partySize}) exceeds table capacity (${selectedTable.capacity})`,
        variant: 'destructive',
      });
      return;
    }

    // Time availability check
    const excludeId = editingReservation ? editingReservation.id : undefined;
    if (!isTableAvailable(formData.tableId, formData.date, formData.time, excludeId)) {
      const conflictingReservation = reservations.find(r => {
        if (r.status === 'canceled' || r.id === excludeId) return false;
        if (r.tableId === formData.tableId && r.date === formData.date) {
          const [reqHours, reqMinutes] = formData.time.split(':').map(Number);
          const [resHours, resMinutes] = r.time.split(':').map(Number);
          const requestedMinutes = reqHours * 60 + reqMinutes;
          const reservationMinutes = resHours * 60 + resMinutes;
          const timeDifference = Math.abs(requestedMinutes - reservationMinutes);
          return timeDifference < 60;
        }
        return false;
      });

      toast({
        title: 'Time Slot Not Available',
        description: `Table ${selectedTable?.number} is already reserved at ${conflictingReservation?.time}. Please select a time at least 1 hour apart.`,
        variant: 'destructive',
      });
      return;
    }

    if (editingReservation) {
      // Edit existing reservation
      const updated = reservations.map(r =>
        r.id === editingReservation.id
          ? {
              ...r,
              name: formData.name,
              phone: formData.phone,
              date: formData.date,
              time: formData.time,
              partySize: partySize,
              tableId: formData.tableId,
              tableNumber: selectedTable?.number,
            }
          : r
      );
      saveReservations(updated);
      
      toast({
        title: 'Success',
        description: 'Reservation updated successfully',
      });
    } else {
      // Create new reservation
      const newReservation: Reservation = {
        id: Date.now().toString(),
        name: formData.name,
        phone: formData.phone,
        date: formData.date,
        time: formData.time,
        partySize: partySize,
        tableId: formData.tableId,
        tableNumber: selectedTable?.number,
        status: 'reserved',
        createdAt: new Date().toISOString(),
      };

      saveReservations([...reservations, newReservation]);

      // Update table status to reserved
      await updateTableStatus(formData.tableId, 'reserved');

      toast({
        title: 'Success',
        description: 'Reservation created successfully',
      });
    }

    setIsDialogOpen(false);
  };

  const handleCancel = async (reservationId: string) => {
    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation) return;

    const updated = reservations.map(r =>
      r.id === reservationId ? { ...r, status: 'canceled' as const } : r
    );
    saveReservations(updated);

    // Update table status to available
    await updateTableStatus(reservation.tableId, 'available');

    toast({
      title: 'Success',
      description: 'Reservation canceled',
    });
  };

  const handleSeat = async (reservationId: string) => {
    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation) return;

    const updated = reservations.map(r =>
      r.id === reservationId ? { ...r, status: 'seated' as const } : r
    );
    saveReservations(updated);

    // Update table status to occupied
    await updateTableStatus(reservation.tableId, 'occupied');

    toast({
      title: 'Success',
      description: 'Reservation marked as seated',
    });
  };

  const handleComplete = async (reservationId: string) => {
    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation) return;

    const updated = reservations.map(r =>
      r.id === reservationId 
        ? { ...r, status: 'completed' as const, completedAt: new Date().toISOString() } 
        : r
    );
    saveReservations(updated);

    // Update table status to available
    await updateTableStatus(reservation.tableId, 'available');

    toast({
      title: 'Success',
      description: 'Reservation completed and table is now available',
    });
  };

  const updateTableStatus = async (tableId: string, status: string) => {
    try {
      await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-status',
          tableId,
          status,
        }),
      });
      loadTables(); // Reload tables
    } catch (error) {
      console.error('Error updating table status:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Reservations</h1>
        <p className="text-gray-600">Manage tables and reservations</p>
      </div>

      {/* Subsection Cards */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {reservationSubsections.map((subsection) => {
          const Icon = subsection.icon;
          const isActive = activeSubsection === subsection.id;

          return (
            <Card
              key={subsection.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                isActive
                  ? 'ring-2 ring-blue-500 shadow-md bg-blue-50 border-blue-200'
                  : 'shadow-sm hover:border-blue-200'
              }`}
              onClick={() => setActiveSubsection(subsection.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    isActive ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Icon className={`h-5 w-5 ${
                      isActive ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold truncate ${
                      isActive ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {subsection.title}
                    </div>
                    {subsection.description && (
                      <p className="text-xs text-gray-500 truncate">{subsection.description}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Active Section Content */}
      <div className="mt-8">
        {activeSubsection === 'reservations' && (
          <div>
            {/* Header with Create Button */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Manage Reservations</h2>
                <p className="text-sm text-gray-600 mt-1">Create, edit, and manage your restaurant reservations</p>
              </div>
              <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                New Reservation
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Reserved</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {reservations.filter(r => r.status === 'reserved').length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Seated</p>
                      <p className="text-2xl font-bold text-green-600">
                        {reservations.filter(r => r.status === 'seated').length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Completed</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {reservations.filter(r => r.status === 'completed').length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Available Tables</p>
                      <p className="text-2xl font-bold text-gray-600">
                        {tables.filter(t => t.status === 'available').length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <Table className="w-6 h-6 text-gray-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Reservations Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">Manage Reservations</h2>
                <p className="text-sm text-gray-500 mt-1">View and manage today's and upcoming reservations</p>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="today" className="w-full">
                <div className="px-6 pt-4">
                  <TabsList className="w-full h-11 bg-gray-50 p-1 rounded-lg border border-gray-200">
                    <TabsTrigger 
                      value="today" 
                      className="flex-1 h-9 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-600 rounded-md transition-all font-medium"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Today
                      <Badge className="ml-2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-1.5 py-0 h-5">
                        {reservations.filter(r => {
                          const todayDate = getTodayDate();
                          return r.date === todayDate && r.status !== 'canceled' && r.status !== 'completed';
                        }).length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="upcoming" 
                      className="flex-1 h-9 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-600 rounded-md transition-all font-medium"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Upcoming
                      <Badge className="ml-2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-1.5 py-0 h-5">
                        {reservations.filter(r => {
                          const todayDate = getTodayDate();
                          return r.date > todayDate && r.status !== 'canceled' && r.status !== 'completed';
                        }).length}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-6">
                  <TabsContent value="today" className="mt-0">
                {reservations.filter(r => {
                  const todayDate = getTodayDate();
                  return r.date === todayDate && r.status !== 'canceled' && r.status !== 'completed';
                }).length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-gray-900 mb-1">No reservations today</h3>
                    <p className="text-sm text-gray-500">No reservations scheduled for today</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reservations
                      .filter(r => {
                        const todayDate = getTodayDate();
                        return r.date === todayDate && r.status !== 'canceled' && r.status !== 'completed';
                      })
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map((reservation) => (
                        <div 
                          key={reservation.id} 
                          className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all p-5"
                        >
                          <div className="flex items-start gap-4">
                            {/* Avatar */}
                            <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                              reservation.status === 'reserved' ? 'bg-blue-100' : 'bg-green-100'
                            }`}>
                              <User className={`w-6 h-6 ${
                                reservation.status === 'reserved' ? 'text-blue-600' : 'text-green-600'
                              }`} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              {/* Header */}
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {reservation.name}
                                  </h3>
                                  <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-0.5">
                                    <Phone className="w-3.5 h-3.5" />
                                    {reservation.phone}
                                  </p>
                                </div>
                                <Badge className={reservation.status === 'reserved' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}>
                                  {reservation.status === 'reserved' ? 'Reserved' : 'Seated'}
                                </Badge>
                              </div>

                              {/* Details */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                <div className="flex items-center gap-2 text-sm">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-600">
                                    {new Date(reservation.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Clock className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-600">{reservation.time}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Users className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-600">{reservation.partySize} guests</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Table className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-600">Table {reservation.tableNumber}</span>
                                </div>
                              </div>

                              {/* Actions */}
                              {reservation.status === 'reserved' ? (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openEditDialog(reservation)}
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  >
                                    <Edit className="w-3.5 h-3.5 mr-1.5" />
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleSeat(reservation.id)}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                    Seat
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCancel(reservation.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <X className="w-3.5 h-3.5 mr-1.5" />
                                    Cancel
                                  </Button>
                                </div>
                              ) : reservation.status === 'seated' ? (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleComplete(reservation.id)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                    Complete
                                  </Button>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
                  </TabsContent>

                  <TabsContent value="upcoming" className="mt-0">
                {reservations.filter(r => {
                  const todayDate = getTodayDate();
                  return r.date > todayDate && r.status !== 'canceled' && r.status !== 'completed';
                }).length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-gray-900 mb-1">No upcoming reservations</h3>
                    <p className="text-sm text-gray-500">No future reservations scheduled</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reservations
                      .filter(r => {
                        const todayDate = getTodayDate();
                        return r.date > todayDate && r.status !== 'canceled' && r.status !== 'completed';
                      })
                      .sort((a, b) => {
                        if (a.date === b.date) {
                          return a.time.localeCompare(b.time);
                        }
                        return a.date.localeCompare(b.date);
                      })
                      .map((reservation) => (
                        <div 
                          key={reservation.id} 
                          className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all p-5"
                        >
                          <div className="flex items-start gap-4">
                            {/* Avatar */}
                            <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                              reservation.status === 'reserved' ? 'bg-blue-100' : 'bg-green-100'
                            }`}>
                              <User className={`w-6 h-6 ${
                                reservation.status === 'reserved' ? 'text-blue-600' : 'text-green-600'
                              }`} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              {/* Header */}
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {reservation.name}
                                  </h3>
                                  <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-0.5">
                                    <Phone className="w-3.5 h-3.5" />
                                    {reservation.phone}
                                  </p>
                                </div>
                                <Badge className={reservation.status === 'reserved' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}>
                                  {reservation.status === 'reserved' ? 'Reserved' : 'Seated'}
                                </Badge>
                              </div>

                              {/* Details */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                <div className="flex items-center gap-2 text-sm">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-600">
                                    {new Date(reservation.date).toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Clock className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-600">{reservation.time}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Users className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-600">{reservation.partySize} guests</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Table className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-600">Table {reservation.tableNumber}</span>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEditDialog(reservation)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Edit className="w-3.5 h-3.5 mr-1.5" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCancel(reservation.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <X className="w-3.5 h-3.5 mr-1.5" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
                  </TabsContent>
                </div>
              </Tabs>
            </div>

            {/* Create/Edit Reservation Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingReservation ? 'Edit Reservation' : 'Create New Reservation'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="name">Customer Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="time">Time *</Label>
                      <Input
                        id="time"
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="partySize">Party Size *</Label>
                    <Input
                      id="partySize"
                      type="number"
                      min="1"
                      value={formData.partySize}
                      onChange={(e) => setFormData({ ...formData, partySize: e.target.value })}
                      placeholder="4"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="table">Table *</Label>
                    <Select
                      value={formData.tableId}
                      onValueChange={(value) => setFormData({ ...formData, tableId: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select a table" />
                      </SelectTrigger>
                      <SelectContent>
                        {tables.map((table) => {
                          const excludeId = editingReservation ? editingReservation.id : undefined;
                          const available = formData.date && formData.time 
                            ? isTableAvailable(table.id, formData.date, formData.time, excludeId)
                            : true;
                          
                          return (
                            <SelectItem 
                              key={table.id} 
                              value={table.id}
                              disabled={!available}
                            >
                              Table {table.number} - {table.capacity} seats {!available ? '(Occupied)' : ''}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {formData.date && formData.time && (
                      <p className="text-xs text-gray-500 mt-1">
                        {tables.filter(t => {
                          const excludeId = editingReservation ? editingReservation.id : undefined;
                          return isTableAvailable(t.id, formData.date, formData.time, excludeId);
                        }).length} tables available at this time
                      </p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
                    {editingReservation ? 'Update' : 'Create'} Reservation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {activeSubsection === 'table-management' && (
          <div className="text-center py-12">
            <Table className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Table Management</h3>
            <p className="text-gray-600 mb-4">Manage your restaurant tables and floor layout</p>
            <button
              onClick={() => router.push('/table-management')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Go to Table Management
            </button>
          </div>
        )}

        {activeSubsection === 'history' && (
          <Card className="overflow-hidden">
            <CardHeader className="bg-gray-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Reservation History</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    {reservations.length} total reservations
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Filters */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={historyFilter === 'all' ? 'default' : 'outline'}
                    onClick={() => setHistoryFilter('all')}
                    className={historyFilter === 'all' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  >
                    All ({reservations.length})
                  </Button>
                  <Button
                    size="sm"
                    variant={historyFilter === 'reserved' ? 'default' : 'outline'}
                    onClick={() => setHistoryFilter('reserved')}
                    className={historyFilter === 'reserved' ? 'bg-blue-600 hover:bg-blue-700' : 'text-blue-600 hover:bg-blue-50'}
                  >
                    Reserved ({reservations.filter(r => r.status === 'reserved').length})
                  </Button>
                  <Button
                    size="sm"
                    variant={historyFilter === 'seated' ? 'default' : 'outline'}
                    onClick={() => setHistoryFilter('seated')}
                    className={historyFilter === 'seated' ? 'bg-blue-600 hover:bg-blue-700' : 'text-green-600 hover:bg-green-50'}
                  >
                    Seated ({reservations.filter(r => r.status === 'seated').length})
                  </Button>
                  <Button
                    size="sm"
                    variant={historyFilter === 'completed' ? 'default' : 'outline'}
                    onClick={() => setHistoryFilter('completed')}
                    className={historyFilter === 'completed' ? 'bg-blue-600 hover:bg-blue-700' : 'text-purple-600 hover:bg-purple-50'}
                  >
                    Completed ({reservations.filter(r => r.status === 'completed').length})
                  </Button>
                  <Button
                    size="sm"
                    variant={historyFilter === 'canceled' ? 'default' : 'outline'}
                    onClick={() => setHistoryFilter('canceled')}
                    className={historyFilter === 'canceled' ? 'bg-blue-600 hover:bg-blue-700' : 'text-gray-600 hover:bg-gray-50'}
                  >
                    Canceled ({reservations.filter(r => r.status === 'canceled').length})
                  </Button>
                </div>
              </div>

              {reservations.length === 0 ? (
                <div className="text-center py-16">
                  <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No reservation history</h3>
                  <p className="text-sm text-gray-500">Reservations will appear here once created</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reservations
                    .filter(r => historyFilter === 'all' || r.status === historyFilter)
                    .sort((a, b) => {
                      // Sort by date and time (most recent first)
                      const dateA = new Date(`${a.date} ${a.time}`).getTime();
                      const dateB = new Date(`${b.date} ${b.time}`).getTime();
                      return dateB - dateA;
                    })
                    .map((reservation) => (
                      <div 
                        key={reservation.id} 
                        className={`bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all p-5 ${
                          reservation.status === 'canceled' ? 'opacity-60' : ''
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                            reservation.status === 'reserved' 
                              ? 'bg-blue-100' 
                              : reservation.status === 'seated'
                              ? 'bg-green-100'
                              : reservation.status === 'completed'
                              ? 'bg-purple-100'
                              : 'bg-gray-100'
                          }`}>
                            <User className={`w-6 h-6 ${
                              reservation.status === 'reserved' 
                                ? 'text-blue-600' 
                                : reservation.status === 'seated'
                                ? 'text-green-600'
                                : reservation.status === 'completed'
                                ? 'text-purple-600'
                                : 'text-gray-400'
                            }`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {reservation.name}
                                </h3>
                                <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-0.5">
                                  <Phone className="w-3.5 h-3.5" />
                                  {reservation.phone}
                                </p>
                              </div>
                              <Badge className={
                                reservation.status === 'reserved' 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : reservation.status === 'seated'
                                  ? 'bg-green-100 text-green-700'
                                  : reservation.status === 'completed'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-gray-100 text-gray-700'
                              }>
                                {reservation.status === 'reserved' 
                                  ? 'Reserved' 
                                  : reservation.status === 'seated'
                                  ? 'Seated'
                                  : reservation.status === 'completed'
                                  ? 'Completed'
                                  : 'Canceled'}
                              </Badge>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <div>
                                  <p className="text-xs text-gray-500">Date</p>
                                  <span className="text-gray-900 font-medium">
                                    {new Date(reservation.date).toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <div>
                                  <p className="text-xs text-gray-500">Time</p>
                                  <span className="text-gray-900 font-medium">{reservation.time}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Users className="w-4 h-4 text-gray-400" />
                                <div>
                                  <p className="text-xs text-gray-500">Guests</p>
                                  <span className="text-gray-900 font-medium">{reservation.partySize}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Table className="w-4 h-4 text-gray-400" />
                                <div>
                                  <p className="text-xs text-gray-500">Table</p>
                                  <span className="text-gray-900 font-medium">#{reservation.tableNumber}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <div>
                                  <p className="text-xs text-gray-500">Created</p>
                                  <span className="text-gray-900 font-medium">
                                    {new Date(reservation.createdAt).toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Additional Info */}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>ID: {reservation.id}</span>
                              <span>•</span>
                              <span>Table ID: {reservation.tableId}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}

