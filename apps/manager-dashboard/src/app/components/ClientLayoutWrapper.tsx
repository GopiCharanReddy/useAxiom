'use client';

import { usePathname } from 'next/navigation';
import DashboardShell from './DashboardShell';
import ReactQueryProvider from './ReactQueryProvider';
import { ReactNode } from 'react';

export default function ClientLayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isStandalonePage = pathname === '/login' || pathname === '/register';

  return (
    <ReactQueryProvider>
      {isStandalonePage ? <>{children}</> : <DashboardShell>{children}</DashboardShell>}
    </ReactQueryProvider>
  );
}


