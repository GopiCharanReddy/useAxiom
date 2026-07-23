"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, CheckCircle2, RefreshCw } from "lucide-react";
import { Card, Badge } from "@useaxiom/ui";

export default function IntegrationsPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("axiom_token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetch("/api/v1/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.role !== "ADMIN") {
          router.push("/projects");
        } else {
          setIsAdmin(true);
        }
      })
      .catch(() => router.push("/login"));
  }, [router]);

  if (!isAdmin) {
    return <div className="text-zinc-500 py-8">Verifying admin access...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Integrations</h1>
        <p className="text-zinc-400 text-sm">Connect useAxiom to outward communication channels and development tools.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-6 border-zinc-800 bg-zinc-900/60 rounded-3xl space-y-6">
          <div className="flex justify-between items-start">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 flex items-center justify-center rounded-2xl border border-emerald-500/20 shrink-0">
                <MessageSquare className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-100 text-lg">WhatsApp Business API</h3>
                <span className="text-xs text-zinc-500 block">Communication engine for employee updates</span>
              </div>
            </div>
            <Badge variant="progress">Simulated</Badge>
          </div>

          <div className="space-y-3.5 border-t border-zinc-800/80 pt-6 text-sm">
            <div className="flex justify-between text-zinc-400">
              <span>Simulation Mode:</span>
              <span className="font-bold text-emerald-400">ACTIVE</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Status:</span>
              <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Interceptions enabled
              </span>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed pt-2">
              The integration is configured in simulated development mode (`WHATSAPP_SIMULATE=true`). Outbound WhatsApp messages will print directly to the worker terminal instead of invoking Meta API endpoints, protecting your billing from 401 exceptions.
            </p>
          </div>
        </Card>

        <Card className="p-6 border-zinc-800 bg-zinc-900/30 rounded-3xl flex flex-col justify-center items-center text-center p-8 space-y-4">
          <div className="w-12 h-12 bg-purple-500/10 flex items-center justify-center rounded-2xl border border-purple-500/20">
            <RefreshCw className="w-5 h-5 text-purple-400 animate-spin-slow" />
          </div>
          <div>
            <h4 className="font-bold text-zinc-200">More Connectors Coming Soon</h4>
            <p className="text-zinc-500 text-xs mt-1 max-w-xs leading-relaxed">
              We are working on Slack, MS Teams, and GitHub Webhooks integrations for deeper platform automation.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
