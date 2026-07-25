'use client';

import Link from 'next/link';
import { ArrowLeft, BarChart2 } from 'lucide-react';

export default function CommunicationAnalyticsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[#e6e3da] pb-6">
        <Link href="/communication">
          <button className="p-2 bg-white border border-[#e6e3da] hover:bg-[#faf8f5] rounded-xl text-[#1c1b18] cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-3xl font-serif font-black tracking-tight text-[#1c1b18]">
            Communication Analytics
          </h1>
          <p className="text-xs font-semibold text-[#66635d] uppercase tracking-widest">
            Engagement metrics, delivery latency, and channel conversion reports
          </p>
        </div>
      </div>

      <div className="p-12 text-center bg-white border border-[#e6e3da]/80 rounded-2xl shadow-sm space-y-4">
        <div className="w-12 h-12 bg-[#8c7853]/10 text-[#8c7853] flex items-center justify-center rounded-2xl mx-auto border border-[#8c7853]/20">
          <BarChart2 className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-serif font-black text-[#1c1b18]">
          Communication Analytics & Engagement Reporting
        </h2>
        <p className="text-xs text-[#66635d] font-semibold max-w-md mx-auto leading-relaxed">
          Detailed breakdown of open rates, response latency, template engagement metrics, and channel conversion velocity will be displayed here as dispatches accumulate.
        </p>
      </div>
    </div>
  );
}
