'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthContext';
import { Loader2 } from 'lucide-react';
import React from 'react';

export default function MensaIOMSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    // Only redirect if auth check is complete and user is not authenticated
    if (!isLoading && !currentUser) {
      // Redirect to login with redirect parameter to come back to Mensa IOMS
      const redirectPath = pathname || '/mensa-ioms/dashboard';
      router.replace(`/login?redirect=${encodeURIComponent(redirectPath)}&mensa=true`);
    }
  }, [currentUser, isLoading, router, pathname]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F5F5F7]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-wm-blue mx-auto mb-4" />
          <p className="text-xl text-wm-blue font-bold">Loading Mensa IOMS...</p>
          <p className="text-sm text-gray-600 mt-2">Please wait while we verify your access</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show loading (redirect will happen via useEffect)
  if (!currentUser) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F5F5F7]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-wm-blue mx-auto mb-4" />
          <p className="text-xl text-wm-blue font-bold">Redirecting to login...</p>
          <p className="text-sm text-gray-600 mt-2">Please sign in to access Mensa IOMS</p>
        </div>
      </div>
    );
  }

  // Return children without AppLayout (no sidebar)
  return <>{children}</>;
}

