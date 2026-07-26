'use client';

import { useState, useEffect } from 'react';
import DashboardShell from '../../components/DashboardShell';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { authFetch } from '../../../lib/auth-fetch';

interface HealthData {
  healthScore: number;
  status: string;
  checks: {
    metaApiReachability: string;
    bullMqConnection: string;
    redisConnection: string;
    webhookStatus: string;
    workerStatus: string;
    environmentValidation: string;
    jwtValidation: string;
    databaseConnection: string;
    lastSuccessfulDelivery?: string;
    lastFailure?: string;
  };
}

export default function HealthPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/v1/communication/health');
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      }
    } catch (err) {
      console.error('Error loading health:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

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
                Communication Health & Subsystem Matrix
              </h1>
              <p className="text-xs text-[#66635d]">
                Live reachability matrix for Meta API, BullMQ queues, Redis, Webhooks, DB pool, and Worker health score
              </p>
            </div>
          </div>

          <button
            onClick={fetchHealth}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-[#e6e3da] text-xs font-bold text-[#1c1b18] rounded-xl hover:bg-[#faf8f5] shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Health Matrix
          </button>
        </div>

        {/* Score Banner */}
        {loading ? (
          <div className="py-12 text-center text-xs text-[#66635d]">Checking subsystem health...</div>
        ) : !health ? (
          <div className="py-12 text-center text-xs text-red-600 font-bold">Failed to load system health status.</div>
        ) : (
          <div className="space-y-6">
            <div className={`p-6 border rounded-2xl flex items-center justify-between shadow-sm ${
              health.healthScore >= 90 ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black ${
                  health.healthScore >= 90 ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                }`}>
                  {health.healthScore}%
                </div>
                <div>
                  <h2 className="font-serif font-black text-lg">
                    System Health Score: {health.status}
                  </h2>
                  <p className="text-xs opacity-80">
                    All core communication components evaluated in real-time.
                  </p>
                </div>
              </div>
              <span className={`px-4 py-1.5 font-black text-xs uppercase tracking-wider rounded-full ${
                health.healthScore >= 90 ? 'bg-emerald-700 text-white' : 'bg-amber-700 text-white'
              }`}>
                {health.status}
              </span>
            </div>

            {/* Health Matrix Grid */}
            <div className="bg-white border border-[#e6e3da] rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-serif font-black text-base text-[#1c1b18] border-b border-[#e6e3da] pb-3">
                Subsystem Health Audit Matrix
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-[#faf8f5] border border-[#e6e3da] rounded-xl flex items-center justify-between">
                  <span className="font-bold text-[#1c1b18]">Meta API Reachability</span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-black text-[10px] rounded uppercase">
                    {health.checks.metaApiReachability}
                  </span>
                </div>

                <div className="p-4 bg-[#faf8f5] border border-[#e6e3da] rounded-xl flex items-center justify-between">
                  <span className="font-bold text-[#1c1b18]">BullMQ Connection</span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-black text-[10px] rounded uppercase">
                    {health.checks.bullMqConnection}
                  </span>
                </div>

                <div className="p-4 bg-[#faf8f5] border border-[#e6e3da] rounded-xl flex items-center justify-between">
                  <span className="font-bold text-[#1c1b18]">Redis Cache & Event Bus</span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-black text-[10px] rounded uppercase">
                    {health.checks.redisConnection}
                  </span>
                </div>

                <div className="p-4 bg-[#faf8f5] border border-[#e6e3da] rounded-xl flex items-center justify-between">
                  <span className="font-bold text-[#1c1b18]">Webhook Receiver</span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-black text-[10px] rounded uppercase">
                    {health.checks.webhookStatus}
                  </span>
                </div>

                <div className="p-4 bg-[#faf8f5] border border-[#e6e3da] rounded-xl flex items-center justify-between">
                  <span className="font-bold text-[#1c1b18]">Worker Processes</span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-black text-[10px] rounded uppercase">
                    {health.checks.workerStatus}
                  </span>
                </div>

                <div className="p-4 bg-[#faf8f5] border border-[#e6e3da] rounded-xl flex items-center justify-between">
                  <span className="font-bold text-[#1c1b18]">Database Connection Pool</span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-black text-[10px] rounded uppercase">
                    {health.checks.databaseConnection}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
