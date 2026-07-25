'use client';

import { useState, useEffect } from 'react';
import DashboardShell from '../../components/DashboardShell';
import Link from 'next/link';
import { SlidersHorizontal, ArrowLeft, Trash2 } from 'lucide-react';
import { authFetch } from '../../../lib/auth-fetch';

interface Rule {
  id: string;
  name: string;
  description?: string;
  eventType: string;
  channel: string;
  isActive: boolean;
  delayMinutes: number;
  template?: {
    name: string;
  };
}

export default function ReminderRulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/v1/communication/reminder-rules');
      if (res.ok) {
        const data = await res.json();
        setRules(data);
      }
    } catch (err) {
      console.error('Error fetching reminder rules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleToggle = async (id: string, current: boolean) => {
    const endpoint = current ? 'deactivate' : 'activate';
    await authFetch(`/api/v1/communication/reminder-rules/${id}/${endpoint}`, {
      method: 'POST',
    });
    fetchRules();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this reminder rule?')) return;
    await authFetch(`/api/v1/communication/reminder-rules/${id}`, {
      method: 'DELETE',
    });
    fetchRules();
  };

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
                Reminder & Delivery Rules
              </h1>
              <p className="text-xs text-[#66635d]">
                Configure event triggers, delay timers, and notification rule routing
              </p>
            </div>
          </div>
        </div>

        {/* Rules Grid */}
        {loading ? (
          <div className="py-12 text-center text-xs text-[#66635d]">Loading reminder rules...</div>
        ) : rules.length === 0 ? (
          <div className="p-12 text-center bg-white border border-[#e6e3da] rounded-2xl text-xs text-[#66635d] space-y-2">
            <SlidersHorizontal className="w-8 h-8 text-[#8c7853] mx-auto" />
            <p className="font-bold">No reminder rules configured</p>
            <p>Rules match business events and map them to notification templates.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="p-6 bg-white border border-[#e6e3da] rounded-2xl shadow-sm flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-serif font-black text-sm text-[#1c1b18]">
                      {rule.name}
                    </span>
                    <span className="px-2.5 py-0.5 bg-[#8c7853]/10 text-[#8c7853] text-[10px] font-black uppercase tracking-wider rounded">
                      {rule.channel}
                    </span>
                    <span className="text-[10px] text-[#66635d] uppercase font-bold">
                      Event: {rule.eventType}
                    </span>
                  </div>
                  {rule.description && (
                    <p className="text-xs text-[#66635d]">{rule.description}</p>
                  )}
                  {rule.template && (
                    <p className="text-[11px] text-[#8c7853] font-bold">
                      Template: {rule.template.name}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleToggle(rule.id, rule.isActive)}
                    className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full cursor-pointer ${
                      rule.isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {rule.isActive ? 'Active' : 'Disabled'}
                  </button>

                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="text-red-600 hover:text-red-800 font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
