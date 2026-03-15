// app/components/input_cad.tsx
"use client";

import { useState } from "react";
import { LucideIcon, Eye, EyeOff } from "lucide-react";

interface InputProps {
  label: string;
  type: string;
  placeholder: string;
  id: string;
  Icon?: LucideIcon;
  erro?: boolean;
}

export function InputCad({ label, type, placeholder, id, Icon, erro }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="flex flex-col gap-1 w-full">
      <label htmlFor={id} className="font-bold text-sm text-slate-800">
        {label}
      </label>
      <div className="relative flex items-center">
        {Icon && (
          <Icon className="absolute left-3 text-slate-400 w-4 h-4" />
        )}
        <input
          id={id}
          type={inputType}
          placeholder={placeholder}
          className={`w-full border rounded-md p-2 text-sm outline-none transition-colors
            ${Icon ? "pl-9" : "pl-3"}
            ${isPassword ? "pr-10" : "pr-3"}
            ${erro
              ? "border-red-400 bg-red-50 focus:border-red-500"
              : "border-slate-300 bg-blue-100 focus:border-blue-500"
            }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}