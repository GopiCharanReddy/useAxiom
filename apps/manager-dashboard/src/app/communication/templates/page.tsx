'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Search,
  Copy,
  Trash2,
  Eye,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@useaxiom/ui';
import { authFetch } from '../../../lib/auth-fetch';

interface Template {
  id: string;
  name: string;
  description?: string;
  eventType: string;
  channel: string;
  body: string;
  subject?: string;
  isActive: boolean;
  isDefault: boolean;
  category?: string;
  updatedAt: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Preview Modal
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [previewResult, setPreviewResult] = useState<string | null>(null);

  // New Template Modal state
  const [showCreate, setShowCreate] = useState(false);
  const [newForm, setNewForm] = useState({
    name: '',
    description: '',
    eventType: 'PROJECT_CREATED',
    channel: 'WHATSAPP',
    body: '',
    category: 'General',
  });

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/v1/communication/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error('Error loading templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleToggleActive = async (id: string, current: boolean) => {
    const endpoint = current ? 'disable' : 'enable';
    await authFetch(`/api/v1/communication/templates/${id}/${endpoint}`, {
      method: 'POST',
    });
    fetchTemplates();
  };

  const handleDuplicate = async (id: string) => {
    await authFetch(`/api/v1/communication/templates/${id}/duplicate`, {
      method: 'POST',
    });
    fetchTemplates();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    await authFetch(`/api/v1/communication/templates/${id}`, {
      method: 'DELETE',
    });
    fetchTemplates();
  };

  const handlePreview = async (template: Template) => {
    setPreviewTemplate(template);
    const res = await authFetch(`/api/v1/communication/templates/${template.id}/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (res.ok) {
      const data = await res.json();
      setPreviewResult(data.renderedBody);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await authFetch('/api/v1/communication/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newForm),
    });
    if (res.ok) {
      setShowCreate(false);
      setNewForm({
        name: '',
        description: '',
        eventType: 'PROJECT_CREATED',
        channel: 'WHATSAPP',
        body: '',
        category: 'General',
      });
      fetchTemplates();
    }
  };

  const filtered = templates.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.body.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || t.category === categoryFilter;
    const matchesChannel = channelFilter === 'ALL' || t.channel === channelFilter;
    return matchesSearch && matchesCategory && matchesChannel;
  });

  const categories = Array.from(new Set(templates.map((t) => t.category).filter(Boolean)));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#e6e3da] pb-6">
          <div className="flex items-center gap-3">
            <Link href="/communication">
              <button className="p-2 bg-white border border-[#e6e3da] hover:bg-[#faf8f5] rounded-xl text-[#1c1b18] cursor-pointer">
                <ArrowLeft className="w-4 h-4" />
              </button>
            </Link>
            <div>
              <h1 className="text-xl font-serif font-black text-[#1c1b18]">
                Message Templates
              </h1>
              <p className="text-xs text-[#66635d]">
                Manage notification templates with variable placeholders (&#123;&#123;employeeName&#125;&#125;, &#123;&#123;projectName&#125;&#125;, etc.)
              </p>
            </div>
          </div>

          <Button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-wider bg-[#8c7853] text-white px-4 py-2 rounded-xl cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Template
          </Button>
        </div>

        {/* Filters bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between bg-white p-4 border border-[#e6e3da] rounded-2xl shadow-sm">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#66635d] absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search templates by name or content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#faf8f5] border border-[#e6e3da] rounded-xl text-xs text-[#1c1b18] focus:outline-none focus:border-[#8c7853]"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="px-3 py-2 bg-[#faf8f5] border border-[#e6e3da] rounded-xl text-xs font-bold text-[#1c1b18] focus:outline-none"
            >
              <option value="ALL">All Channels</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
              <option value="IN_APP">In-App</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-[#faf8f5] border border-[#e6e3da] rounded-xl text-xs font-bold text-[#1c1b18] focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c as string}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="py-12 text-center text-xs text-[#66635d]">Loading templates...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-white border border-[#e6e3da] rounded-2xl text-xs text-[#66635d] space-y-3">
            <FileText className="w-8 h-8 text-[#8c7853] mx-auto" />
            <p className="font-bold">No templates found</p>
            <p>Click &quot;Create Template&quot; or click &quot;Seed Default Templates&quot; from the main Communication Center dashboard.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((t) => (
              <div
                key={t.id}
                className="bg-white border border-[#e6e3da] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-serif font-black text-[#1c1b18]">
                        {t.name}
                      </span>
                      {t.isDefault && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[9px] font-black uppercase tracking-wider">
                          System Default
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleToggleActive(t.id, t.isActive)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer ${
                        t.isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {t.isActive ? 'Active' : 'Disabled'}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 bg-[#8c7853]/10 text-[#8c7853] rounded text-[10px] font-black uppercase tracking-wider">
                      {t.channel}
                    </span>
                    <span className="text-[10px] font-bold text-[#66635d] uppercase tracking-wider">
                      Event: {t.eventType}
                    </span>
                  </div>

                  {t.description && (
                    <p className="text-xs text-[#66635d] mb-3">{t.description}</p>
                  )}

                  <div className="p-3 bg-[#faf8f5] border border-[#e6e3da] rounded-xl text-xs font-mono text-[#1c1b18] whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {t.body}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-[#e6e3da] flex items-center justify-between text-xs">
                  <button
                    onClick={() => handlePreview(t)}
                    className="flex items-center gap-1 text-[#8c7853] font-bold hover:underline cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleDuplicate(t.id)}
                      className="text-[#66635d] hover:text-[#1c1b18] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" /> Duplicate
                    </button>
                    {!t.isDefault && (
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="text-red-600 hover:text-red-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Preview Modal */}
        {previewTemplate && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-[#e6e3da] rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#e6e3da] pb-3">
                <h3 className="font-serif font-black text-base text-[#1c1b18]">
                  Template Preview: {previewTemplate.name}
                </h3>
                <button onClick={() => setPreviewTemplate(null)} className="text-[#66635d] font-bold cursor-pointer">✕</button>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-[#66635d]">Rendered Output (Sample Variables):</span>
                <div className="p-4 bg-[#faf8f5] border border-[#e6e3da] rounded-xl text-xs text-[#1c1b18] whitespace-pre-wrap font-sans leading-relaxed">
                  {previewResult}
                </div>
              </div>

              <div className="text-right">
                <Button onClick={() => setPreviewTemplate(null)} className="bg-[#8c7853] text-white text-xs px-4 py-2 rounded-xl cursor-pointer">
                  Close Preview
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Create Template Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <form onSubmit={handleCreate} className="bg-white border border-[#e6e3da] rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#e6e3da] pb-3">
                <h3 className="font-serif font-black text-base text-[#1c1b18]">
                  Create New Template
                </h3>
                <button type="button" onClick={() => setShowCreate(false)} className="text-[#66635d] font-bold cursor-pointer">✕</button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-[#1c1b18] mb-1">Template Name</label>
                  <input
                    type="text"
                    required
                    value={newForm.name}
                    onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                    placeholder="e.g. Custom Task Assigned Alert"
                    className="w-full px-3 py-2 border border-[#e6e3da] rounded-xl focus:outline-none focus:border-[#8c7853]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#1c1b18] mb-1">Channel</label>
                    <select
                      value={newForm.channel}
                      onChange={(e) => setNewForm({ ...newForm, channel: e.target.value })}
                      className="w-full px-3 py-2 border border-[#e6e3da] rounded-xl focus:outline-none"
                    >
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="EMAIL">Email</option>
                      <option value="SMS">SMS</option>
                      <option value="IN_APP">In-App</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#1c1b18] mb-1">Event Type</label>
                    <select
                      value={newForm.eventType}
                      onChange={(e) => setNewForm({ ...newForm, eventType: e.target.value })}
                      className="w-full px-3 py-2 border border-[#e6e3da] rounded-xl focus:outline-none"
                    >
                      <option value="PROJECT_CREATED">PROJECT_CREATED</option>
                      <option value="PROJECT_UPDATED">PROJECT_UPDATED</option>
                      <option value="PROJECT_COMPLETED">PROJECT_COMPLETED</option>
                      <option value="TASK_CREATED">TASK_CREATED</option>
                      <option value="TASK_ASSIGNED">TASK_ASSIGNED</option>
                      <option value="TASK_COMPLETED">TASK_COMPLETED</option>
                      <option value="EMPLOYEE_ADDED">EMPLOYEE_ADDED</option>
                      <option value="EMPLOYEE_REMOVED">EMPLOYEE_REMOVED</option>
                      <option value="GOAL_CREATED">GOAL_CREATED</option>
                      <option value="MANUAL_NOTIFICATION">MANUAL_NOTIFICATION</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#1c1b18] mb-1">Template Body</label>
                  <textarea
                    required
                    rows={4}
                    value={newForm.body}
                    onChange={(e) => setNewForm({ ...newForm, body: e.target.value })}
                    placeholder="Hello {{employeeName}}, task {{taskName}} has been created!"
                    className="w-full px-3 py-2 border border-[#e6e3da] rounded-xl focus:outline-none font-mono"
                  />
                  <span className="text-[10px] text-[#66635d] mt-1 block">
                    Supported tokens: &#123;&#123;employeeName&#125;&#125;, &#123;&#123;projectName&#125;&#125;, &#123;&#123;taskName&#125;&#125;, &#123;&#123;deadline&#125;&#125;, &#123;&#123;portalLink&#125;&#125;
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e6e3da]">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 border border-[#e6e3da] text-xs font-bold rounded-xl hover:bg-[#faf8f5] cursor-pointer"
                >
                  Cancel
                </button>
                <Button type="submit" className="bg-[#8c7853] text-white text-xs px-4 py-2 rounded-xl cursor-pointer">
                  Save Template
                </Button>
              </div>
            </form>
          </div>
        )}
    </div>
  );
}
