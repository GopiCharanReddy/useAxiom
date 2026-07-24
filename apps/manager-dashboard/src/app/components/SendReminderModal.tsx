'use client';

import { useState, useEffect } from 'react';
import { X, Send, Phone, MessageSquare, AlertCircle, CheckCircle2, User } from 'lucide-react';
import { Button } from '@useaxiom/ui';

interface SendReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRecipientName?: string;
  defaultPhoneNumber?: string;
  defaultMessage?: string;
  taskId?: string;
  onSuccess?: (newPhoneNumber: string) => void;
}

export function SendReminderModal({
  isOpen,
  onClose,
  defaultRecipientName = '',
  defaultPhoneNumber = '',
  defaultMessage = '',
  taskId,
  onSuccess,
}: SendReminderModalProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [messageText, setMessageText] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPhoneNumber(defaultPhoneNumber || '');
      setMessageText(
        defaultMessage ||
          `Hi ${defaultRecipientName || 'team member'}, please provide a status update on your assigned project tasks for useAxiom.`,
      );
      setPhoneError('');
      setSuccessMessage('');
      setApiError('');
    }
  }, [isOpen, defaultPhoneNumber, defaultRecipientName, defaultMessage]);

  if (!isOpen) return null;

  const validatePhone = (num: string): boolean => {
    const cleanNum = num.trim();
    if (!cleanNum) {
      setPhoneError('Phone number is required.');
      return false;
    }

    // Phone format regex: optional leading +, then 7 to 15 digits (E.164 recommendation)
    const phoneRegex = /^\+?[1-9]\d{6,14}$/;
    const sanitized = cleanNum.replace(/[\s\-\(\)]/g, '');

    if (!phoneRegex.test(sanitized)) {
      setPhoneError(
        'Please enter a valid phone number with country code (e.g. +1234567890 or +919876543210).',
      );
      return false;
    }

    setPhoneError('');
    return true;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhoneNumber(val);
    if (phoneError) {
      validatePhone(val);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setApiError('');

    if (!validatePhone(phoneNumber)) {
      return;
    }

    setIsSending(true);
    const token = localStorage.getItem('axiom_token');
    const targetPhone = phoneNumber.trim().replace(/[\s\-\(\)]/g, '');

    try {
      const res = await fetch('/api/v1/notifications/send-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          recipientPhone: targetPhone,
          message: messageText.trim(),
          recipientName: defaultRecipientName,
          taskId: taskId || undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to dispatch WhatsApp reminder.');
      }

      if (onSuccess) {
        onSuccess(targetPhone);
      }

      setSuccessMessage(`WhatsApp reminder sent successfully to ${targetPhone}!`);
      setTimeout(() => {
        onClose();
        setSuccessMessage('');
      }, 1800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error sending WhatsApp reminder';
      setApiError(msg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-[#e6e3da] max-w-md w-full p-6 space-y-5 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-[#1c1b18]">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-[#e6e3da]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#8c7853]/10 border border-[#8c7853]/20 flex items-center justify-center text-[#8c7853]">
              <MessageSquare className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-serif font-black text-[#1c1b18] text-base leading-tight">
                Send WhatsApp Reminder
              </h3>
              <p className="text-[10px] text-[#66635d] font-semibold uppercase tracking-wider">
                Direct Team Notification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-[#66635d] hover:text-[#1c1b18] hover:bg-[#faf8f5] transition-colors border border-[#e6e3da]/80"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          {/* Recipient info badge */}
          {defaultRecipientName && (
            <div className="flex items-center gap-2 px-3 py-2 bg-[#faf8f5] rounded-xl border border-[#e6e3da]">
              <User className="w-4 h-4 text-[#8c7853]" />
              <span className="text-xs font-black text-[#1c1b18]">
                Recipient: {defaultRecipientName}
              </span>
            </div>
          )}

          {/* Phone Number Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[#66635d] uppercase tracking-widest block">
              WhatsApp Phone Number <span className="text-[#9f3a38]">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c7853]" />
              <input
                type="text"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="e.g. +1234567890 or +919876543210"
                className={`w-full bg-white border ${
                  phoneError
                    ? 'border-[#9f3a38] focus:border-[#9f3a38]'
                    : 'border-[#e6e3da] focus:border-[#8c7853]'
                } rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-[#1c1b18] placeholder:text-[#a09c94] focus:outline-none focus:ring-2 focus:ring-[#8c7853]/20 transition-all shadow-sm`}
              />
            </div>
            {phoneError && (
              <p className="text-[11px] text-[#9f3a38] font-bold flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {phoneError}
              </p>
            )}
            <p className="text-[9px] text-[#66635d] font-medium">
              Enter or edit the exact WhatsApp phone number (with country code).
            </p>
          </div>

          {/* Reminder Message Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[#66635d] uppercase tracking-widest block">
              Reminder Message
            </label>
            <textarea
              rows={3}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full bg-white border border-[#e6e3da] focus:border-[#8c7853] rounded-xl p-3 text-xs font-semibold text-[#1c1b18] placeholder:text-[#a09c94] focus:outline-none focus:ring-2 focus:ring-[#8c7853]/20 transition-all shadow-sm resize-none"
              placeholder="Enter message text..."
            />
          </div>

          {/* API Error Notification */}
          {apiError && (
            <div className="bg-[#fdf2f2] border border-[#fcdada] text-[#9f3a38] text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Success Notification */}
          {successMessage && (
            <div className="bg-[#f0f5f0] border border-[#3e593e]/30 text-[#3e593e] text-xs p-3 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-bold">{successMessage}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2.5 pt-2 border-t border-[#e6e3da]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="px-4 py-2 text-[9px] font-black tracking-widest uppercase border-[#e6e3da] text-[#66635d] hover:bg-[#faf8f5]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSending}
              className="px-4 py-2 text-[9px] font-black tracking-widest uppercase border border-[#7d6b4a] gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Sending...' : 'Send WhatsApp Reminder'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
