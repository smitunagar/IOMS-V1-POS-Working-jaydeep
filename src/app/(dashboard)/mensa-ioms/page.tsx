"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthContext";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export default function MensaIOMSPage() {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard immediately
    if (!isLoading) {
      if (currentUser) {
        router.replace('/mensa-ioms/dashboard');
      } else {
        router.replace(`/login?redirect=${encodeURIComponent('/mensa-ioms/dashboard')}&mensa=true`);
      }
    }
  }, [currentUser, isLoading, router]);

  // Show loading while redirecting
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#F5F5F7]">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-wm-blue mx-auto mb-4" />
        <p className="text-xl text-wm-blue font-bold">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}

