// app/components/inputCad.tsx

"use client";

import { useState } from "react";
import { LucideIcon, Eye, EyeOff, ChevronDown } from "lucide-react";

interface InputProps {
  label: string;
  type: string;
  placeholder: string;
  id: string;
  Icon?: LucideIcon;
  erro?: boolean;
  defaultValue?: string; // ✅ novo
  autoComplete?: string;
}

interface SelectProps {
  label: string;
  id: string;
  placeholder: string;
  options: string[];
  Icon?: LucideIcon;
  erro?: boolean;
}

// Formata enquanto digita: (11) 91234-5678
function formatTelefone(value: string): string {
  const nums = value.replace(/\D/g, "").slice(0, 11);
  if (nums.length === 0) return "";
  if (nums.length <= 2) return `(${nums}`;
  if (nums.length <= 6) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
  if (nums.length <= 10) return `(${nums.slice(0, 2)}) ${nums.slice(2, 6)}-${nums.slice(6)}`;
  return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
}

export function InputCad({ label, type, placeholder, id, Icon, erro, defaultValue, autoComplete }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [telValue, setTelValue] = useState("");

  const isPassword = type === "password";
  const isTel = type === "tel";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="flex flex-col gap-1 w-full">
      <label htmlFor={id} className="font-bold text-sm text-slate-800 dark:text-slate-200">
        {label}
      </label>
      <div className="relative flex items-center">
        {Icon && (
          <Icon className="absolute left-3 text-[#4D4D4D] dark:text-slate-400 w-4 h-4" />
        )}
        <input
          id={id}
          type={inputType}
          placeholder={placeholder}
          defaultValue={defaultValue} // ✅ novo
          autoComplete={autoComplete}
          value={isTel ? telValue : undefined}
          onChange={isTel ? (e) => setTelValue(formatTelefone(e.target.value)) : undefined}
          inputMode={isTel ? "numeric" : undefined}
          className={`w-full border rounded-md p-2 text-sm outline-none transition-colors
            ${Icon ? "pl-9" : "pl-3"}
            ${isPassword ? "pr-10" : "pr-3"}
            ${erro
              ? "border-red-400 bg-red-50 dark:bg-red-950 dark:border-red-600 focus:border-red-500 text-[#4D4D4D] dark:text-red-200 placeholder:text-red-300"
              : "border-slate-300 dark:border-[#505050] bg-blue-100 dark:bg-[#424242] focus:border-blue-500 dark:focus:border-blue-400 text-[#4D4D4D] dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-[#888888]"
            }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

export function SelectCad({ label, id, placeholder, options, Icon, erro }: SelectProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label htmlFor={id} className="font-bold text-sm text-slate-800 dark:text-slate-200">
        {label}
      </label>
      <div className="relative flex items-center">
        {Icon && (
          <Icon className="absolute left-3 text-[#4D4D4D] dark:text-slate-400 w-4 h-4 z-10 pointer-events-none" />
        )}
        <select
          id={id}
          defaultValue=""
          className={`w-full border rounded-md p-2 text-sm outline-none transition-colors appearance-none cursor-pointer
            ${Icon ? "pl-9" : "pl-3"} pr-9
            ${erro
              ? "border-red-400 bg-red-50 dark:bg-red-950 dark:border-red-600 focus:border-red-500 text-[#4D4D4D] dark:text-red-200"
              : "border-slate-300 dark:border-[#505050] bg-blue-100 dark:bg-[#424242] focus:border-blue-500 dark:focus:border-blue-400 text-[#4D4D4D] dark:text-slate-200"
            }`}
        >
          <option value="" disabled className="text-slate-400 dark:text-[#888888]">
            {placeholder}
          </option>
          {options.map((curso) => (
            <option key={curso} value={curso}>
              {curso}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 text-[#4D4D4D] dark:text-slate-400 w-4 h-4 pointer-events-none" />
      </div>
    </div>
  );
}