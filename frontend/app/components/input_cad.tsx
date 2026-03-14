// frontend/app/components/input_cad.tsx
import { LucideIcon } from "lucide-react";

interface InputProps {
  label: string;
  type: string;
  placeholder: string;
  id: string;
  Icon?: LucideIcon;
}

export function InputCad({ label, type, placeholder, id, Icon }: InputProps) {
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
          type={type}
          placeholder={placeholder}
          className={`w-full bg-blue-100 border border-blue-200 rounded-md p-2 text-sm text-slate-500 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white transition-colors ${
            Icon ? "pl-9" : "pl-3"
          }`}
        />
      </div>
    </div>
  );
}