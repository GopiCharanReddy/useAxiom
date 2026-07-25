'use client';

import DashboardShell from '../../components/DashboardShell';
import Link from 'next/link';
import { ArrowLeft, BarChart2 } from 'lucide-react';

export default function CommunicationAnalyticsPage() {
  return (
    <DashboardShell>
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[#e6e3da] pb-6">
          <Link href="/communication">
            <button className="p-2 bg-white border border-[#e6e3da] hover:bg-[#faf8f5] rounded-xl text-[#1c1b18] cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-serif font-black text-[#1c1b18]">
              Communication Analytics
            </h1>
            <p className="text-xs text-[#66635d]">
              Engagement metrics, delivery latency, and channel conversion reports
            </p>
          </div>
        </div>

        <div className="p-12 text-center bg-white border border-[#e6e3da] rounded-2xl shadow-sm space-y-4">
          <div className="w-12 h-12 bg-[#8c7853]/10 text-[#8c7853] flex items-center justify-center rounded-2xl mx-auto">
            <BarChart2 className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-serif font-black text-[#1c1b18]">
            Communication Analytics & Engagement Reporting
          </h2>
          <p className="text-xs text-[#66635d] max-w-md mx-auto leading-relaxed">
            Detailed breakdown of open rates, response latency, template engagement metrics, and channel conversion velocity will be displayed here as dispatches accumulate.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}
