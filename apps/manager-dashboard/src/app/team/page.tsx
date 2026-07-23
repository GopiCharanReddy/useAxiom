'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserCheck, MessageSquare, Trash2 } from 'lucide-react';
import { Button, Card, Badge } from '@useaxiom/ui';

interface DBUser {
  id: string;
  name: string;
  role: string;
  employeeId?: string;
  specialty?: string;
  phoneNumber: string;
  projectMembers?: Array<{
    project: {
      id: string;
      name: string;
      objective: string;
      domain: string;
      techStack: string[];
      targetDeadline?: string;
      tasks?: Array<{
        id: string;
        title: string;
        status: string;
      }>;
    };
  }>;
}

interface DBProject {
  id: string;
  name: string;
  status: string;
  members?: unknown[];
}

interface DBWorkload {
  employee_id: string;
  employee_name: string;
  role: string;
  avatar: string;
  load: number;
  active_tasks: number;
  queued_tasks: number;
  blocked_tasks: number;
  status: 'active' | 'offline';
  current_task_name: string;
}

export default function TeamPage() {
  const [employees, setEmployees] = useState<DBUser[]>([]);
  const [projects, setProjects] = useState<DBProject[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningMap, setAssigningMap] = useState<Record<string, string>>({});
  const router = useRouter();

  const fetchWorkloads = async () => {
    try {
      const token = localStorage.getItem('axiom_token');
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };
      const [uRes, pRes] = await Promise.all([
        fetch('/api/v1/users', { headers }),
        fetch('/api/v1/projects', { headers }),
      ]);
      if (uRes.ok) {
        const usersData = await uRes.json();
        setEmployees(usersData.filter((u: DBUser) => u.role === 'EMPLOYEE'));
      }
      if (pRes.ok) {
        setProjects(await pRes.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await fetchWorkloads();
      setLoading(false);
    };
    fetchData();
  }, [router]);

  const handleAssignProject = async (userId: string) => {
    const projectId = assigningMap[userId];
    if (!projectId) return;

    try {
      const token = localStorage.getItem('axiom_token');
      const res = await fetch(`/api/v1/projects/${projectId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        alert('Project assigned and WhatsApp alert sent successfully!');
        setAssigningMap((prev) => ({ ...prev, [userId]: '' }));
        fetchWorkloads();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnassignProject = async (userId: string, projectId: string) => {
    if (!confirm('Are you sure you want to unassign this project?')) return;

    try {
      const token = localStorage.getItem('axiom_token');
      const res = await fetch(`/api/v1/projects/${projectId}/assign/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        fetchWorkloads();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const calculateStats = (member: DBUser) => {
    const pms = member.projectMembers || [];
    const pCount = pms.length;

    // Load allocation mapping
    let load = 0;
    if (pCount === 1) load = 60;
    else if (pCount === 2) load = 80;
    else if (pCount >= 3) load = 95;

    // Sum task counts across assigned projects
    let active = 0;
    let queued = 0;
    let blocked = 0;

    pms.forEach((pm) => {
      const tasks = pm.project.tasks || [];
      tasks.forEach((t) => {
        if (t.status === 'ACTIVE') active++;
        else if (t.status === 'BLOCKED') blocked++;
        else queued++;
      });
    });

    return { load, active, queued, blocked };
  };

  const getLoadColor = (load: number) => {
    if (load >= 85) return 'bg-[#9f3a38]';
    if (load >= 60) return 'bg-[#8c7853]';
    return 'bg-[#3e593e]';
  };

  if (loading) {
    return <div className="text-zinc-400 py-8">Loading workloads...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-serif font-black tracking-tight text-[#1c1b18]">
          Team Workloads
        </h1>
        <p className="text-[#66635d] text-xs font-semibold uppercase tracking-widest">
          Review resource allocation, active tasks, and employee status details.
        </p>
      </div>

      {loading ? (
        <div className="text-[#66635d] text-xs font-black uppercase tracking-widest py-8">
          Loading team workloads...
        </div>
      ) : employees.length > 0 ? (
        /* Team grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {employees.map((member) => {
            const stats = calculateStats(member);
            const assignedProjects = member.projectMembers || [];

            return (
              <Card
                key={member.id}
                className="flex flex-col justify-between hover:border-[#8c7853] group shadow-sm border border-[#e6e3da]/80 hover:shadow-md transition-all duration-300 bg-white"
              >
                <div className="space-y-6">
                  {/* Member profile header */}
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className="w-11 h-11 rounded-lg bg-[#8c7853]/10 border border-[#8c7853]/10 flex items-center justify-center font-serif font-black text-[#8c7853] text-sm shadow-inner">
                        {getInitials(member.name)}
                      </div>
                      <div>
                        <h3 className="font-serif font-black text-[#1c1b18] text-base">
                          {member.name}
                        </h3>
                        <span className="block text-xs text-[#8c7853] font-semibold">
                          Specialty: {member.specialty || 'General'}
                        </span>
                        <span className="block text-[9px] text-[#66635d] font-black uppercase tracking-widest mt-0.5">
                          ID: {member.employeeId || 'None'} • Phone: {member.phoneNumber}
                        </span>
                      </div>
                    </div>
                    <Badge variant={assignedProjects.length > 0 ? 'completed' : 'proposed'}>
                      {assignedProjects.length > 0 ? 'Active' : 'Waiting'}
                    </Badge>
                  </div>

                  {/* Project Assignment Control */}
                  <div className="space-y-2.5 p-3.5 bg-[#faf8f5] border border-[#e6e3da]/80 rounded-xl shadow-inner">
                    <label className="block text-[9px] font-black text-[#66635d] uppercase tracking-widest">
                      Assign to Campaign
                    </label>
                    <div className="flex gap-2 w-full">
                      <select
                        value={assigningMap[member.id] || ''}
                        onChange={(e) =>
                          setAssigningMap((prev) => ({ ...prev, [member.id]: e.target.value }))
                        }
                        className="flex-1 bg-white border border-[#e6e3da] rounded-lg px-2 py-1.5 text-xs text-[#1c1b18] outline-none focus:border-[#8c7853] shadow-sm cursor-pointer"
                      >
                        <option value="">Select project...</option>
                        {projects
                          .filter((p) => !p.members || p.members.length === 0)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                      </select>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAssignProject(member.id)}
                        disabled={!assigningMap[member.id]}
                        className="h-8 px-3 text-[9px] font-black tracking-widest uppercase cursor-pointer rounded-lg border border-[#7d6b4a]"
                      >
                        Assign
                      </Button>
                    </div>
                  </div>

                  {/* Workload Stats */}
                  <div className="space-y-3 pt-4 border-t border-[#faf8f5]">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[#66635d]">
                      <span>Current Allocation Load</span>
                      <span
                        className={
                          stats.load >= 85
                            ? 'text-[#9f3a38]'
                            : stats.load >= 60
                              ? 'text-[#8c7853]'
                              : 'text-[#3e593e]'
                        }
                      >
                        {stats.load}%
                      </span>
                    </div>
                    <div className="w-full bg-[#f2efe9] h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getLoadColor(stats.load)}`}
                        style={{ width: `${stats.load}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2.5 text-center pt-2">
                      <div className="bg-[#faf8f5] p-2.5 rounded-lg border border-[#e6e3da]/80 shadow-sm">
                        <span className="block text-[#66635d] text-[8px] font-black uppercase tracking-widest">
                          Active Tasks
                        </span>
                        <span className="text-[#1c1b18] text-xs font-black">{stats.active}</span>
                      </div>
                      <div className="bg-[#faf8f5] p-2.5 rounded-lg border border-[#e6e3da]/80 shadow-sm">
                        <span className="block text-[#66635d] text-[8px] font-black uppercase tracking-widest">
                          Queued Tasks
                        </span>
                        <span className="text-[#1c1b18] text-xs font-black">{stats.queued}</span>
                      </div>
                      <div className="bg-[#faf8f5] p-2.5 rounded-lg border border-[#e6e3da]/80 shadow-sm">
                        <span className="block text-[#66635d] text-[8px] font-black uppercase tracking-widest">
                          Blocked Tasks
                        </span>
                        <span
                          className={`text-xs font-black ${stats.blocked > 0 ? 'text-[#9f3a38] animate-pulse' : 'text-[#66635d]'}`}
                        >
                          {stats.blocked}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Real Active Project details */}
                  <div className="space-y-3">
                    {assignedProjects.length > 0 ? (
                      assignedProjects.map((pm) => (
                        <div
                          key={pm.project.id}
                          className="bg-[#faf8f5] p-4 rounded-xl border border-[#e6e3da] space-y-2 relative group"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[8px] text-[#66635d] font-black uppercase tracking-widest">
                              Assigned Campaign
                            </span>
                            <div className="flex items-center gap-1.5">
                              <Badge variant="progress">{pm.project.domain || 'General'}</Badge>
                              <button
                                onClick={() => handleUnassignProject(member.id, pm.project.id)}
                                className="p-1 rounded bg-[#fdf2f2] hover:bg-[#fcdada] text-[#9f3a38] border border-[#fcdada] cursor-pointer flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                                title="Unassign Project"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <h4 className="text-xs font-serif font-black text-[#1c1b18] leading-tight">
                            {pm.project.name}
                          </h4>
                          <p className="text-[10px] text-[#66635d] font-semibold leading-relaxed line-clamp-2 min-h-[30px]">
                            {pm.project.objective}
                          </p>
                          <div className="flex flex-wrap gap-1 pt-1">
                            {(pm.project.techStack || []).map((tech) => (
                              <span
                                key={tech}
                                className="text-[8px] font-black bg-white border border-[#e6e3da] text-[#66635d] px-1.5 py-0.5 rounded-md uppercase tracking-wider"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                          {pm.project.targetDeadline && (
                            <span className="block text-[8px] text-[#66635d] font-black uppercase tracking-widest mt-1">
                              Deadline: {new Date(pm.project.targetDeadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="bg-white p-4 border border-dashed border-[#e6e3da] rounded-xl text-center shadow-sm">
                        <span className="text-[9px] text-[#66635d] font-black uppercase tracking-widest block">
                          No Assigned Work
                        </span>
                        <p className="text-[10px] text-[#a09c94] mt-1 font-semibold">
                          Waiting to be assigned to a campaign
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="mt-6 pt-4 border-t border-[#e6e3da]/80 flex justify-between gap-2.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-lg text-[9px] tracking-widest uppercase gap-1.5 h-9 border-[#e6e3da] text-[#66635d] hover:bg-[#faf8f5] shadow-sm"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Text Agent</span>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 rounded-lg text-[9px] tracking-widest uppercase gap-1.5 h-9 border border-[#e6e3da] hover:bg-[#e6e3da]/10 bg-white text-[#1c1b18] shadow-sm"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-[#8c7853]" />
                    <span>Reallocate task</span>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-[#66635d] text-xs font-black uppercase tracking-widest py-8">
          No employees found.
        </div>
      )}
    </div>
  );
}
