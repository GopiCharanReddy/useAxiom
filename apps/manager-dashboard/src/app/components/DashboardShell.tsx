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
  Clock,
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

    // Fast path: load cached user profile from sessionStorage
    const cachedUser = sessionStorage.getItem('axiom_user_profile');
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch (e) {
        // Fallthrough to fetch
      }
    }

    fetch('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (r.status === 401) throw new Error('Unauthorized');
        return r.json();
      })
      .then((data) => {
        if (data) {
          setUser(data);
          sessionStorage.setItem('axiom_user_profile', JSON.stringify(data));
        }
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
    { name: 'Automatic Reminders', href: '/reminders', icon: Clock },
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
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 bg-white shrink-0 sticky top-0 h-screen shadow-xs">
        <div className="p-5 flex items-center gap-3 border-b border-slate-200 bg-white">
          <div className="w-8 h-8 bg-blue-600 flex items-center justify-center rounded-lg shadow-xs">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-base text-slate-900 tracking-tight">useAxiom</span>
            <span className="block text-[10px] font-semibold text-slate-500 tracking-wider uppercase mt-0.5">
              Manager Portal
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-5 space-y-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={true}
                className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold tracking-wide transition-all duration-200 rounded-lg border ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-blue-100 border-l-4 border-l-blue-600 shadow-xs'
                    : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <item.icon
                  className={`w-4 h-4 shrink-0 transition-colors duration-200 ${isActive ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-900'}`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs border border-blue-100">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-xs font-bold text-slate-900 truncate">
              {user?.name || 'David Miller'}
            </span>
            <span className="block text-[10px] font-medium text-slate-500 truncate tracking-wide">
              {user?.role || 'Manager'} @ {user?.organization?.name || 'Axiom'}
            </span>
          </div>
        </div>
      </aside>

      {/* Sidebar - Mobile drawer */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setIsSidebarOpen(false)}
          />
          <aside className="fixed top-0 left-0 w-72 h-full bg-white border-r border-slate-200 flex flex-col p-6 animate-in slide-in-from-left duration-200 shadow-xl">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 flex items-center justify-center rounded-lg">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-base text-slate-900">useAxiom</span>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="flex-1 space-y-1">
              {navigation.map((item) => {
                const isActive =
                  pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    prefetch={true}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold tracking-wide transition-all rounded-lg border ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-blue-100 border-l-4 border-l-blue-600'
                        : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="pt-4 border-t border-slate-200 flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg flex items-center justify-center font-bold text-xs">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-xs font-bold text-slate-900 truncate">
                  {user?.name || 'David Miller'}
                </span>
                <span className="block text-[10px] font-medium text-slate-500 truncate tracking-wide">
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
        <header className="sticky top-0 z-30 h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md flex items-center justify-between px-6 sm:px-8 shadow-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 md:hidden rounded-lg transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* Search Bar */}
            <div className="hidden sm:flex items-center gap-2.5 bg-white border border-slate-200 rounded-lg px-3.5 py-1.5 w-80 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all duration-200 shadow-xs">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects, tasks..."
                className="bg-transparent text-xs font-medium text-slate-900 placeholder-slate-400 outline-none w-full tracking-wide"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* AI Assistant Trigger */}
            <button
              onClick={() => setIsAIOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs tracking-wide rounded-lg shadow-xs transition-all duration-200 cursor-pointer border border-blue-600"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              <span>Ask Axiom</span>
            </button>

            {/* Notification Bell */}
            <button className="h-9 w-9 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xs relative">
              <Bell className="w-4 h-4 text-slate-600" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full" />
            </button>

            <Link href="/projects" className="hidden sm:inline-block">
              <Button
                variant="primary"
                size="sm"
                className="h-9 px-3.5 font-semibold text-xs shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Project Goal</span>
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
