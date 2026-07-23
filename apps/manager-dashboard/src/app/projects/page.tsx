'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FolderKanban, Search, Plus, X, Trash2 } from 'lucide-react';
import { Button, Card, Badge } from '@useaxiom/ui';

interface Project {
  id: string;
  name: string;
  category: string;
  description: string;
  status: 'progress' | 'proposed' | 'completed';
  progress: number;
  health: 'on_track' | 'at_risk' | 'review';
  tasksDone: number;
  tasksTotal: number;
  members?: unknown[];
}

interface DBProject {
  id: string;
  name: string;
  category?: string;
  objective: string;
  status: string;
  healthStatus?: string;
  healthScore?: number;
  members?: unknown[];
  tasks?: Array<{ id: string; status: string }>;
}

function ProjectsPageContent() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'progress' | 'proposed' | 'completed'>('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newObjective, setNewObjective] = useState('');
  const [newDomain, setNewDomain] = useState('Frontend');
  const [newTechStack, setNewTechStack] = useState('');
  const [modalTasks, setModalTasks] = useState<
    Array<{ title: string; description: string; estimatedHours?: number }>
  >([]);
  const [modalTaskTitle, setModalTaskTitle] = useState('');
  const [modalTaskDesc, setModalTaskDesc] = useState('');
  const [modalTaskHours, setModalTaskHours] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowModal(true);
    }
  }, [searchParams]);

  const handleAddModalTask = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!modalTaskTitle || !modalTaskDesc) return;
    setModalTasks((prev) => [
      ...prev,
      {
        title: modalTaskTitle,
        description: modalTaskDesc,
        estimatedHours: modalTaskHours ? Number(modalTaskHours) : undefined,
      },
    ]);
    setModalTaskTitle('');
    setModalTaskDesc('');
    setModalTaskHours('');
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      const token = localStorage.getItem('axiom_token');
      const res = await fetch(`/api/v1/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
      } else {
        const errorText = await res.text();
        alert(`Failed to delete project. Status: ${res.status}. Details: ${errorText}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      alert(`Network error during project deletion: ${errorMsg}`);
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('axiom_token');
        if (!token) {
          router.push('/login');
          return;
        }

        const res = await fetch('/api/v1/projects', {
          headers: { Authorization: `Bearer ${token}` },
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
            let status: 'progress' | 'proposed' | 'completed' = 'proposed';
            if (p.status === 'ACTIVE') status = 'progress';
            else if (p.status === 'COMPLETED') status = 'completed';

            let health: 'on_track' | 'at_risk' | 'review' = 'review';
            if (p.healthStatus === 'LOW') health = 'on_track';
            else if (p.healthStatus === 'HIGH') health = 'at_risk';

            const tasksTotal = p.tasks?.length || 0;
            const tasksDone = p.tasks?.filter((t) => t.status === 'COMPLETED').length || 0;
            const progress =
              tasksTotal > 0
                ? Math.round((tasksDone / tasksTotal) * 100)
                : p.status === 'ACTIVE'
                  ? 10
                  : 0;

            return {
              id: p.id,
              name: p.name,
              category: p.category || 'General',
              description: p.objective,
              status,
              progress,
              health,
              tasksDone,
              tasksTotal,
              members: p.members || [],
            };
          });
          setProjects(mapped);
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newName,
          objective: newObjective,
          targetDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          domain: newDomain,
          techStack: newTechStack
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          tasks: modalTasks,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setNewName('');
        setNewObjective('');
        setNewDomain('Frontend');
        setNewTechStack('');
        setModalTasks([]);
        // Reload projects
        const fetchProjects = async () => {
          const token = localStorage.getItem('axiom_token');
          if (!token) return;
          const res = await fetch('/api/v1/projects', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (Array.isArray(data)) {
            const mapped: Project[] = data.map((p: DBProject) => {
              let status: 'progress' | 'proposed' | 'completed' = 'proposed';
              if (p.status === 'ACTIVE') status = 'progress';
              else if (p.status === 'COMPLETED') status = 'completed';

              let health: 'on_track' | 'at_risk' | 'review' = 'review';
              if (p.healthStatus === 'LOW') health = 'on_track';
              else if (p.healthStatus === 'HIGH') health = 'at_risk';

              const tasksTotal = p.tasks?.length || 0;
              const tasksDone = p.tasks?.filter((t) => t.status === 'COMPLETED').length || 0;
              const progress =
                tasksTotal > 0
                  ? Math.round((tasksDone / tasksTotal) * 100)
                  : p.status === 'ACTIVE'
                    ? 10
                    : 0;

              return {
                id: p.id,
                name: p.name,
                category: p.category || 'General',
                description: p.objective,
                status,
                progress,
                health,
                tasksDone,
                tasksTotal,
                members: p.members || [],
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

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(search.toLowerCase()) ||
      project.category.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'all' ? true : project.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'on_track':
        return (
          <span className="text-[10px] font-black uppercase tracking-widest text-[#3e593e] flex items-center gap-1 bg-[#f0f5f0] border border-[#d5ebd5] px-2 py-0.5 rounded-full">
            On Track
          </span>
        );
      case 'at_risk':
        return (
          <span className="text-[10px] font-black uppercase tracking-widest text-[#9f3a38] flex items-center gap-1 bg-[#fdf2f2] border border-[#fcdada] px-2 py-0.5 rounded-full animate-pulse">
            At Risk
          </span>
        );
      case 'review':
      default:
        return (
          <span className="text-[10px] font-black uppercase tracking-widest text-[#bda272] flex items-center gap-1 bg-[#FCF5EB] border border-[#eedebf] px-2 py-0.5 rounded-full">
            Needs Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-serif font-black tracking-tight text-[#1c1b18]">
            Campaigns & Projects
          </h1>
          <p className="text-[#66635d] text-xs font-semibold uppercase tracking-widest">
            Monitor the execution states and goals generated by the planner.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowModal(true)}
          className="rounded-lg shadow-sm cursor-pointer border border-[#7d6b4a]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Campaign Goal</span>
        </Button>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-[#e6e3da]/80 shadow-sm">
        {/* Status Tabs */}
        <div className="flex bg-[#f2efe9] p-1 rounded-lg border border-[#e6e3da] gap-1 overflow-x-auto w-full md:w-auto">
          {(
            [
              { id: 'all', label: 'All Campaigns' },
              { id: 'progress', label: 'In Progress' },
              { id: 'proposed', label: 'Awaiting Review' },
              { id: 'completed', label: 'Completed' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-[#8c7853] shadow-sm border border-[#e6e3da]'
                  : 'text-[#66635d] hover:text-[#1c1b18]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2.5 bg-white border border-[#e6e3da] rounded-lg px-4 py-2 w-full md:w-80 shadow-sm focus-within:border-[#8c7853] focus-within:ring-4 focus-within:ring-[#8c7853]/10 transition-all duration-300">
          <Search className="w-4 h-4 text-[#66635d]" />
          <input
            type="text"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            placeholder="Search campaigns..."
            className="bg-transparent text-xs font-bold text-[#1c1b18] placeholder-[#a09c94] outline-none w-full uppercase tracking-wider"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="text-[#66635d] text-xs font-black uppercase tracking-widest py-8">
          Loading campaigns...
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className="flex flex-col h-full hover:border-[#8c7853] group shadow-sm border border-[#e6e3da]/80 hover:shadow-md transition-all duration-300"
            >
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-[#8c7853] uppercase tracking-widest bg-[#FAF4E8] px-2 py-0.5 rounded border border-[#eedebf]">
                      {project.category}
                    </span>
                    <h3 className="font-serif font-black text-lg text-[#1c1b18] mt-2 group-hover:text-[#8c7853] transition-colors leading-tight">
                      <Link href={`/projects/${project.id}`}>{project.name}</Link>
                    </h3>
                  </div>
                  <div className="flex gap-1.5 flex-wrap justify-end">
                    <Badge variant={project.status}>
                      {project.status === 'progress' && 'Active'}
                      {project.status === 'proposed' && 'Proposed'}
                      {project.status === 'completed' && 'Completed'}
                    </Badge>
                    {project.members && project.members.length > 0 ? (
                      <Badge variant="completed">Assigned</Badge>
                    ) : (
                      <Badge variant="proposed">Unassigned</Badge>
                    )}
                  </div>
                </div>

                <p className="text-xs text-[#66635d] leading-relaxed line-clamp-2 min-h-[40px] font-semibold">
                  {project.description}
                </p>

                {/* Progress */}
                <div className="space-y-1.5 pt-2 border-t border-[#faf8f5]">
                  <div className="flex justify-between text-[10px] font-black text-[#66635d] uppercase tracking-widest">
                    <span>Task Execution</span>
                    <span className="text-[#1c1b18]">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-[#f2efe9] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#8c7853] h-full rounded-full transition-all duration-500"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-6 pt-4 border-t border-[#e6e3da]/80 flex items-center justify-between">
                {getHealthBadge(project.health)}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[#66635d] bg-[#faf8f5] px-2.5 py-1 rounded-lg border border-[#e6e3da]/80 shadow-sm">
                    <span>
                      {project.tasksDone}/{project.tasksTotal} Tasks
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleDeleteProject(project.id);
                    }}
                    className="p-1.5 rounded-lg bg-[#fdf2f2] hover:bg-[#fcdada] text-[#9f3a38] border border-[#fcdada] hover:shadow transition-all cursor-pointer flex items-center justify-center"
                    title="Delete Project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center text-center py-16 rounded-2xl border border-[#e6e3da]/80">
          <FolderKanban className="w-12 h-12 text-[#66635d]/40 mb-3" />
          <h3 className="text-[#1c1b18] font-serif font-black text-lg">No campaigns found</h3>
          <p className="text-[#66635d] text-xs font-semibold mt-1 uppercase tracking-wider">
            Try modifying your keyword search or filters.
          </p>
        </Card>
      )}

      {/* New Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#1c1b18]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#e6e3da] max-w-2xl w-full p-8 space-y-6 max-h-[90vh] overflow-y-auto rounded-3xl shadow-[0_20px_50px_rgba(28,27,24,0.1)] animate-in fade-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center pb-4 border-b border-[#e6e3da]">
              <h2 className="text-xl font-serif font-black text-[#1c1b18]">
                Create New Project Goal
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 bg-[#faf8f5] hover:bg-[#e6e3da] text-[#66635d] rounded-lg transition-colors cursor-pointer border border-[#e6e3da]/80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column 1: Project Details */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-[#8c7853] uppercase tracking-widest pb-1 border-b border-[#faf8f5]">
                    Project Details
                  </h3>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#66635d] uppercase tracking-widest block mb-1">
                      Project Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Q4 Website Redesign"
                      className="w-full bg-white border border-[#e6e3da] rounded-xl py-2.5 px-3.5 text-xs text-[#1c1b18] placeholder:text-[#a09c94] focus:outline-none focus:border-[#8c7853] focus:ring-4 focus:ring-[#8c7853]/10 transition-all duration-300 shadow-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#66635d] uppercase tracking-widest block mb-1">
                      Objective / Description
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={newObjective}
                      onChange={(e) => setNewObjective(e.target.value)}
                      placeholder="Describe the ultimate business objective or goal..."
                      className="w-full bg-white border border-[#e6e3da] rounded-xl py-2.5 px-3.5 text-xs text-[#1c1b18] placeholder:text-[#a09c94] focus:outline-none focus:border-[#8c7853] focus:ring-4 focus:ring-[#8c7853]/10 transition-all duration-300 shadow-sm resize-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#66635d] uppercase tracking-widest block mb-1">
                      Domain
                    </label>
                    <select
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      className="w-full bg-white border border-[#e6e3da] rounded-xl py-2.5 px-3.5 text-xs text-[#1c1b18] focus:outline-none focus:border-[#8c7853] focus:ring-4 focus:ring-[#8c7853]/10 transition-all duration-300 shadow-sm cursor-pointer"
                    >
                      <option value="Frontend">Frontend</option>
                      <option value="Backend">Backend</option>
                      <option value="Fullstack">Fullstack</option>
                      <option value="AI/ML">AI/ML</option>
                      <option value="DevOps">DevOps</option>
                      <option value="QA">QA</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#66635d] uppercase tracking-widest block mb-1">
                      Tech Stack (comma separated)
                    </label>
                    <input
                      type="text"
                      value={newTechStack}
                      onChange={(e) => setNewTechStack(e.target.value)}
                      placeholder="e.g. Next.js, TailwindCSS"
                      className="w-full bg-white border border-[#e6e3da] rounded-xl py-2.5 px-3.5 text-xs text-[#1c1b18] placeholder:text-[#a09c94] focus:outline-none focus:border-[#8c7853] focus:ring-4 focus:ring-[#8c7853]/10 transition-all duration-300 shadow-sm"
                    />
                  </div>
                </div>

                {/* Column 2: Tasks Builder */}
                <div className="space-y-4 border-t md:border-t-0 md:border-l md:pl-6 border-[#e6e3da]">
                  <h3 className="text-[10px] font-black text-[#8c7853] uppercase tracking-widest pb-1 border-b border-[#faf8f5]">
                    Project Tasks
                  </h3>

                  {/* Local task list */}
                  {modalTasks.length > 0 ? (
                    <div className="space-y-2 max-h-32 overflow-y-auto bg-[#faf8f5] p-3 border border-[#e6e3da] rounded-xl shadow-inner">
                      {modalTasks.map((t, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-start text-xs border-b border-[#e6e3da]/60 pb-1.5 last:border-0 last:pb-0"
                        >
                          <div className="truncate pr-2">
                            <span className="font-bold text-[#1c1b18] block truncate">
                              {t.title}
                            </span>
                            <span className="text-[9px] text-[#66635d] font-semibold block truncate">
                              {t.description}
                            </span>
                          </div>
                          <Badge variant="completed">{t.estimatedHours || 0}h</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[9px] text-[#66635d] font-black uppercase tracking-widest bg-[#faf8f5] p-3 text-center border border-[#e6e3da]/80 rounded-xl">
                      No tasks added yet. Add tasks below.
                    </p>
                  )}

                  {/* Task Builder Inputs */}
                  <div className="bg-[#faf8f5] p-4 border border-[#e6e3da] rounded-xl space-y-3 shadow-sm">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-[#66635d] uppercase tracking-widest block mb-0.5">
                        Task Title
                      </label>
                      <input
                        type="text"
                        value={modalTaskTitle}
                        onChange={(e) => setModalTaskTitle(e.target.value)}
                        placeholder="Setup database schemas"
                        className="w-full bg-white border border-[#e6e3da] rounded-lg p-2 text-xs text-[#1c1b18] outline-none focus:border-[#8c7853] focus:ring-4 focus:ring-[#8c7853]/10 transition-all duration-300"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-[#66635d] uppercase tracking-widest block mb-0.5">
                        Description
                      </label>
                      <textarea
                        rows={2}
                        value={modalTaskDesc}
                        onChange={(e) => setModalTaskDesc(e.target.value)}
                        placeholder="Task context details..."
                        className="w-full bg-white border border-[#e6e3da] rounded-lg p-2 text-xs text-[#1c1b18] outline-none focus:border-[#8c7853] focus:ring-4 focus:ring-[#8c7853]/10 transition-all duration-300 resize-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-[#66635d] uppercase tracking-widest block mb-0.5">
                        Estimated Hours
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={modalTaskHours}
                          onChange={(e) => setModalTaskHours(e.target.value)}
                          placeholder="e.g. 8"
                          className="flex-1 bg-white border border-[#e6e3da] rounded-lg p-2 text-xs text-[#1c1b18] outline-none focus:border-[#8c7853] focus:ring-4 focus:ring-[#8c7853]/10 transition-all duration-300"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleAddModalTask}
                          className="h-8 text-[9px] cursor-pointer rounded-lg border border-[#e6e3da] py-0 px-3 tracking-widest font-black uppercase"
                        >
                          + Add Task
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#e6e3da]">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setShowModal(false)}
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
