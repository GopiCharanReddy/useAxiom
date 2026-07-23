"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Link2 
} from "lucide-react";
import { Button } from "@useaxiom/ui";
import AIAssistantPanel from "./AIAssistantPanel";

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
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => {
      if (r.status === 401) throw new Error('Unauthorized');
      return r.json();
    })
    .then(data => {
      if (data) setUser(data);
    })
    .catch(err => console.error("Error fetching user profile:", err));
  }, []);

  const initials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) 
    : '??';

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Projects", href: "/projects", icon: FolderKanban },
    { name: "Team Workload", href: "/team", icon: Users },
    ...(user?.role === 'ADMIN' ? [
      { name: "Users & Invites", href: "/admin/users", icon: ShieldAlert },
      { name: "Integrations", href: "/admin/integrations", icon: Link2 },
      { name: "Billing", href: "/admin/billing", icon: CreditCard },
    ] : []),
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800 bg-zinc-900/50 shrink-0 sticky top-0 h-screen">
        <div className="p-6 flex items-center gap-3 border-b border-zinc-800 bg-zinc-900">
          <div className="w-10 h-10 bg-purple-600 flex items-center justify-center rounded-lg shadow-none">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg text-zinc-100 tracking-tight">useAxiom</span>
            <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Manager Port</span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all duration-200 group rounded-xl border ${
                  isActive
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-transparent text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-900/50"
                }`}
              >
                <item.icon className={`w-5 h-5 shrink-0 ${
                  isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
                }`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 font-bold text-sm">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-sm font-bold text-zinc-200 truncate">{user?.name || "Loading..."}</span>
            <span className="block text-xs font-semibold text-zinc-500 truncate">{user?.role || "Manager"} @ {user?.organization?.name || "Axiom"}</span>
          </div>
        </div>
      </aside>

      {/* Sidebar - Mobile drawer */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/80" onClick={() => setIsSidebarOpen(false)} />
          <aside className="fixed top-0 left-0 w-72 h-full bg-zinc-900 border-r border-zinc-800 flex flex-col p-6 animate-in slide-in-from-left duration-200 shadow-none">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 flex items-center justify-center rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg text-zinc-100">useAxiom</span>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-100 font-bold transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1.5">
              {navigation.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all border rounded-xl ${
                      isActive
                        ? "bg-purple-600 text-white border-purple-600"
                        : "bg-transparent text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-800"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="pt-4 border-t border-zinc-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 font-bold">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-sm font-bold truncate">{user?.name || "Loading..."}</span>
                <span className="block text-xs font-semibold text-zinc-500 truncate">{user?.role || "Manager"}</span>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 h-20 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur flex items-center justify-between px-6 sm:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 md:hidden transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            {/* Search Bar */}
            <div className="hidden sm:flex items-center gap-2.5 bg-zinc-950 border border-zinc-850 px-4 py-2.5 w-80 rounded-xl focus-within:border-purple-600/50 transition-all duration-200">
              <Search className="w-5 h-5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search projects, tasks..."
                className="bg-transparent text-sm font-semibold text-zinc-200 placeholder-zinc-500 outline-none w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* AI Assistant Trigger */}
            <button
              onClick={() => setIsAIOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-xl text-white font-bold transition-all duration-200 cursor-pointer shadow-lg shadow-purple-500/10"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ask Axiom</span>
            </button>

            {/* Notification Bell */}
            <button className="p-2.5 bg-zinc-950 border border-zinc-850 hover:border-zinc-700 rounded-xl text-zinc-400 hover:text-zinc-200 transition-all relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            <Link href="/projects?create=true">
              <Button variant="primary" size="sm" className="hidden sm:inline-flex shadow-none border-0 h-11 px-5 rounded-xl">
                <Plus className="w-4 h-4" />
                <span>New Project</span>
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
