'use client';

import { AppLayout } from '@/shared/components/layout/AppLayout';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Exclude AppLayout (sidebar) for mensa-ioms routes, except repository pages
  // Repository pages handle their own AppLayout, so don't wrap them here
  if (pathname?.startsWith('/mensa-ioms')) {
    return <>{children}</>;
  }
  
  // Exclude AppLayout (sidebar) for supply-sync routes
  if (pathname?.startsWith('/supply-sync') || pathname?.startsWith('/apps/supply-sync') || pathname?.startsWith('/supplysync')) {
    return <>{children}</>;
  }
  
  return <AppLayout>{children}</AppLayout>;
}
