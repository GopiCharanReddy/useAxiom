'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  FileText,
  History,
  Settings,
  Sparkles,
  Send,
  CheckCircle2,
  TrendingUp,
  Plus,
  SlidersHorizontal,
  Smartphone,
  ShieldCheck,
  Activity,
  Cpu,
  ShieldAlert,
  FlaskConical,
} from 'lucide-react';
import { Button } from '@useaxiom/ui';
import { authFetch } from '../../lib/auth-fetch';

interface Stats {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  pending: number;
  deliveryRate: number;
}

interface Template {
  id: string;
  name: string;
  eventType: string;
  channel: string;
  isActive: boolean;
  category?: string;
}

interface HistoryItem {
  id: string;
  channel: string;
  renderedBody: string;
  deliveryStatus: string;
  createdAt: string;
  event?: {
    eventType: string;
    entityType: string;
  };
}

export default function CommunicationDashboard() {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    sent: 0,
    delivered: 0,
    failed: 0,
    pending: 0,
    deliveryRate: 0,
  });
  const [templates, setTemplates] = useState<Template[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, tplRes, historyRes] = await Promise.all([
        authFetch('/api/v1/communication/history/stats').then((r) => r.ok ? r.json() : null),
        authFetch('/api/v1/communication/templates').then((r) => r.ok ? r.json() : []),
        authFetch('/api/v1/communication/history?limit=5').then((r) => r.ok ? r.json() : []),
      ]);

      if (statsRes) setStats(statsRes);
      if (tplRes) setTemplates(tplRes);
      if (historyRes) setHistory(historyRes);
    } catch {
      // Handled by authFetch redirect or component state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSeedDefaults = async () => {
    setSeeding(true);
    setSeedMessage(null);
    try {
      const res = await authFetch('/api/v1/communication/seed-defaults', {
        method: 'POST',
      });
      const data = await res.json();
      setSeedMessage(`Seeded ${data.seeded ?? 0} default template(s)!`);
      fetchData();
    } catch {
      setSeedMessage('Failed to seed default templates');
    } finally {
      setSeeding(false);
    }
  };

  const navCards = [
    {
      title: 'Message Templates',
      description: 'Create, edit, duplicate, and preview notification templates with variable placeholders.',
      href: '/communication/templates',
      icon: FileText,
      count: `${templates.length} Active`,
      color: 'bg-[#8c7853]/10 text-[#8c7853]',
    },
    {
      title: 'Reminder Rules',
      description: 'Configure event-driven notification triggers, delay timers, and rule conditions.',
      href: '/communication/reminder-rules',
      icon: SlidersHorizontal,
      count: 'Rules Active',
      color: 'bg-blue-50 text-blue-700',
    },
    {
      title: 'Queue Dashboard & Telemetry',
      description: 'Real-time BullMQ job states, active worker count, latency telemetry, and queue health.',
      href: '/communication/queue',
      icon: Cpu,
      count: 'BullMQ Live',
      color: 'bg-indigo-50 text-indigo-700',
    },
    {
      title: 'Subsystem Health Matrix',
      description: 'Live reachability matrix for Meta API, BullMQ, Redis, Webhooks, DB pool, and Worker health score.',
      href: '/communication/health',
      icon: Activity,
      count: 'Health Score',
      color: 'bg-emerald-50 text-emerald-700',
    },
    {
      title: 'Dead Letter Queue Console',
      description: 'Inspect failed messages that exhausted retries, replay jobs, or cancel quarantined dispatches.',
      href: '/communication/dead-letter',
      icon: ShieldAlert,
      count: 'DLQ Manager',
      color: 'bg-rose-50 text-rose-700',
    },
    {
      title: 'Pipeline Simulation Utilities',
      description: 'Inject synthetic messaging scenarios (Success, Failure, Timeout, Webhook receipts) for testing.',
      href: '/communication/test-utilities',
      icon: FlaskConical,
      count: 'Test Suite',
      color: 'bg-cyan-50 text-cyan-700',
    },
    {
      title: 'Test WhatsApp Cloud API',
      description: 'Send live test WhatsApp messages via official Meta Graph API and inspect response payloads.',
      href: '/communication/test-whatsapp',
      icon: Smartphone,
      count: 'Live Test Tool',
      color: 'bg-emerald-50 text-emerald-700',
    },
    {
      title: 'Meta Configuration',
      description: 'View Phone Number ID, Business Account ID, API Version, and Webhook verification status.',
      href: '/communication/meta-config',
      icon: ShieldCheck,
      count: 'Meta API',
      color: 'bg-purple-50 text-purple-700',
    },
    {
      title: 'Delivery Logs & History',
      description: 'Audit log of all event-triggered notifications, step timelines, and delivery statuses.',
      href: '/communication/history',
      icon: History,
      count: `${stats.total} Logged`,
      color: 'bg-[#8c7853]/10 text-[#8c7853]',
    },
    {
      title: 'Communication Settings',
      description: 'Configure global channels, quiet hours, and organization defaults.',
      href: '/communication/settings',
      icon: Settings,
      count: 'Channels',
      color: 'bg-amber-50 text-amber-700',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e6e3da] pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-[#8c7853] text-white flex items-center justify-center rounded-xl shadow-sm">
              <Bell className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-[#66635d]">
              Enterprise Notification Event Management System & Fault-Tolerant Messaging Platform
            </p>
          </div>
          <p className="text-xs font-semibold text-[#66635d] uppercase tracking-widest">
            Enterprise Notification Event Management System & Meta Cloud API Gateway
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSeedDefaults}
            disabled={seeding}
            className="border-[#e6e3da] text-[#66635d] hover:bg-white text-[10px] font-black uppercase tracking-widest shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#8c7853]" />
            {seeding ? 'Seeding...' : 'Seed Templates'}
          </Button>
          <Link href="/communication/templates">
            <Button variant="primary" size="sm" className="text-[10px] font-black uppercase tracking-widest border border-[#7d6b4a] shadow-sm">
              <Plus className="w-3.5 h-3.5" />
              New Template
            </Button>
          </Link>
        </div>
      </div>

      {seedMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-between">
          <span>{seedMessage}</span>
          <button onClick={() => setSeedMessage(null)} className="text-emerald-600 hover:text-emerald-900 cursor-pointer">✕</button>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-6 bg-white border border-[#e6e3da] rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-[#66635d] text-xs font-bold uppercase tracking-wider mb-2">
            <span>Total Notifications</span>
            <Send className="w-4 h-4 text-[#8c7853]" />
          </div>
          <div className="text-3xl font-serif font-black text-[#1c1b18]">
            {loading ? '...' : stats.total}
          </div>
          <p className="text-[11px] text-[#66635d] mt-1">Across all channels</p>
        </div>

        <div className="p-6 bg-white border border-[#e6e3da] rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-[#66635d] text-xs font-bold uppercase tracking-wider mb-2">
            <span>Delivery Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-serif font-black text-emerald-600">
            {loading ? '...' : `${stats.deliveryRate}%`}
          </div>
          <p className="text-[11px] text-[#66635d] mt-1">Successful dispatches</p>
        </div>

        <div className="p-6 bg-white border border-[#e6e3da] rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-[#66635d] text-xs font-bold uppercase tracking-wider mb-2">
            <span>Sent / Delivered</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-serif font-black text-[#1c1b18]">
            {loading ? '...' : stats.sent + stats.delivered}
          </div>
          <p className="text-[11px] text-[#66635d] mt-1">Confirmed delivery</p>
        </div>

        <div className="p-6 bg-white border border-[#e6e3da] rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-[#66635d] text-xs font-bold uppercase tracking-wider mb-2">
            <span>Templates</span>
            <FileText className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-serif font-black text-[#1c1b18]">
            {loading ? '...' : templates.length}
          </div>
          <p className="text-[11px] text-[#66635d] mt-1">Configured templates</p>
        </div>
      </div>

      {/* Feature Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {navCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="p-6 bg-white border border-[#e6e3da] hover:border-[#8c7853] rounded-2xl shadow-sm hover:shadow-md transition-all group cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${card.color}`}>
                <card.icon className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 bg-[#faf8f5] text-[#8c7853] rounded-full border border-[#e6e3da]">
                {card.count}
              </span>
            </div>
            <h3 className="text-lg font-serif font-black text-[#1c1b18] group-hover:text-[#8c7853] transition-colors mb-2">
              {card.title}
            </h3>
            <p className="text-xs text-[#66635d] leading-relaxed">
              {card.description}
            </p>
          </Link>
        ))}
      </div>

        {/* Recent Delivery Activity preview */}
        <div className="bg-white border border-[#e6e3da] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#e6e3da] pb-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-[#8c7853]" />
              <h2 className="text-base font-serif font-black text-[#1c1b18]">
                Recent Notification Activity
              </h2>
            </div>
            <Link
              href="/communication/history"
              className="text-xs font-black uppercase tracking-wider text-[#8c7853] hover:underline"
            >
              View All History →
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-[#66635d]">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#66635d]">
              No notifications sent yet. Event notifications will appear here automatically when business events occur.
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-[#faf8f5] border border-[#e6e3da] rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 bg-[#8c7853]/10 text-[#8c7853] font-black uppercase tracking-wider text-[10px] rounded-md">
                      {item.channel}
                    </span>
                    <span className="font-bold text-[#1c1b18] max-w-md truncate">
                      {item.renderedBody}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link href={`/communication/timeline/${item.id}`}>
                      <span className="text-[10px] font-bold text-[#8c7853] hover:underline">
                        Timeline →
                      </span>
                    </Link>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md ${
                        item.deliveryStatus === 'SENT' || item.deliveryStatus === 'DELIVERED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.deliveryStatus === 'FAILED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.deliveryStatus}
                    </span>
                    <span className="text-[10px] text-[#66635d]">
                      {new Date(item.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
  );
}
