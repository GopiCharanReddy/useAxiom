'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Settings,
  Sparkles,
  Search,
  Plus,
  Menu,
  X,
  Bell,
  ShieldAlert,
  CreditCard,
  Link2,
} from 'lucide-react';
import { Button } from '@useaxiom/ui';
import AIAssistantPanel from './AIAssistantPanel';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  organization: {
    name: string;
  };
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('axiom_token');
    if (!token) return;

    fetch('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (r.status === 401) throw new Error('Unauthorized');
        return r.json();
      })
      .then((data) => {
        if (data) setUser(data);
      })
      .catch((err) => console.error('Error fetching user profile:', err));
  }, []);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : 'DM';

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'Team Workload', href: '/team', icon: Users },
    ...(user?.role === 'ADMIN'
      ? [
          { name: 'Users & Invites', href: '/admin/users', icon: ShieldAlert },
          { name: 'Integrations', href: '/admin/integrations', icon: Link2 },
          { name: 'Billing', href: '/admin/billing', icon: CreditCard },
        ]
      : []),
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-[#faf8f5] text-[#1c1b18]">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[#e6e3da]/80 bg-white shrink-0 sticky top-0 h-screen shadow-[0_0_20px_-10px_rgba(28,27,24,0.05)]">
        <div className="p-6 flex items-center gap-3 border-b border-[#e6e3da]/80 bg-white">
          <div className="w-9 h-9 bg-[#8c7853] flex items-center justify-center rounded-lg shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-serif font-black text-lg text-[#1c1b18] tracking-tight">
              useAxiom
            </span>
            <span className="block text-[9px] font-black text-[#66635d] tracking-widest uppercase mt-0.5">
              Manager Portal
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest transition-all duration-300 rounded-lg border ${
                  isActive
                    ? 'bg-[#faf8f5] text-[#8c7853] border-[#e6e3da] border-l-4 border-l-[#8c7853] shadow-[0_2px_10px_-4px_rgba(140,120,83,0.1)]'
                    : 'bg-transparent text-[#66635d] border-transparent hover:text-[#1c1b18] hover:bg-[#faf8f5] hover:border-[#e6e3da]/50'
                }`}
              >
                <item.icon
                  className={`w-4 h-4 shrink-0 transition-colors duration-300 ${isActive ? 'text-[#8c7853]' : 'text-[#66635d] group-hover:text-[#1c1b18]'}`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-[#e6e3da]/80 bg-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#8c7853]/10 flex items-center justify-center text-[#8c7853] font-serif font-black text-sm">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-xs font-black text-[#1c1b18] truncate">
              {user?.name || 'David Miller'}
            </span>
            <span className="block text-[10px] font-bold text-[#66635d] truncate uppercase tracking-wider">
              {user?.role || 'Manager'} @ {user?.organization?.name || 'Axiom'}
            </span>
          </div>
        </div>
      </aside>

      {/* Sidebar - Mobile drawer */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-[#1c1b18]/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />
          <aside className="fixed top-0 left-0 w-72 h-full bg-white border-r border-[#e6e3da] flex flex-col p-6 animate-in slide-in-from-left duration-300 shadow-xl">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#e6e3da]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#8c7853] flex items-center justify-center rounded-lg">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-serif font-black text-lg text-[#1c1b18]">useAxiom</span>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 bg-[#f2efe9] hover:bg-[#e6e3da] text-[#1c1b18] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 space-y-1.5">
              {navigation.map((item) => {
                const isActive =
                  pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest transition-all rounded-lg border ${
                      isActive
                        ? 'bg-[#faf8f5] text-[#8c7853] border-[#e6e3da] border-l-4 border-l-[#8c7853]'
                        : 'bg-transparent text-[#66635d] border-transparent hover:text-[#1c1b18] hover:bg-[#faf8f5]'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="pt-4 border-t border-[#e6e3da] flex items-center gap-3">
              <div className="w-10 h-10 bg-[#8c7853]/10 text-[#8c7853] rounded-lg flex items-center justify-center font-serif font-black">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-xs font-black truncate">
                  {user?.name || 'David Miller'}
                </span>
                <span className="block text-[10px] font-bold text-[#66635d] truncate uppercase tracking-wider">
                  {user?.role || 'Manager'}
                </span>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 h-20 border-b border-[#e6e3da]/80 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 sm:px-8 shadow-[0_2px_15px_-10px_rgba(28,27,24,0.02)]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 bg-[#f2efe9] hover:bg-[#e6e3da] text-[#1c1b18] md:hidden rounded-lg transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* Search Bar */}
            <div className="hidden sm:flex items-center gap-2.5 bg-white border border-[#e6e3da] rounded-lg px-4 py-2 w-80 focus-within:border-[#8c7853] focus-within:ring-4 focus-within:ring-[#8c7853]/10 transition-all duration-300 shadow-sm">
              <Search className="w-4 h-4 text-[#66635d]" />
              <input
                type="text"
                placeholder="Search campaigns, tasks..."
                className="bg-transparent text-xs font-bold text-[#1c1b18] placeholder-[#a09c94] outline-none w-full uppercase tracking-wider"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* AI Assistant Trigger */}
            <button
              onClick={() => setIsAIOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#8c7853] to-[#bda272] hover:opacity-90 active:scale-95 text-white font-black text-[10px] uppercase tracking-widest rounded-lg shadow-sm hover:shadow transition-all duration-300 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask Axiom</span>
            </button>

            {/* Notification Bell */}
            <button className="h-10 w-10 bg-white border border-[#e6e3da] hover:border-[#8c7853] text-[#1c1b18] rounded-lg flex items-center justify-center transition-all duration-300 cursor-pointer shadow-sm relative">
              <Bell className="w-4 h-4 text-[#66635d]" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#9f3a38] rounded-full" />
            </button>

            <Link href="/projects" className="hidden sm:inline-block">
              <Button
                variant="primary"
                size="sm"
                className="h-10 px-4 font-black tracking-widest text-[10px] uppercase shadow-sm border border-[#7d6b4a]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Campaign</span>
              </Button>
            </Link>
          </div>
        </header>

        {/* Dynamic Page Container */}
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Global AI Assistant Slideout */}
      <AIAssistantPanel isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />
    </div>
  );
}
