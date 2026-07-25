'use client';

import { useState, useEffect } from 'react';
import DashboardShell from '../../components/DashboardShell';
import Link from 'next/link';
import { ArrowLeft, Search, RefreshCw } from 'lucide-react';

interface HistoryItem {
  id: string;
  channel: string;
  renderedSubject?: string;
  renderedBody: string;
  deliveryStatus: string;
  errorMessage?: string;
  createdAt: string;
  event?: {
    eventType: string;
    entityType: string;
    entityId: string;
  };
  template?: {
    name: string;
  };
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    const token = localStorage.getItem('axiom_token');
    try {
      const res = await fetch('/api/v1/communication/history?limit=100', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filtered = history.filter((item) => {
    const matchesSearch =
      item.renderedBody.toLowerCase().includes(search.toLowerCase()) ||
      (item.event?.eventType || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.deliveryStatus === statusFilter;
    const matchesChannel = channelFilter === 'ALL' || item.channel === channelFilter;
    return matchesSearch && matchesStatus && matchesChannel;
  });

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
                Notification History & Audit Log
              </h1>
              <p className="text-xs text-[#66635d]">
                Immutable delivery log of all business events and dispatched notifications
              </p>
            </div>
          </div>

          <button
            onClick={fetchHistory}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-[#e6e3da] hover:bg-[#faf8f5] text-xs font-bold text-[#1c1b18] rounded-xl shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 justify-between bg-white p-4 border border-[#e6e3da] rounded-2xl shadow-sm">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#66635d] absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search history by message or event type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#faf8f5] border border-[#e6e3da] rounded-xl text-xs text-[#1c1b18] focus:outline-none focus:border-[#8c7853]"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="px-3 py-2 bg-[#faf8f5] border border-[#e6e3da] rounded-xl text-xs font-bold text-[#1c1b18] focus:outline-none"
            >
              <option value="ALL">All Channels</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
              <option value="IN_APP">In-App</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-[#faf8f5] border border-[#e6e3da] rounded-xl text-xs font-bold text-[#1c1b18] focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="SENT">Sent</option>
              <option value="DELIVERED">Delivered</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>

        {/* Table / List */}
        <div className="bg-white border border-[#e6e3da] rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-12 text-center text-xs text-[#66635d]">Loading delivery logs...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#66635d]">No matching history records found.</div>
          ) : (
            <div className="divide-y divide-[#e6e3da]">
              {filtered.map((item) => (
                <div key={item.id} className="p-4 hover:bg-[#faf8f5] transition-colors space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-[#8c7853]/10 text-[#8c7853] font-black uppercase text-[10px] rounded-md">
                        {item.channel}
                      </span>
                      {item.event && (
                        <span className="font-bold text-[#1c1b18] uppercase text-[11px]">
                          {item.event.eventType}
                        </span>
                      )}
                      {item.template && (
                        <span className="text-[10px] text-[#66635d]">
                          (Template: {item.template.name})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md ${
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
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#1c1b18] font-mono bg-[#faf8f5] p-3 border border-[#e6e3da] rounded-xl whitespace-pre-wrap">
                    {item.renderedBody}
                  </p>

                  {item.errorMessage && (
                    <p className="text-[11px] text-red-600 font-bold">
                      Error: {item.errorMessage}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
