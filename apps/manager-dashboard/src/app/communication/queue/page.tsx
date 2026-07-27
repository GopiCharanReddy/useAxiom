'use client';

import { useState, useEffect } from 'react';
import DashboardShell from '../../components/DashboardShell';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Activity, Cpu, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';
import { authFetch } from '../../../lib/auth-fetch';

interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  retrying: number;
  deadLetter: number;
  total: number;
  avgDeliveryLatencyMs: number;
  avgProcessingDurationMs: number;
  workersOnline: number;
  queueHealth: string;
}

export default function QueueDashboardPage() {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchQueueStats = async () => {
    try {
      const res = await authFetch('/api/v1/communication/queue');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error loading queue stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueStats();
    if (!autoRefresh) return;
    const interval = setInterval(fetchQueueStats, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  return (
    <DashboardShell>
      <div className="p-8 max-w-7xl mx-auto space-y-6">
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
                BullMQ Queue Monitor & Pipeline Dashboard
              </h1>
              <p className="text-xs text-[#66635d]">
                Real-time job queue states, worker telemetry, processing latency, and retry metrics (Auto-refreshing 10s)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                autoRefresh ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-gray-50 border-gray-300 text-gray-700'
              }`}
            >
              Auto-Refresh: {autoRefresh ? 'ON (10s)' : 'OFF'}
            </button>
            <button
              onClick={fetchQueueStats}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-[#e6e3da] text-xs font-bold text-[#1c1b18] rounded-xl hover:bg-[#faf8f5] cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        </div>

        {/* Status Banner */}
        {loading ? (
          <div className="py-8 text-center text-xs text-[#66635d]">Loading queue stats...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-6 bg-white border border-[#e6e3da] rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#66635d]">
                <span>Active Workers</span>
                <Cpu className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-3xl font-serif font-black text-[#1c1b18]">
                {stats?.workersOnline ?? 0} Online
              </div>
              <p className="text-[11px] text-[#66635d]">BullMQ Worker Instances</p>
            </div>

            <div className="p-6 bg-white border border-[#e6e3da] rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#66635d]">
                <span>Queue Health</span>
                <Activity className="w-4 h-4 text-emerald-600" />
              </div>
              <div className={`text-2xl font-serif font-black ${stats?.queueHealth === 'HEALTHY' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {stats?.queueHealth ?? 'UNKNOWN'}
              </div>
              <p className="text-[11px] text-[#66635d]">Pipeline Integrity Score</p>
            </div>

            <div className="p-6 bg-white border border-[#e6e3da] rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#66635d]">
                <span>Avg Delivery Latency</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-3xl font-serif font-black text-[#1c1b18]">
                {stats?.avgDeliveryLatencyMs ?? 0} ms
              </div>
              <p className="text-[11px] text-[#66635d]">Dispatch → Delivered</p>
            </div>

            <div className="p-6 bg-white border border-[#e6e3da] rounded-2xl shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#66635d]">
                <span>Avg Processing Duration</span>
                <CheckCircle2 className="w-4 h-4 text-[#8c7853]" />
              </div>
              <div className="text-3xl font-serif font-black text-[#1c1b18]">
                {stats?.avgProcessingDurationMs ?? 0} ms
              </div>
              <p className="text-[11px] text-[#66635d]">Worker Execution Time</p>
            </div>
          </div>
        )}

        {/* State Breakdown Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
            <span className="text-[10px] font-black uppercase text-blue-700">Waiting</span>
            <div className="text-2xl font-serif font-black text-blue-900">{stats?.waiting ?? 0}</div>
          </div>

          <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
            <span className="text-[10px] font-black uppercase text-purple-700">Processing</span>
            <div className="text-2xl font-serif font-black text-purple-900">{stats?.active ?? 0}</div>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
            <span className="text-[10px] font-black uppercase text-emerald-700">Completed</span>
            <div className="text-2xl font-serif font-black text-emerald-900">{stats?.completed ?? 0}</div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
            <span className="text-[10px] font-black uppercase text-amber-700">Retrying</span>
            <div className="text-2xl font-serif font-black text-amber-900">{stats?.retrying ?? 0}</div>
          </div>

          <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-1">
            <span className="text-[10px] font-black uppercase text-red-700">Failed</span>
            <div className="text-2xl font-serif font-black text-red-900">{stats?.failed ?? 0}</div>
          </div>

          <div className="p-4 bg-rose-100 border border-rose-300 rounded-xl space-y-1">
            <span className="text-[10px] font-black uppercase text-rose-800 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> Dead Letter
            </span>
            <div className="text-2xl font-serif font-black text-rose-950">{stats?.deadLetter ?? 0}</div>
          </div>
        </div>

        {/* Action Link Banner */}
        <div className="p-6 bg-white border border-[#e6e3da] rounded-2xl flex items-center justify-between">
          <div>
            <h3 className="font-serif font-black text-base text-[#1c1b18]">
              Dead Letter Queue Operations
            </h3>
            <p className="text-xs text-[#66635d]">
              Inspect failed messages that exhausted max retry attempts (3) or encountered permanent Meta Cloud API errors.
            </p>
          </div>
          <Link href="/communication/dead-letter">
            <button className="px-4 py-2 bg-[#8c7853] text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer hover:bg-[#786645]">
              Manage Dead Letter Queue →
            </button>
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}
