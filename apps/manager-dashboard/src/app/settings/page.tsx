'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Cpu,
  MessageSquare,
  Building2,
  Save,
  Sparkles,
  Link2,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Badge,
} from '@useaxiom/ui';

export default function SettingsPage() {
  const [orgName, setOrgName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('axiom_org_name') || 'Axiom Core Labs';
    }
    return 'Axiom Core Labs';
  });
  const [automationMode, setAutomationMode] = useState<'assisted' | 'manual' | 'autonomous'>(() => {
    if (typeof window !== 'undefined') {
      return (
        (localStorage.getItem('axiom_automation_mode') as 'assisted' | 'manual' | 'autonomous') ||
        'assisted'
      );
    }
    return 'assisted';
  });
  const [isSaved, setIsSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('axiom_token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('axiom_org_name', orgName);
      localStorage.setItem('axiom_automation_mode', automationMode);
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-serif font-black tracking-tight text-[#1c1b18]">
          Workspace Configurations
        </h1>
        <p className="text-[#66635d] text-xs font-semibold uppercase tracking-widest">
          Configure global automation settings, business integrations, and tenant options.
        </p>
      </div>

      <div className="space-y-6">
        {/* Organization settings */}
        <Card className="bg-white border border-[#e6e3da]/80 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5 text-base font-serif font-black text-[#1c1b18]">
              <Building2 className="w-4.5 h-4.5 text-[#8c7853]" />
              <span>Organization Workspace Details</span>
            </CardTitle>
            <CardDescription className="text-xs font-semibold text-[#66635d] uppercase tracking-wider">
              Setup details and identification labels for this tenant.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
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
                className="opacity-75 cursor-not-allowed font-mono text-xs text-[#66635d] bg-[#faf8f5] border border-[#e6e3da]/60 rounded-xl py-3 px-4 shadow-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Automation Settings */}
        <Card className="bg-white border border-[#e6e3da]/80 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5 text-base font-serif font-black text-[#1c1b18]">
              <Cpu className="w-4.5 h-4.5 text-[#8c7853]" />
              <span>AI Execution Strategy</span>
            </CardTitle>
            <CardDescription className="text-xs font-semibold text-[#66635d] uppercase tracking-wider">
              Select the integration authority level for AI task planning.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Option 1: Manual */}
              <button
                type="button"
                onClick={() => setAutomationMode('manual')}
                className={`p-5 rounded-2xl border text-left transition-all duration-300 relative shadow-sm cursor-pointer ${
                  automationMode === 'manual'
                    ? 'border-[#8c7853] bg-[#FAF4E8] text-[#1c1b18]'
                    : 'border-[#e6e3da] bg-white text-[#66635d] hover:border-[#8c7853]/60'
                }`}
              >
                {automationMode === 'manual' && (
                  <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-[#8c7853] text-white text-[8px] font-black uppercase tracking-widest shadow-sm animate-in fade-in">
                    Active
                  </div>
                )}
                <span className="block font-serif font-black text-sm text-[#1c1b18]">
                  Manual Planning
                </span>
                <span className="block text-[10px] text-[#66635d] font-semibold leading-relaxed mt-2 uppercase tracking-wide">
                  Manager manually creates milestones, assigns resources, and starts task runs.
                </span>
              </button>

              {/* Option 2: AI Assisted */}
              <button
                type="button"
                onClick={() => setAutomationMode('assisted')}
                className={`p-5 rounded-2xl border text-left transition-all duration-300 relative shadow-sm cursor-pointer ${
                  automationMode === 'assisted'
                    ? 'border-[#8c7853] bg-[#FAF4E8] text-[#1c1b18]'
                    : 'border-[#e6e3da] bg-white text-[#66635d] hover:border-[#8c7853]/60'
                }`}
              >
                {automationMode === 'assisted' && (
                  <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-[#8c7853] text-white text-[8px] font-black uppercase tracking-widest shadow-sm animate-in fade-in">
                    Active
                  </div>
                )}
                <span className="block font-serif font-black text-sm text-[#1c1b18] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#8c7853]" />
                  <span>AI Assisted</span>
                </span>
                <span className="block text-[10px] text-[#66635d] font-semibold leading-relaxed mt-2 uppercase tracking-wide">
                  AI drafts the milestones and task lists. Active notification starts after Manager
                  signs off.
                </span>
              </button>

              {/* Option 3: Autonomous */}
              <button
                type="button"
                onClick={() => setAutomationMode('autonomous')}
                className={`p-5 rounded-2xl border text-left transition-all duration-300 relative shadow-sm cursor-pointer ${
                  automationMode === 'autonomous'
                    ? 'border-[#8c7853] bg-[#FAF4E8] text-[#1c1b18]'
                    : 'border-[#e6e3da] bg-white text-[#66635d] hover:border-[#8c7853]/60'
                }`}
              >
                {automationMode === 'autonomous' ? (
                  <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-[#8c7853] text-white text-[8px] font-black uppercase tracking-widest shadow-sm animate-in fade-in">
                    Active
                  </div>
                ) : (
                  <div className="absolute top-3 right-3 text-[#66635d]">
                    <Lock className="w-3 h-3" />
                  </div>
                )}
                <span className="block font-serif font-black text-sm text-[#1c1b18]">
                  Autonomous
                </span>
                <span className="block text-[10px] text-[#a09c94] font-semibold leading-relaxed mt-2 uppercase tracking-wide">
                  AI plans, assigns, and schedules runs automatically. Manager receives dashboard
                  feeds retrospectively.
                </span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Integrations: WhatsApp Business API */}
        <Card className="bg-white border border-[#e6e3da]/80 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5 text-base font-serif font-black text-[#1c1b18]">
              <MessageSquare className="w-4.5 h-4.5 text-[#8c7853]" />
              <span>WhatsApp Integration Channel</span>
            </CardTitle>
            <CardDescription className="text-xs font-semibold text-[#66635d] uppercase tracking-wider">
              Connect Meta WhatsApp Business account for employee messaging.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="p-4 bg-[#faf8f5] border border-[#e6e3da] rounded-xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#3e593e]/10 border border-[#d5ebd5] flex items-center justify-center text-[#3e593e]">
                  <Link2 className="w-4.5 h-4.5" />
                </div>
                <div className="space-y-0.5">
                  <span className="block text-xs font-black text-[#1c1b18] uppercase tracking-wider">
                    Meta API Account connected
                  </span>
                  <span className="block text-[9px] text-[#66635d] uppercase tracking-widest font-semibold">
                    Webhook:{' '}
                    <code className="text-[10px] text-[#8c7853] font-mono">
                      POST /webhooks/whatsapp
                    </code>
                  </span>
                </div>
              </div>
              <Badge variant="completed">Linked</Badge>
            </div>
          </CardContent>
          <CardFooter className="justify-between pt-6 border-t border-[#e6e3da]/80">
            {isSaved ? (
              <span className="text-[#3e593e] text-xs font-black uppercase tracking-widest flex items-center gap-1.5 animate-in fade-in duration-300">
                <CheckCircle2 className="w-4.5 h-4.5" />
                <span>Workspace settings updated!</span>
              </span>
            ) : (
              <div />
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              className="h-10 px-4 text-[9px] font-black tracking-widest uppercase border border-[#7d6b4a] shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Configurations</span>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
