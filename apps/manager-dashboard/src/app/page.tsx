"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  FolderKanban, 
  CheckCircle2, 
  AlertTriangle, 
  Cpu, 
  ArrowRight, 
  Sparkles, 
  Play, 
  Check, 
  FileText,
  Users
} from "lucide-react";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Badge } from "@useaxiom/ui";

export default function Home() {
  // Client state to make dashboard interactive and "alive"
  const [hasApprovedPlan, setHasApprovedPlan] = useState(false);
  const [hasResolvedBlocker, setHasResolvedBlocker] = useState(false);

  const stats = [
    { name: "Active Projects", value: hasApprovedPlan ? "3" : "2", icon: FolderKanban, color: "text-purple-400" },
    { name: "Pending Approvals", value: hasApprovedPlan ? "0" : "1", icon: FileText, color: "text-amber-400" },
    { name: "Tasks Blocked", value: hasResolvedBlocker ? "0" : "1", icon: AlertTriangle, color: "text-rose-400" },
    { name: "Automation Mode", value: "AI Assisted", icon: Cpu, color: "text-emerald-400" },
  ];

  const handleApprove = () => {
    setHasApprovedPlan(true);
  };

  const handleResolveBlocker = () => {
    setHasResolvedBlocker(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-purple-500/10 p-6 sm:p-8 bg-gradient-to-r from-zinc-950 via-zinc-900 to-purple-950/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-semibold mb-4 border border-purple-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sprint 1 Foundations Operational</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400">
            Welcome back, David
          </h1>
          <p className="mt-2 text-zinc-400 text-sm sm:text-base leading-relaxed">
            Your execution assistants are actively listening on employee WhatsApp channels. You have {hasApprovedPlan ? "no plans awaiting review" : "1 AI-generated project plan awaiting review"}.
          </p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="hover:translate-y-[-2px] transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2 mb-0">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{stat.name}</span>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <span className="text-2xl sm:text-3xl font-bold text-zinc-100">{stat.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Proposed Plans & Projects */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Pending Approvals Widget */}
          {!hasApprovedPlan ? (
            <Card className="border-amber-500/20 bg-gradient-to-b from-zinc-900/60 to-amber-950/5">
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-amber-400">Awaiting Manager Approval</CardTitle>
                    <Badge variant="proposed">Proposed Plan</Badge>
                  </div>
                  <CardDescription className="mt-1">
                    AI generated a structured plan based on objective: <span className="text-zinc-300">&quot;Launch the new Q3 Product Marketing campaign&quot;</span>
                  </CardDescription>
                </div>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 space-y-3.5">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                    <span className="text-xs font-bold text-zinc-400">Milestone 1: Launch Assets</span>
                    <span className="text-[10px] text-zinc-500 font-medium">Est. Duration: 3 Days</span>
                  </div>
                  <div className="space-y-2.5 text-xs text-zinc-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-purple-400" />
                        <span>Draft Email & Press Releases</span>
                      </div>
                      <span className="text-zinc-500 font-semibold bg-zinc-900 px-2 py-0.5 rounded">Sarah</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-purple-400" />
                        <span>Configure Social Media Audience</span>
                      </div>
                      <span className="text-zinc-500 font-semibold bg-zinc-900 px-2 py-0.5 rounded">Alex</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-purple-400" />
                        <span>Load Creative Assets & Graphics</span>
                      </div>
                      <span className="text-zinc-500 font-semibold bg-zinc-900 px-2 py-0.5 rounded">Dave</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                <Link href="/projects/q3-marketing-launch" className="text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1">
                  <span>Review & Customize Plan</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setHasApprovedPlan(true)}>
                    Reject
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleApprove}>
                    <Play className="w-3.5 h-3.5 text-white fill-white" />
                    <span>Approve & Start Execution</span>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ) : (
            <Card className="border-emerald-500/10 bg-emerald-950/5 p-6 flex flex-col items-center justify-center text-center py-8">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400 mb-3 border border-emerald-500/25">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-zinc-200 font-semibold text-sm">All plans have been reviewed</h3>
              <p className="text-zinc-500 text-xs mt-1 max-w-sm">
                The Q3 Product Marketing campaign plan has been moved to active execution. Tasks are queued for employee notification.
              </p>
            </Card>
          )}

          {/* Active Projects List */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-zinc-300">Active Campaigns & Projects</h2>
              <Link href="/projects" className="text-xs font-semibold text-purple-400 hover:text-purple-300">
                View all projects
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/projects/axiom-platform-setup" className="block group">
                <Card className="h-full border-zinc-800/80 group-hover:border-purple-500/30 transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-zinc-200 group-hover:text-purple-400 transition-colors">Axiom Platform Setup</h3>
                      <p className="text-[10px] text-zinc-500 font-medium mt-0.5">Core System Migration</p>
                    </div>
                    <Badge variant="progress">In Progress</Badge>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="space-y-1.5 mt-6">
                    <div className="flex justify-between text-xs font-medium text-zinc-400">
                      <span>Execution Progress</span>
                      <span className="text-zinc-200">75%</span>
                    </div>
                    <div className="w-full bg-zinc-850 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full" style={{ width: "75%" }} />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-zinc-850 flex items-center justify-between text-[10px] text-zinc-500 font-medium">
                    <span className="text-emerald-400">🟢 On Track</span>
                    <span>3 / 4 Tasks Done</span>
                  </div>
                </Card>
              </Link>

              {/* Second card changes status based on approval */}
              <Link href="/projects/q3-marketing-launch" className="block group">
                <Card className={`h-full border-zinc-800/80 group-hover:border-purple-500/30 transition-all duration-300 ${!hasApprovedPlan ? 'opacity-85' : ''}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-zinc-200 group-hover:text-purple-400 transition-colors">Q3 Marketing Launch</h3>
                      <p className="text-[10px] text-zinc-500 font-medium mt-0.5">Asset Breakdown & Campaign</p>
                    </div>
                    <Badge variant={hasApprovedPlan ? "progress" : "proposed"}>
                      {hasApprovedPlan ? "In Progress" : "Proposed"}
                    </Badge>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5 mt-6">
                    <div className="flex justify-between text-xs font-medium text-zinc-400">
                      <span>Execution Progress</span>
                      <span className="text-zinc-200">{hasApprovedPlan ? "0%" : "—"}</span>
                    </div>
                    <div className="w-full bg-zinc-850 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full" style={{ width: hasApprovedPlan ? "0%" : "0%" }} />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-zinc-850 flex items-center justify-between text-[10px] text-zinc-500 font-medium">
                    <span className={hasApprovedPlan ? "text-emerald-400" : "text-amber-400"}>
                      {hasApprovedPlan ? "🟢 On Track" : "⚠️ Needs Review"}
                    </span>
                    <span>{hasApprovedPlan ? "0 / 3 Tasks Done" : "3 Proposed"}</span>
                  </div>
                </Card>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Alerts & Team Workloads */}
        <div className="space-y-6">
          
          {/* Active Alerts Widget */}
          <Card className={`border-zinc-800 ${!hasResolvedBlocker ? "border-rose-500/20 bg-rose-950/5" : ""}`}>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <AlertTriangle className={`w-4 h-4 ${!hasResolvedBlocker ? "text-rose-400" : "text-zinc-500"}`} />
                <span>Active Blocker Alerts</span>
              </CardTitle>
              <CardDescription>Piped from employee SMS/WhatsApp streams</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!hasResolvedBlocker ? (
                <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-2">
                      <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300 uppercase">
                        DM
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-zinc-300">Dave Morris</span>
                        <span className="block text-[9px] text-zinc-500 font-semibold uppercase">Load Creative Assets</span>
                      </div>
                    </div>
                    <Badge variant="blocked">Blocked</Badge>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-950 p-2 rounded border border-zinc-900 font-mono">
                    &quot;I can&apos;t load the graphics, the drive link is broken.&quot;
                  </p>
                  <div className="flex justify-end gap-1.5">
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] rounded-lg">
                      Ping via WhatsApp
                    </Button>
                    <Button variant="danger" size="sm" className="h-7 text-[10px] rounded-lg" onClick={handleResolveBlocker}>
                      Mark Resolved
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 flex flex-col items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                  <span className="text-zinc-300 text-xs font-semibold">No active blockers!</span>
                  <p className="text-[10px] text-zinc-500 mt-1 max-w-[200px]">
                    All employee feedback streams are green.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Workload Widget */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span>Team Member Workloads</span>
              </CardTitle>
              <CardDescription>Current task allocations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3.5">
                {/* Employee 1 */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-zinc-300">Sarah Jenkins</span>
                    <span className="text-zinc-400">90% Load</span>
                  </div>
                  <div className="w-full bg-zinc-850 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full animate-pulse" style={{ width: "90%" }} />
                  </div>
                  <span className="block text-[9px] text-zinc-500">Active: 1 task • Queued: 2 tasks</span>
                </div>
                {/* Employee 2 */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-zinc-300">Alex Rivers</span>
                    <span className="text-zinc-400">80% Load</span>
                  </div>
                  <div className="w-full bg-zinc-850 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: "80%" }} />
                  </div>
                  <span className="block text-[9px] text-zinc-500">Active: 1 task • Queued: 1 task</span>
                </div>
                {/* Employee 3 */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-zinc-300">Dave Morris</span>
                    <span className="text-zinc-400">{hasResolvedBlocker ? "30% Load" : "50% Load"}</span>
                  </div>
                  <div className="w-full bg-zinc-850 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: hasResolvedBlocker ? "30%" : "50%" }} />
                  </div>
                  <span className="block text-[9px] text-zinc-500">
                    {hasResolvedBlocker ? "Active: 1 task • Queued: 0" : "Blocked on 'Load Creative Assets'"}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Link href="/team" className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 w-full text-center">
                Manage Allocations
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
