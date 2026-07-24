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

  const loadDashboardData = () => {
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
  };

  useEffect(() => {
    loadDashboardData();

    const handleProjectCreated = () => {
      loadDashboardData();
    };

    window.addEventListener('axiom_project_created', handleProjectCreated);
    window.addEventListener('focus', handleProjectCreated);

    return () => {
      window.removeEventListener('axiom_project_created', handleProjectCreated);
      window.removeEventListener('focus', handleProjectCreated);
    };
  }, [router]);

  const hasApprovedPlan = !projects.some((p) => p.status === 'PROPOSED');
  const hasResolvedBlocker = statsData?.blocked_tasks === 0;

  const activeProjectsCount =
    projects.length > 0 ? projects.length : statsData?.active_projects || 0;
  const aiInterventionsCount =
    statsData?.ai_interventions_count && statsData.ai_interventions_count > 0
      ? statsData.ai_interventions_count
      : projects.length > 0
        ? projects.length
        : 0;

  const stats = [
    {
      name: 'Active Projects',
      value: activeProjectsCount.toString(),
      icon: FolderKanban,
      bg: 'bg-blue-50 text-blue-600 border border-blue-100',
      text: 'text-slate-900',
    },
    {
      name: 'AI Interventions',
      value: aiInterventionsCount.toString(),
      icon: FileText,
      bg: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
      text: 'text-slate-900',
    },
    {
      name: 'Tasks Blocked',
      value: (statsData?.blocked_tasks ?? 0).toString(),
      icon: AlertTriangle,
      bg: 'bg-rose-50 text-rose-600 border border-rose-100',
      text: 'text-slate-900',
    },
    {
      name: 'Team Velocity',
      value: `${statsData?.team_velocity || 100}%`,
      icon: Cpu,
      bg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      text: 'text-slate-900',
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
      setProjects(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTriggerPlan = async (id: string) => {
    try {
      const token = localStorage.getItem('axiom_token');
      await fetch(`/api/v1/projects/${id}/plan`, {
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
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white p-8 sm:p-10 rounded-2xl shadow-xs border border-slate-700/50">
        <div className="absolute top-[-50%] right-[-10%] w-96 h-96 bg-blue-500/10 rounded-full pointer-events-none blur-3xl" />

        <div className="relative max-w-2xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/90 text-white text-[11px] font-medium tracking-wide rounded-full mb-4 border border-blue-400/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sprint 1 Foundations Operational</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
            Welcome back, {user ? user.name.split(' ')[0] : 'Manager'}
          </h1>
          <p className="text-slate-300 text-sm font-normal leading-relaxed max-w-xl">
            Your execution assistants are actively listening on employee WhatsApp channels. You have{' '}
            {hasApprovedPlan
              ? 'no plans awaiting review'
              : '1 AI-generated project plan awaiting review'}
            .
          </p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <Card key={stat.name} className="hover:-translate-y-0.5 transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2 mb-0">
              <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
                {stat.name}
              </span>
              <div className={`w-8 h-8 ${stat.bg} flex items-center justify-center rounded-lg`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold text-slate-900">{stat.value}</span>
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
            <div className="bg-blue-50/60 p-8 sm:p-10 border border-blue-200/80 rounded-2xl relative overflow-hidden group shadow-xs transition-all duration-200">
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-slate-900">
                        Awaiting Manager Approval
                      </h2>
                      <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-0.5 tracking-wide rounded-full border border-blue-200">
                        Proposed Plan
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium text-xs max-w-lg leading-relaxed">
                      AI generated a structured plan for{' '}
                      <span className="text-slate-900 font-bold">
                        &quot;{proposedProject?.name}&quot;
                      </span>{' '}
                      based on objective:{' '}
                      <span className="text-slate-900 font-bold">
                        &quot;{proposedProject?.objective}&quot;
                      </span>
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-white border border-blue-200 rounded-lg flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-xs space-y-2 mb-6">
                  <span className="text-xs font-semibold text-blue-600 tracking-wide uppercase block border-b border-slate-100 pb-2">
                    AI Plan Ready
                  </span>
                  <p className="text-xs font-normal text-slate-600 leading-relaxed">
                    The AI has generated tasks, milestones, and resource allocations for this
                    project. Please review and customize the plan before approving.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <Link
                    href={`/projects/${proposedProject?.id}`}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-2 group/link"
                  >
                    <span>Review & Customize Plan</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50 flex-1 sm:flex-none h-9"
                    >
                      Reject
                    </Button>
                    <Button
                      variant="primary"
                      className="flex-1 sm:flex-none h-9"
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
            <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-xs">
              <div className="w-10 h-10 bg-white border border-emerald-200 rounded-lg flex items-center justify-center mb-3 shadow-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-slate-900 font-bold text-xl mb-1">
                All plans have been reviewed
              </h3>
              <p className="text-slate-500 text-xs font-normal max-w-md leading-relaxed">
                The Q3 Product Marketing project plan has been moved to active execution. Tasks are
                queued for employee notification.
              </p>
            </div>
          )}

          {/* Active Projects List */}
          <div className="space-y-6">
            <div className="flex justify-between items-end border-b border-slate-200 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Active Projects</h2>
              <Link
                href="/projects"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                VIEW ALL
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {projects.slice(0, 4).map((project) => {
                const tasksTotal = project.tasks?.length || 0;
                const tasksDone =
                  project.tasks?.filter((t) => t.status === 'COMPLETED' || t.status === 'DONE')
                    .length || 0;
                const progress =
                  tasksTotal > 0
                    ? Math.round((tasksDone / tasksTotal) * 100)
                    : project.status === 'ACTIVE'
                      ? 5
                      : 0;

                return (
                  <Link href={`/projects/${project.id}`} key={project.id} className="block group">
                    <Card className="h-full border border-slate-200 group-hover:border-slate-300 group-hover:shadow-md transition-all duration-200 flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                          <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                            {project.name}
                          </h3>
                          <p className="text-xs text-slate-500 font-normal line-clamp-2 leading-relaxed">
                            {project.objective}
                          </p>
                        </div>
                        <Badge variant={project.status === 'ACTIVE' ? 'progress' : 'proposed'}>
                          {project.status === 'ACTIVE' ? 'Active' : project.status}
                        </Badge>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1.5 mt-auto pt-4 border-t border-slate-100">
                        <div className="flex justify-between text-xs font-semibold text-slate-500">
                          <span>Progress</span>
                          <span className="text-slate-900">{progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
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
            className={`border rounded-2xl p-6 sm:p-8 transition-all duration-200 shadow-xs ${
              !hasResolvedBlocker
                ? 'bg-rose-50/50 border-rose-200 text-rose-900'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3 mb-6">
              <div
                className={`w-9 h-9 flex items-center justify-center rounded-lg border ${
                  !hasResolvedBlocker
                    ? 'bg-white border-rose-200 text-rose-600'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Active Alerts</h3>
                <span className="text-xs font-medium text-slate-500">SMS/WhatsApp Streams</span>
              </div>
            </div>

            {!hasResolvedBlocker && statsData && statsData.blocked_tasks > 0 ? (
              <div className="bg-white border border-rose-200 rounded-xl p-5 text-slate-900 flex flex-col items-center justify-center text-center shadow-xs">
                <div className="w-10 h-10 bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center rounded-lg mb-3">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <span className="text-slate-900 text-xs font-bold uppercase tracking-wider">
                  {statsData.blocked_tasks} Active Blockers!
                </span>
                <p className="text-xs text-slate-500 font-medium mt-1 mb-4">
                  Tasks blocked by employees.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs border-rose-300 text-rose-700 hover:bg-rose-50 h-9 rounded-md"
                  onClick={() => router.push('/projects')}
                >
                  View Projects
                </Button>
              </div>
            ) : (
              <div className="text-center py-6 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-xl">
                <div className="w-10 h-10 bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center rounded-lg mb-3 shadow-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="text-slate-900 text-xs font-bold uppercase tracking-wider">
                  NO ACTIVE BLOCKERS!
                </span>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  FEEDBACK STREAMS ARE GREEN.
                </p>
              </div>
            )}
          </div>

          {/* Team Workload Widget */}
          <Card className="bg-white border border-slate-200 shadow-xs rounded-2xl">
            <CardHeader className="border-b border-slate-100 pb-4 mb-6">
              <CardTitle className="text-base font-bold flex items-center gap-3 text-slate-900">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                Team Workloads
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {workloads.map((emp) => (
                  <div key={emp.employee_id} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-800">
                      <span>{emp.employee_name}</span>
                      <span>{emp.capacity_percentage}% Load</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${emp.capacity_percentage}%` }}
                      />
                    </div>
                    <span className="block text-[11px] text-slate-500 font-normal">
                      Active: {emp.active_tasks} tasks
                    </span>
                  </div>
                ))}
                {workloads.length === 0 && (
                  <div className="text-slate-500 text-xs font-normal text-center py-4">
                    No employee data found.
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="pt-6 border-t border-slate-100">
              <Link
                href="/team"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 w-full text-center transition-colors"
              >
                MANAGE ALLOCATIONS
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
