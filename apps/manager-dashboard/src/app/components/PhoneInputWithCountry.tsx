'use client';

import { useState, useEffect } from 'react';
import { Phone } from 'lucide-react';

export interface CountryCode {
  code: string; // e.g. "+91"
  country: string; // e.g. "India"
  flag: string; // e.g. "🇮🇳"
}

export const COUNTRY_CODES: CountryCode[] = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'US / Canada', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
];

interface PhoneInputWithCountryProps {
  value: string;
  onChange: (fullPhoneNumber: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export default function PhoneInputWithCountry({
  value,
  onChange,
  placeholder = '9876543210',
  required = false,
  className = '',
}: PhoneInputWithCountryProps) {
  // Parse initial value if provided with a country code
  const initialCountry = COUNTRY_CODES.find((c) => value.startsWith(c.code)) || COUNTRY_CODES[0];
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(initialCountry);
  const [localNumber, setLocalNumber] = useState<string>(() => {
    if (value && value.startsWith(initialCountry.code)) {
      return value.slice(initialCountry.code.length).trim();
    }
    return value.replace(/^\+\d+\s*/, '');
  });

  useEffect(() => {
    const cleanedLocal = localNumber.replace(/\D/g, '');
    const combined = `${selectedCountry.code}${cleanedLocal}`;
    onChange(combined);
  }, [selectedCountry, localNumber, onChange]);

  return (
    <div className={`relative flex items-center gap-2 ${className}`}>
      {/* Country Selector Dropdown */}
      <div className="relative shrink-0">
        <select
          value={selectedCountry.code}
          onChange={(e) => {
            const found = COUNTRY_CODES.find((c) => c.code === e.target.value);
            if (found) setSelectedCountry(found);
          }}
          className="bg-white border border-[#e6e3da] text-[#1c1b18] font-bold text-xs rounded-xl py-2.5 pl-3 pr-6 focus:outline-none focus:border-[#8c7853] focus:ring-2 focus:ring-[#8c7853]/10 transition-all duration-200 shadow-sm appearance-none cursor-pointer"
        >
          {COUNTRY_CODES.map((c) => (
            <option key={`${c.country}-${c.code}`} value={c.code}>
              {c.flag} {c.code} ({c.country})
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-[#66635d]">
          ▼
        </div>
      </div>

      {/* Phone Number Input Field */}
      <div className="relative flex-1">
        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#66635d]" />
        <input
          type="tel"
          required={required}
          value={localNumber}
          onChange={(e) => setLocalNumber(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white border border-[#e6e3da] rounded-xl py-2.5 pl-10 pr-4 text-[#1c1b18] placeholder:text-[#a09c94] text-sm focus:outline-none focus:border-[#8c7853] focus:ring-4 focus:ring-[#8c7853]/10 transition-all duration-300 shadow-sm font-mono tracking-wide"
        />
      </div>
    </div>
  );
}
