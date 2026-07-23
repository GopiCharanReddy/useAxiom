'use client';

import { useState, useRef, useEffect } from 'react';
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

  const suggestions = [
    'Why is Milestone 2 delayed?',
    'Show tasks blocked on Dave',
    'Ping Sarah for task update',
    'Review draft project plan',
  ];

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
        throw new Error('Chat service returned an error');
      }

      const data = await res.json();
      idCounterRef.current += 1;

      let aiResponseText = '';
      if (data.success) {
        aiResponseText = data.data;
      } else {
        aiResponseText = `Error: ${data.error || 'Failed to process chat query'}`;
      }

      const aiMessage: Message = {
        id: `ai-msg-${idCounterRef.current}`,
        sender: 'ai',
        content: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: unknown) {
      console.error(err);
      idCounterRef.current += 1;
      const messageText = err instanceof Error ? err.message : 'Unknown error';
      const aiMessage: Message = {
        id: `ai-msg-${idCounterRef.current}`,
        sender: 'ai',
        content: `Could not connect to the AI engine: ${messageText}`,
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
        className={`fixed top-0 right-0 h-full w-full sm:w-[480px] bg-zinc-950 border-l border-zinc-800 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div>
              <h2 className="font-semibold text-zinc-100 text-sm">Axiom Assistant</h2>
              <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Autonomous Engine Active
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                  msg.sender === 'user'
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-200'
                    : 'bg-purple-950/40 border-purple-800/40 text-purple-400'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className="flex flex-col gap-1">
                <div
                  className={`p-3 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-purple-600 text-white rounded-tr-none'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none'
                  }`}
                >
                  {msg.content}
                </div>
                <span
                  className={`text-[10px] text-zinc-500 px-1 ${
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
              <div className="w-8 h-8 rounded-lg bg-purple-950/40 border border-purple-800/40 text-purple-400 flex items-center justify-center shrink-0">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-none flex items-center gap-1">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        {messages.length === 1 && (
          <div className="px-4 pb-2">
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Suggested Actions
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSend(suggestion)}
                  className="px-2.5 py-1.5 text-xs text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/20">
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
              className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500/30"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="px-3 py-2.5 rounded-xl shrink-0"
              disabled={!input.trim() || isTyping}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <div className="mt-2 flex items-center gap-1.5 justify-center">
            <AlertCircle className="w-3 h-3 text-zinc-500" />
            <span className="text-[10px] text-zinc-500">
              Updates are piped to WhatsApp agents automatically.
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
