// frontend/app/components/Input.tsx
import { LucideIcon } from "lucide-react"; // Exemplo usando lucide-react para os ícones

interface InputProps {
  label: string;
  type: string;
  placeholder: string;
  id: string;
  Icon?: LucideIcon; // Opcional, caso queira passar o ícone como componente
}

export  function InputCad({ label, type, placeholder, id, Icon }: InputProps) {
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
          className={`w-full border border-slate-300 rounded-md p-2 text-sm outline-none focus:border-blue-500 transition-colors ${
            Icon ? "pl-10" : "pl-3"
          }`}
        />
      </div>
    </div>
  );
}