'use client';

import DashboardShell from '../../components/DashboardShell';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CommunicationSettingsPage() {
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
              Communication Settings
            </h1>
            <p className="text-xs text-[#66635d]">
              Organization-level notification channel configurations and dispatch defaults
            </p>
          </div>
        </div>

        {/* Channel Provider Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-white border border-[#e6e3da] rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-100 text-emerald-800 flex items-center justify-center rounded-xl font-bold text-xs">
                  WA
                </div>
                <div>
                  <h3 className="font-serif font-black text-sm text-[#1c1b18]">WhatsApp Provider</h3>
                  <p className="text-[11px] text-[#66635d]">Twilio Sandbox / Meta Cloud API Integration</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase rounded-full">
                Active
              </span>
            </div>
            <p className="text-xs text-[#66635d]">
              Event-driven notifications route through the configured WhatsApp gateway using structured message templates.
            </p>
          </div>

          <div className="p-6 bg-white border border-[#e6e3da] rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 text-blue-800 flex items-center justify-center rounded-xl font-bold text-xs">
                  EM
                </div>
                <div>
                  <h3 className="font-serif font-black text-sm text-[#1c1b18]">Email Gateway</h3>
                  <p className="text-[11px] text-[#66635d]">Simulated / SMTP Provider</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-[10px] font-black uppercase rounded-full">
                Ready
              </span>
            </div>
            <p className="text-xs text-[#66635d]">
              Supports fallback and multi-channel notification dispatches for user-preferred channels.
            </p>
          </div>
        </div>

        {/* Global Policy settings */}
        <div className="p-6 bg-white border border-[#e6e3da] rounded-2xl shadow-sm space-y-4">
          <h2 className="font-serif font-black text-base text-[#1c1b18]">Global Notification Dispatch Policies</h2>
          <div className="space-y-3 text-xs text-[#1c1b18]">
            <div className="flex items-center justify-between p-3 bg-[#faf8f5] border border-[#e6e3da] rounded-xl">
              <div>
                <span className="font-bold block">Transactional Event Logging</span>
                <span className="text-[11px] text-[#66635d]">Record immutable NotificationEvent audit log for every business event</span>
              </div>
              <span className="text-emerald-700 font-black">ENABLED</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#faf8f5] border border-[#e6e3da] rounded-xl">
              <div>
                <span className="font-bold block">Safe Async Dispatching</span>
                <span className="text-[11px] text-[#66635d]">All notifications enqueued via BullMQ; zero impact on primary database transactions</span>
              </div>
              <span className="text-emerald-700 font-black">ACTIVE</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#faf8f5] border border-[#e6e3da] rounded-xl">
              <div>
                <span className="font-bold block">Template Fallback Handling</span>
                <span className="text-[11px] text-[#66635d]">Missing placeholders retain original syntax for safe debugging visibility</span>
              </div>
              <span className="text-emerald-700 font-black">ACTIVE</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
