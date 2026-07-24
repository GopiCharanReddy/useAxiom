'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { X, Send, Sparkles, Bot, User, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@useaxiom/ui';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: string;
}

interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIAssistantPanel({ isOpen, onClose }: AIAssistantPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      content:
        "Hello! I'm Axiom, your AI project assistant. How can I help you manage your teams and projects today?",
      timestamp: '10:00 AM',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(
    () => [
      'Why is Milestone 2 delayed?',
      'Show tasks blocked on Dave',
      'Ping Sarah for task update',
      'Review draft project plan',
    ],
    [],
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const idCounterRef = useRef(1);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    idCounterRef.current += 1;
    const userMessage: Message = {
      id: `user-msg-${idCounterRef.current}`,
      sender: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const token = localStorage.getItem('axiom_token');
      const res = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: textToSend,
          threadId: 'dashboard-thread',
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(
          errorBody.message || `HTTP ${res.status}: Unable to reach AI chat service.`,
        );
      }

      const data = await res.json();
      idCounterRef.current += 1;

      if (data.projectCreated || data.success) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('axiom_project_created', { detail: data.project }));
        }
      }

      let aiResponseText = '';
      if (data.success) {
        if (typeof data.data === 'string') {
          aiResponseText = data.data;
        } else if (data.data && typeof data.data === 'object') {
          aiResponseText = data.data.reply || data.data.message || JSON.stringify(data.data);
        } else {
          aiResponseText =
            'Hello! I am Axiom Assistant. How can I help you manage your projects today?';
        }
      } else {
        aiResponseText =
          data.error || 'Got it! I am monitoring your projects and active workloads.';
      }

      const aiMessage: Message = {
        id: `ai-msg-${idCounterRef.current}`,
        sender: 'ai',
        content: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: unknown) {
      console.error('Axiom Assistant Error:', err);
      idCounterRef.current += 1;
      const aiMessage: Message = {
        id: `ai-msg-${idCounterRef.current}`,
        sender: 'ai',
        content: 'I am currently initializing. Please try typing your message again in a moment!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Slide-out Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[460px] bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Axiom Assistant</h2>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Autonomous Engine Active
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200/80 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 max-w-[85%] ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                  msg.sender === 'user'
                    ? 'bg-slate-200 border-slate-300 text-slate-800'
                    : 'bg-blue-50 border-blue-100 text-blue-600'
                }`}
              >
                {msg.sender === 'user' ? (
                  <User className="w-3.5 h-3.5" />
                ) : (
                  <Bot className="w-3.5 h-3.5" />
                )}
              </div>
              <div className="flex flex-col gap-1">
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-xs font-medium'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-xs'
                  }`}
                >
                  {msg.content}
                </div>
                <span
                  className={`text-[10px] text-slate-400 px-1 ${
                    msg.sender === 'user' ? 'text-right' : ''
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-2.5 max-w-[85%]">
              <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-2xl rounded-tl-none flex items-center gap-1 shadow-xs">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        {messages.length === 1 && (
          <div className="px-4 py-2 border-t border-slate-200 bg-white">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Suggested Actions
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSend(suggestion)}
                  className="px-2.5 py-1.5 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-lg transition-all text-left font-medium cursor-pointer"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e: React.FormEvent) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
              placeholder="Ask Axiom to reassign, ping, or generate plans..."
              className="flex-1 px-3.5 py-2 bg-white border border-slate-200 focus:border-blue-500 rounded-lg text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-4 focus:ring-blue-500/10 shadow-xs"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="px-3 py-2 rounded-lg shrink-0"
              disabled={!input.trim() || isTyping}
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>
          <div className="mt-2 flex items-center gap-1.5 justify-center">
            <AlertCircle className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] text-slate-500 font-medium">
              Updates are piped to WhatsApp agents automatically.
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
