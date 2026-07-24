'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  Sparkles,
  Play,
  Pause,
  XCircle,
  Send,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Phone,
  User,
  Calendar,
} from 'lucide-react';
import { Button, Card, Badge } from '@useaxiom/ui';

interface ReminderSchedule {
  id: string;
  employeeName: string;
  employeeId: string;
  employeePhone: string;
  projectName: string;
  projectDescription: string;
  priority: string;
  startDate: string;
  deadline: string;
  assignedManager: string;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'COMPLETED';
  nextReminderDate: string;
  history: Array<{
    id: string;
    timestamp: string;
    message: string;
    status: 'SENT' | 'DELIVERED' | 'FAILED' | 'PENDING';
    phone: string;
  }>;
}

export default function AutomaticRemindersPage() {
  const [schedules, setSchedules] = useState<ReminderSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  const [triggeringId, setTriggeringId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [newEmployeePhone, setNewEmployeePhone] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newDeadline, setNewDeadline] = useState('2026-07-30');
  const [phoneError, setPhoneError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const router = useRouter();

  const fetchSchedules = async () => {
    try {
      const token = localStorage.getItem('axiom_token');
      if (!token) {
        router.push('/login');
        return;
      }
      const res = await fetch('/api/v1/notifications/reminders/schedules', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSchedules(data);
      }
    } catch (err) {
      console.error('Error loading reminder schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const validatePhone = (num: string): boolean => {
    const cleanNum = num.trim();
    if (!cleanNum) {
      setPhoneError('Phone number is required.');
      return false;
    }
    const phoneRegex = /^\+?[1-9]\d{6,14}$/;
    if (!phoneRegex.test(cleanNum.replace(/[\s\-\(\)]/g, ''))) {
      setPhoneError('Please enter a valid phone number with country code (e.g. +918105670193).');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhone(newEmployeePhone)) return;

    setIsCreating(true);
    try {
      const token = localStorage.getItem('axiom_token');
      const res = await fetch('/api/v1/notifications/reminders/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          employeeName: newEmployeeName,
          employeeId: newEmployeeId,
          employeePhone: newEmployeePhone,
          projectName: newProjectName,
          projectDescription: newProjectDesc,
          deadline: newDeadline,
        }),
      });

      if (res.ok) {
        setActionMessage(
          `Automatic reminder schedule created & initial WhatsApp message sent to ${newEmployeePhone}!`,
        );
        setShowCreateModal(false);
        setNewEmployeeName('');
        setNewEmployeeId('');
        setNewEmployeePhone('');
        setNewProjectName('');
        setNewProjectDesc('');
        fetchSchedules();
        setTimeout(() => setActionMessage(''), 4000);
      }
    } catch (err) {
      console.error('Error creating schedule:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      const token = localStorage.getItem('axiom_token');
      const res = await fetch(`/api/v1/notifications/reminders/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setSchedules((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: newStatus as ReminderSchedule['status'] } : s)),
        );
        setActionMessage(`Schedule ${id} updated to ${newStatus}`);
        setTimeout(() => setActionMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error toggling schedule status:', err);
    }
  };

  const handleManualTrigger = async (schedule: ReminderSchedule) => {
    setTriggeringId(schedule.id);
    try {
      const token = localStorage.getItem('axiom_token');
      const aiTone = localStorage.getItem('axiom_ai_tone') || 'Professional';
      const res = await fetch('/api/v1/notifications/reminders/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          scheduleId: schedule.id,
          phone: schedule.employeePhone,
          aiTone,
        }),
      });

      if (res.ok) {
        setActionMessage(
          `AI WhatsApp reminder triggered successfully to ${schedule.employeePhone}!`,
        );
        fetchSchedules();
        setTimeout(() => setActionMessage(''), 3500);
      }
    } catch (err) {
      console.error('Error triggering AI reminder:', err);
    } finally {
      setTriggeringId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-serif font-black tracking-tight text-[#1c1b18]">
              Automatic Reminders
            </h1>
            <Badge variant="completed">AI Engine Active</Badge>
          </div>
          <p className="text-[#66635d] text-xs font-semibold uppercase tracking-widest">
            Manage automated daily WhatsApp reminder schedules, delivery logs, and AI wording tone.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg shadow-sm border border-[#7d6b4a] text-[9px] font-black uppercase tracking-widest cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ Create Schedule</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSchedules}
            className="rounded-lg border-[#e6e3da] text-[#66635d] hover:bg-[#faf8f5]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Schedules</span>
          </Button>
        </div>
      </div>

      {/* Action Notification Message */}
      {actionMessage && (
        <div className="p-4 bg-[#f0f5f0] border border-[#3e593e]/30 text-[#3e593e] rounded-2xl flex items-center gap-2.5 text-xs font-bold shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4.5 h-4.5 shrink-0 text-[#3e593e]" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 bg-white border border-[#e6e3da]/80 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[#8c7853]">
            <Clock className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#66635d]">
              Active Schedules
            </span>
          </div>
          <div className="text-2xl font-serif font-black text-[#1c1b18]">
            {schedules.filter((s) => s.status === 'ACTIVE').length}
          </div>
        </Card>

        <Card className="p-5 bg-white border border-[#e6e3da]/80 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[#8c7853]">
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#66635d]">
              AI Engine Status
            </span>
          </div>
          <div className="text-2xl font-serif font-black text-[#1c1b18]">Automated</div>
        </Card>

        <Card className="p-5 bg-white border border-[#e6e3da]/80 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[#3e593e]">
            <Send className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#66635d]">
              Reminders Dispatched
            </span>
          </div>
          <div className="text-2xl font-serif font-black text-[#1c1b18]">
            {schedules.reduce((acc, curr) => acc + (curr.history?.length || 0), 0)}
          </div>
        </Card>

        <Card className="p-5 bg-white border border-[#e6e3da]/80 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[#8c7853]">
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#66635d]">
              Next Run
            </span>
          </div>
          <div className="text-sm font-black text-[#1c1b18]">Daily @ 09:00 AM</div>
        </Card>
      </div>

      {/* Schedules List */}
      <div className="space-y-4">
        <h2 className="text-xl font-serif font-black text-[#1c1b18]">
          Scheduled Project Reminders
        </h2>

        {loading ? (
          <div className="py-8 text-xs font-black uppercase tracking-widest text-[#66635d]">
            Loading active schedules...
          </div>
        ) : schedules.length > 0 ? (
          <div className="space-y-4">
            {schedules.map((schedule) => {
              const deadlineDate = new Date(schedule.deadline);
              const daysRemaining = Math.ceil(
                (deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
              );

              return (
                <Card
                  key={schedule.id}
                  className="p-6 bg-white border border-[#e6e3da]/80 rounded-2xl shadow-sm space-y-4"
                >
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-[#e6e3da]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={schedule.status === 'ACTIVE' ? 'progress' : 'proposed'}>
                          {schedule.status}
                        </Badge>
                        <Badge variant="completed">ID: {schedule.employeeId}</Badge>
                      </div>
                      <h3 className="text-lg font-serif font-black text-[#1c1b18]">
                        {schedule.projectName}
                      </h3>
                      <p className="text-xs text-[#66635d] font-semibold max-w-xl">
                        {schedule.projectDescription}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(schedule.id, schedule.status)}
                        className="text-[9px] font-black uppercase tracking-widest border-[#e6e3da] text-[#66635d]"
                      >
                        {schedule.status === 'ACTIVE' ? (
                          <>
                            <Pause className="w-3.5 h-3.5 text-[#9f3a38]" />
                            <span>Pause</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 text-[#3e593e]" />
                            <span>Resume</span>
                          </>
                        )}
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        disabled={triggeringId === schedule.id}
                        onClick={() => handleManualTrigger(schedule)}
                        className="text-[9px] font-black uppercase tracking-widest border border-[#7d6b4a]"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{triggeringId === schedule.id ? 'Sending...' : 'Trigger Now'}</span>
                      </Button>
                    </div>
                  </div>

                  {/* Recipient & Deadline Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#faf8f5] p-4 rounded-xl border border-[#e6e3da] text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-black text-[#66635d] uppercase tracking-widest block">
                        Assigned Employee
                      </span>
                      <div className="font-bold text-[#1c1b18] flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#8c7853]" />
                        <span>{schedule.employeeName}</span>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[9px] font-black text-[#66635d] uppercase tracking-widest block">
                        WhatsApp Recipient Phone
                      </span>
                      <div className="font-bold text-[#1c1b18] flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#8c7853]" />
                        <span>{schedule.employeePhone}</span>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[9px] font-black text-[#66635d] uppercase tracking-widest block">
                        Target Deadline
                      </span>
                      <div className="font-bold text-[#1c1b18] flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#8c7853]" />
                        <span>
                          {schedule.deadline} (
                          {daysRemaining < 0
                            ? `${Math.abs(daysRemaining)} days overdue`
                            : `${daysRemaining} days remaining`}
                          )
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Log History */}
                  {schedule.history && schedule.history.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h4 className="text-[10px] font-black text-[#8c7853] uppercase tracking-widest">
                        Recent Reminder Delivery Logs
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {schedule.history.map((log) => (
                          <div
                            key={log.id}
                            className="p-3 bg-white border border-[#e6e3da] rounded-xl text-xs space-y-1 shadow-sm"
                          >
                            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-[#66635d]">
                              <span>Sent to: {log.phone}</span>
                              <Badge variant="completed">{log.status}</Badge>
                            </div>
                            <p className="text-xs font-semibold text-[#1c1b18] whitespace-pre-line">
                              {log.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-xs font-black uppercase tracking-widest text-[#66635d]">
            No automatic reminder schedules active.
          </div>
        )}
      </div>

      {/* Create Automatic Reminder Schedule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#e6e3da] max-w-lg w-full p-6 space-y-5 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-[#1c1b18]">
            <div className="flex justify-between items-center pb-3 border-b border-[#e6e3da]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#8c7853]/10 border border-[#8c7853]/20 flex items-center justify-center text-[#8c7853]">
                  <Sparkles className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-[#1c1b18] text-base leading-tight">
                    Create Automatic Reminder Schedule
                  </h3>
                  <p className="text-[10px] text-[#66635d] font-semibold uppercase tracking-wider">
                    Initial Message + Daily Automatic AI Reminders
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                type="button"
                className="p-1.5 rounded-lg text-[#66635d] hover:text-[#1c1b18] hover:bg-[#faf8f5] border border-[#e6e3da]/80"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#66635d] uppercase tracking-widest block">
                    Employee Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newEmployeeName}
                    onChange={(e) => setNewEmployeeName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-white border border-[#e6e3da] rounded-xl p-2.5 text-xs font-semibold text-[#1c1b18] focus:border-[#8c7853] focus:outline-none shadow-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#66635d] uppercase tracking-widest block">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={newEmployeeId}
                    onChange={(e) => setNewEmployeeId(e.target.value)}
                    placeholder="e.g. EMP-005"
                    className="w-full bg-white border border-[#e6e3da] rounded-xl p-2.5 text-xs font-semibold text-[#1c1b18] focus:border-[#8c7853] focus:outline-none shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#66635d] uppercase tracking-widest block">
                  WhatsApp Recipient Phone *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c7853]" />
                  <input
                    type="text"
                    required
                    value={newEmployeePhone}
                    onChange={(e) => {
                      setNewEmployeePhone(e.target.value);
                      if (phoneError) validatePhone(e.target.value);
                    }}
                    placeholder="e.g. +918105670193"
                    className={`w-full bg-white border ${
                      phoneError ? 'border-[#9f3a38]' : 'border-[#e6e3da] focus:border-[#8c7853]'
                    } rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-[#1c1b18] focus:outline-none shadow-sm`}
                  />
                </div>
                {phoneError && (
                  <p className="text-[11px] text-[#9f3a38] font-bold flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {phoneError}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#66635d] uppercase tracking-widest block">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="e.g. Mobile Banking Dashboard"
                    className="w-full bg-white border border-[#e6e3da] rounded-xl p-2.5 text-xs font-semibold text-[#1c1b18] focus:border-[#8c7853] focus:outline-none shadow-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#66635d] uppercase tracking-widest block">
                    Target Deadline Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full bg-white border border-[#e6e3da] rounded-xl p-2 text-xs font-semibold text-[#1c1b18] focus:border-[#8c7853] focus:outline-none shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#66635d] uppercase tracking-widest block">
                  Project Description / Context
                </label>
                <textarea
                  rows={2}
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="Describe key deliverables or goals..."
                  className="w-full bg-white border border-[#e6e3da] rounded-xl p-2.5 text-xs font-semibold text-[#1c1b18] focus:border-[#8c7853] focus:outline-none shadow-sm resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#e6e3da]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-[9px] font-black tracking-widest uppercase border-[#e6e3da] text-[#66635d]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isCreating}
                  className="px-4 py-2 text-[9px] font-black tracking-widest uppercase border border-[#7d6b4a] gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isCreating ? 'Creating...' : 'Create & Start Reminders'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
