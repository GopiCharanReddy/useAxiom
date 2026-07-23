"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, MessageSquare } from "lucide-react";
import { Button, Card, Badge } from "@useaxiom/ui";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  load: number;
  activeTasks: number;
  queuedTasks: number;
  blockedTasks: number;
  status: "active" | "offline";
  currentTaskName: string;
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
  status: "active" | "offline";
  current_task_name: string;
}

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const token = localStorage.getItem('axiom_token');
        if (!token) {
          router.push('/login');
          return;
        }

        const res = await fetch('/api/v1/analytics/team-workload', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) {
          localStorage.removeItem('axiom_token');
          router.push('/login');
          return;
        }

        const data = await res.json();
        if (data && Array.isArray(data.workloads)) {
          const mapped = data.workloads.map((emp: DBWorkload) => ({
            id: emp.employee_id,
            name: emp.employee_name,
            role: emp.role,
            avatar: emp.avatar,
            load: emp.load,
            activeTasks: emp.active_tasks,
            queuedTasks: emp.queued_tasks,
            blockedTasks: emp.blocked_tasks,
            status: emp.status,
            currentTaskName: emp.current_task_name,
          }));
          setTeam(mapped);
        }
      } catch (err) {
        console.error("Error fetching team workload:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [router]);

  const handleReallocate = (memberId: string) => {
    setTeam(prev => prev.map(member => {
      if (member.id === memberId) {
        const isSarah = memberId === "sarah";
        const newLoad = isSarah ? 60 : member.load;
        const newQueued = isSarah ? 1 : member.queuedTasks;
        return {
          ...member,
          load: newLoad,
          queuedTasks: newQueued,
        };
      }
      if (memberId === "sarah" && member.id === "dave") {
        // Shift a queued task from Sarah to Dave
        return {
          ...member,
          load: member.load + 20,
          queuedTasks: member.queuedTasks + 1
        };
      }
      return member;
    }));
  };

  const getLoadColor = (load: number) => {
    if (load >= 85) return "bg-rose-500";
    if (load >= 60) return "bg-purple-500";
    return "bg-emerald-500";
  };

  if (loading) {
    return <div className="text-zinc-400 py-8">Loading workloads...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Team Workloads</h1>
        <p className="text-zinc-400 text-sm mt-1">Review resource allocation, active tasks, and employee status details.</p>
      </div>

      {/* Team grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {team.map((member) => (
          <Card key={member.id} className="flex flex-col justify-between hover:border-zinc-700/80 transition-all duration-300">
            <div className="space-y-6">
              {/* Member profile header */}
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="w-11 h-11 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-300 text-sm">
                    {member.avatar}
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-200 text-base">{member.name}</h3>
                    <span className="block text-xs text-zinc-500 font-semibold">{member.role}</span>
                  </div>
                </div>
                <Badge variant={member.status === "active" ? "completed" : "proposed"}>
                  {member.status === "active" ? "Active via SMS" : "Offline"}
                </Badge>
              </div>

              {/* Workload Stats */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-xs font-semibold text-zinc-400">
                  <span>Current Allocation Load</span>
                  <span className={member.load >= 85 ? "text-rose-400" : member.load >= 60 ? "text-purple-400" : "text-emerald-400"}>
                    {member.load}%
                  </span>
                </div>
                <div className="w-full bg-zinc-850 h-2 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${getLoadColor(member.load)}`} style={{ width: `${member.load}%` }} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-2">
                  <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-850">
                    <span className="block text-zinc-500 text-[9px] font-bold uppercase">Active</span>
                    <span className="text-zinc-200 text-xs font-bold">{member.activeTasks}</span>
                  </div>
                  <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-850">
                    <span className="block text-zinc-500 text-[9px] font-bold uppercase">Queued</span>
                    <span className="text-zinc-200 text-xs font-bold">{member.queuedTasks}</span>
                  </div>
                  <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-850">
                    <span className="block text-zinc-500 text-[9px] font-bold uppercase">Blocked</span>
                    <span className={`text-xs font-bold ${member.blockedTasks > 0 ? "text-rose-400 animate-pulse" : "text-zinc-400"}`}>{member.blockedTasks}</span>
                  </div>
                </div>
              </div>

              {/* Current Active Task details */}
              <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-850 space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Active Stream</span>
                <p className="text-xs text-zinc-300 font-medium truncate">{member.currentTaskName}</p>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-between gap-2">
              <Button variant="outline" size="sm" className="flex-1 rounded-xl text-xs gap-1.5 h-9">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Text Agent</span>
              </Button>
              {member.load >= 85 && (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => handleReallocate(member.id)} 
                  className="flex-1 rounded-xl text-xs gap-1.5 h-9 border border-zinc-700/60 hover:bg-zinc-800"
                >
                  <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span>Reallocate task</span>
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
