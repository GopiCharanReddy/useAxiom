'use client';

import { useState, useEffect } from 'react';
import DashboardShell from '../../../components/DashboardShell';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Code, FileText, Bug } from 'lucide-react';
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
  renderedSubject?: string;
  rawPayload?: Record<string, unknown>;
  apiResponse?: Record<string, unknown>;
  webhookLogs?: Array<Record<string, unknown>>;
}

export default function DiagnosticsPage() {
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
      <div className="p-8 max-w-6xl mx-auto space-y-6">
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
                Deep Message Diagnostics & Inspection
              </h1>
              <p className="text-xs text-[#66635d]">
                Raw payload audit log, Meta API response headers, correlation IDs, and webhook receipt history
              </p>
            </div>
          </div>

          {id && (
            <Link href={`/communication/timeline/${id}`}>
              <button className="px-4 py-2 bg-[#8c7853] text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer">
                View Timeline Stepper →
              </button>
            </Link>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-[#66635d]">Loading diagnostic payloads...</div>
        ) : !data ? (
          <div className="py-12 text-center text-xs text-red-600 font-bold">Failed to load diagnostics.</div>
        ) : (
          <div className="space-y-6 text-xs">
            {/* Meta Table */}
            <div className="bg-white border border-[#e6e3da] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-[#e6e3da] pb-3">
                <Bug className="w-5 h-5 text-[#8c7853]" />
                <h2 className="font-serif font-black text-base text-[#1c1b18]">
                  Telemetry Summary
                </h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
                <div className="p-3 bg-[#faf8f5] border border-[#e6e3da] rounded-xl">
                  <span className="text-[10px] text-[#66635d] uppercase block">Delivery Status</span>
                  <span className="font-bold text-[#1c1b18]">{data.deliveryStatus}</span>
                </div>
                <div className="p-3 bg-[#faf8f5] border border-[#e6e3da] rounded-xl">
                  <span className="text-[10px] text-[#66635d] uppercase block">Retry Count</span>
                  <span className="font-bold text-[#1c1b18]">{data.retryCount} / 3</span>
                </div>
                <div className="p-3 bg-[#faf8f5] border border-[#e6e3da] rounded-xl">
                  <span className="text-[10px] text-[#66635d] uppercase block">Dead Letter State</span>
                  <span className={`font-bold ${data.isDeadLetter ? 'text-red-600' : 'text-emerald-600'}`}>
                    {data.isDeadLetter ? 'TRUE (DLQ)' : 'FALSE'}
                  </span>
                </div>
                <div className="p-3 bg-[#faf8f5] border border-[#e6e3da] rounded-xl">
                  <span className="text-[10px] text-[#66635d] uppercase block">Failure Category</span>
                  <span className="font-bold text-[#1c1b18]">{data.failureCategory || 'NONE'}</span>
                </div>
              </div>
            </div>

            {/* Payloads Inspector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Event Payload */}
              <div className="bg-white border border-[#e6e3da] rounded-2xl p-6 shadow-sm space-y-3">
                <div className="flex items-center gap-2 border-b border-[#e6e3da] pb-3">
                  <Code className="w-4 h-4 text-[#8c7853]" />
                  <h3 className="font-serif font-black text-sm text-[#1c1b18]">
                    Original Business Event Payload
                  </h3>
                </div>
                <pre className="p-4 bg-[#faf8f5] border border-[#e6e3da] rounded-xl font-mono text-[11px] overflow-x-auto max-h-64">
                  {JSON.stringify(data.rawPayload, null, 2)}
                </pre>
              </div>

              {/* Meta Response */}
              <div className="bg-white border border-[#e6e3da] rounded-2xl p-6 shadow-sm space-y-3">
                <div className="flex items-center gap-2 border-b border-[#e6e3da] pb-3">
                  <FileText className="w-4 h-4 text-[#8c7853]" />
                  <h3 className="font-serif font-black text-sm text-[#1c1b18]">
                    Meta Graph API Response
                  </h3>
                </div>
                <pre className="p-4 bg-[#faf8f5] border border-[#e6e3da] rounded-xl font-mono text-[11px] overflow-x-auto max-h-64">
                  {JSON.stringify(data.apiResponse, null, 2)}
                </pre>
              </div>
            </div>

            {/* Webhook Logs Audit */}
            <div className="bg-white border border-[#e6e3da] rounded-2xl p-6 shadow-sm space-y-3">
              <h3 className="font-serif font-black text-sm text-[#1c1b18] border-b border-[#e6e3da] pb-3">
                Transaction Webhook Receipt History
              </h3>
              {!data.webhookLogs || data.webhookLogs.length === 0 ? (
                <p className="text-gray-500 py-4 text-center">No webhook status receipts logged yet for this message.</p>
              ) : (
                <pre className="p-4 bg-[#faf8f5] border border-[#e6e3da] rounded-xl font-mono text-[11px] overflow-x-auto max-h-64">
                  {JSON.stringify(data.webhookLogs, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
