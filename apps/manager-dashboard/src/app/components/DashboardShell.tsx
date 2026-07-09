"use client";

import { useState } from "react";
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
  User, 
  Bell 
} from "lucide-react";
import { Button } from "@useaxiom/ui";
import AIAssistantPanel from "./AIAssistantPanel";

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Projects", href: "/projects", icon: FolderKanban },
    { name: "Team Workload", href: "/team", icon: Users },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800 bg-zinc-900/30 shrink-0 sticky top-0 h-screen">
        <div className="p-6 flex items-center gap-2 border-b border-zinc-800 bg-zinc-900/10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-base bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400">useAxiom</span>
            <span className="block text-[10px] font-semibold text-purple-400 uppercase tracking-widest leading-none mt-0.5">Manager Port</span>
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
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-purple-600/10 text-purple-400 border border-purple-500/20 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent"
                }`}
              >
                <item.icon className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? "text-purple-400" : "text-zinc-500 group-hover:text-zinc-300"
                }`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-300">
            <User className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-xs font-semibold text-zinc-200 truncate">David Miller</span>
            <span className="block text-[10px] text-zinc-500 truncate">Project Lead @ Org A</span>
          </div>
        </div>
      </aside>

      {/* Sidebar - Mobile drawer */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
          <aside className="fixed top-0 left-0 w-64 h-full bg-zinc-900 border-r border-zinc-800 flex flex-col p-6 shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-sm">useAxiom</span>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400">
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
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-purple-600/10 text-purple-400 border border-purple-500/20"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="pt-4 border-t border-zinc-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-850 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-xs font-semibold truncate">David Miller</span>
                <span className="block text-[10px] text-zinc-500 truncate">Project Lead</span>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 border-b border-zinc-850 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 rounded-lg hover:bg-zinc-900 text-zinc-400 md:hidden transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* Search Bar - Mocked */}
            <div className="hidden sm:flex items-center gap-2.5 bg-zinc-900/60 border border-zinc-850 px-3.5 py-1.5 rounded-xl w-72 focus-within:border-zinc-700/60 transition-all duration-200">
              <Search className="w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search projects, tasks..."
                className="bg-transparent text-xs text-zinc-200 placeholder-zinc-500 outline-none w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* AI Assistant Trigger */}
            <button
              onClick={() => setIsAIOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/30 hover:bg-purple-950/50 text-purple-400 border border-purple-900/30 hover:border-purple-800/50 text-xs font-semibold transition-all duration-200 shadow-lg shadow-purple-950/10 cursor-pointer animate-pulse"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask Axiom</span>
            </button>

            {/* Notification Bell - Mocked */}
            <button className="p-2 rounded-xl bg-zinc-900/60 border border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-850 transition-all relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-purple-500 rounded-full animate-ping" />
            </button>

            <Link href="/projects">
              <Button variant="primary" size="sm" className="hidden sm:inline-flex rounded-xl font-semibold shadow-purple-500/10">
                <Plus className="w-4 h-4" />
                <span>New Project</span>
              </Button>
            </Link>
          </div>
        </header>

        {/* Dynamic Page Container */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Global AI Assistant Slideout */}
      <AIAssistantPanel isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />
    </div>
  );
}
