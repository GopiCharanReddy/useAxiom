import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  id?: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose?: () => void;
}

export function Toast({ message, type = 'info', duration = 4000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!visible) return null;

  const styles = {
    success: 'bg-[#f0f5f0] border-[#d5ebd5] text-[#3e593e] icon-emerald',
    error: 'bg-[#fdf2f2] border-[#fcdada] text-[#9f3a38] icon-rose',
    warning: 'bg-[#FCF5EB] border-[#eedebf] text-[#8c7853] icon-amber',
    info: 'bg-[#eef2f6] border-[#d8e3ed] text-[#4d6a8c] icon-[#4d6a8c]',
  };

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />,
    warning: <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />,
  };

  return (
    <div
      className={`fixed bottom-5 right-5 z-[100] flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg text-xs font-bold transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${styles[type]}`}
    >
      {icons[type]}
      <span className="font-semibold">{message}</span>
      <button
        onClick={() => {
          setVisible(false);
          if (onClose) onClose();
        }}
        className="ml-2 p-0.5 hover:opacity-70 cursor-pointer rounded"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
