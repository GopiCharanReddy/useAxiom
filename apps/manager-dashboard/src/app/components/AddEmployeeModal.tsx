'use client';

import { useState } from 'react';
import { X, UserPlus, UserCheck, Briefcase, Award, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@useaxiom/ui';
import { z } from 'zod';
import PhoneInputWithCountry from './PhoneInputWithCountry';

const employeeSchema = z.object({
  name: z.string().min(2, 'Full name is required (min 2 characters)'),
  role: z.string().min(1, 'Role / Designation is required'),
  experience: z.string().min(1, 'Experience level is required'),
  phoneNumber: z.string().min(8, 'Valid phone number with country code is required'),
  specialty: z.string().optional(),
  email: z.string().email('Invalid email address').or(z.literal('')).optional(),
});

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddEmployeeModal({ isOpen, onClose, onSuccess }: AddEmployeeModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Frontend Engineer');
  const [experience, setExperience] = useState('3 Years');
  const [phoneNumber, setPhoneNumber] = useState('+91');
  const [specialty, setSpecialty] = useState('');
  const [email, setEmail] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Safe parse Zod schema
    const validation = employeeSchema.safeParse({
      name,
      role,
      experience,
      phoneNumber,
      specialty,
      email,
    });

    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Validation error');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('axiom_token');
      if (!token) throw new Error('Not authenticated');

      const res = await fetch('/api/v1/users/employee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          role,
          experience,
          phoneNumber,
          specialty,
          email,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || 'Failed to add employee details.');
      }

      // Reset form & trigger refresh
      setName('');
      setSpecialty('');
      setEmail('');
      setPhoneNumber('+91');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-[#e6e3da] max-w-lg w-full p-6 sm:p-8 space-y-6 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-[#1c1b18]">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-[#e6e3da]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#8c7853]/10 border border-[#8c7853]/20 flex items-center justify-center text-[#8c7853]">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-black text-[#1c1b18] text-lg leading-tight">
                Add Team Employee
              </h3>
              <p className="text-[10px] text-[#66635d] font-bold uppercase tracking-wider">
                Register employee under organization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-xl text-[#66635d] hover:text-[#1c1b18] hover:bg-[#faf8f5] transition-colors border border-[#e6e3da]/80 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[#66635d] uppercase tracking-widest block">
              Full Name <span className="text-[#9f3a38]">*</span>
            </label>
            <div className="relative">
              <UserCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#66635d]" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                className="w-full bg-white border border-[#e6e3da] rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-[#1c1b18] placeholder:text-[#a09c94] focus:outline-none focus:border-[#8c7853] focus:ring-4 focus:ring-[#8c7853]/10 transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Role */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[#66635d] uppercase tracking-widest block">
                Role / Designation <span className="text-[#9f3a38]">*</span>
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#66635d]" />
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full bg-white border border-[#e6e3da] rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-[#1c1b18] placeholder:text-[#a09c94] focus:outline-none focus:border-[#8c7853] shadow-sm"
                />
              </div>
            </div>

            {/* Experience */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[#66635d] uppercase tracking-widest block">
                Experience Level <span className="text-[#9f3a38]">*</span>
              </label>
              <div className="relative">
                <Award className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#66635d]" />
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full bg-white border border-[#e6e3da] rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-[#1c1b18] focus:outline-none focus:border-[#8c7853] shadow-sm appearance-none cursor-pointer"
                >
                  <option value="Junior (1 Year)">Junior (1 Year)</option>
                  <option value="2 Years">2 Years</option>
                  <option value="3 Years">3 Years</option>
                  <option value="4 Years">4 Years</option>
                  <option value="Senior (5+ Years)">Senior (5+ Years)</option>
                  <option value="Lead (8+ Years)">Lead (8+ Years)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Specialty / Skills */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[#66635d] uppercase tracking-widest block">
              Specialty / Skills
            </label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="e.g. React, Node.js, UI/UX"
              className="w-full bg-white border border-[#e6e3da] rounded-xl py-2.5 px-4 text-xs font-semibold text-[#1c1b18] placeholder:text-[#a09c94] focus:outline-none focus:border-[#8c7853] shadow-sm"
            />
          </div>

          {/* WhatsApp Phone Number */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[#66635d] uppercase tracking-widest block">
              WhatsApp Phone Number (Select Country Code + Enter Number) <span className="text-[#9f3a38]">*</span>
            </label>
            <PhoneInputWithCountry
              value={phoneNumber}
              onChange={(fullPhone) => setPhoneNumber(fullPhone)}
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[#66635d] uppercase tracking-widest block">
              Email Address (Optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@organization.com"
              className="w-full bg-white border border-[#e6e3da] rounded-xl py-2.5 px-4 text-xs font-semibold text-[#1c1b18] placeholder:text-[#a09c94] focus:outline-none focus:border-[#8c7853] shadow-sm"
            />
          </div>

          {error && (
            <div className="bg-[#fdf2f2] border border-[#fcdada] text-[#9f3a38] text-xs font-bold p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#e6e3da]">
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
              disabled={loading}
              className="px-5 py-2.5 text-[9px] font-black tracking-widest uppercase border border-[#7d6b4a] gap-1.5 cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{loading ? 'Adding Employee...' : 'Add Employee'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
