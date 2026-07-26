'use client';

import { useState, useEffect } from 'react';
import DashboardShell from '../../components/DashboardShell';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, RotateCcw, Trash2, ShieldAlert, Eye } from 'lucide-react';
import { authFetch } from '../../../lib/auth-fetch';

interface DeadLetterItem {
  id: string;
  recipientPhone?: string;
  channel: string;
  renderedBody: string;
  errorMessage?: string;
  deadLetterReason?: string;
  failureCategory?: string;
  retryCount: number;
  createdAt: string;
}

export default function DeadLetterQueuePage() {
  const [items, setItems] = useState<DeadLetterItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDLQ = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/v1/communication/dead-letter');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error('Error fetching DLQ:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDLQ();
  }, []);

  const handleReplay = async (id: string) => {
    const res = await authFetch(`/api/v1/communication/replay/${id}`, { method: 'POST' });
    if (res.ok) {
      fetchDLQ();
    }
  };

  const handleCancel = async (id: string) => {
    const res = await authFetch(`/api/v1/communication/cancel/${id}`, { method: 'POST' });
    if (res.ok) {
      fetchDLQ();
    }
  };

  return (
    <DashboardShell>
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e6e3da] pb-6">
          <div className="flex items-center gap-3">
            <Link href="/communication/queue">
              <button className="p-2 bg-white border border-[#e6e3da] hover:bg-[#faf8f5] rounded-xl text-[#1c1b18] cursor-pointer">
                <ArrowLeft className="w-4 h-4" />
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-serif font-black text-[#1c1b18]">
                Dead Letter Queue (DLQ) Console
              </h1>
              <p className="text-xs text-[#66635d]">
                Administrative quarantine for messages exceeding maximum retries (3) or failing non-retryable Meta API checks
              </p>
            </div>
          </div>

          <button
            onClick={fetchDLQ}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-[#e6e3da] text-xs font-bold text-[#1c1b18] rounded-xl hover:bg-[#faf8f5] shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh DLQ
          </button>
        </div>

        {/* DLQ List */}
        {loading ? (
          <div className="py-12 text-center text-xs text-[#66635d]">Loading Dead Letter Queue...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center bg-white border border-[#e6e3da] rounded-2xl text-xs text-[#66635d] space-y-2">
            <ShieldAlert className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="font-bold text-emerald-900">Dead Letter Queue is Empty!</p>
            <p>All pipeline dispatches are processing normally without permanent failure quarantine.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="p-6 bg-white border border-red-200 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-0.5 bg-rose-100 text-rose-900 font-black uppercase text-[10px] rounded-md border border-rose-300">
                      DLQ QUARANTINED
                    </span>
                    <span className="font-mono text-[#1c1b18] font-bold">To: {item.recipientPhone || 'N/A'}</span>
                    <span className="text-[10px] text-[#66635d]">Retries: {item.retryCount} / 3</span>
                  </div>

                  <span className="text-[10px] text-[#66635d]">{new Date(item.createdAt).toLocaleString()}</span>
                </div>

                <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2 text-xs">
                  <span className="font-bold text-red-950 block font-mono">
                    Reason: {item.deadLetterReason || item.errorMessage || 'Exceeded Retry Threshold'}
                  </span>
                  <p className="font-mono text-[#1c1b18] bg-white p-3 border border-red-200 rounded-lg">
                    {item.renderedBody}
                  </p>
                </div>

                {/* Operations Bar */}
                <div className="flex items-center justify-between pt-2 text-xs">
                  <Link href={`/communication/diagnostics/${item.id}`}>
                    <button className="text-[#8c7853] font-bold hover:underline flex items-center gap-1 cursor-pointer">
                      <Eye className="w-4 h-4" /> Inspect Payload
                    </button>
                  </Link>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleReplay(item.id)}
                      className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-xl flex items-center gap-1 hover:bg-emerald-700 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Replay & Re-enqueue
                    </button>

                    <button
                      onClick={() => handleCancel(item.id)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 font-bold rounded-xl flex items-center gap-1 hover:bg-gray-200 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Cancel Message
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
