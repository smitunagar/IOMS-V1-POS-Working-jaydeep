'use client'

import React from 'react';
import { usePathname } from 'next/navigation';
import { AppLayout } from './AppLayout';
import { sidebarConfig } from '@/config/sidebarConfig';

interface IOMSLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export function IOMSLayout({ children, pageTitle }: IOMSLayoutProps) {
  const pathname = usePathname();

  return (
    <AppLayout pageTitle={pageTitle}>
      {children}
    </AppLayout>
  );
}