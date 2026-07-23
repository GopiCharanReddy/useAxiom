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
    return <div className="text-zinc-500 py-8">Verifying admin access...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Billing & Limits</h1>
        <p className="text-zinc-400 text-sm">
          Manage subscription levels, AI token usage limits, and active billing information.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-6 border-zinc-800 bg-zinc-900/60 rounded-3xl space-y-6">
          <div className="flex justify-between items-start">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-purple-500/10 flex items-center justify-center rounded-2xl border border-purple-500/20 shrink-0">
                <CreditCard className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-100 text-lg">Platform Plan</h3>
                <span className="text-xs text-zinc-500 block">
                  Organization Level: Developer Sandbox
                </span>
              </div>
            </div>
            <Badge variant="progress">Free Sandbox</Badge>
          </div>

          <div className="space-y-3.5 border-t border-zinc-800/80 pt-6 text-sm">
            <div className="flex justify-between text-zinc-400">
              <span>Monthly AI Limit:</span>
              <span className="text-zinc-200">50,000 / Unlimited</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Assigned Employees Limit:</span>
              <span className="text-zinc-200">10 maximum</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Card Ending:</span>
              <span className="text-zinc-200">None attached</span>
            </div>
          </div>

          <Button className="w-full bg-zinc-950 text-zinc-400 border border-zinc-800 rounded-xl py-2 hover:bg-zinc-900">
            Upgrade subscription
          </Button>
        </Card>

        <Card className="p-6 border-zinc-800 bg-zinc-900/30 rounded-3xl flex gap-4 items-start">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h4 className="font-bold text-zinc-200">Developer Environment</h4>
            <p className="text-zinc-500 text-xs leading-relaxed">
              This organization is currently linked to the default developer seed workspace
              configuration. Payments and card validation checks are bypassed on all mock pipelines.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
