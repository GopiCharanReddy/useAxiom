'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, CheckCircle2, RefreshCw } from 'lucide-react';
import { Card, Badge } from '@useaxiom/ui';

export default function IntegrationsPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('axiom_token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.role !== 'ADMIN') {
          router.push('/projects');
        } else {
          setIsAdmin(true);
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  if (!isAdmin) {
    return <div className="text-[#66635d] text-xs font-black uppercase tracking-widest py-8">Verifying admin access...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <div className="space-y-1">
        <h1 className="text-3xl font-serif font-black tracking-tight text-[#1c1b18]">Integrations</h1>
        <p className="text-[#66635d] text-xs font-semibold uppercase tracking-widest">
          Connect useAxiom to outward communication channels and development tools.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-6 border border-[#e6e3da]/80 bg-white rounded-2xl shadow-sm space-y-6">
          <div className="flex justify-between items-start">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-[#3e593e]/10 flex items-center justify-center rounded-xl border border-[#3e593e]/20 shrink-0">
                <MessageSquare className="w-6 h-6 text-[#3e593e]" />
              </div>
              <div>
                <h3 className="font-serif font-black text-[#1c1b18] text-lg">WhatsApp Business API</h3>
                <span className="text-xs text-[#8c7853] font-semibold block">
                  Communication engine for employee updates
                </span>
              </div>
            </div>
            <Badge variant="progress">Simulated</Badge>
          </div>

          <div className="space-y-3.5 border-t border-[#e6e3da] pt-6 text-xs font-bold">
            <div className="flex justify-between text-[#66635d]">
              <span>Simulation Mode:</span>
              <span className="font-black text-[#3e593e]">ACTIVE</span>
            </div>
            <div className="flex justify-between text-[#66635d]">
              <span>Status:</span>
              <span className="font-black text-[#1c1b18] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#3e593e]" />
                Interceptions enabled
              </span>
            </div>
            <p className="text-xs text-[#66635d] leading-relaxed pt-2 font-medium">
              The integration is configured in simulated development mode
              (`WHATSAPP_SIMULATE=true`). Outbound WhatsApp messages will print directly to the
              worker terminal instead of invoking Meta API endpoints.
            </p>
          </div>
        </Card>

        <Card className="p-6 border border-[#e6e3da]/80 bg-white rounded-2xl shadow-sm flex flex-col justify-center items-center text-center p-8 space-y-4">
          <div className="w-12 h-12 bg-[#8c7853]/10 flex items-center justify-center rounded-xl border border-[#8c7853]/20">
            <RefreshCw className="w-5 h-5 text-[#8c7853]" />
          </div>
          <div>
            <h4 className="font-serif font-black text-[#1c1b18]">More Connectors Coming Soon</h4>
            <p className="text-[#66635d] text-xs font-semibold mt-1 max-w-xs leading-relaxed">
              We are working on Slack, MS Teams, and GitHub Webhooks integrations for deeper
              platform automation.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
