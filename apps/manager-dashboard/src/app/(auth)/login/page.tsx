'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Lock, Mail, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('mockmanager@useaxiom.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error('Invalid credentials. Please check your email and password.');
      }

      const data = await res.json();
      localStorage.setItem('axiom_token', data.access_token);
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

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white border border-[#e6e3da] mb-6 shadow-sm">
            <Sparkles className="w-6 h-6 text-[#8c7853]" />
          </div>
          <h1 className="text-4xl font-serif font-black tracking-tight text-[#1c1b18] mb-2">
            useAxiom
          </h1>
          <p className="text-[#66635d] text-[10px] font-black uppercase tracking-widest">
            Log in to your manager workspace
          </p>
        </div>

        <div className="bg-white border border-[#e6e3da] p-8 rounded-3xl shadow-[0_15px_40px_-15px_rgba(28,27,24,0.05)]">
          <form onSubmit={handleLogin} className="space-y-5">
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
                  className="w-full bg-white border border-[#e6e3da] rounded-xl py-3 pl-11 pr-4 text-[#1c1b18] placeholder:text-[#a09c94] text-sm focus:outline-none focus:border-[#8c7853] focus:ring-4 focus:ring-[#8c7853]/10 transition-all duration-300 shadow-sm"
                  placeholder="manager@useaxiom.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[#66635d] uppercase tracking-widest block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#66635d]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-[#e6e3da] rounded-xl py-3 pl-11 pr-4 text-[#1c1b18] placeholder:text-[#a09c94] text-sm focus:outline-none focus:border-[#8c7853] focus:ring-4 focus:ring-[#8c7853]/10 transition-all duration-300 shadow-sm"
                  placeholder="••••••••"
                />
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
              className="w-full relative rounded-xl bg-[#8c7853] text-white font-black uppercase text-xs tracking-widest py-3.5 px-4 transition-all duration-300 hover:bg-[#736243] hover:scale-[1.015] hover:shadow-md active:scale-[0.99] border border-[#7d6b4a] disabled:opacity-70 disabled:hover:scale-100 disabled:hover:shadow-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              {!loading && (
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              )}
            </button>
          </form>
          <div className="mt-6 text-center text-xs">
            <span className="text-[#66635d] font-semibold">Need to create an organization? </span>
            <Link
              href="/register"
              className="text-[#8c7853] hover:text-[#736243] font-black tracking-wider uppercase transition-colors"
            >
              Register here
            </Link>
          </div>
        </div>

        <p className="text-center text-[#a09c94] text-[9px] font-black uppercase tracking-widest mt-8">
          Secure Access • useAxiom Platform Foundation
        </p>
      </div>
    </div>
  );
}
