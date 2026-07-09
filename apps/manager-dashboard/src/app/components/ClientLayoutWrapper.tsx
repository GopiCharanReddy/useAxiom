'use client';

import { usePathname } from 'next/navigation';
import DashboardShell from './DashboardShell';
import { ReactNode } from 'react';

export default function ClientLayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  // If we are on the login page, don't show the dashboard shell
  if (pathname === '/login') {
    return <>{children}</>;
  }

  return <DashboardShell>{children}</DashboardShell>;
}
