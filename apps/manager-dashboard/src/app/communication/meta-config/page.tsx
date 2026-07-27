'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, XCircle, ShieldCheck, RefreshCw, Send } from 'lucide-react';
import { Button } from '@useaxiom/ui';

interface MetaConfig {
  isConfigured: boolean;
  phoneNumberId: string | null;
  businessAccountId: string | null;
  apiVersion: string;
  hasAccessToken: boolean;
  hasVerifyToken: boolean;
}

export default function MetaConfigPage() {
  const [config, setConfig] = useState<MetaConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    setLoading(true);
    const token = localStorage.getItem('axiom_token');
    try {
      const res = await fetch('/api/v1/communication/meta-config', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (err) {
      console.error('Error loading Meta config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl">
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
              Meta WhatsApp Cloud API Configuration
            </h1>
            <p className="text-xs text-[#66635d]">
              Live Meta Graph API connection status, phone credentials, and webhook endpoints
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchConfig}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-[#e6e3da] text-xs font-bold text-[#1c1b18] rounded-xl hover:bg-[#faf8f5] shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
          </button>
          <Link href="/communication/test-whatsapp">
            <Button variant="primary" size="sm" className="cursor-pointer">
              <Send className="w-4 h-4" /> Test Dispatches
            </Button>
          </Link>
        </div>
      </div>

      {/* Health Banner */}
      {loading ? (
        <div className="py-8 text-center text-xs text-[#66635d]">Checking Meta Cloud API connection...</div>
      ) : config?.isConfigured ? (
        <div className="p-6 bg-[#f0f5f0] border border-[#d5ebd5] rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#3e593e] text-white flex items-center justify-center rounded-xl font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-black text-base text-[#3e593e]">
                Meta WhatsApp Cloud API Ready
              </h3>
              <p className="text-xs font-semibold text-[#3e593e]">
                Environment variables configured with Graph API version {config.apiVersion}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-[#3e593e] text-white font-black text-xs uppercase tracking-wider rounded-full">
            CONNECTED
          </span>
        </div>
      ) : (
        <div className="p-6 bg-[#fdf2f2] border border-[#fcdada] rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#9f3a38] text-white flex items-center justify-center rounded-xl font-bold">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-black text-base text-[#9f3a38]">
                Meta Credentials Missing in Environment
              </h3>
              <p className="text-xs font-semibold text-[#9f3a38]">
                Add WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID to your root .env file
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-[#9f3a38] text-white font-black text-xs uppercase tracking-wider rounded-full">
            NOT CONFIGURED
          </span>
        </div>
      )}

      {/* Credentials Breakdown Table */}
      <div className="bg-white border border-[#e6e3da] rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-serif font-black text-base text-[#1c1b18]">
          Environment Credentials & Masked Secrets
        </h2>

        <div className="space-y-3 text-xs">
          <div className="p-4 bg-[#faf8f5] border border-[#e6e3da] rounded-xl flex items-center justify-between">
            <div>
              <span className="font-bold text-[#1c1b18] block">System Access Token (WHATSAPP_ACCESS_TOKEN)</span>
              <span className="text-[11px] text-[#66635d]">Permanent Meta Business System User Access Token</span>
            </div>
            <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-md ${config?.hasAccessToken ? 'bg-[#f0f5f0] text-[#3e593e] border border-[#d5ebd5]' : 'bg-[#fdf2f2] text-[#9f3a38] border border-[#fcdada]'}`}>
              {config?.hasAccessToken ? 'PRESENT (MASKED)' : 'MISSING'}
            </span>
          </div>

          <div className="p-4 bg-[#faf8f5] border border-[#e6e3da] rounded-xl flex items-center justify-between">
            <div>
              <span className="font-bold text-[#1c1b18] block">Phone Number ID (WHATSAPP_PHONE_NUMBER_ID)</span>
              <span className="text-[11px] text-[#66635d]">Meta Cloud API Registered Phone ID</span>
            </div>
            <span className="font-mono text-xs font-bold text-[#1c1b18]">
              {config?.phoneNumberId || 'Not Configured'}
            </span>
          </div>

          <div className="p-4 bg-[#faf8f5] border border-[#e6e3da] rounded-xl flex items-center justify-between">
            <div>
              <span className="font-bold text-[#1c1b18] block">Business Account ID (WHATSAPP_BUSINESS_ACCOUNT_ID)</span>
              <span className="text-[11px] text-[#66635d]">Meta WABA Identifier</span>
            </div>
            <span className="font-mono text-xs font-bold text-[#1c1b18]">
              {config?.businessAccountId || 'Not Configured'}
            </span>
          </div>

          <div className="p-4 bg-[#faf8f5] border border-[#e6e3da] rounded-xl flex items-center justify-between">
            <div>
              <span className="font-bold text-[#1c1b18] block">Webhook Verification Token (WHATSAPP_VERIFY_TOKEN)</span>
              <span className="text-[11px] text-[#66635d]">Arbitrary secret matching Meta App Dashboard</span>
            </div>
            <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-md ${config?.hasVerifyToken ? 'bg-[#f0f5f0] text-[#3e593e] border border-[#d5ebd5]' : 'bg-[#fdf2f2] text-[#9f3a38] border border-[#fcdada]'}`}>
              {config?.hasVerifyToken ? 'CONFIGURED' : 'MISSING'}
            </span>
          </div>

          <div className="p-4 bg-[#faf8f5] border border-[#e6e3da] rounded-xl flex items-center justify-between">
            <div>
              <span className="font-bold text-[#1c1b18] block">Graph API Version</span>
              <span className="text-[11px] text-[#66635d]">Target Meta Cloud API endpoint version</span>
            </div>
            <span className="font-mono text-xs font-bold text-[#8c7853]">
              {config?.apiVersion || 'v21.0'}
            </span>
          </div>
        </div>
      </div>

      {/* Webhook Endpoint Info */}
      <div className="bg-white border border-[#e6e3da] rounded-2xl p-6 shadow-sm space-y-3 text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#8c7853]" />
          <h2 className="font-serif font-black text-base text-[#1c1b18]">
            Meta Webhook Endpoints
          </h2>
        </div>

        <p className="text-[#66635d]">
          Configure these URLs in your Meta Developer App Dashboard under <strong>WhatsApp → Configuration → Webhook</strong>:
        </p>

        <div className="p-4 bg-[#faf8f5] border border-[#e6e3da] rounded-xl font-mono text-[11px] text-[#1c1b18] space-y-2">
          <div>
            <span className="text-[#66635d] uppercase text-[10px] font-bold block">Callback URL:</span>
            <span>https://YOUR_PUBLIC_DOMAIN/api/v1/communication/webhook</span>
          </div>
          <div>
            <span className="text-[#66635d] uppercase text-[10px] font-bold block">Verify Token:</span>
            <span>Matches WHATSAPP_VERIFY_TOKEN in your .env</span>
          </div>
        </div>
      </div>
    </div>
  );
}
