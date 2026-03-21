// app/components/filters/FilterSelect.tsx
"use client";

import { IconChevronDown } from "@tabler/icons-react";

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}

export function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1 block">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none px-3 py-2 pr-8 border border-slate-300 dark:border-[#505050] rounded-md text-sm bg-blue-100 dark:bg-[#424242] text-[#4D4D4D] dark:text-slate-200 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
        >
          {options.map((opt) => (
            <option key={opt}>{opt}</option>
          ))}
        </select>
        <IconChevronDown
          size={14}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4D4D4D] dark:text-slate-400 pointer-events-none"
        />
      </div>
    </div>
  );
}
