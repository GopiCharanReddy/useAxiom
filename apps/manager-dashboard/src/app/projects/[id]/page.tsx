'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MessageSquare,
  Plus,
  ChevronRight,
  Activity,
  Play,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Button, Card, Badge } from '@useaxiom/ui';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectDetailPage({ params }: PageProps) {
  const { id } = use(params);

  const [project, setProject] = useState<Record<string, unknown> | null>(null);
  const [tasks, setTasks] = useState<
    Array<{
      id: string;
      title: string;
      status: string;
      description?: string;
      estimatedHours?: number;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [assignedMembers, setAssignedMembers] = useState<
    Array<{
      id: string;
      user: {
        id: string;
        name: string;
        email: string;
        employeeId: string;
        role: string;
      };
    }>
  >([]);
  const [allUsers, setAllUsers] = useState<
    Array<{
      id: string;
      name: string;
      employeeId: string;
      role: string;
    }>
  >([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskHours, setTaskHours] = useState('');

  const router = useRouter();

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('axiom_token');
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };
      const mRes = await fetch(`/api/v1/projects/${id}/members`, { headers });
      if (mRes.ok) {
        setAssignedMembers(await mRes.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('axiom_token');
        if (!token) {
          router.push('/login');
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        const [pRes, tRes, uRes, mRes] = await Promise.all([
          fetch(`/api/v1/projects/${id}`, { headers }),
          fetch(`/api/v1/projects/${id}/tasks`, { headers }),
          fetch(`/api/v1/users`, { headers }),
          fetch(`/api/v1/projects/${id}/members`, { headers }),
        ]);

        if (pRes.status === 401 || tRes.status === 401 || uRes.status === 401) {
          localStorage.removeItem('axiom_token');
          router.push('/login');
          return;
        }

        setProject(await pRes.json());
        setTasks(await tRes.json());
        if (uRes.ok) {
          setAllUsers(await uRes.json());
        }
        if (mRes.ok) {
          setAssignedMembers(await mRes.json());
        }
      } catch (e: unknown) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, router]);

  const handleAssignMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    try {
      const token = localStorage.getItem('axiom_token');
      const res = await fetch(`/api/v1/projects/${id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: selectedUserId }),
      });
      if (res.ok) {
        setSelectedUserId('');
        fetchMembers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('axiom_token');
      const res = await fetch(`/api/v1/projects/${id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription,
          estimatedHours: taskHours ? Number(taskHours) : undefined,
        }),
      });
      if (res.ok) {
        setShowTaskModal(false);
        setTaskTitle('');
        setTaskDescription('');
        setTaskHours('');
        // Reload tasks list
        const headers = { Authorization: `Bearer ${token}` };
        const tRes = await fetch(`/api/v1/projects/${id}/tasks`, { headers });
        if (tRes.ok) {
          setTasks(await tRes.json());
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveBlocker = () => {
    // API Call triggers here if needed
  };

  const handleApprovePlan = async () => {
    try {
      const token = localStorage.getItem('axiom_token');
      await fetch(`/api/v1/projects/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e: unknown) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="text-[#66635d] text-xs font-black uppercase tracking-widest p-8">
        Loading project details...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-[#9f3a38] text-xs font-black uppercase tracking-widest p-8">
        Project not found
      </div>
    );
  }

  const getTaskStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge variant="completed">Done</Badge>;
      case 'progress':
        return <Badge variant="progress">In Progress</Badge>;
      case 'blocked':
        return <Badge variant="blocked">Blocked</Badge>;
      case 'pending':
        return <Badge variant="pending">Awaiting Start</Badge>;
      case 'proposed':
      default:
        return <Badge variant="proposed">Proposed</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Breadcrumb back navigation */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[#66635d] hover:text-[#1c1b18] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Projects</span>
      </Link>

      {/* Campaign Details Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-[#e6e3da]">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-[#8c7853] uppercase tracking-widest bg-[#FAF4E8] px-2.5 py-0.5 rounded border border-[#eedebf]">
              {(project.status as string) || 'PROJECT'}
            </span>
            <Badge
              variant={
                project.status === 'ACTIVE'
                  ? 'progress'
                  : project.status === 'COMPLETED'
                    ? 'completed'
                    : 'proposed'
              }
            >
              {project.status === 'ACTIVE'
                ? 'In Progress'
                : project.status === 'COMPLETED'
                  ? 'Done'
                  : 'Awaiting Review'}
            </Badge>
          </div>
          <h1 className="text-3xl font-serif font-black tracking-tight text-[#1c1b18]">
            {project.name as string}
          </h1>
          <p className="text-[#66635d] text-sm leading-relaxed max-w-2xl font-semibold">
            {project.objective as string}
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {typeof project.domain === 'string' && (
              <Badge variant="progress">Domain: {project.domain}</Badge>
            )}
            {Array.isArray(project.techStack) &&
              (project.techStack as string[]).map((tech: string) => (
                <Badge key={tech} variant="proposed">
                  {tech}
                </Badge>
              ))}
          </div>
        </div>

        {/* Progress Bar Widget */}
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          {project.healthScore !== undefined && project.healthScore !== null && (
            <div
              className={`w-full lg:w-72 bg-white p-5 rounded-xl border border-l-4 shadow-sm ${project.healthStatus === 'HIGH' ? 'border-[#e6e3da]/80 border-l-[#9f3a38] bg-[#fdf2f2]' : project.healthStatus === 'MEDIUM' ? 'border-[#e6e3da]/80 border-l-[#bda272] bg-[#FCF5EB]' : 'border-[#e6e3da]/80 border-l-[#3e593e] bg-[#f0f5f0]'} space-y-2`}
            >
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[#1c1b18]">
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className={`w-3.5 h-3.5 ${project.healthStatus === 'HIGH' ? 'text-[#9f3a38]' : project.healthStatus === 'MEDIUM' ? 'text-[#bda272]' : 'text-[#3e593e]'}`}
                  />
                  <span>AI Risk</span>
                </div>
                <span>{project.healthScore as number}/100</span>
              </div>
              <p className="text-[10px] font-semibold text-[#66635d] line-clamp-2 leading-relaxed">
                {project.healthReasoning as string}
              </p>
            </div>
          )}
          <div className="w-full lg:w-72 bg-white p-5 rounded-xl border border-[#e6e3da]/80 shadow-sm space-y-3">
            {(() => {
              const tasksTotal = tasks.length;
              const tasksDone = tasks.filter(
                (t) => t.status === 'COMPLETED' || t.status === 'completed',
              ).length;
              const progressPercent =
                tasksTotal > 0
                  ? Math.round((tasksDone / tasksTotal) * 100)
                  : project.status === 'ACTIVE'
                    ? 10
                    : 0;
              return (
                <>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[#1c1b18]">
                    <span>Campaign Progress</span>
                    <span className="text-[#8c7853]">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-[#f2efe9] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#8c7853] h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex justify-between items-center gap-4 bg-white p-4 rounded-xl border border-[#e6e3da]/85 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Activity className="w-4.5 h-4.5 text-[#8c7853]" />
          <span className="text-xs font-black uppercase tracking-widest text-[#1c1b18]">
            Campaign Execution Log
          </span>
        </div>
        <div className="flex gap-3">
          {tasks.some((t) => t.status === 'PROPOSED') && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleApprovePlan}
              className="h-10 text-[9px] font-black tracking-widest uppercase border border-[#7d6b4a]"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Approve Proposed Plan</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTaskModal(true)}
            className="h-10 text-[9px] font-black tracking-widest uppercase border-[#e6e3da] text-[#66635d] hover:bg-[#faf8f5] shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </Button>
        </div>
      </div>

      {/* Tasks Flow */}
      <div className="space-y-6">
        {tasks.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2">
              <ChevronRight className="w-4 h-4 text-[#8c7853]" />
              <h3 className="font-serif font-black text-lg text-[#1c1b18]">All Tasks</h3>
            </div>

            {/* Task list inside card */}
            <Card className="p-0 overflow-hidden shadow-sm border border-[#e6e3da]/80 rounded-xl divide-y divide-[#e6e3da]/60 bg-white">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-[#faf8f5] transition-all duration-300"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-[#1c1b18]">{task.title}</span>
                      {getTaskStatusBadge(task.status)}
                    </div>
                    {task.description && (
                      <span className="text-xs text-[#66635d] font-semibold block max-w-xl leading-relaxed">
                        {task.description}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    {/* Task Metadata */}
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black bg-[#f2efe9] text-[#1c1b18] border border-[#e6e3da]/80 px-2.5 py-1 rounded-lg">
                        {task.estimatedHours || 1} hrs
                      </span>
                    </div>

                    {/* Interactive Resolves */}
                    {task.status === 'BLOCKED' && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleResolveBlocker()}
                        className="h-9 px-3 text-[9px] font-black tracking-widest uppercase rounded-lg shadow-sm"
                      >
                        Resolve Blocker
                      </Button>
                    )}
                    <button className="h-9 w-9 rounded-lg bg-white border border-[#e6e3da]/80 hover:border-[#8c7853] hover:bg-[#faf8f5] text-[#66635d] hover:text-[#1c1b18] transition-all flex items-center justify-center cursor-pointer shadow-sm">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        ) : (
          <div className="text-[#66635d] text-xs font-black uppercase tracking-widest py-4">
            No tasks found for this project yet.
          </div>
        )}
      </div>

      {/* Team Assignment Section */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center gap-2">
          <h3 className="font-serif font-black text-lg text-[#1c1b18]">Project Team Members</h3>
        </div>
        <Card className="p-6 space-y-4 rounded-xl border border-[#e6e3da]/80 shadow-sm bg-white">
          <form
            onSubmit={handleAssignMember}
            className="flex flex-col sm:flex-row gap-4 items-end bg-[#faf8f5] p-5 rounded-xl border border-[#e6e3da] shadow-inner w-full"
          >
            <div className="flex-1 space-y-1 w-full">
              <label className="text-[9px] font-black text-[#66635d] uppercase tracking-widest block mb-1">
                Assign Team Member
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full bg-white border border-[#e6e3da] rounded-xl p-2.5 text-xs text-[#1c1b18] focus:outline-none focus:border-[#8c7853] focus:ring-4 focus:ring-[#8c7853]/10 shadow-sm cursor-pointer"
              >
                <option value="">Select an employee...</option>
                {allUsers
                  .filter((u) => !assignedMembers.some((am) => am.user.id === u.id))
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.employeeId || 'No ID'})
                    </option>
                  ))}
              </select>
            </div>
            <Button
              variant="primary"
              type="submit"
              disabled={!selectedUserId}
              className="h-10 text-[9px] font-black tracking-widest uppercase border border-[#7d6b4a] w-full sm:w-auto shadow-sm"
            >
              Assign to Project
            </Button>
          </form>

          {assignedMembers.length > 0 ? (
            <div className="divide-y divide-[#faf8f5]">
              {assignedMembers.map((member) => (
                <div key={member.id} className="py-3 flex justify-between items-center">
                  <div className="space-y-0.5">
                    <h4 className="font-black text-xs text-[#1c1b18]">{member.user.name}</h4>
                    <span className="text-[10px] text-[#66635d] font-semibold uppercase tracking-wider block">
                      Role: {member.user.role}
                    </span>
                  </div>
                  <Badge variant="completed">ID: {member.user.employeeId || 'None'}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#66635d] font-black uppercase tracking-widest">
              No team members assigned to this project yet.
            </p>
          )}
        </Card>
      </div>

      {/* New Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-[#1c1b18]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#e6e3da] max-w-md w-full p-8 space-y-6 rounded-3xl shadow-[0_20px_50px_rgba(28,27,24,0.1)] animate-in fade-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center pb-4 border-b border-[#e6e3da]">
              <h2 className="text-lg font-serif font-black text-[#1c1b18]">Create New Task</h2>
              <button
                onClick={() => setShowTaskModal(false)}
                className="p-1.5 bg-[#faf8f5] hover:bg-[#e6e3da] text-[#66635d] rounded-lg transition-colors cursor-pointer border border-[#e6e3da]/80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#66635d] uppercase tracking-widest block mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Implement user login API"
                  className="w-full bg-white border border-[#e6e3da] rounded-xl py-2.5 px-3.5 text-xs text-[#1c1b18] placeholder:text-[#a09c94] focus:outline-none focus:border-[#8c7853] focus:ring-4 focus:ring-[#8c7853]/10 transition-all duration-300 shadow-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#66635d] uppercase tracking-widest block mb-1">
                  Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Detail the technical implementation steps..."
                  className="w-full bg-white border border-[#e6e3da] rounded-xl py-2.5 px-3.5 text-xs text-[#1c1b18] placeholder:text-[#a09c94] focus:outline-none focus:border-[#8c7853] focus:ring-4 focus:ring-[#8c7853]/10 transition-all duration-300 shadow-sm resize-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#66635d] uppercase tracking-widest block mb-1">
                  Estimated Hours
                </label>
                <input
                  type="number"
                  value={taskHours}
                  onChange={(e) => setTaskHours(e.target.value)}
                  placeholder="e.g. 8"
                  className="w-full bg-white border border-[#e6e3da] rounded-xl py-2.5 px-3.5 text-xs text-[#1c1b18] placeholder:text-[#a09c94] focus:outline-none focus:border-[#8c7853] focus:ring-4 focus:ring-[#8c7853]/10 transition-all duration-300 shadow-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-[#e6e3da]">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="h-10 text-[9px] font-black tracking-widest uppercase border-[#e6e3da] text-[#66635d] hover:bg-[#faf8f5]"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  className="h-10 text-[9px] font-black tracking-widest uppercase border border-[#7d6b4a]"
                >
                  Create Task
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
