"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  MessageSquare, 
  Plus, 
  ChevronRight, 
  Activity,
  Play,
  AlertTriangle
} from "lucide-react";
import { Button, Card, Badge } from "@useaxiom/ui";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectDetailPage({ params }: PageProps) {
  const { id } = use(params);

  const [project, setProject] = useState<Record<string, unknown> | null>(null);
  const [tasks, setTasks] = useState<Array<{
    id: string;
    title: string;
    status: string;
    description?: string;
    estimatedHours?: number;
  }>>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('axiom_token');
        if (!token) {
          router.push('/login');
          return;
        }
        
        const headers = { 'Authorization': `Bearer ${token}` };
  
        const [pRes, tRes] = await Promise.all([
          fetch(`/api/v1/projects/${id}`, { headers }),
          fetch(`/api/v1/projects/${id}/tasks`, { headers })
        ]);
  
        if (pRes.status === 401 || tRes.status === 401) {
          localStorage.removeItem('axiom_token');
          router.push('/login');
          return;
        }
  
        setProject(await pRes.json());
        setTasks(await tRes.json());
      } catch (e: unknown) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, router]);

  const handleResolveBlocker = () => {
    // Implement API call if needed
    // Reload manually or update state
  };

  const handleApprovePlan = async () => {
    try {
      const token = localStorage.getItem('axiom_token');
      await fetch(`/api/v1/projects/${id}/approve`, { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // Optionally trigger reload here
    } catch (e: unknown) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="text-gray-400 p-8">Loading project details...</div>;
  }

  if (!project) {
    return <div className="text-red-500 p-8">Project not found</div>;
  }

  const getTaskStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <Badge variant="completed">Done</Badge>;
      case "progress":
        return <Badge variant="progress">In Progress</Badge>;
      case "blocked":
        return <Badge variant="blocked">Blocked</Badge>;
      case "pending":
        return <Badge variant="pending">Awaiting Start</Badge>;
      case "proposed":
      default:
        return <Badge variant="proposed">Proposed</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Breadcrumb back navigation */}
      <Link href="/projects" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-200 transition-colors font-bold">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Projects</span>
      </Link>

      {/* Campaign Details Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-zinc-850">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest bg-purple-500/5 px-2.5 py-0.5 rounded border border-purple-500/10">
              {(project.status as string) || 'PROJECT'}
            </span>
            <Badge variant={project.status === "ACTIVE" ? "progress" : project.status === "COMPLETED" ? "completed" : "proposed"}>
              {project.status === "ACTIVE" ? "In Progress" : project.status === "COMPLETED" ? "Done" : "Awaiting Review"}
            </Badge>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-100">{project.name as string}</h1>
          <p className="text-zinc-400 text-base max-w-2xl font-medium">{project.objective as string}</p>
        </div>

        {/* Progress Bar Widget */}
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          {project.healthScore !== undefined && project.healthScore !== null && (
            <div className={`w-full lg:w-72 bg-zinc-900 p-5 border border-zinc-850 border-l-4 ${project.healthStatus === 'HIGH' ? 'border-l-rose-500' : project.healthStatus === 'MEDIUM' ? 'border-l-amber-500' : 'border-l-emerald-500'} space-y-3 rounded-r-xl`}>
              <div className="flex justify-between items-center text-sm font-bold">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 ${project.healthStatus === 'HIGH' ? 'text-rose-400' : project.healthStatus === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'}`} />
                  <span className="text-zinc-200 uppercase tracking-wider">AI Risk</span>
                </div>
                <span className={project.healthStatus === 'HIGH' ? 'text-rose-400' : project.healthStatus === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'}>{project.healthScore as number}/100</span>
              </div>
              <p className="text-xs font-medium text-zinc-450 line-clamp-2">{project.healthReasoning as string}</p>
            </div>
          )}
          <div className="w-full lg:w-72 bg-zinc-900 p-5 border border-zinc-850 rounded-xl space-y-3">
            {(() => {
              const tasksTotal = tasks.length;
              const tasksDone = tasks.filter(t => t.status === "COMPLETED" || t.status === "completed").length;
              const progressPercent = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;
              return (
                <>
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-zinc-200 uppercase tracking-wider">Campaign Progress</span>
                    <span className="text-purple-400">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-855">
                    <div className="bg-purple-600 h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex justify-between items-center gap-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-850">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-500" />
          <span className="text-sm font-bold text-zinc-200 tracking-wide">Campaign Execution Log</span>
        </div>
        <div className="flex gap-2">
          {tasks.some(t => t.status === "PROPOSED") && (
            <Button variant="primary" size="sm" onClick={handleApprovePlan} className="rounded-xl">
              <Play className="w-4 h-4" />
              <span>Approve Proposed Plan</span>
            </Button>
          )}
          <Button variant="outline" size="sm" className="rounded-xl border-zinc-800 text-zinc-300 hover:bg-zinc-800">
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </Button>
        </div>
      </div>

      {/* Tasks Flow */}
      <div className="space-y-6">
        {tasks.length > 0 ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ChevronRight className="w-5 h-5 text-zinc-500" />
                <h3 className="font-bold text-zinc-200 text-lg tracking-tight">All Tasks</h3>
              </div>
            </div>

            {/* Task list inside card */}
            <Card className="bg-zinc-900 border border-zinc-850 divide-y divide-zinc-800 p-0 rounded-2xl overflow-hidden">
              {tasks.map((task) => (
                <div key={task.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-zinc-950/40 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-zinc-100">{task.title}</span>
                      {getTaskStatusBadge(task.status)}
                    </div>
                    {task.description && (
                      <span className="text-sm text-zinc-400 font-medium block max-w-xl">
                        {task.description}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    {/* Task Metadata */}
                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                      <span className="font-bold bg-zinc-950 border border-zinc-850 px-3 py-1.5 rounded-lg text-zinc-300">
                        {task.estimatedHours || 1} hrs
                      </span>
                    </div>

                    {/* Interactive Resolves */}
                    {task.status === "BLOCKED" && (
                      <Button variant="danger" size="sm" onClick={() => handleResolveBlocker()} className="h-9 rounded-xl">
                        Resolve Blocker
                      </Button>
                    )}
                    <button className="p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer border border-zinc-850">
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        ) : (
          <div className="text-zinc-500 font-medium py-4">No tasks found for this project yet.</div>
        )}
      </div>
    </div>
  );
}
