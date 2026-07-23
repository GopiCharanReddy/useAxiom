"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  FolderKanban, 
  CheckCircle2, 
  AlertTriangle, 
  Cpu, 
  ArrowRight, 
  Sparkles, 
  Play, 
  FileText,
  Users
} from "lucide-react";
import { Button, Card, CardHeader, CardTitle, CardContent, CardFooter, Badge } from "@useaxiom/ui";

export default function Home() {
  const [projects, setProjects] = useState<Array<{id: string, name: string, objective: string, status: string, healthScore?: number, healthStatus?: string, healthReasoning?: string, tasks?: Array<{ id: string, status: string }> }>>([]);
  const [statsData, setStatsData] = useState<{ active_projects: number, blocked_tasks: number, ai_interventions_count: number, team_velocity: number } | null>(null);
  const [workloads, setWorkloads] = useState<Array<{employee_id: string, employee_name: string, active_tasks: number, capacity_percentage: number}>>([]);
  const [user, setUser] = useState<{ name: string } | null>(null);

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('axiom_token');
    if (!token) {
      router.push('/login');
      return;
    }

    Promise.all([
      fetch('/api/v1/projects', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => {
        if (r.status === 401) throw new Error('Unauthorized');
        return r.json();
      }),
      fetch('/api/v1/analytics/dashboard', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/v1/analytics/team-workload', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/v1/auth/me', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json())
    ])
    .then(([projectsData, dashboardData, workloadData, userData]) => {
      if (Array.isArray(projectsData)) setProjects(projectsData);
      setStatsData(dashboardData);
      if (workloadData?.workloads) setWorkloads(workloadData.workloads);
      if (userData) setUser(userData);
    })
    .catch(err => {
      if (err.message === 'Unauthorized') {
        localStorage.removeItem('axiom_token');
        router.push('/login');
      }
      console.error("Failed to fetch dashboard data:", err);
    });
  }, [router]);

  const hasApprovedPlan = !projects.some(p => p.status === 'PROPOSED');
  const hasResolvedBlocker = statsData?.blocked_tasks === 0;

  const stats = [
    { name: "Active Projects", value: statsData?.active_projects.toString() || "0", icon: FolderKanban, bg: "bg-purple-600/10", text: "text-purple-400" },
    { name: "AI Interventions", value: statsData?.ai_interventions_count.toString() || "0", icon: FileText, bg: "bg-amber-500/10", text: "text-amber-400" },
    { name: "Tasks Blocked", value: statsData?.blocked_tasks.toString() || "0", icon: AlertTriangle, bg: "bg-rose-500/10", text: "text-rose-400" },
    { name: "Team Velocity", value: `${statsData?.team_velocity || 100}%`, icon: Cpu, bg: "bg-emerald-500/10", text: "text-emerald-400" },
  ];

  const handleApprove = async (id: string) => {
    try {
      const token = localStorage.getItem('axiom_token');
      await fetch(`/api/v1/projects/${id}/approve`, { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // Re-fetch
      const res = await fetch('/api/v1/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setProjects(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerate = async (id: string) => {
    try {
      const token = localStorage.getItem('axiom_token');
      await fetch(`/api/v1/projects/${id}/generate-plan`, { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      alert('Plan generation triggered!');
    } catch (e) {
      console.error(e);
    }
  };

  const proposedProject = projects.find(p => p.status === 'PROPOSED');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-zinc-900 border border-zinc-800 p-8 sm:p-10 rounded-2xl">
        <div className="absolute top-[-50%] right-[-10%] w-96 h-96 bg-purple-600/5 rounded-full pointer-events-none" />
        
        <div className="relative max-w-2xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-purple-400 text-xs font-bold uppercase tracking-wider mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Sprint 1 Foundations Operational</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            Welcome back, {user ? user.name.split(' ')[0] : 'Manager'}
          </h1>
          <p className="text-zinc-400 text-lg font-medium leading-relaxed max-w-xl">
            Your execution assistants are actively listening on employee WhatsApp channels. You have {hasApprovedPlan ? "no plans awaiting review" : "1 AI-generated project plan awaiting review"}.
          </p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name} className="hover:-translate-y-1 transition-all duration-300 border border-zinc-850 rounded-2xl bg-zinc-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2 mb-0">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{stat.name}</span>
              <div className={`w-8 h-8 ${stat.bg} flex items-center justify-center rounded-lg`}>
                <stat.icon className={`w-4 h-4 ${stat.text}`} />
              </div>
            </CardHeader>
            <CardContent>
              <span className={`text-4xl font-extrabold ${stat.text}`}>{stat.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Proposed Plans & Projects */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Pending Approvals Widget */}
          {!hasApprovedPlan ? (
            <div className="bg-zinc-900 border-2 border-amber-500 p-8 sm:p-10 relative overflow-hidden group rounded-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-black text-zinc-100">Awaiting Manager Approval</h2>
                      <span className="bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase px-2 py-1 tracking-wider rounded border border-amber-500/20">Proposed Plan</span>
                    </div>
                    <p className="text-zinc-400 font-medium text-sm max-w-lg">
                      AI generated a structured plan for <span className="font-bold text-zinc-200">&quot;{proposedProject?.name}&quot;</span> based on objective: <span className="font-bold text-zinc-200">&quot;{proposedProject?.objective}&quot;</span>
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 rounded-xl">
                    <Sparkles className="w-6 h-6 text-amber-400" />
                  </div>
                </div>

                <div className="bg-zinc-950 p-6 rounded-xl border border-zinc-850 space-y-4 mb-6">
                  <div className="flex justify-between items-center pb-4 border-b border-zinc-850">
                    <span className="text-sm font-black text-zinc-200 uppercase tracking-wide">AI Plan Ready</span>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-zinc-400">
                      The AI has generated tasks, milestones, and resource allocations for this project. Please review and customize the plan before approving.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <Link href={`/projects/${proposedProject?.id}`} className="text-sm font-bold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-2 group/link">
                    <span className="border-b border-transparent group-hover/link:border-amber-300 pb-0.5 transition-all">Review & Customize Plan</span>
                    <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <Button variant="outline" className="border border-zinc-800 text-zinc-300 hover:bg-zinc-800 flex-1 sm:flex-none">
                      Reject
                    </Button>
                    <Button variant="primary" className="bg-amber-500 hover:bg-amber-600 text-zinc-950 hover:text-zinc-950 flex-1 sm:flex-none" onClick={() => {
                      if (proposedProject) {
                        handleApprove(proposedProject.id);
                      }
                    }}>
                      <Play className="w-4 h-4 fill-current text-zinc-950" />
                      <span>Approve & Start</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 rounded-2xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-zinc-100 font-black text-2xl mb-2">All plans have been reviewed</h3>
              <p className="text-zinc-400 font-medium max-w-md">
                The Q3 Product Marketing campaign plan has been moved to active execution. Tasks are queued for employee notification.
              </p>
            </div>
          )}

          {/* Active Projects List */}
          <div className="space-y-6">
            <div className="flex justify-between items-end border-b border-zinc-850 pb-2">
              <h2 className="text-2xl font-black text-zinc-100">Active Campaigns</h2>
              <Link href="/projects" className="text-sm font-bold text-purple-400 hover:text-purple-300">
                View all
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((project) => (
                <Link href={`/projects/${project.id}`} key={project.id} className="block group">
                  <Card className="h-full border border-zinc-850 group-hover:border-zinc-700/80 bg-zinc-900 transition-colors duration-200 rounded-2xl">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="font-black text-lg text-zinc-200 group-hover:text-purple-400 transition-colors leading-tight mb-2">{project.name}</h3>
                        <p className="text-xs text-zinc-400 font-bold line-clamp-2 leading-relaxed">{project.objective}</p>
                      </div>
                      <Badge variant={project.status === 'ACTIVE' ? "progress" : "proposed"}>
                        {project.status === 'ACTIVE' ? "Active" : project.status}
                      </Badge>
                    </div>

                    {/* Progress bar */}
                    {(() => {
                      const tasksTotal = project.tasks?.length || 0;
                      const tasksDone = project.tasks?.filter((t) => t.status === "COMPLETED").length || 0;
                      const progress = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;
                      return (
                        <div className="space-y-2 mt-auto pt-6">
                          <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase tracking-wider">
                            <span>Progress</span>
                            <span className="text-zinc-300">{progress}%</span>
                          </div>
                          <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden">
                            <div className="bg-purple-600 h-full rounded-full" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      );
                    })()}
                    {project.healthScore !== undefined && project.healthScore !== null && (
                      <div className={`mt-4 p-3 border-l-4 rounded-r-xl ${project.healthStatus === 'HIGH' ? 'border-rose-500 bg-rose-500/5' : project.healthStatus === 'MEDIUM' ? 'border-amber-500 bg-amber-500/5' : 'border-emerald-500 bg-emerald-500/5'} flex justify-between items-center`}>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className={`w-4 h-4 ${project.healthStatus === 'HIGH' ? 'text-rose-400' : project.healthStatus === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'}`} />
                          <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">AI Risk</span>
                        </div>
                        <span className={`text-xs font-black ${project.healthStatus === 'HIGH' ? 'text-rose-400' : project.healthStatus === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'}`}>{project.healthScore}/100</span>
                      </div>
                    )}
                    <div className="mt-6 pt-4 border-t border-zinc-850 flex items-center justify-between text-xs font-bold">
                      <span className={project.status === 'ACTIVE' ? "text-emerald-400" : "text-amber-400"}>
                        {project.status === 'ACTIVE' ? "ON TRACK" : "NEEDS REVIEW"}
                      </span>
                      <span className="flex gap-2">
                        <button className="text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-wider text-[10px]" onClick={(e) => { e.preventDefault(); handleGenerate(project.id); }}>Generate</button>
                        <button className="text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-wider text-[10px]" onClick={(e) => { e.preventDefault(); handleApprove(project.id); }}>Approve</button>
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Alerts & Team Workloads */}
        <div className="space-y-8">
          
          {/* Active Alerts Widget */}
          <div className={`p-6 sm:p-8 rounded-2xl border ${!hasResolvedBlocker ? "bg-zinc-900 border-rose-500 text-zinc-100" : "bg-zinc-900 border-zinc-850"}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 flex items-center justify-center rounded-xl ${!hasResolvedBlocker ? "bg-rose-500/10 text-rose-400" : "bg-zinc-950 text-zinc-500"}`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`font-black text-lg ${!hasResolvedBlocker ? "text-zinc-100" : "text-zinc-200"}`}>Active Alerts</h3>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${!hasResolvedBlocker ? "text-rose-400" : "text-zinc-500"}`}>SMS/WhatsApp Streams</span>
              </div>
            </div>
            
            {!hasResolvedBlocker && statsData && statsData.blocked_tasks > 0 ? (
              <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-850 text-zinc-200 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center rounded-2xl mb-4">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <span className="text-zinc-100 text-sm font-black">{statsData.blocked_tasks} Active Blockers!</span>
                <p className="text-xs text-zinc-400 font-bold mt-2 mb-4">
                  There are tasks currently blocked by employees.
                </p>
                <div className="flex flex-col gap-2 w-full">
                  <Button variant="outline" className="w-full text-xs" onClick={() => router.push('/projects')}>
                    View Projects
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center rounded-2xl mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <span className="text-zinc-200 text-sm font-black">No active blockers!</span>
                <p className="text-xs text-zinc-500 font-bold mt-2">
                  All employee feedback streams are green.
                </p>
              </div>
            )}
          </div>

          {/* Team Workload Widget */}
          <Card className="bg-zinc-900 border border-zinc-850 rounded-2xl">
            <CardHeader className="border-b border-zinc-850 pb-4 mb-6">
              <CardTitle className="text-lg font-black flex items-center gap-3 text-zinc-200">
                <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-purple-400" />
                </div>
                Team Workloads
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                {workloads.map((emp) => (
                  <div key={emp.employee_id} className="space-y-2">
                    <div className="flex justify-between items-center text-sm font-black text-zinc-200">
                      <span>{emp.employee_name}</span>
                      <span>{emp.capacity_percentage}% Load</span>
                    </div>
                    <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-850">
                      <div className="bg-purple-600 h-full rounded-full" style={{ width: `${emp.capacity_percentage}%` }} />
                    </div>
                    <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Active: {emp.active_tasks} tasks</span>
                  </div>
                ))}
                {workloads.length === 0 && (
                  <div className="text-zinc-500 text-sm font-bold text-center py-4">No employee data found.</div>
                )}
              </div>
            </CardContent>
            <CardFooter className="pt-6 border-t border-zinc-850">
              <Link href="/team" className="text-sm font-black text-zinc-300 hover:text-purple-400 w-full text-center transition-colors uppercase tracking-wider">
                Manage Allocations
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
