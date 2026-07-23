"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FolderKanban, Search, Plus, X } from "lucide-react";
import { Button, Card, Badge } from "@useaxiom/ui";

interface Project {
  id: string;
  name: string;
  category: string;
  description: string;
  status: "progress" | "proposed" | "completed";
  progress: number;
  health: "on_track" | "at_risk" | "review";
  tasksDone: number;
  tasksTotal: number;
}

interface DBProject {
  id: string;
  name: string;
  category?: string;
  objective: string;
  status: string;
  healthStatus?: string;
  healthScore?: number;
  tasks?: Array<{ id: string; status: string }>;
}

function ProjectsPageContent() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "progress" | "proposed" | "completed">("all");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newObjective, setNewObjective] = useState("");
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("create") === "true") {
      setShowModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('axiom_token');
        if (!token) {
          router.push('/login');
          return;
        }
        
        const res = await fetch('/api/v1/projects', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.status === 401) {
          localStorage.removeItem('axiom_token');
          router.push('/login');
          return;
        }
        
        const data = await res.json();
        if (Array.isArray(data)) {
          // Map the backend DB projects to frontend visual model
          const mapped: Project[] = data.map((p: DBProject) => {
            let status: "progress" | "proposed" | "completed" = "proposed";
            if (p.status === "ACTIVE") status = "progress";
            else if (p.status === "COMPLETED") status = "completed";
            
            let health: "on_track" | "at_risk" | "review" = "review";
            if (p.healthStatus === "LOW") health = "on_track";
            else if (p.healthStatus === "HIGH") health = "at_risk";
            
            const tasksTotal = p.tasks?.length || 0;
            const tasksDone = p.tasks?.filter((t) => t.status === "COMPLETED").length || 0;
            const progress = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;

            return {
              id: p.id,
              name: p.name,
              category: p.category || "General",
              description: p.objective,
              status,
              progress,
              health,
              tasksDone, 
              tasksTotal
            };
          });
          setProjects(mapped);
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [router]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('axiom_token');
      const res = await fetch('/api/v1/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newName,
          objective: newObjective,
          targetDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
      });
      
      if (res.ok) {
        setShowModal(false);
        setNewName("");
        setNewObjective("");
        // Reload projects
        const fetchProjects = async () => {
          const token = localStorage.getItem('axiom_token');
          if (!token) return;
          const res = await fetch('/api/v1/projects', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (Array.isArray(data)) {
            const mapped: Project[] = data.map((p: DBProject) => {
              let status: "progress" | "proposed" | "completed" = "proposed";
              if (p.status === "ACTIVE") status = "progress";
              else if (p.status === "COMPLETED") status = "completed";
              
              let health: "on_track" | "at_risk" | "review" = "review";
              if (p.healthStatus === "LOW") health = "on_track";
              else if (p.healthStatus === "HIGH") health = "at_risk";
              
              const tasksTotal = p.tasks?.length || 0;
              const tasksDone = p.tasks?.filter((t) => t.status === "COMPLETED").length || 0;
              const progress = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;

              return {
                id: p.id,
                name: p.name,
                category: p.category || "General",
                description: p.objective,
                status,
                progress,
                health,
                tasksDone, 
                tasksTotal
              };
            });
            setProjects(mapped);
          }
        };
        fetchProjects();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(search.toLowerCase()) || 
                          project.category.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === "all" ? true : project.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const getHealthBadge = (health: string) => {
    switch (health) {
      case "on_track":
        return <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">🟢 On Track</span>;
      case "at_risk":
        return <span className="text-xs text-red-400 font-semibold flex items-center gap-1">🔴 At Risk</span>;
      case "review":
      default:
        return <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">⚠️ Needs Review</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Projects Workspace</h1>
          <p className="text-zinc-400 text-sm mt-1">Monitor the execution states and goals generated by the planner.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowModal(true)} className="rounded-xl shadow-lg shadow-purple-500/10 cursor-pointer">
          <Plus className="w-4 h-4" />
          <span>New Project Goal</span>
        </Button>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900/20 p-4 rounded-2xl border border-zinc-900">
        {/* Status Tabs */}
        <div className="flex bg-zinc-950/60 p-1.5 rounded-xl border border-zinc-800/80 gap-1 overflow-x-auto w-full md:w-auto">
          {(
            [
              { id: "all", label: "All Campaigns" },
              { id: "progress", label: "In Progress" },
              { id: "proposed", label: "Awaiting Review" },
              { id: "completed", label: "Completed" }
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/50"
                  : "text-zinc-400 hover:text-zinc-200 border border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-850 px-3.5 py-2 rounded-xl w-full md:w-80">
          <Search className="w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            placeholder="Search campaigns..."
            className="bg-transparent text-xs text-zinc-200 outline-none w-full placeholder-zinc-500"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="text-zinc-400 py-8">Loading campaigns...</div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="flex flex-col h-full hover:border-zinc-700/80 transition-all duration-300">
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest bg-purple-500/5 px-2 py-0.5 rounded border border-purple-500/10">
                      {project.category}
                    </span>
                    <h3 className="font-bold text-lg text-zinc-200 mt-2 hover:text-purple-400 transition-colors">
                      <Link href={`/projects/${project.id}`}>{project.name}</Link>
                    </h3>
                  </div>
                  <Badge variant={project.status}>
                    {project.status === "progress" && "Active"}
                    {project.status === "proposed" && "Proposed"}
                    {project.status === "completed" && "Completed"}
                  </Badge>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed truncate-2-lines min-h-[40px]">
                  {project.description}
                </p>

                {/* Progress */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-semibold text-zinc-400">
                    <span>Task Execution</span>
                    <span className="text-zinc-200">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-zinc-850 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
                {getHealthBadge(project.health)}
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-semibold bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-850">
                  <span>{project.tasksDone}/{project.tasksTotal} Tasks</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center text-center py-16">
          <FolderKanban className="w-12 h-12 text-zinc-700 mb-3" />
          <h3 className="text-zinc-300 font-semibold text-sm">No campaigns found</h3>
          <p className="text-zinc-500 text-xs mt-1">Try modifying your keyword search or filters.</p>
        </Card>
      )}

      {/* New Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border-4 border-gray-900 max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b-2 border-zinc-800">
              <h2 className="text-lg font-black text-white">Create New Project Goal</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300 uppercase">Project Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Q4 Website Redesign"
                  className="w-full bg-zinc-950 border-2 border-zinc-800 p-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300 uppercase">Objective / Description</label>
                <textarea
                  required
                  rows={4}
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  placeholder="Describe the ultimate business objective or goal..."
                  className="w-full bg-zinc-950 border-2 border-zinc-800 p-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Generate Plan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="text-zinc-400 py-8">Loading workspace...</div>}>
      <ProjectsPageContent />
    </Suspense>
  );
}
