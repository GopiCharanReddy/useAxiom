"use client";

import { use, useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Clock, 
  MessageSquare, 
  Plus, 
  ChevronRight, 
  Activity,
  Play
} from "lucide-react";
import { Button, Card, Badge } from "@useaxiom/ui";

interface Task {
  id: string;
  name: string;
  assignee: string;
  status: "completed" | "progress" | "blocked" | "pending" | "proposed";
  blockerDescription?: string;
  duration: string;
}

interface Milestone {
  id: string;
  title: string;
  status: "completed" | "progress" | "pending";
  tasks: Task[];
}

interface ProjectDetails {
  id: string;
  name: string;
  category: string;
  health: "on_track" | "at_risk" | "review";
  progress: number;
  description: string;
  milestones: Milestone[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectDetailPage({ params }: PageProps) {
  const { id } = use(params);

  // Core project mock database
  const [projectData, setProjectData] = useState<Record<string, ProjectDetails>>({
    "axiom-platform-setup": {
      id: "axiom-platform-setup",
      name: "Axiom Platform Setup",
      category: "Core Infrastructure",
      health: "on_track",
      progress: 75,
      description: "Initialize workspace configurations, setup local dev containers, and configure NestJS base modules.",
      milestones: [
        {
          id: "m1",
          title: "Scaffolding & Workspaces",
          status: "completed",
          tasks: [
            { id: "t1", name: "Turborepo & NestJS init", assignee: "Alex", status: "completed", duration: "1d" },
            { id: "t2", name: "ESLint, Prettier, Husky configs", assignee: "Dave", status: "completed", duration: "0.5d" }
          ]
        },
        {
          id: "m2",
          title: "Database Integration",
          status: "progress",
          tasks: [
            { id: "t3", name: "Prisma & PostgreSQL migration schema", assignee: "Sarah", status: "completed", duration: "1.5d" },
            { id: "t4", name: "Implement Tenant-ID database validation", assignee: "Sarah", status: "progress", duration: "2d" }
          ]
        }
      ]
    },
    "q3-marketing-launch": {
      id: "q3-marketing-launch",
      name: "Q3 Marketing Launch",
      category: "Product Growth",
      health: "review",
      progress: 0,
      description: "Deconstruct goal into atomic social media and creative asset tasks, and assign to marketing resource pool.",
      milestones: [
        {
          id: "m3",
          title: "Asset Creation",
          status: "progress",
          tasks: [
            { id: "t5", name: "Draft Email & Press Releases", assignee: "Sarah", status: "proposed", duration: "1d" },
            { id: "t6", name: "Configure Social Media Audience", assignee: "Alex", status: "proposed", duration: "2d" },
            { id: "t7", name: "Load Creative Assets & Graphics", assignee: "Dave", status: "blocked", blockerDescription: "Google Drive folder link is broken/unreachable.", duration: "1d" }
          ]
        }
      ]
    }
  });

  const project = projectData[id] || {
    id: "unknown",
    name: "Unknown Campaign",
    category: "General",
    health: "review" as const,
    progress: 0,
    description: "No details available.",
    milestones: []
  };

  // State handles interactive reassignments or updates
  const handleResolveBlocker = (taskId: string) => {
    setProjectData((prev) => {
      const updatedProject = { ...prev[id] };
      updatedProject.milestones = updatedProject.milestones.map((milestone) => {
        const updatedTasks = milestone.tasks.map((task) => {
          if (task.id === taskId) {
            return { ...task, status: "progress" as const, blockerDescription: undefined };
          }
          return task;
        });
        return { ...milestone, tasks: updatedTasks };
      });
      // Recalculate health and progress
      updatedProject.health = "on_track";
      return { ...prev, [id]: updatedProject };
    });
  };

  const handleApprovePlan = () => {
    setProjectData((prev) => {
      const updatedProject = { ...prev[id] };
      updatedProject.milestones = updatedProject.milestones.map((milestone) => {
        const updatedTasks = milestone.tasks.map((task) => {
          if (task.status === "proposed") {
            return { ...task, status: "pending" as const };
          }
          return task;
        });
        return { ...milestone, tasks: updatedTasks };
      });
      updatedProject.health = "on_track";
      return { ...prev, [id]: updatedProject };
    });
  };

  const getTaskStatusBadge = (status: Task["status"]) => {
    switch (status) {
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
      <Link href="/projects" className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors font-medium">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Projects</span>
      </Link>

      {/* Campaign Details Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-zinc-900">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest bg-purple-500/5 px-2.5 py-0.5 rounded border border-purple-500/10">
              {project.category}
            </span>
            <Badge variant={project.health === "on_track" ? "completed" : project.health === "at_risk" ? "blocked" : "proposed"}>
              {project.health === "on_track" ? "On Track" : project.health === "at_risk" ? "At Risk" : "Awaiting Review"}
            </Badge>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-100">{project.name}</h1>
          <p className="text-zinc-400 text-sm max-w-2xl">{project.description}</p>
        </div>

        {/* Progress Bar Widget */}
        <div className="w-full lg:w-72 bg-zinc-900 p-4 rounded-2xl border border-zinc-850 space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-zinc-500 uppercase tracking-wider">Campaign Progress</span>
            <span className="text-zinc-200">{project.progress}%</span>
          </div>
          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full" style={{ width: `${project.progress}%` }} />
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex justify-between items-center gap-4 bg-zinc-900/15 p-4 rounded-xl border border-zinc-900">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold text-zinc-300">Campaign Execution Log</span>
        </div>
        <div className="flex gap-2">
          {project.milestones.some(m => m.tasks.some(t => t.status === "proposed")) && (
            <Button variant="primary" size="sm" onClick={handleApprovePlan} className="rounded-xl">
              <Play className="w-3.5 h-3.5 text-white fill-white" />
              <span>Approve Proposed Plan</span>
            </Button>
          )}
          <Button variant="outline" size="sm" className="rounded-xl">
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </Button>
        </div>
      </div>

      {/* Milestones and Tasks Flow */}
      <div className="space-y-6">
        {project.milestones.map((milestone) => (
          <div key={milestone.id} className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-zinc-500" />
                <h3 className="font-bold text-zinc-200 text-sm">{milestone.title}</h3>
              </div>
              <span className="text-[10px] text-zinc-500 font-semibold uppercase bg-zinc-900/50 px-2 py-0.5 rounded border border-zinc-850">
                Milestone Status: {milestone.status}
              </span>
            </div>

            {/* Task list inside card */}
            <Card className="divide-y divide-zinc-800/60 p-0 overflow-hidden">
              {milestone.tasks.map((task) => (
                <div key={task.id} className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-zinc-900/15 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-200">{task.name}</span>
                      {getTaskStatusBadge(task.status)}
                    </div>
                    {task.blockerDescription && (
                      <span className="text-xs text-rose-400 font-medium bg-rose-500/5 border border-rose-500/10 px-2 py-1 rounded block max-w-xl">
                        Blocker feedback: &quot;{task.blockerDescription}&quot;
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    {/* Task Metadata */}
                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                      <span className="font-semibold bg-zinc-950 px-2.5 py-1 rounded border border-zinc-850">
                        {task.assignee}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                        {task.duration}
                      </span>
                    </div>

                    {/* Interactive Resolves */}
                    {task.status === "blocked" && (
                      <Button variant="danger" size="sm" onClick={() => handleResolveBlocker(task.id)} className="h-8 text-[11px] rounded-lg">
                        Resolve Blocker
                      </Button>
                    )}
                    <button className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-850 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 transition-colors">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
