"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Cpu, 
  MessageSquare, 
  Building2, 
  Save, 
  Sparkles,
  Link2,
  CheckCircle2,
  Lock
} from "lucide-react";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Input, Badge } from "@useaxiom/ui";

export default function SettingsPage() {
  const [orgName, setOrgName] = useState("Axiom Core Labs");
  const [automationMode, setAutomationMode] = useState<"assisted" | "manual" | "autonomous">("assisted");
  const [isSaved, setIsSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('axiom_token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-500">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Workspace Configurations</h1>
        <p className="text-zinc-400 text-sm mt-1">Configure global automation settings, business integrations, and tenant options.</p>
      </div>

      <div className="space-y-6">
        
        {/* Organization settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <Building2 className="w-4 h-4 text-purple-400" />
              <span>Organization Workspace Details</span>
            </CardTitle>
            <CardDescription>Setup details and identification labels for this tenant.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Organization Profile Name"
                value={orgName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrgName(e.target.value)}
                placeholder="e.g. Acme Corp"
              />
              <Input
                label="System Tenant ID (Read Only)"
                value="org_axiom_prod_008"
                disabled
                className="opacity-75 cursor-not-allowed font-mono text-xs text-zinc-400 bg-zinc-950"
              />
            </div>
          </CardContent>
        </Card>

        {/* Automation Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>AI Execution Strategy</span>
            </CardTitle>
            <CardDescription>Select the integration authority level for AI task planning.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Option 1: Manual */}
              <button
                type="button"
                onClick={() => setAutomationMode("manual")}
                className={`p-4 rounded-xl border text-left transition-all ${
                  automationMode === "manual"
                    ? "border-purple-600 bg-purple-500/5 text-zinc-100"
                    : "border-zinc-800 bg-zinc-900/10 text-zinc-400 hover:border-zinc-700/60"
                }`}
              >
                <span className="block font-bold text-sm text-zinc-200">Manual Planning</span>
                <span className="block text-[10px] text-zinc-500 leading-normal mt-1">
                  Manager manually creates milestones, assigns resources, and starts task runs.
                </span>
              </button>

              {/* Option 2: AI Assisted */}
              <button
                type="button"
                onClick={() => setAutomationMode("assisted")}
                className={`p-4 rounded-xl border text-left transition-all relative ${
                  automationMode === "assisted"
                    ? "border-purple-600 bg-purple-500/5 text-zinc-100"
                    : "border-zinc-800 bg-zinc-900/10 text-zinc-400 hover:border-zinc-700/60"
                }`}
              >
                <div className="absolute -top-2 right-3 px-2 py-0.5 rounded bg-purple-600 text-white text-[9px] font-bold uppercase tracking-widest">
                  Active
                </div>
                <span className="block font-bold text-sm text-zinc-200 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>AI Assisted</span>
                </span>
                <span className="block text-[10px] text-zinc-500 leading-normal mt-1">
                  AI drafts the milestones and task lists. Active notification starts after Manager signs off.
                </span>
              </button>

              {/* Option 3: Autonomous */}
              <button
                type="button"
                onClick={() => setAutomationMode("autonomous")}
                className={`p-4 rounded-xl border text-left transition-all relative ${
                  automationMode === "autonomous"
                    ? "border-purple-600 bg-purple-500/5 text-zinc-100"
                    : "border-zinc-800 bg-zinc-900/10 text-zinc-400 hover:border-zinc-700/60"
                }`}
              >
                <div className="absolute top-2 right-2 text-zinc-500">
                  <Lock className="w-3 h-3" />
                </div>
                <span className="block font-bold text-sm text-zinc-200">Autonomous (Future)</span>
                <span className="block text-[10px] text-zinc-500 leading-normal mt-1">
                  AI plans, assigns, and schedules runs automatically. Manager receives dashboard feeds retrospectively.
                </span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Integrations: WhatsApp Business API */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              <span>WhatsApp Integration Channel</span>
            </CardTitle>
            <CardDescription>Connect Meta WhatsApp Business account for employee messaging.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-zinc-950/60 border border-zinc-850 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Link2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-zinc-200">Meta API Account connected</span>
                  <span className="block text-[10px] text-zinc-500">Webhook: <code className="text-[10px] text-purple-400 font-mono">POST /webhooks/whatsapp</code></span>
                </div>
              </div>
              <Badge variant="completed">Linked</Badge>
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            {isSaved ? (
              <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>Workspace settings updated!</span>
              </span>
            ) : (
              <div />
            )}
            <Button variant="primary" size="sm" onClick={handleSave} className="rounded-xl font-semibold gap-1.5">
              <Save className="w-4 h-4" />
              <span>Save Configurations</span>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
