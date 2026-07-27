'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Bell,
  FileText,
  History,
  Send,
  CheckCircle2,
  TrendingUp,
  Plus,
  SlidersHorizontal,
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, tplRes, historyRes] = await Promise.all([
        authFetch('/api/v1/communication/history/stats').then((r) => (r.ok ? r.json() : null)),
        authFetch('/api/v1/communication/templates').then((r) => (r.ok ? r.json() : [])),
        authFetch('/api/v1/communication/history?limit=5').then((r) => (r.ok ? r.json() : [])),
      ]);

      if (statsRes) setStats(statsRes);
      if (tplRes) setTemplates(tplRes);
      if (historyRes) setHistory(historyRes);
    } catch {
      // Handled by authFetch redirect or component state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const navCards = [
    {
      title: 'Message Templates',
      description:
        'Create, edit, and preview WhatsApp notification templates with variable placeholders.',
      href: '/communication/templates',
      icon: FileText,
      count: `${templates.length} Active`,
      color: 'bg-[#8c7853]/10 text-[#8c7853]',
    },
    {
      title: 'Reminder Rules & Triggers',
      description: 'Configure event-driven notification triggers, delay timers, and automated rules.',
      href: '/communication/reminder-rules',
      icon: SlidersHorizontal,
      count: 'Active Rules',
      color: 'bg-[#bda272]/10 text-[#bda272]',
    },
    {
      title: 'Delivery Logs & History',
      description: 'Audit log of all event-triggered notifications and real-time delivery statuses.',
      href: '/communication/history',
      icon: History,
      count: `${stats.total} Logged`,
      color: 'bg-[#3e593e]/10 text-[#3e593e]',
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
            <h1 className="text-3xl font-serif font-black tracking-tight text-[#1c1b18]">
              Communication Center
            </h1>
          </div>
          <p className="text-xs font-semibold text-[#66635d] uppercase tracking-widest">
            Manage automated WhatsApp templates, notification triggers, and delivery logs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/communication/templates">
            <Button
              variant="primary"
              size="sm"
              className="text-[10px] font-black uppercase tracking-widest border border-[#7d6b4a] shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Template</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-6 bg-white border border-[#e6e3da] rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#66635d] text-xs font-black uppercase tracking-wider mb-2">
            <span>Total Sent</span>
            <Send className="w-4 h-4 text-[#8c7853]" />
          </div>
          <div className="text-3xl font-serif font-black text-[#1c1b18]">
            {loading ? '...' : stats.total}
          </div>
          <p className="text-[10px] text-[#66635d] font-bold uppercase tracking-wide">Across all channels</p>
        </div>

        <div className="p-6 bg-white border border-[#e6e3da] rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#66635d] text-xs font-black uppercase tracking-wider mb-2">
            <span>Delivery Rate</span>
            <TrendingUp className="w-4 h-4 text-[#3e593e]" />
          </div>
          <div className="text-3xl font-serif font-black text-[#3e593e]">
            {loading ? '...' : `${stats.deliveryRate}%`}
          </div>
          <p className="text-[10px] text-[#66635d] font-bold uppercase tracking-wide">Successful dispatches</p>
        </div>

        <div className="p-6 bg-white border border-[#e6e3da] rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#66635d] text-xs font-black uppercase tracking-wider mb-2">
            <span>Delivered</span>
            <CheckCircle2 className="w-4 h-4 text-[#8c7853]" />
          </div>
          <div className="text-3xl font-serif font-black text-[#1c1b18]">
            {loading ? '...' : stats.sent + stats.delivered}
          </div>
          <p className="text-[10px] text-[#66635d] font-bold uppercase tracking-wide">Confirmed delivery</p>
        </div>

        <div className="p-6 bg-white border border-[#e6e3da] rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#66635d] text-xs font-black uppercase tracking-wider mb-2">
            <span>Templates</span>
            <FileText className="w-4 h-4 text-[#bda272]" />
          </div>
          <div className="text-3xl font-serif font-black text-[#1c1b18]">
            {loading ? '...' : templates.length}
          </div>
          <p className="text-[10px] text-[#66635d] font-bold uppercase tracking-wide">Configured templates</p>
        </div>
      </div>

      {/* Feature Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {navCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="p-6 bg-white border border-[#e6e3da] hover:border-[#8c7853] rounded-2xl shadow-sm hover:shadow-md transition-all group cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${card.color}`}>
                  <card.icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 bg-[#faf8f5] text-[#8c7853] rounded-full border border-[#e6e3da]">
                  {card.count}
                </span>
              </div>
              <h3 className="text-lg font-serif font-black text-[#1c1b18] group-hover:text-[#8c7853] transition-colors mb-2">
                {card.title}
              </h3>
              <p className="text-xs font-semibold text-[#66635d] leading-relaxed">
                {card.description}
              </p>
            </div>
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
            className="text-xs font-black uppercase tracking-wider text-[#8c7853] hover:text-[#736243]"
          >
            View All History →
          </Link>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs font-black uppercase tracking-widest text-[#66635d]">
            Loading history...
          </div>
        ) : history.length === 0 ? (
          <div className="py-8 text-center text-xs font-black uppercase tracking-widest text-[#66635d]">
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
                  <span
                    className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md ${
                      item.deliveryStatus === 'SENT' || item.deliveryStatus === 'DELIVERED'
                        ? 'bg-[#f0f5f0] text-[#3e593e] border border-[#d5ebd5]'
                        : item.deliveryStatus === 'FAILED'
                          ? 'bg-[#fdf2f2] text-[#9f3a38] border border-[#fcdada]'
                          : 'bg-[#faf8f5] text-[#8c7853] border border-[#e6e3da]'
                    }`}
                  >
                    {item.deliveryStatus}
                  </span>
                  <span className="text-[10px] font-mono text-[#66635d]">
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
