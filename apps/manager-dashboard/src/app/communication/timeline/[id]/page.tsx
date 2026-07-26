'use client';

import { useState, useEffect } from 'react';
import DashboardShell from '../../../components/DashboardShell';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, XCircle } from 'lucide-react';
import { authFetch } from '../../../../lib/auth-fetch';

interface DiagnosticsData {
  notificationId: string;
  correlationId: string;
  metaMessageId?: string;
  recipientPhone?: string;
  channel: string;
  deliveryStatus: string;
  errorMessage?: string;
  failureCategory?: string;
  isDeadLetter: boolean;
  deadLetterReason?: string;
  retryCount: number;
  requestTime?: string;
  responseTime?: string;
  processingDurationMs?: number;
  deliveryLatencyMs?: number;
  renderedBody: string;
  timelineSteps: Array<{
    step: string;
    timestamp?: string;
    completed: boolean;
  }>;
}

export default function DeliveryTimelinePage() {
  const params = useParams();
  const id = params?.id as string;

  const [data, setData] = useState<DiagnosticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    authFetch(`/api/v1/communication/diagnostics/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <DashboardShell>
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e6e3da] pb-6">
          <div className="flex items-center gap-3">
            <Link href="/communication/history">
              <button className="p-2 bg-white border border-[#e6e3da] hover:bg-[#faf8f5] rounded-xl text-[#1c1b18] cursor-pointer">
                <ArrowLeft className="w-4 h-4" />
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-serif font-black text-[#1c1b18]">
                Notification Delivery Lifecycle Timeline
              </h1>
              <p className="text-xs text-[#66635d]">
                Step-by-step state transition graph with exact timestamps, processing duration, and latency metrics
              </p>
            </div>
          </div>

          {id && (
            <Link href={`/communication/diagnostics/${id}`}>
              <button className="px-4 py-2 bg-white border border-[#e6e3da] hover:bg-[#faf8f5] text-xs font-bold text-[#8c7853] rounded-xl cursor-pointer">
                View Raw Diagnostics →
              </button>
            </Link>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-[#66635d]">Loading timeline telemetry...</div>
        ) : !data ? (
          <div className="py-12 text-center text-xs text-red-600 font-bold">Failed to load delivery timeline.</div>
        ) : (
          <div className="space-y-6">
            {/* Meta info card */}
            <div className="bg-white border border-[#e6e3da] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#e6e3da] pb-3 text-xs">
                <div>
                  <span className="text-[#66635d] uppercase text-[10px] font-bold block">Notification ID</span>
                  <span className="font-mono font-bold text-[#1c1b18]">{data.notificationId}</span>
                </div>
                <div>
                  <span className="text-[#66635d] uppercase text-[10px] font-bold block">Correlation ID</span>
                  <span className="font-mono text-xs text-[#8c7853]">{data.correlationId}</span>
                </div>
                <div>
                  <span className="text-[#66635d] uppercase text-[10px] font-bold block">Meta wamid</span>
                  <span className="font-mono text-xs text-[#1c1b18]">{data.metaMessageId || 'N/A'}</span>
                </div>
              </div>

              <div className="p-4 bg-[#faf8f5] border border-[#e6e3da] rounded-xl text-xs font-mono text-[#1c1b18]">
                {data.renderedBody}
              </div>
            </div>

            {/* Visual Timeline Stepper */}
            <div className="bg-white border border-[#e6e3da] rounded-2xl p-6 shadow-sm space-y-6">
              <h2 className="font-serif font-black text-base text-[#1c1b18]">
                State Machine Lifecycle
              </h2>

              <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#e6e3da]">
                {data.timelineSteps.map((step, idx) => (
                  <div key={step.step} className="relative flex items-start justify-between text-xs">
                    <div className={`absolute -left-6 top-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${
                      step.completed ? 'bg-emerald-600' : 'bg-gray-300'
                    }`}>
                      {step.completed ? '✓' : idx + 1}
                    </div>

                    <div>
                      <span className={`font-bold block text-sm ${step.completed ? 'text-[#1c1b18]' : 'text-gray-400'}`}>
                        {step.step} State
                      </span>
                      {step.timestamp ? (
                        <span className="text-[11px] text-[#66635d]">
                          {new Date(step.timestamp).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400 font-italic">Awaiting state transition...</span>
                      )}
                    </div>

                    <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-md ${
                      step.completed ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {step.completed ? 'COMPLETED' : 'PENDING'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white border border-[#e6e3da] rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-[#66635d] uppercase">Worker Processing Duration</span>
                <div className="text-xl font-mono font-black text-[#1c1b18]">
                  {data.processingDurationMs ? `${data.processingDurationMs} ms` : 'N/A'}
                </div>
              </div>

              <div className="p-4 bg-white border border-[#e6e3da] rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-[#66635d] uppercase">End-to-End Delivery Latency</span>
                <div className="text-xl font-mono font-black text-emerald-700">
                  {data.deliveryLatencyMs ? `${data.deliveryLatencyMs} ms` : 'N/A'}
                </div>
              </div>
            </div>

            {/* Failure Box */}
            {data.errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 text-red-900 font-bold">
                  <XCircle className="w-4 h-4 text-red-700" />
                  <span>Failure Details</span>
                </div>
                <p className="font-mono text-red-800">{data.errorMessage}</p>
                {data.deadLetterReason && (
                  <p className="font-bold text-red-950">DLQ Reason: {data.deadLetterReason}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
