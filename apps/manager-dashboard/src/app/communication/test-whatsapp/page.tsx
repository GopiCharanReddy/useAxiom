'use client';

import { useState, useEffect } from 'react';
import DashboardShell from '../../components/DashboardShell';
import Link from 'next/link';
import { ArrowLeft, Send, CheckCircle2, AlertTriangle, Eye } from 'lucide-react';
import { Button } from '@useaxiom/ui';
import { authFetch } from '../../../lib/auth-fetch';

interface Template {
  id: string;
  name: string;
  body: string;
  eventType: string;
}

interface DispatchResult {
  success: boolean;
  metaMessageId?: string;
  statusCode?: number;
  errorMessage?: string;
  apiResponse?: Record<string, unknown>;
  requestTime?: string;
  responseTime?: string;
}

export default function TestWhatsappPage() {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('Hello from useAxiom! This is a test WhatsApp message sent via Meta Cloud API.');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DispatchResult | null>(null);

  useEffect(() => {
    authFetch('/api/v1/communication/templates')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setTemplates(data))
      .catch(() => {});
  }, []);

  const handleTemplateChange = (id: string) => {
    setSelectedTemplateId(id);
    const tpl = templates.find((t) => t.id === id);
    if (tpl) {
      const rendered = tpl.body
        .replace(/\{\{employeeName\}\}/g, 'John Doe')
        .replace(/\{\{projectName\}\}/g, 'Mobile Banking App')
        .replace(/\{\{taskName\}\}/g, 'Design UI Mockups')
        .replace(/\{\{deadline\}\}/g, '2026-12-31')
        .replace(/\{\{portalLink\}\}/g, 'https://app.useaxiom.com');
      setMessage(rendered);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await authFetch('/api/v1/communication/test-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientPhone: phone, message }),
      });

      const data = await res.json();
      setResult(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Network error occurred while calling server endpoint';
      setResult({
        success: false,
        errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell>
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[#e6e3da] pb-6">
          <Link href="/communication">
            <button className="p-2 bg-white border border-[#e6e3da] hover:bg-[#faf8f5] rounded-xl text-[#1c1b18] cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-serif font-black text-[#1c1b18]">
              Test WhatsApp Cloud API
            </h1>
            <p className="text-xs text-[#66635d]">
              Dispatch live test messages to any E.164 phone number via the official Meta WhatsApp Cloud API
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Test Form */}
          <form onSubmit={handleSend} className="bg-white border border-[#e6e3da] rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="font-serif font-black text-sm text-[#1c1b18] border-b border-[#e6e3da] pb-3">
              Test Message Dispatcher
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#1c1b18] mb-1">Recipient Phone Number (E.164)</label>
                <input
                  type="text"
                  required
                  placeholder="+14155238886 or 918105670193"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-[#e6e3da] rounded-xl text-xs focus:outline-none focus:border-[#8c7853]"
                />
                <span className="text-[10px] text-[#66635d] mt-1 block">
                  Include country code (e.g. +91 or 1 for US). Formatting like spaces or parentheses will be auto-normalized.
                </span>
              </div>

              <div>
                <label className="block font-bold text-[#1c1b18] mb-1">Load Message from Template (Optional)</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-[#e6e3da] rounded-xl text-xs focus:outline-none"
                >
                  <option value="">-- Custom Text Message --</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.eventType})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#1c1b18] mb-1">Message Content</label>
                <textarea
                  required
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-[#e6e3da] rounded-xl text-xs font-mono focus:outline-none focus:border-[#8c7853]"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider bg-[#8c7853] hover:bg-[#786645] text-white py-2.5 rounded-xl cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Sending to Meta Cloud API...' : 'Send WhatsApp Message'}
            </Button>
          </form>

          {/* Response Inspector */}
          <div className="space-y-4">
            <div className="bg-white border border-[#e6e3da] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#e6e3da] pb-3">
                <h2 className="font-serif font-black text-sm text-[#1c1b18]">
                  Meta Response Inspector
                </h2>
                {result && (
                  <span
                    className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md ${
                      result.success ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {result.success ? 'HTTP Success' : 'HTTP Error'}
                  </span>
                )}
              </div>

              {!result ? (
                <div className="py-12 text-center text-xs text-[#66635d] space-y-2">
                  <Eye className="w-8 h-8 text-[#8c7853] mx-auto opacity-50" />
                  <p>Send a test message to inspect raw Meta API HTTP response logs and Meta Message IDs (wamid).</p>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  {result.success ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-emerald-900">
                      <div className="flex items-center gap-2 font-black">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span>Message Sent Successfully!</span>
                      </div>
                      {result.metaMessageId && (
                        <p className="font-mono text-[11px] text-emerald-800">
                          <strong>Meta wamid:</strong> {result.metaMessageId}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1 text-red-900">
                      <div className="flex items-center gap-2 font-black">
                        <AlertTriangle className="w-4 h-4 text-red-700" />
                        <span>Dispatch Failed</span>
                      </div>
                      <p className="text-[11px] font-bold text-red-800">{result.errorMessage}</p>
                    </div>
                  )}

                  {result.apiResponse && (
                    <div>
                      <span className="font-bold text-[#1c1b18] block mb-1">Raw API Payload:</span>
                      <pre className="p-3 bg-[#faf8f5] border border-[#e6e3da] rounded-xl font-mono text-[10px] text-[#1c1b18] overflow-x-auto max-h-48">
                        {JSON.stringify(result.apiResponse, null, 2)}
                      </pre>
                    </div>
                  )}

                  {result.requestTime && (
                    <div className="text-[10px] text-[#66635d] flex justify-between border-t border-[#e6e3da] pt-2">
                      <span>Request: {new Date(result.requestTime).toLocaleTimeString()}</span>
                      {result.responseTime && <span>Response: {new Date(result.responseTime).toLocaleTimeString()}</span>}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
