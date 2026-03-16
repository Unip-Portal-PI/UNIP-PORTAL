// app/components/filters/FilterInput.tsx
"use client";

import { IconSearch } from "@tabler/icons-react";

interface FilterInputProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

export function FilterInput({ label, placeholder, value, onChange }: FilterInputProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 block">
        {label}
      </label>
      <div className="relative">
        <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4D4D4D] dark:text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-8 pr-3 py-2 border border-slate-300 dark:border-[#505050] rounded-md text-sm bg-blue-100 dark:bg-[#424242] text-[#4D4D4D] dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-[#888888] focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
        />
      </div>
    </div>
  );
}