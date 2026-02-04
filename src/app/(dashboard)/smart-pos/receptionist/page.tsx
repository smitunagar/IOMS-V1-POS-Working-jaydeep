"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Users, Clock, CheckCircle, Calendar, Phone, MessageSquare } from 'lucide-react';

export default function ReceptionistPage() {
  return (
    
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Receptionist Dashboard</h1>
              <p className="text-gray-600">Manage guest services and front desk operations</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Check-ins</CardTitle>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">+12% from yesterday</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Wait Time</CardTitle>
              <Clock className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3.2min</div>
              <p className="text-xs text-muted-foreground">Below target</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reservations</CardTitle>
              <Calendar className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18</div>
              <p className="text-xs text-muted-foreground">For today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Guest Satisfaction</CardTitle>
              <MessageSquare className="w-4 h-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.8</div>
              <p className="text-xs text-muted-foreground">Out of 5.0</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Queue */}
          <Card>
            <CardHeader>
              <CardTitle>Current Queue</CardTitle>
              <CardDescription>Guests waiting to be served</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'John Smith', party: 4, waitTime: '5 min', type: 'Walk-in' },
                  { name: 'Maria Garcia', party: 2, waitTime: '3 min', type: 'Reservation' },
                  { name: 'David Wilson', party: 6, waitTime: '8 min', type: 'Walk-in' },
                  { name: 'Sarah Johnson', party: 3, waitTime: '2 min', type: 'Reservation' }
                ].map((guest, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{guest.name}</div>
                      <div className="text-sm text-gray-600">Party of {guest.party} • {guest.type}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{guest.waitTime}</div>
                      <button className="text-xs text-blue-600 hover:underline">
                        Seat Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Today's Reservations */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Reservations</CardTitle>
              <CardDescription>Scheduled bookings for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { time: '12:30 PM', name: 'Anderson Family', party: 5, status: 'Confirmed' },
                  { time: '1:15 PM', name: 'Business Lunch', party: 8, status: 'Pending' },
                  { time: '2:00 PM', name: 'Birthday Party', party: 12, status: 'Confirmed' },
                  { time: '6:30 PM', name: 'Date Night', party: 2, status: 'Confirmed' }
                ].map((reservation, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{reservation.time}</div>
                      <div className="text-sm text-gray-600">{reservation.name} • {reservation.party} guests</div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      reservation.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {reservation.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Service Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Service Overview</CardTitle>
            <CardDescription>Current status of guest services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">94%</div>
                <div className="text-sm text-gray-600">On-time Seating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">15</div>
                <div className="text-sm text-gray-600">Tables Available</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-2">7</div>
                <div className="text-sm text-gray-600">Special Requests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 mb-2">3</div>
                <div className="text-sm text-gray-600">VIP Guests</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    
  );
}