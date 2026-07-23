'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Mail, Shield, Phone, CheckCircle2 } from 'lucide-react';
import { Button, Card, Badge } from '@useaxiom/ui';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string;
}

export default function UsersAdminPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState('MANAGER');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('axiom_token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (r.status === 401) throw new Error('Unauthorized');
        return r.json();
      })
      .then((data) => {
        if (data.role !== 'ADMIN') {
          // If not an admin, redirect back to projects
          router.push('/projects');
        } else {
          setUserProfile(data);
        }
      })
      .catch(() => {
        localStorage.removeItem('axiom_token');
        router.push('/login');
      });
  }, [router]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    const token = localStorage.getItem('axiom_token');
    if (!token || !userProfile) return;

    try {
      const res = await fetch(`/api/v1/organizations/${userProfile.organizationId}/invite-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: inviteEmail,
          phoneNumber: invitePhone,
          role: inviteRole,
          name: inviteName,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to invite user');
      }

      setMessage('User successfully invited and added to organization!');
      setInviteEmail('');
      setInviteName('');
      setInvitePhone('');
      setInviteRole('MANAGER');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!userProfile) {
    return <div className="text-zinc-500 py-8">Checking credentials...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Users & Invites</h1>
        <p className="text-zinc-400 text-sm">
          Add and manage organization roles, workspace members, and permissions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Invitation Form Card */}
        <Card className="p-6 border-zinc-800 bg-zinc-900/60 rounded-3xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600/10 flex items-center justify-center rounded-xl border border-purple-500/20">
              <UserPlus className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-100 text-lg">Invite New Member</h3>
              <p className="text-xs text-zinc-500">Workspace managers and employees</p>
            </div>
          </div>

          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                required
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-2.5 px-4 text-sm text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-purple-500 transition-all"
                placeholder="Sarah Jenkins"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-purple-500 transition-all"
                  placeholder="sarah@useaxiom.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                WhatsApp Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  required
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-purple-500 transition-all"
                  placeholder="+19998887777"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Workspace Role
              </label>
              <div className="relative">
                <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-200 focus:outline-none focus:border-purple-500 transition-all appearance-none"
                >
                  <option value="MANAGER" className="bg-zinc-950">
                    MANAGER
                  </option>
                  <option value="EMPLOYEE" className="bg-zinc-950">
                    EMPLOYEE
                  </option>
                  <option value="ADMIN" className="bg-zinc-950">
                    ADMIN
                  </option>
                </select>
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-2.5 rounded-xl">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {message}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white font-bold py-2.5 rounded-xl hover:bg-purple-500"
            >
              {loading ? 'Sending invitation...' : 'Send Invitation'}
            </Button>
          </form>
        </Card>

        {/* Informative Side Card */}
        <div className="flex flex-col justify-center space-y-6 bg-zinc-900/30 p-8 rounded-3xl border border-zinc-850">
          <div className="space-y-2">
            <Badge variant="progress">Access Control</Badge>
            <h3 className="font-extrabold text-xl text-zinc-200">How Team Roles Work</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              When you invite a new user, they are registered to your Organization ID.
            </p>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex gap-3">
              <span className="text-purple-400 font-bold shrink-0">ADMIN:</span>
              <span className="text-zinc-400">
                Full platform controls, billing, and invitation capabilities.
              </span>
            </div>
            <div className="flex gap-3">
              <span className="text-purple-400 font-bold shrink-0">MANAGER:</span>
              <span className="text-zinc-400">
                Can create projects, milestones, tasks, and view execution metrics.
              </span>
            </div>
            <div className="flex gap-3">
              <span className="text-purple-400 font-bold shrink-0">EMPLOYEE:</span>
              <span className="text-zinc-400">
                Can be assigned tasks. Receives reminders and reports details strictly via WhatsApp.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
