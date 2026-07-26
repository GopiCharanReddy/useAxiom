'use client';

import { useState } from 'react';
import DashboardShell from '../../components/DashboardShell';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, AlertTriangle, Clock, ShieldCheck } from 'lucide-react';
import { Button } from '@useaxiom/ui';
import { authFetch } from '../../../lib/auth-fetch';

export default function TestUtilitiesPage() {
  const [phone, setPhone] = useState('14155238886');
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const handleRunSimulation = async (type: 'SUCCESS' | 'FAILURE' | 'TIMEOUT' | 'WEBHOOK') => {
    setLoading(true);
    setResultMessage(null);
    try {
      const res = await authFetch('/api/v1/communication/test-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, recipientPhone: phone }),
      });

      if (res.ok) {
        const data = await res.json();
        setResultMessage(`Simulation executed successfully! Record ID: ${data.id} (Status: ${data.deliveryStatus})`);
      } else {
        setResultMessage('Simulation execution failed.');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      setResultMessage(`Error running simulation: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell>
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e6e3da] pb-6">
          <div className="flex items-center gap-3">
            <Link href="/communication">
              <button className="p-2 bg-white border border-[#e6e3da] hover:bg-[#faf8f5] rounded-xl text-[#1c1b18] cursor-pointer">
                <ArrowLeft className="w-4 h-4" />
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-serif font-black text-[#1c1b18]">
                Fault-Tolerant Pipeline Simulation Utilities
              </h1>
              <p className="text-xs text-[#66635d]">
                Inject simulated messaging scenarios (Success, Failure, Timeout, Webhook receipts) to test worker retries, DLQ, and latency monitoring
              </p>
            </div>
          </div>
        </div>

        {/* Input Phone */}
        <div className="bg-white border border-[#e6e3da] rounded-2xl p-6 shadow-sm space-y-4">
          <label className="block text-xs font-bold text-[#1c1b18]">Simulation Recipient Phone</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 border border-[#e6e3da] rounded-xl text-xs font-mono focus:outline-none focus:border-[#8c7853]"
          />
        </div>

        {resultMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-xl flex items-center justify-between">
            <span>{resultMessage}</span>
            <button onClick={() => setResultMessage(null)} className="text-emerald-700 font-bold">✕</button>
          </div>
        )}

        {/* Simulation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fake Success */}
          <div className="bg-white border border-[#e6e3da] rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Simulate Delivered Success</span>
            </div>
            <p className="text-xs text-[#66635d]">
              Creates a synthetic dispatch record with 2500ms delivery latency and 500ms processing duration.
            </p>
            <Button
              onClick={() => handleRunSimulation('SUCCESS')}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider py-2 rounded-xl cursor-pointer"
            >
              Run Success Simulation
            </Button>
          </div>

          {/* Fake Failure */}
          <div className="bg-white border border-[#e6e3da] rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span>Simulate DLQ Failure</span>
            </div>
            <p className="text-xs text-[#66635d]">
              Injects a permanent client error (HTTP 400) and immediately flags the message for Dead Letter Queue quarantine.
            </p>
            <Button
              onClick={() => handleRunSimulation('FAILURE')}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider py-2 rounded-xl cursor-pointer"
            >
              Run DLQ Failure Simulation
            </Button>
          </div>

          {/* Fake Timeout */}
          <div className="bg-white border border-[#e6e3da] rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
              <Clock className="w-5 h-5 text-amber-600" />
              <span>Simulate Transient Timeout</span>
            </div>
            <p className="text-xs text-[#66635d]">
              Injects a network timeout error in RETRYING status to test exponential backoff schedule.
            </p>
            <Button
              onClick={() => handleRunSimulation('TIMEOUT')}
              disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-black uppercase tracking-wider py-2 rounded-xl cursor-pointer"
            >
              Run Timeout Simulation
            </Button>
          </div>

          {/* Fake Webhook */}
          <div className="bg-white border border-[#e6e3da] rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span>Simulate Webhook Status Sync</span>
            </div>
            <p className="text-xs text-[#66635d]">
              Triggers a full webhook receipt sequence transitioning message status to READ with wamid tracking.
            </p>
            <Button
              onClick={() => handleRunSimulation('WEBHOOK')}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider py-2 rounded-xl cursor-pointer"
            >
              Run Webhook Simulation
            </Button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
