'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FolderKanban,
  Search,
  Plus,
  X,
  Trash2,
  Sparkles,
  Bot,
  UserCheck,
  CheckCircle2,
  Clock,
  Wand2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Button, Card, Badge, Toast } from '@useaxiom/ui';

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

interface GeneratedTaskItem {
  id?: string;
  title: string;
  description: string;
  estimatedHours: number;
  assignedUser: string;
  status: string;
}

function ProjectsPageContent() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'progress' | 'proposed' | 'completed'>('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form Fields
  const [planningMode, setPlanningMode] = useState<'AI_ASSISTED' | 'AUTONOMOUS' | 'MANUAL'>('AI_ASSISTED');
  const [newName, setNewName] = useState('');
  const [newObjective, setNewObjective] = useState('');
  const [newDomain, setNewDomain] = useState('Frontend');
  const [newTechStack, setNewTechStack] = useState('');
  const [employees, setEmployees] = useState<Array<{ id: string; name: string; role: string; employeeId?: string; specialty?: string }>>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [notifyEmployees, setNotifyEmployees] = useState(true);

  // State for AI Plan Preview & Approval Workflow
  const [modalStep, setModalStep] = useState<'FORM' | 'PLAN_PREVIEW'>('FORM');
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTaskItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [approvedSuccess, setApprovedSuccess] = useState(false);

  // UI Dialog & Toast State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem('axiom_token');
        if (!token) return;
        const res = await fetch('/api/v1/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const filtered = data.filter((u: { role: string; name: string; id: string; employeeId?: string }) => u.role === 'EMPLOYEE');
            setEmployees(filtered);
          }
        }
      } catch (err) {
        console.error('Error fetching employees:', err);
      }
    };
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowModal(true);
    }
  }, [searchParams]);

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

  useEffect(() => {
    fetchProjects();
  }, [router]);

  const handleDeleteProject = async (projectId: string) => {
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
        setToast({ message: 'Project successfully deleted', type: 'success' });
      } else {
        const errorText = await res.text();
        setToast({ message: `Failed to delete project: ${errorText}`, type: 'error' });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setToast({ message: `Network error during deletion: ${errorMsg}`, type: 'error' });
      console.error(err);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    let activeEmployeeIds = selectedEmployeeIds;
    if (activeEmployeeIds.length === 0 && (planningMode === 'AUTONOMOUS' || planningMode === 'AI_ASSISTED')) {
      activeEmployeeIds = employees.slice(0, 3).map((emp) => emp.id);
    }

    if (activeEmployeeIds.length === 0 && planningMode === 'MANUAL') {
      setToast({ message: 'Please assign at least one employee for manual project planning.', type: 'warning' });
      return;
    }

    setIsSubmitting(true);
    setApprovedSuccess(false);

    try {
      const token = localStorage.getItem('axiom_token');
      const payload = {
        name: newName,
        objective: newObjective,
        targetDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        domain: newDomain,
        techStack: newTechStack
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        employeeIds: activeEmployeeIds,
        notifyEmployees: notifyEmployees,
        tasks: [],
      };

      const res = await fetch('/api/v1/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const createdData = await res.json();
        setCreatedProjectId(createdData.id);

        // Call backend API generate-plan endpoint
        let fetchedTasks: GeneratedTaskItem[] = [];
        try {
          const planRes = await fetch(`/api/v1/projects/${createdData.id}/generate-plan`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (planRes.ok) {
            const planData = await planRes.json();
            if (Array.isArray(planData.tasks) && planData.tasks.length > 0) {
              fetchedTasks = planData.tasks;
            }
          }
        } catch (planErr) {
          console.warn('AI Plan generation trigger notice:', planErr);
        }

        // If tasks array wasn't in planData, fetch from tasks endpoint
        if (fetchedTasks.length === 0) {
          try {
            const tRes = await fetch(`/api/v1/projects/${createdData.id}/tasks`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (tRes.ok) {
              const taskList = await tRes.json();
              if (Array.isArray(taskList)) {
                fetchedTasks = taskList.map((t: Record<string, unknown>) => ({
                  id: String(t.id || ''),
                  title: String(t.title || ''),
                  description: String(t.description || 'Day-to-day project deliverable'),
                  estimatedHours: Number(t.estimatedHours || 8),
                  assignedUser: String(t.assignedUser || 'Assigned Developer'),
                  status: String(t.status || 'PROPOSED'),
                }));
              }
            }
          } catch (tErr) {
            console.warn('Task fetch error:', tErr);
          }
        }

        if (planningMode === 'AI_ASSISTED') {
          // Transition to Plan Preview step for Manager Review
          setGeneratedTasks(fetchedTasks);
          setModalStep('PLAN_PREVIEW');
          setIsSubmitting(false);
          setToast({ message: 'AI Plan generated! Review day-to-day tasks below.', type: 'info' });
          return;
        }

        if (planningMode === 'AUTONOMOUS') {
          // Autonomous mode auto-approves and provisions instantly
          await fetch(`/api/v1/projects/${createdData.id}/approve`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });
          setToast({ message: 'Project provisioned and activated autonomously by AI Agent!', type: 'success' });
        } else {
          setToast({ message: 'Project created successfully!', type: 'success' });
        }

        await fetchProjects();
        setTimeout(() => {
          resetModal();
        }, 1200);
      } else {
        const errorText = await res.text();
        setToast({ message: `Failed to create project: ${errorText}`, type: 'error' });
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Error creating project:', err);
      setToast({ message: 'A network error occurred while creating the project.', type: 'error' });
      setIsSubmitting(false);
    }
  };

  const handleApprovePlan = async () => {
    if (!createdProjectId) {
      setToast({ message: 'No project ID available to approve.', type: 'error' });
      return;
    }

    setIsApproving(true);

    try {
      const token = localStorage.getItem('axiom_token');
      const res = await fetch(`/api/v1/projects/${createdProjectId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setApprovedSuccess(true);
        setToast({ message: 'Plan approved! Project is active and notifications dispatched.', type: 'success' });
        await fetchProjects();

        setTimeout(() => {
          resetModal();
        }, 1500);
      } else {
        const errText = await res.text();
        setToast({ message: `Failed to approve plan: ${errText}`, type: 'error' });
        setIsApproving(false);
      }
    } catch (err) {
      console.error('Error approving plan:', err);
      setToast({ message: 'Network error while approving project plan.', type: 'error' });
      setIsApproving(false);
    }
  };

  const resetModal = () => {
    setShowModal(false);
    setModalStep('FORM');
    setCreatedProjectId(null);
    setGeneratedTasks([]);
    setNewName('');
    setNewObjective('');
    setNewDomain('Frontend');
    setNewTechStack('');
    setSelectedEmployeeIds([]);
    setNotifyEmployees(true);
    setApprovedSuccess(false);
    setIsSubmitting(false);
    setIsApproving(false);
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
      {/* Toast Notification Container */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-[#1c1b18]/40 backdrop-blur-sm flex items-center justify-center z-[90] p-4">
          <div className="bg-white border border-[#e6e3da] max-w-md w-full p-6 space-y-4 rounded-3xl shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-[#9f3a38]">
              <div className="p-2.5 bg-[#fdf2f2] rounded-xl border border-[#fcdada]">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-black text-lg text-[#1c1b18]">Confirm Deletion</h3>
                <p className="text-[11px] text-[#66635d] font-semibold uppercase tracking-wider">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <p className="text-xs text-[#66635d] leading-relaxed">
              Are you sure you want to delete this project and all associated task assignments?
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmId(null)}
                className="h-9 text-[10px] font-black tracking-widest uppercase border-[#e6e3da] text-[#66635d]"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleDeleteProject(deleteConfirmId)}
                className="h-9 text-[10px] font-black tracking-widest uppercase bg-[#9f3a38] hover:bg-[#862e2c] border-[#9f3a38] text-white"
              >
                Delete Project
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-serif font-black tracking-tight text-[#1c1b18]">Projects</h1>
          <p className="text-[#66635d] text-xs font-semibold uppercase tracking-widest">
            Monitor execution states, AI planning modes, and day-to-day employee tasks.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowModal(true)}
          className="rounded-lg shadow-sm cursor-pointer border border-[#7d6b4a] hidden sm:flex items-center gap-2"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project Goal</span>
        </Button>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-[#e6e3da]/80 shadow-sm">
        {/* Status Tabs */}
        <div className="flex bg-[#f2efe9] p-1 rounded-lg border border-[#e6e3da] gap-1 overflow-x-auto w-full md:w-auto">
          {(
            [
              { id: 'all', label: 'All Projects' },
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
            placeholder="Search projects..."
            className="bg-transparent text-xs font-bold text-[#1c1b18] placeholder-[#a09c94] outline-none w-full uppercase tracking-wider"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="bg-white border border-[#e6e3da]/80 rounded-2xl p-6 h-64 flex flex-col justify-between shadow-sm space-y-4"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-[#e6e3da] rounded w-20" />
                  <div className="h-4 bg-[#e6e3da] rounded w-16" />
                </div>
                <div className="h-6 bg-[#e6e3da] rounded w-3/4" />
                <div className="h-3 bg-[#e6e3da] rounded w-full" />
                <div className="h-3 bg-[#e6e3da] rounded w-2/3" />
              </div>
            </div>
          ))}
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
                      setDeleteConfirmId(project.id);
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
          <h3 className="text-[#1c1b18] font-serif font-black text-lg">No projects found</h3>
          <p className="text-[#66635d] text-xs font-semibold mt-1 uppercase tracking-wider">
            Try modifying your keyword search or filters.
          </p>
        </Card>
      )}

      {/* New Project Goal & AI Planning Wizard Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#1c1b18]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#e6e3da] max-w-3xl w-full p-8 space-y-6 max-h-[92vh] overflow-y-auto rounded-3xl shadow-[0_20px_50px_rgba(28,27,24,0.15)] animate-in fade-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-[#e6e3da]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#faf4e8] border border-[#eedebf] rounded-xl text-[#8c7853]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-serif font-black text-[#1c1b18]">
                    {modalStep === 'FORM' ? 'Create New Project Goal' : 'AI-Generated Execution Plan Review'}
                  </h2>
                  <p className="text-[10px] font-black text-[#66635d] uppercase tracking-widest">
                    {modalStep === 'FORM'
                      ? 'Configure planning mode, employee assignments, and business objectives'
                      : 'Review proposed day-to-day employee tasks before final approval'}
                  </p>
                </div>
              </div>
              <button
                onClick={resetModal}
                className="p-1.5 bg-[#faf8f5] hover:bg-[#e6e3da] text-[#66635d] rounded-lg transition-colors cursor-pointer border border-[#e6e3da]/80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalStep === 'FORM' ? (
              <form onSubmit={handleCreateProject} className="space-y-6">
                {/* Mode Selector Header */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#66635d] uppercase tracking-widest block">
                    Select Planning Execution Mode
                  </label>
                  <div className="grid grid-cols-3 gap-3 bg-[#faf8f5] p-1.5 rounded-2xl border border-[#e6e3da]">
                    <button
                      type="button"
                      onClick={() => setPlanningMode('AI_ASSISTED')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        planningMode === 'AI_ASSISTED'
                          ? 'bg-white border-[#8c7853] shadow-sm text-[#8c7853]'
                          : 'border-transparent text-[#66635d] hover:bg-white/60'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider">
                        <Wand2 className="w-4 h-4 text-[#8c7853]" />
                        <span>AI-Assisted</span>
                      </div>
                      <span className="text-[9px] text-[#66635d] font-semibold mt-0.5">
                        AI generates plan &rarr; Manager Approves
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPlanningMode('AUTONOMOUS')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        planningMode === 'AUTONOMOUS'
                          ? 'bg-white border-[#8c7853] shadow-sm text-[#8c7853]'
                          : 'border-transparent text-[#66635d] hover:bg-white/60'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider">
                        <Bot className="w-4 h-4 text-[#8c7853]" />
                        <span>Autonomous</span>
                      </div>
                      <span className="text-[9px] text-[#66635d] font-semibold mt-0.5">
                        Full AI team matching & auto-dispatch
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPlanningMode('MANUAL')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        planningMode === 'MANUAL'
                          ? 'bg-white border-[#8c7853] shadow-sm text-[#8c7853]'
                          : 'border-transparent text-[#66635d] hover:bg-white/60'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider">
                        <UserCheck className="w-4 h-4 text-[#8c7853]" />
                        <span>Manual</span>
                      </div>
                      <span className="text-[9px] text-[#66635d] font-semibold mt-0.5">
                        Manager manually specifies tasks
                      </span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Column 1: Details */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-[#8c7853] uppercase tracking-widest pb-1 border-b border-[#faf8f5]">
                      Project Parameters
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
                        placeholder="e.g. Enterprise WhatsApp Bot Integration"
                        className="w-full bg-white border border-[#e6e3da] rounded-xl py-2.5 px-3.5 text-xs text-[#1c1b18] placeholder:text-[#a09c94] focus:outline-none focus:border-[#8c7853] focus:ring-4 focus:ring-[#8c7853]/10 transition-all duration-300 shadow-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-[#66635d] uppercase tracking-widest block mb-1">
                        Business Objective / Goal
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={newObjective}
                        onChange={(e) => setNewObjective(e.target.value)}
                        placeholder="Describe the overall business objective for the AI agent to break down into day-to-day employee tasks..."
                        className="w-full bg-white border border-[#e6e3da] rounded-xl py-2.5 px-3.5 text-xs text-[#1c1b18] placeholder:text-[#a09c94] focus:outline-none focus:border-[#8c7853] focus:ring-4 focus:ring-[#8c7853]/10 transition-all duration-300 shadow-sm resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-[#66635d] uppercase tracking-widest block mb-1">
                          Domain
                        </label>
                        <select
                          value={newDomain}
                          onChange={(e) => setNewDomain(e.target.value)}
                          className="w-full bg-white border border-[#e6e3da] rounded-xl py-2.5 px-3.5 text-xs text-[#1c1b18] focus:outline-none focus:border-[#8c7853] shadow-sm cursor-pointer"
                        >
                          <option value="Frontend">Frontend</option>
                          <option value="Backend">Backend</option>
                          <option value="Fullstack">Fullstack</option>
                          <option value="AI/ML">AI/ML</option>
                          <option value="DevOps">DevOps</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-[#66635d] uppercase tracking-widest block mb-1">
                          Tech Stack
                        </label>
                        <input
                          type="text"
                          value={newTechStack}
                          onChange={(e) => setNewTechStack(e.target.value)}
                          placeholder="e.g. NestJS, Prisma"
                          className="w-full bg-white border border-[#e6e3da] rounded-xl py-2.5 px-3.5 text-xs text-[#1c1b18] placeholder:text-[#a09c94] focus:outline-none focus:border-[#8c7853] shadow-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Employee Matching & Notifications */}
                  <div className="space-y-4 border-t md:border-t-0 md:border-l md:pl-6 border-[#e6e3da]">
                    <h3 className="text-[10px] font-black text-[#8c7853] uppercase tracking-widest pb-1 border-b border-[#faf8f5]">
                      Team & Dispatch Setup
                    </h3>

                    {planningMode === 'AUTONOMOUS' ? (
                      <div className="p-4 bg-[#FAF4E8] border border-[#eedebf] rounded-2xl space-y-2">
                        <div className="flex items-center gap-2 text-[#8c7853] font-black text-xs uppercase tracking-wider">
                          <Bot className="w-4 h-4" />
                          <span>AI Auto-Team Assignment</span>
                        </div>
                        <p className="text-[11px] text-[#66635d] leading-relaxed">
                          In Autonomous mode, the AI Agent evaluates employee domain skills and active workload capacity, and automatically assigns day-to-day tasks.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 relative">
                        <label className="text-[10px] font-black text-[#66635d] uppercase tracking-widest block mb-1">
                          {planningMode === 'AI_ASSISTED'
                            ? 'Assign Employees (Optional - AI recommends if empty)'
                            : 'Assign Employees (Required for Manual)'}
                        </label>

                        {/* Selection Box / Trigger */}
                        <div
                          onClick={() => setDropdownOpen(!dropdownOpen)}
                          className="w-full bg-white border border-[#e6e3da] rounded-xl py-2.5 px-3.5 text-xs text-[#1c1b18] focus:outline-none focus:border-[#8c7853] shadow-sm cursor-pointer flex justify-between items-center select-none"
                        >
                          <span className="font-bold text-[#1c1b18] truncate">
                            {selectedEmployeeIds.length === 0
                              ? 'Select employees...'
                              : `${selectedEmployeeIds.length} employee(s) selected`}
                          </span>
                          <span className="text-[#a09c94] text-xs">{dropdownOpen ? '▲' : '▼'}</span>
                        </div>

                        {/* Dropdown Panel */}
                        {dropdownOpen && (
                          <div className="absolute left-0 right-0 z-50 mt-1 bg-white border border-[#e6e3da] rounded-xl shadow-lg p-3 space-y-2 max-h-56 overflow-y-auto">
                            <input
                              type="text"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              placeholder="Search employees..."
                              onClick={(e) => e.stopPropagation()}
                              className="w-full bg-[#faf8f5] border border-[#e6e3da] rounded-lg py-1.5 px-3 text-xs text-[#1c1b18] focus:outline-none focus:border-[#8c7853]"
                            />
                            <div className="space-y-1">
                              {employees
                                .filter((emp) => emp.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map((emp) => {
                                  const isSelected = selectedEmployeeIds.includes(emp.id);
                                  return (
                                    <label
                                      key={emp.id}
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex items-center gap-2 text-xs text-[#1c1b18] font-bold cursor-pointer hover:bg-[#faf8f5] p-1.5 rounded"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => {
                                          if (isSelected) {
                                            setSelectedEmployeeIds((prev) => prev.filter((id) => id !== emp.id));
                                          } else {
                                            setSelectedEmployeeIds((prev) => [...prev, emp.id]);
                                          }
                                        }}
                                        className="rounded border-[#e6e3da] text-[#8c7853]"
                                      />
                                      <span>
                                        {emp.employeeId ? `${emp.employeeId} – ` : ''}
                                        {emp.name}
                                      </span>
                                    </label>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Dispatch Checkbox */}
                    <div className="space-y-2 pt-2">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={notifyEmployees}
                          onChange={(e) => setNotifyEmployees(e.target.checked)}
                          className="w-4 h-4 rounded text-[#8c7853]"
                        />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#66635d]">
                          Send WhatsApp & Portal Alerts to Employees
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-[#e6e3da]">
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    disabled={isSubmitting}
                    onClick={resetModal}
                    className="h-10 text-[9px] font-black tracking-widest uppercase border-[#e6e3da] text-[#66635d]"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    type="submit"
                    disabled={isSubmitting}
                    className="h-10 text-[9px] font-black tracking-widest uppercase border border-[#7d6b4a] flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      'Generating Plan...'
                    ) : planningMode === 'AI_ASSISTED' ? (
                      <>
                        <span>Generate & Preview AI Plan</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    ) : planningMode === 'AUTONOMOUS' ? (
                      <>
                        <span>Provision Autonomously</span>
                        <Bot className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      'Create Project'
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              /* PLAN PREVIEW & APPROVAL STEP */
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-[#FAF4E8] border border-[#eedebf] p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif font-black text-base text-[#1c1b18]">{newName}</h3>
                      <span className="text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full">
                        Status: Awaiting Manager Approval
                      </span>
                    </div>
                    <p className="text-xs text-[#66635d] mt-1 font-semibold">{newObjective}</p>
                  </div>
                  <Badge variant="proposed">{generatedTasks.length} Day-to-Day Tasks</Badge>
                </div>

                {/* Day-to-Day Task Breakdown List */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-[#8c7853] uppercase tracking-widest">
                    Generated Day-to-Day Employee Tasks & Assignments
                  </h4>

                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {generatedTasks.map((task, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-[#e6e3da] p-3.5 rounded-xl flex items-center justify-between hover:border-[#8c7853] transition-all shadow-sm"
                      >
                        <div className="space-y-1 max-w-[65%]">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-[#1c1b18]">{task.title}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#8c7853] bg-[#faf4e8] px-2 py-0.5 rounded">
                              {task.status || 'PROPOSED'}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#66635d] leading-relaxed">{task.description}</p>
                        </div>

                        <div className="flex items-center gap-4 text-right pl-4">
                          <div className="space-y-0.5">
                            <div className="text-[10px] font-black text-[#1c1b18] flex items-center justify-end gap-1">
                              <UserCheck className="w-3 h-3 text-[#8c7853]" />
                              <span>{task.assignedUser}</span>
                            </div>
                            <div className="text-[9px] text-[#66635d] font-bold flex items-center justify-end gap-1">
                              <Clock className="w-3 h-3 text-[#a09c94]" />
                              <span>Est: {task.estimatedHours}h</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {approvedSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>✓ Plan Approved! Project is active and employee notifications were sent successfully.</span>
                  </div>
                )}

                {/* Footer Action Buttons */}
                <div className="flex justify-between items-center pt-4 border-t border-[#e6e3da]">
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    disabled={isApproving}
                    onClick={() => setModalStep('FORM')}
                    className="h-10 text-[9px] font-black tracking-widest uppercase border-[#e6e3da] text-[#66635d]"
                  >
                    &larr; Back to Edit Parameters
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleApprovePlan}
                    disabled={isApproving || approvedSuccess}
                    className="h-10 text-[9px] font-black tracking-widest uppercase border border-[#7d6b4a] bg-[#8c7853] hover:bg-[#7d6b4a] text-white flex items-center gap-2 shadow cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isApproving ? 'Approving & Dispatching...' : 'Approve & Dispatch Plan'}</span>
                  </Button>
                </div>
              </div>
            )}
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
