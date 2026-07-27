'use client';

import { useState } from 'react';
import { MessageSquare, Trash2, UserPlus } from 'lucide-react';
import { Button, Card, Badge } from '@useaxiom/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SendReminderModal } from '../components/SendReminderModal';
import { AddEmployeeModal } from '../components/AddEmployeeModal';

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

export default function TeamPage() {
  const queryClient = useQueryClient();

  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [addEmployeeModalOpen, setAddEmployeeModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedMemberName, setSelectedMemberName] = useState('');
  const [selectedMemberPhone, setSelectedMemberPhone] = useState('');

  // 1. Fetch Users using TanStack Query
  const { data: employees = [], isLoading: loading } = useQuery<DBUser[]>({
    queryKey: ['team-employees'],
    queryFn: async () => {
      const token = localStorage.getItem('axiom_token');
      if (!token) return [];
      const res = await fetch('/api/v1/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch team members');
      const usersData: DBUser[] = await res.json();
      return usersData.filter((u) => u.role === 'EMPLOYEE');
    },
  });

  // 2. Unassign Project Mutation
  const unassignProjectMutation = useMutation({
    mutationFn: async ({ userId, projectId }: { userId: string; projectId: string }) => {
      const token = localStorage.getItem('axiom_token');
      const res = await fetch(`/api/v1/projects/${projectId}/assign/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to unassign project');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-employees'] });
    },
  });

  const handleUnassignProject = (userId: string, projectId: string) => {
    if (!confirm('Are you sure you want to unassign this project?')) return;
    unassignProjectMutation.mutate({ userId, projectId });
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

    let load = 0;
    if (pCount === 1) load = 60;
    else if (pCount === 2) load = 80;
    else if (pCount >= 3) load = 95;

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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header with Add Employee Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-serif font-black tracking-tight text-[#1c1b18]">
            Team Workloads & Employees
          </h1>
          <p className="text-[#66635d] text-xs font-semibold uppercase tracking-widest">
            Review resource allocation, active tasks, and employee WhatsApp contact details.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setAddEmployeeModalOpen(true)}
          className="h-10 px-4 font-black tracking-widest text-[10px] uppercase shadow-sm border border-[#7d6b4a] gap-2 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Employee</span>
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="bg-white border border-[#e6e3da]/80 rounded-2xl p-6 h-72 flex flex-col justify-between shadow-sm space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#e6e3da] rounded-xl" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 bg-[#e6e3da] rounded w-32" />
                    <div className="h-3 bg-[#e6e3da] rounded w-20" />
                  </div>
                </div>
                <div className="h-3 bg-[#e6e3da] rounded w-full" />
                <div className="h-3 bg-[#e6e3da] rounded w-3/4" />
              </div>
            </div>
          ))}
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
                        <span className="block text-[9px] text-[#66635d] font-black uppercase tracking-widest mt-0.5 font-mono">
                          ID: {member.employeeId || 'EMP'} • WhatsApp: {member.phoneNumber}
                        </span>
                      </div>
                    </div>
                    <Badge variant={assignedProjects.length > 0 ? 'completed' : 'proposed'}>
                      {assignedProjects.length > 0 ? 'Active' : 'Waiting'}
                    </Badge>
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
                              Assigned Project
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
                        </div>
                      ))
                    ) : (
                      <div className="bg-white p-4 border border-dashed border-[#e6e3da] rounded-xl text-center shadow-sm">
                        <span className="text-[9px] text-[#66635d] font-black uppercase tracking-widest block">
                          No Assigned Work
                        </span>
                        <p className="text-[10px] text-[#a09c94] mt-1 font-semibold">
                          Waiting to be assigned to a project
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
                    onClick={() => {
                      setSelectedMemberId(member.id);
                      setSelectedMemberName(member.name);
                      setSelectedMemberPhone(member.phoneNumber || '');
                      setReminderModalOpen(true);
                    }}
                    className="flex-1 rounded-lg text-[9px] tracking-widest uppercase gap-1.5 h-9 border-[#e6e3da] text-[#66635d] hover:bg-[#faf8f5] shadow-sm cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#8c7853]" />
                    <span>Send Reminder</span>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-dashed border-[#e6e3da] p-8 rounded-2xl text-center max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#8c7853]/10 text-[#8c7853] flex items-center justify-center mx-auto">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif font-black text-[#1c1b18] text-base">No Employees Found</h3>
            <p className="text-[#66635d] text-xs font-semibold mt-1">
              You haven&apos;t added any employees under your organization yet. Click &quot;+ Add Employee&quot; above to register team members.
            </p>
          </div>
        </div>
      )}

      {/* Direct Add Employee Modal */}
      <AddEmployeeModal
        isOpen={addEmployeeModalOpen}
        onClose={() => setAddEmployeeModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['team-employees'] });
        }}
      />

      {/* WhatsApp Reminder Modal */}
      <SendReminderModal
        isOpen={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
        defaultRecipientName={selectedMemberName}
        defaultPhoneNumber={selectedMemberPhone}
        onSuccess={async (newPhoneNumber: string) => {
          if (!selectedMemberId) return;

          try {
            const token = localStorage.getItem('axiom_token');
            if (token) {
              await fetch(`/api/v1/users/${selectedMemberId}/phone`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ phoneNumber: newPhoneNumber }),
              });
              queryClient.invalidateQueries({ queryKey: ['team-employees'] });
            }
          } catch (err) {
            console.error('Error persisting user phone update:', err);
          }
        }}
      />
    </div>
  );
}
