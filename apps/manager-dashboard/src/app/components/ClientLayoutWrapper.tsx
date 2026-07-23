'use client';

import { usePathname } from 'next/navigation';
import DashboardShell from './DashboardShell';
import { ReactNode } from 'react';
import { AiChatPanel } from './AiChatPanel';

export default function ClientLayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // If we are on login or register, don't show the dashboard shell
  if (pathname === '/login' || pathname === '/register') {
    return <>{children}</>;
  }

  return (
    <DashboardShell>
      {children}
      <AiChatPanel />
    </DashboardShell>
  );
}
