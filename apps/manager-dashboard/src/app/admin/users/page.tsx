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
    return <div className="text-[#66635d] text-xs font-black uppercase tracking-widest py-8">Checking credentials...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <div className="space-y-1">
        <h1 className="text-3xl font-serif font-black tracking-tight text-[#1c1b18]">Users & Invites</h1>
        <p className="text-[#66635d] text-xs font-semibold uppercase tracking-widest">
          Add and manage organization roles, workspace members, and permissions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Invitation Form Card */}
        <Card className="p-6 border border-[#e6e3da]/80 bg-white rounded-2xl shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#8c7853]/10 flex items-center justify-center rounded-xl border border-[#8c7853]/20">
              <UserPlus className="w-5 h-5 text-[#8c7853]" />
            </div>
            <div>
              <h3 className="font-serif font-black text-[#1c1b18] text-lg">Invite New Member</h3>
              <p className="text-xs text-[#8c7853] font-semibold">Workspace managers and employees</p>
            </div>
          </div>

          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[#66635d] uppercase tracking-widest block">
                Full Name
              </label>
              <input
                type="text"
                required
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="w-full bg-white border border-[#e6e3da] rounded-xl py-2.5 px-4 text-sm text-[#1c1b18] placeholder:text-[#a09c94] focus:outline-none focus:border-[#8c7853] focus:ring-4 focus:ring-[#8c7853]/10 transition-all duration-300 shadow-sm"
                placeholder="Sarah Jenkins"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[#66635d] uppercase tracking-widest block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#66635d]" />
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-white border border-[#e6e3da] rounded-xl py-2.5 pl-11 pr-4 text-sm text-[#1c1b18] placeholder:text-[#a09c94] focus:outline-none focus:border-[#8c7853] focus:ring-4 focus:ring-[#8c7853]/10 transition-all duration-300 shadow-sm"
                  placeholder="sarah@useaxiom.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[#66635d] uppercase tracking-widest block">
                WhatsApp Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#66635d]" />
                <input
                  type="text"
                  required
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  className="w-full bg-white border border-[#e6e3da] rounded-xl py-2.5 pl-11 pr-4 text-sm text-[#1c1b18] placeholder:text-[#a09c94] focus:outline-none focus:border-[#8c7853] focus:ring-4 focus:ring-[#8c7853]/10 transition-all duration-300 shadow-sm"
                  placeholder="+19998887777"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[#66635d] uppercase tracking-widest block">
                Workspace Role
              </label>
              <div className="relative">
                <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#66635d]" />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-white border border-[#e6e3da] rounded-xl py-2.5 pl-11 pr-4 text-sm text-[#1c1b18] focus:outline-none focus:border-[#8c7853] focus:ring-4 focus:ring-[#8c7853]/10 transition-all duration-300 shadow-sm appearance-none"
                >
                  <option value="MANAGER">MANAGER</option>
                  <option value="EMPLOYEE">EMPLOYEE</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="bg-[#fdf2f2] border border-[#fcdada] text-[#9f3a38] text-xs font-bold px-4 py-2.5 rounded-xl">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-[#f0f5f0] border border-[#d5ebd5] text-[#3e593e] text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {message}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#8c7853] text-white font-black uppercase text-xs tracking-widest py-3.5 rounded-xl hover:bg-[#736243] border border-[#7d6b4a] shadow-sm cursor-pointer"
            >
              {loading ? 'Sending invitation...' : 'Send Invitation'}
            </Button>
          </form>
        </Card>

        {/* Informative Side Card */}
        <div className="flex flex-col justify-center space-y-6 bg-white p-8 rounded-2xl border border-[#e6e3da]/80 shadow-sm">
          <div className="space-y-2">
            <Badge variant="progress">Access Control</Badge>
            <h3 className="font-serif font-black text-xl text-[#1c1b18]">How Team Roles Work</h3>
            <p className="text-[#66635d] text-xs font-semibold leading-relaxed">
              When you invite a new user, they are registered to your Organization ID.
            </p>
          </div>

          <div className="space-y-4 text-xs font-bold">
            <div className="flex gap-3">
              <span className="text-[#8c7853] font-black shrink-0">ADMIN:</span>
              <span className="text-[#66635d]">
                Full platform controls, billing, and invitation capabilities.
              </span>
            </div>
            <div className="flex gap-3">
              <span className="text-[#8c7853] font-black shrink-0">MANAGER:</span>
              <span className="text-[#66635d]">
                Can create projects, milestones, tasks, and view execution metrics.
              </span>
            </div>
            <div className="flex gap-3">
              <span className="text-[#8c7853] font-black shrink-0">EMPLOYEE:</span>
              <span className="text-[#66635d]">
                Can be assigned tasks. Receives reminders and reports details strictly via WhatsApp.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
