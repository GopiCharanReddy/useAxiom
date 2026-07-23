'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  ArrowRight,
  Sparkles,
  Play,
  FileText,
  Users,
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, CardFooter, Badge } from '@useaxiom/ui';

export default function Home() {
  const [projects, setProjects] = useState<
    Array<{
      id: string;
      name: string;
      objective: string;
      status: string;
      healthScore?: number;
      healthStatus?: string;
      healthReasoning?: string;
      tasks?: Array<{ id: string; status: string }>;
    }>
  >([]);
  const [statsData, setStatsData] = useState<{
    active_projects: number;
    blocked_tasks: number;
    ai_interventions_count: number;
    team_velocity: number;
  } | null>(null);
  const [workloads, setWorkloads] = useState<
    Array<{
      employee_id: string;
      employee_name: string;
      active_tasks: number;
      capacity_percentage: number;
    }>
  >([]);
  const [user, setUser] = useState<{ name: string } | null>(null);

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('axiom_token');
    if (!token) {
      router.push('/login');
      return;
    }

    Promise.all([
      fetch('/api/v1/projects', { headers: { Authorization: `Bearer ${token}` } }).then((r) => {
        if (r.status === 401) throw new Error('Unauthorized');
        return r.json();
      }),
      fetch('/api/v1/analytics/dashboard', { headers: { Authorization: `Bearer ${token}` } }).then(
        (r) => r.json(),
      ),
      fetch('/api/v1/analytics/team-workload', {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ])
      .then(([projectsData, dashboardData, workloadData, userData]) => {
        if (Array.isArray(projectsData)) setProjects(projectsData);
        setStatsData(dashboardData);
        if (workloadData?.workloads) setWorkloads(workloadData.workloads);
        if (userData) setUser(userData);
      })
      .catch((err) => {
        if (err.message === 'Unauthorized') {
          localStorage.removeItem('axiom_token');
          router.push('/login');
        }
        console.error('Failed to fetch dashboard data:', err);
      });
  }, [router]);

  const hasApprovedPlan = !projects.some((p) => p.status === 'PROPOSED');
  const hasResolvedBlocker = statsData?.blocked_tasks === 0;

  const stats = [
    {
      name: 'Active Campaigns',
      value: statsData?.active_projects.toString() || '0',
      icon: FolderKanban,
      bg: 'bg-[#8c7853]/10 text-[#8c7853]',
      text: 'text-[#8c7853]',
    },
    {
      name: 'AI Interventions',
      value: statsData?.ai_interventions_count.toString() || '0',
      icon: FileText,
      bg: 'bg-[#bda272]/10 text-[#bda272]',
      text: 'text-[#bda272]',
    },
    {
      name: 'Tasks Blocked',
      value: statsData?.blocked_tasks.toString() || '0',
      icon: AlertTriangle,
      bg: 'bg-[#9f3a38]/10 text-[#9f3a38]',
      text: 'text-[#9f3a38]',
    },
    {
      name: 'Team Velocity',
      value: `${statsData?.team_velocity || 100}%`,
      icon: Cpu,
      bg: 'bg-[#3e593e]/10 text-[#3e593e]',
      text: 'text-[#3e593e]',
    },
  ];

  const handleApprove = async (id: string) => {
    try {
      const token = localStorage.getItem('axiom_token');
      await fetch(`/api/v1/projects/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      // Re-fetch
      const res = await fetch('/api/v1/projects', {
        headers: { Authorization: `Bearer ${token}` },
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
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Plan generation triggered!');
    } catch (e) {
      console.error(e);
    }
  };

  const proposedProject = projects.find((p) => p.status === 'PROPOSED');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#1c1b18] to-[#3a3731] text-white p-8 sm:p-10 rounded-2xl shadow-[0_10px_30px_-10px_rgba(28,27,24,0.15)] border border-[#e6e3da]/10">
        <div className="absolute top-[-50%] right-[-10%] w-96 h-96 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[10%] w-64 h-64 bg-[#8c7853]/10 rotate-45 pointer-events-none" />

        <div className="relative max-w-2xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#8c7853] text-white text-[9px] font-black uppercase tracking-widest rounded-full mb-6 border border-[#8c7853]/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sprint 1 Foundations Operational</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-black tracking-tight text-white mb-4">
            Welcome back, {user ? user.name.split(' ')[0] : 'Manager'}
          </h1>
          <p className="text-[#a8a49c] text-sm font-bold tracking-wide leading-relaxed max-w-xl">
            Your execution assistants are actively listening on employee WhatsApp channels. You have{' '}
            {hasApprovedPlan
              ? 'no plans awaiting review'
              : '1 AI-generated project plan awaiting review'}
            .
          </p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name} className="hover:-translate-y-1 transition-transform duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2 mb-0">
              <span className="text-[10px] font-black text-[#66635d] uppercase tracking-widest">
                {stat.name}
              </span>
              <div className={`w-8 h-8 ${stat.bg} flex items-center justify-center rounded-lg`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <span className={`text-3xl font-serif font-black ${stat.text}`}>{stat.value}</span>
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
            <div className="bg-[#FAF6EE] p-8 sm:p-10 border border-[#eedebf] rounded-2xl relative overflow-hidden group shadow-sm transition-all duration-300">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#bda272]/5 rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-serif font-black text-[#736243]">
                        Awaiting Manager Approval
                      </h2>
                      <span className="bg-[#8c7853]/15 text-[#8c7853] text-[9px] font-black uppercase px-2.5 py-1 tracking-widest rounded-full border border-[#8c7853]/10">
                        Proposed Plan
                      </span>
                    </div>
                    <p className="text-[#736243] font-bold text-xs max-w-lg leading-relaxed uppercase tracking-wider">
                      AI generated a structured plan for{' '}
                      <span className="text-[#1c1b18] font-black">
                        &quot;{proposedProject?.name}&quot;
                      </span>{' '}
                      based on objective:{' '}
                      <span className="text-[#1c1b18] font-black">
                        &quot;{proposedProject?.objective}&quot;
                      </span>
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-white border border-[#eedebf] rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                    <Sparkles className="w-5 h-5 text-[#8c7853]" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-[#eedebf]/60 shadow-sm space-y-3 mb-6">
                  <span className="text-[10px] font-black text-[#8c7853] uppercase tracking-widest block border-b border-[#faf8f5] pb-2">
                    AI Plan Ready
                  </span>
                  <p className="text-xs font-semibold text-[#66635d] leading-relaxed">
                    The AI has generated tasks, milestones, and resource allocations for this
                    project. Please review and customize the plan before approving.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <Link
                    href={`/projects/${proposedProject?.id}`}
                    className="text-xs font-black text-[#8c7853] hover:text-[#736243] transition-colors flex items-center gap-2 group/link uppercase tracking-widest"
                  >
                    <span>Review & Customize Plan</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      className="bg-white border-[#8c7853] text-[#8c7853] hover:bg-[#8c7853]/10 flex-1 sm:flex-none h-10"
                    >
                      Reject
                    </Button>
                    <Button
                      variant="primary"
                      className="flex-1 sm:flex-none h-10"
                      onClick={() => {
                        if (proposedProject) {
                          handleApprove(proposedProject.id);
                        }
                      }}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Approve & Start</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#f0f5f0] border border-[#d5ebd5] rounded-2xl p-10 flex flex-col items-center justify-center text-center shadow-sm">
              <div className="w-12 h-12 bg-white border border-[#d5ebd5] rounded-lg flex items-center justify-center mb-4 shadow-sm">
                <CheckCircle2 className="w-6 h-6 text-[#3e593e]" />
              </div>
              <h3 className="text-[#3e593e] font-serif font-black text-2xl mb-2">
                All plans have been reviewed
              </h3>
              <p className="text-[#66635d] text-xs font-semibold max-w-md leading-relaxed">
                The Q3 Product Marketing campaign plan has been moved to active execution. Tasks are
                queued for employee notification.
              </p>
            </div>
          )}

          {/* Active Projects List */}
          <div className="space-y-6">
            <div className="flex justify-between items-end border-b border-[#e6e3da] pb-3">
              <h2 className="text-xl font-serif font-black text-[#1c1b18]">Active Campaigns</h2>
              <Link
                href="/projects"
                className="text-xs font-black uppercase tracking-widest text-[#8c7853] hover:text-[#736243]"
              >
                View all
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((project) => {
                const tasksTotal = project.tasks?.length || 0;
                const tasksDone =
                  project.tasks?.filter((t) => t.status === 'COMPLETED').length || 0;
                const progress =
                  tasksTotal > 0
                    ? Math.round((tasksDone / tasksTotal) * 100)
                    : project.status === 'ACTIVE'
                      ? 5
                      : 0;

                return (
                  <Link href={`/projects/${project.id}`} key={project.id} className="block group">
                    <Card className="h-full border border-[#e6e3da]/80 group-hover:border-[#8c7853] group-hover:shadow-md transition-all duration-300 flex flex-col">
                      <div className="flex justify-between items-start mb-6">
                        <div className="space-y-2">
                          <h3 className="font-serif font-black text-lg text-[#1c1b18] group-hover:text-[#8c7853] transition-colors leading-tight">
                            {project.name}
                          </h3>
                          <p className="text-xs text-[#66635d] font-semibold line-clamp-2 leading-relaxed">
                            {project.objective}
                          </p>
                        </div>
                        <Badge variant={project.status === 'ACTIVE' ? 'progress' : 'proposed'}>
                          {project.status === 'ACTIVE' ? 'Active' : project.status}
                        </Badge>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-2 mt-auto pt-6 border-t border-[#faf8f5]">
                        <div className="flex justify-between text-[10px] font-black text-[#66635d] uppercase tracking-widest">
                          <span>Progress</span>
                          <span className="text-[#1c1b18]">{progress}%</span>
                        </div>
                        <div className="w-full bg-[#f2efe9] h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#8c7853] h-full rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      {project.healthScore !== undefined && project.healthScore !== null && (
                        <div
                          className={`mt-4 p-3 rounded-lg border border-l-4 ${project.healthStatus === 'HIGH' ? 'border-red-200 border-l-[#9f3a38] bg-[#fdf2f2]' : project.healthStatus === 'MEDIUM' ? 'border-amber-200 border-l-[#bda272] bg-[#FCF5EB]' : 'border-emerald-200 border-l-[#3e593e] bg-[#f0f5f0]'} flex justify-between items-center`}
                        >
                          <div className="flex items-center gap-2">
                            <AlertTriangle
                              className={`w-3.5 h-3.5 ${project.healthStatus === 'HIGH' ? 'text-[#9f3a38]' : project.healthStatus === 'MEDIUM' ? 'text-[#bda272]' : 'text-[#3e593e]'}`}
                            />
                            <span className="text-[10px] font-black text-[#1c1b18] uppercase tracking-widest">
                              AI Risk
                            </span>
                          </div>
                          <span
                            className={`text-xs font-black ${project.healthStatus === 'HIGH' ? 'text-[#9f3a38]' : project.healthStatus === 'MEDIUM' ? 'text-[#bda272]' : 'text-[#3e593e]'}`}
                          >
                            {project.healthScore}/100
                          </span>
                        </div>
                      )}
                      <div className="mt-6 pt-4 border-t border-[#e6e3da]/80 flex items-center justify-between text-[10px] font-black tracking-widest">
                        <span
                          className={
                            project.status === 'ACTIVE' ? 'text-[#3e593e]' : 'text-[#bda272]'
                          }
                        >
                          {project.status === 'ACTIVE' ? 'ON TRACK' : 'NEEDS REVIEW'}
                        </span>
                        <span className="flex gap-2">
                          <button
                            className="text-[#66635d] hover:text-[#1c1b18] transition-colors uppercase tracking-widest text-[9px] cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              handleGenerate(project.id);
                            }}
                          >
                            Generate
                          </button>
                          <button
                            className="text-[#8c7853] hover:text-[#736243] transition-colors uppercase tracking-widest text-[9px] cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              handleApprove(project.id);
                            }}
                          >
                            Approve
                          </button>
                        </span>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Alerts & Team Workloads */}
        <div className="space-y-8">
          {/* Active Alerts Widget */}
          <div
            className={`border rounded-2xl p-6 sm:p-8 transition-all duration-300 shadow-sm ${
              !hasResolvedBlocker
                ? 'bg-[#fdf2f2] border-[#fcdada] text-[#9f3a38]'
                : 'bg-white border-[#e6e3da]/80 text-[#1c1b18]'
            }`}
          >
            <div className="flex items-center gap-3 mb-6">
              <div
                className={`w-9 h-9 flex items-center justify-center rounded-lg border ${
                  !hasResolvedBlocker
                    ? 'bg-white border-[#fcdada] text-[#9f3a38]'
                    : 'bg-[#faf8f5] border-[#e6e3da] text-[#66635d]'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-black text-lg text-[#1c1b18]">Active Alerts</h3>
                <span className="text-[9px] font-black uppercase tracking-widest text-[#66635d]">
                  SMS/WhatsApp Streams
                </span>
              </div>
            </div>

            {!hasResolvedBlocker && statsData && statsData.blocked_tasks > 0 ? (
              <div className="bg-white border border-[#fcdada] rounded-xl p-5 text-gray-900 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="w-12 h-12 bg-[#fdf2f2] border border-[#fcdada] text-[#9f3a38] flex items-center justify-center rounded-lg mb-3">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <span className="text-[#1c1b18] text-xs font-black uppercase tracking-wider">
                  {statsData.blocked_tasks} Active Blockers!
                </span>
                <p className="text-[10px] text-[#66635d] font-bold mt-1 mb-4 uppercase tracking-wide">
                  Tasks blocked by employees.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-[10px] tracking-widest uppercase border-[#9f3a38] text-[#9f3a38] hover:bg-[#fdf2f2] h-9 rounded-md"
                  onClick={() => router.push('/projects')}
                >
                  View Projects
                </Button>
              </div>
            ) : (
              <div className="text-center py-6 flex flex-col items-center justify-center bg-white border border-[#e6e3da]/60 rounded-xl">
                <div className="w-12 h-12 bg-[#f0f5f0] border border-[#d5ebd5] text-[#3e593e] flex items-center justify-center rounded-lg mb-3 shadow-sm">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <span className="text-[#1c1b18] text-xs font-black uppercase tracking-wider">
                  No active blockers!
                </span>
                <p className="text-[10px] text-[#66635d] font-bold mt-1 uppercase tracking-wide">
                  Feedback streams are green.
                </p>
              </div>
            )}
          </div>

          {/* Team Workload Widget */}
          <Card className="bg-white border border-[#e6e3da]/80 shadow-sm rounded-2xl">
            <CardHeader className="border-b border-[#faf8f5] pb-4 mb-6">
              <CardTitle className="text-lg font-serif font-black flex items-center gap-3 text-[#1c1b18]">
                <div className="w-8 h-8 rounded-lg bg-[#8c7853]/10 border border-[#8c7853]/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-[#8c7853]" />
                </div>
                Team Workloads
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-5">
                {workloads.map((emp) => (
                  <div key={emp.employee_id} className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-black text-[#1c1b18] uppercase tracking-wider">
                      <span>{emp.employee_name}</span>
                      <span>{emp.capacity_percentage}% Load</span>
                    </div>
                    <div className="w-full bg-[#f2efe9] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#8c7853] h-full rounded-full"
                        style={{ width: `${emp.capacity_percentage}%` }}
                      />
                    </div>
                    <span className="block text-[9px] text-[#66635d] font-bold uppercase tracking-widest">
                      Active: {emp.active_tasks} tasks
                    </span>
                  </div>
                ))}
                {workloads.length === 0 && (
                  <div className="text-[#66635d] text-xs font-bold text-center py-4 uppercase tracking-widest">
                    No employee data found.
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="pt-6 border-t border-[#e6e3da]/80">
              <Link
                href="/team"
                className="text-xs font-black text-[#8c7853] hover:text-[#736243] w-full text-center transition-colors uppercase tracking-widest"
              >
                Manage Allocations
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
