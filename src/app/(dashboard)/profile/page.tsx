"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/features/auth/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { currentUser, isLoading, logout } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setEmail(currentUser.email || "");
      setRestaurantName(currentUser.restaurantName || "");
    }
  }, [currentUser]);

  const handleSave = () => {
    // Save logic here (API call or localStorage)
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (isLoading) {
    return (
      
        <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      
    );
  }

  if (!currentUser) {
    router.push('/login');
    return null;
  }

  const qrUrl = typeof window !== 'undefined' ? `${window.location.origin}/scan/${currentUser.id}` : `/scan/${currentUser.id}`;

  return (
    
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>Manage your account information and access your unique QR code for inventory management.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <Input value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Restaurant Name</label>
              <Input value={restaurantName} onChange={e => setRestaurantName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <Input value="********" disabled type="password" />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave}>Save Changes</Button>
              <Button variant="outline" onClick={handleLogout}>Logout</Button>
            </div>
            {saved && <div className="text-green-600 text-sm">Profile updated!</div>}
            <div className="mt-8 flex flex-col items-center">
              <div className="font-semibold mb-2">Your Inventory QR Code</div>
              <QRCodeSVG value={qrUrl} size={180} />
              <div className="mt-2 text-xs text-gray-600 text-center max-w-xs">
                Scan this QR code with your mobile device to access the inventory barcode scanner. This allows you or your staff to quickly add products to your inventory by scanning product barcodes, streamlining your stock management process.
              </div>
              <Button className="mt-2" onClick={() => navigator.clipboard.writeText(qrUrl)}>Copy QR Link</Button>
            </div>
          </CardContent>
          <CardFooter>
            <div className="text-xs text-gray-400">Powered by IOMS</div>
          </CardFooter>
        </Card>
      </div>
    
  );
} 