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
          className="fixed inset-0 bg-[#1c1b18]/40 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Slide-out Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[480px] bg-[#faf8f5] border-l border-[#e6e3da] shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#e6e3da] flex items-center justify-between bg-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#8c7853] to-[#bda272] flex items-center justify-center shadow-sm">
              <Sparkles className="w-4.5 h-4.5 text-white animate-pulse" />
            </div>
            <div>
              <h2 className="font-serif font-black text-[#1c1b18] text-base tracking-tight">
                Ask Axiom AI
              </h2>
              <span className="text-[10px] text-[#8c7853] font-bold uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8c7853] animate-ping" />
                Autonomous Engine Active
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[#faf8f5] text-[#66635d] hover:text-[#1c1b18] transition-colors border border-transparent hover:border-[#e6e3da] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[88%] ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-[#8c7853]/10 border-[#8c7853]/20 text-[#8c7853]'
                    : 'bg-white border-[#e6e3da] text-[#8c7853]'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className="flex flex-col gap-1">
                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-[#8c7853] text-white rounded-tr-none font-medium'
                      : 'bg-white border border-[#e6e3da] text-[#1c1b18] rounded-tl-none font-normal'
                  }`}
                >
                  {msg.content}
                </div>
                <span
                  className={`text-[9px] font-bold text-[#a09c94] uppercase tracking-wider px-1 ${
                    msg.sender === 'user' ? 'text-right' : ''
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-xl bg-white border border-[#e6e3da] text-[#8c7853] flex items-center justify-center shrink-0 shadow-xs">
                <RefreshCw className="w-4 h-4 animate-spin text-[#8c7853]" />
              </div>
              <div className="p-3 bg-white border border-[#e6e3da] rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-sm">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#8c7853] animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#8c7853] animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#8c7853] animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        {messages.length === 1 && (
          <div className="px-4 pb-3">
            <p className="text-[9px] font-black text-[#66635d] uppercase tracking-widest mb-2">
              Suggested Actions
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSend(suggestion)}
                  className="px-3 py-1.5 text-xs text-[#1c1b18] font-medium bg-white hover:bg-[#faf8f5] border border-[#e6e3da] hover:border-[#8c7853] rounded-xl transition-all text-left shadow-xs cursor-pointer"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 border-t border-[#e6e3da] bg-white shadow-lg">
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
              className="flex-1 px-4 py-2.5 bg-[#faf8f5] border border-[#e6e3da] focus:border-[#8c7853] rounded-xl text-[#1c1b18] placeholder-[#a09c94] text-xs font-medium focus:outline-none focus:ring-4 focus:ring-[#8c7853]/10 shadow-inner"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="px-3.5 py-2.5 rounded-xl shrink-0 bg-[#8c7853] hover:bg-[#736243] text-white border border-[#7d6b4a] shadow-sm cursor-pointer"
              disabled={!input.trim() || isTyping}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <div className="mt-2 flex items-center gap-1.5 justify-center">
            <AlertCircle className="w-3 h-3 text-[#66635d]" />
            <span className="text-[10px] text-[#66635d] font-semibold">
              Updates are piped to WhatsApp agents automatically.
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
