'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Lock, Mail, ArrowRight, Building2, User, Phone, Shield } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const [organizationName, setOrganizationName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('MANAGER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName,
          name,
          email,
          password,
          phoneNumber,
          role,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create account. Please check inputs.');
      }

      const data = await res.json();
      localStorage.setItem('axiom_token', data.access_token);
      // Set cookie for middleware access
      document.cookie = `axiom_token=${data.access_token}; path=/; max-age=604800; SameSite=Lax`;
      router.push('/projects');
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

  return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Soft Architectural Glow elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#8c7853]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#bda272]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 my-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white border border-[#e6e3da] mb-4 shadow-sm">
            <Activity className="w-6 h-6 text-[#8c7853]" />
          </div>
          <h1 className="text-3xl font-serif font-black tracking-tight text-[#1c1b18] mb-1">
            Create Organization
          </h1>
          <p className="text-[#66635d] text-[10px] font-black uppercase tracking-widest">
            Set up your workspace & manager profile
          </p>
        </div>

        <div className="bg-white border border-[#e6e3da] p-8 rounded-3xl shadow-[0_15px_40px_-15px_rgba(28,27,24,0.05)]">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[#66635d] uppercase tracking-widest block">
                Organization Name
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#66635d]" />
                <input
                  type="text"
                  required
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="w-full bg-white border border-[#e6e3da] rounded-xl py-2.5 pl-11 pr-4 text-[#1c1b18] placeholder:text-[#a09c94] text-sm focus:outline-none focus:border-[#8c7853] focus:ring-4 focus:ring-[#8c7853]/10 transition-all duration-300 shadow-sm"
                  placeholder="e.g. Axiom Core Labs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[#66635d] uppercase tracking-widest block">
                Admin Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#66635d]" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-[#e6e3da] rounded-xl py-2.5 pl-11 pr-4 text-[#1c1b18] placeholder:text-[#a09c94] text-sm focus:outline-none focus:border-[#8c7853] focus:ring-4 focus:ring-[#8c7853]/10 transition-all duration-300 shadow-sm"
                  placeholder="Jane Doe"
                />
              </div>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-[#e6e3da] rounded-xl py-2.5 pl-11 pr-4 text-[#1c1b18] placeholder:text-[#a09c94] text-sm focus:outline-none focus:border-[#8c7853] focus:ring-4 focus:ring-[#8c7853]/10 transition-all duration-300 shadow-sm"
                  placeholder="admin@useaxiom.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[#66635d] uppercase tracking-widest block">
                Password (Min. 6 chars)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#66635d]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-[#e6e3da] rounded-xl py-2.5 pl-11 pr-4 text-[#1c1b18] placeholder:text-[#a09c94] text-sm focus:outline-none focus:border-[#8c7853] focus:ring-4 focus:ring-[#8c7853]/10 transition-all duration-300 shadow-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[#66635d] uppercase tracking-widest block">
                Phone Number (with WhatsApp Country Code)
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#66635d]" />
                <input
                  type="text"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-white border border-[#e6e3da] rounded-xl py-2.5 pl-11 pr-4 text-[#1c1b18] placeholder:text-[#a09c94] text-sm focus:outline-none focus:border-[#8c7853] focus:ring-4 focus:ring-[#8c7853]/10 transition-all duration-300 shadow-sm"
                  placeholder="+19998887777"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[#66635d] uppercase tracking-widest block">
                Register as:
              </label>
              <div className="relative">
                <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#66635d]" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-white border border-[#e6e3da] rounded-xl py-2.5 pl-11 pr-4 text-[#1c1b18] text-sm focus:outline-none focus:border-[#8c7853] focus:ring-4 focus:ring-[#8c7853]/10 transition-all duration-300 shadow-sm appearance-none"
                >
                  <option value="MANAGER">MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="bg-[#fdf2f2] border border-[#fcdada] text-[#9f3a38] text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#9f3a38]" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full relative rounded-xl bg-[#8c7853] text-white font-black uppercase text-xs tracking-widest py-3.5 px-4 transition-all duration-300 hover:bg-[#736243] hover:scale-[1.015] hover:shadow-md active:scale-[0.99] border border-[#7d6b4a] disabled:opacity-70 disabled:hover:scale-100 disabled:hover:shadow-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-4"
            >
              <span>{loading ? 'Creating Organization...' : 'Sign Up'}</span>
              {!loading && (
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs">
            <span className="text-[#66635d] font-semibold">Already have an organization? </span>
            <Link
              href="/login"
              className="text-[#8c7853] hover:text-[#736243] font-black tracking-wider uppercase transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>

        <p className="text-center text-[#a09c94] text-[9px] font-black uppercase tracking-widest mt-6">
          Workspace Initializer • useAxiom Platform Foundation
        </p>
      </div>
    </div>
  );
}
