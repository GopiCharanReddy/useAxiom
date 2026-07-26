'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, AlertCircle } from 'lucide-react';
import { Card, Badge, Button } from '@useaxiom/ui';

export default function BillingPage() {
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
        <h1 className="text-3xl font-serif font-black tracking-tight text-[#1c1b18]">Billing & Limits</h1>
        <p className="text-[#66635d] text-xs font-semibold uppercase tracking-widest">
          Manage subscription levels, AI token usage limits, and active billing information.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-6 border border-[#e6e3da]/80 bg-white rounded-2xl shadow-sm space-y-6">
          <div className="flex justify-between items-start">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-[#8c7853]/10 flex items-center justify-center rounded-xl border border-[#8c7853]/20 shrink-0">
                <CreditCard className="w-6 h-6 text-[#8c7853]" />
              </div>
              <div>
                <h3 className="font-serif font-black text-[#1c1b18] text-lg">Platform Plan</h3>
                <span className="text-xs text-[#8c7853] font-semibold block">
                  Organization Level: Developer Sandbox
                </span>
              </div>
            </div>
            <Badge variant="progress">Free Sandbox</Badge>
          </div>

          <div className="space-y-3.5 border-t border-[#e6e3da] pt-6 text-xs font-bold">
            <div className="flex justify-between text-[#66635d]">
              <span>Monthly AI Limit:</span>
              <span className="text-[#1c1b18] font-black">50,000 / Unlimited</span>
            </div>
            <div className="flex justify-between text-[#66635d]">
              <span>Assigned Employees Limit:</span>
              <span className="text-[#1c1b18] font-black">10 maximum</span>
            </div>
            <div className="flex justify-between text-[#66635d]">
              <span>Card Ending:</span>
              <span className="text-[#1c1b18] font-black">None attached</span>
            </div>
          </div>

          <Button className="w-full bg-[#8c7853] text-white border border-[#7d6b4a] rounded-xl py-2.5 hover:bg-[#736243] font-black uppercase text-xs tracking-widest cursor-pointer shadow-sm">
            Upgrade subscription
          </Button>
        </Card>

        <Card className="p-6 border border-[#e6e3da]/80 bg-white rounded-2xl shadow-sm flex gap-4 items-start">
          <AlertCircle className="w-5 h-5 text-[#bda272] shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h4 className="font-serif font-black text-[#1c1b18]">Developer Environment</h4>
            <p className="text-[#66635d] text-xs font-semibold leading-relaxed">
              This organization is currently linked to the default developer seed workspace
              configuration. Payments and card validation checks are bypassed on all mock pipelines.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
