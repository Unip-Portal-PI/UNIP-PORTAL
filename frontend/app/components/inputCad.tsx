// app/components/inputCad.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { LucideIcon, Eye, EyeOff, ChevronDown } from "lucide-react";
import { BLOCKED_TERMS } from "@/src/data/termsBlockMock";

interface InputProps {
  label: ReactNode;
  type: string;
  placeholder: string;
  id: string;
  Icon?: LucideIcon;
  erro?: boolean;
  defaultValue?: string;
  autoComplete?: string;
  validator?: (value: string) => string;
  onValidatedChange?: (isValid: boolean, message: string, value: string) => void;
}

interface SelectProps {
  label: ReactNode;
  id: string;
  placeholder: string;
  options: string[];
  Icon?: LucideIcon;
  erro?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}
function formatTelefone(value: string): string {
  const nums = value.replace(/\D/g, "").slice(0, 11);

  if (nums.length === 0) return "";
  if (nums.length <= 2) return `(${nums}`;
  if (nums.length <= 6) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
  if (nums.length <= 10) return `(${nums.slice(0, 2)}) ${nums.slice(2, 6)}-${nums.slice(6)}`;

  return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function containsBlockedTerm(value: string): boolean {
  const normalized = normalizeText(value);

  return BLOCKED_TERMS.some((term) => {
    const normalizedTerm = normalizeText(term);
    return normalized.includes(normalizedTerm);
  });
}

export function onlyNumbers(value: string): string {
  return value.replace(/\D/g, "");
}

export function validateSenha(value: string): string {
  if (!value.trim()) return "";
  if (value.length > 48) return "A senha deve ter no máximo 48 caracteres.";
  return "";
}

export function validateMatricula(value: string): string {
  if (!value.trim()) return "";

  const cleaned = value.trim().toUpperCase();

  if (cleaned.length > 10) {
    return "A matrícula deve ter no máximo 10 caracteres.";
  }

  const PREFIXOS_VALIDOS = ["PI", "UP", "UG", "CL", "AD"];
  const prefixo = cleaned.slice(0, 2);

  if (prefixo.length === 2 && !/^[A-Z]{2}$/.test(prefixo)) {
    return "A matrícula deve começar com letras maiúsculas.";
  }

  if (prefixo.length === 2 && !PREFIXOS_VALIDOS.includes(prefixo)) {
    return "A matrícula deve começar com: PI, UP, UG, CL ou AD.";
  }

  if (!/^[A-Z]{2}[0-9]{8}$/.test(cleaned)) {
    return "A matrícula deve ter 2 letras maiúsculas iniciais e 8 números.";
  }

  return "";
}

export function validateTelefone(value: string): string {
  const nums = onlyNumbers(value);

  if (!nums) return "";
  if (nums.length > 11) return "O telefone deve ter no máximo 11 números.";
  if (nums.length < 11) return "O telefone deve ter exatamente 11 números.";

  return "";
}

export function validateBlockedTermsField(fieldLabel: string, value: string): string {
  if (!value.trim()) return "";

  if (containsBlockedTerm(value)) {
    return `${fieldLabel} contém termo não permitido.`;
  }

  return "";
}

export function validateEmail(value: string): string {
  if (!value.trim()) return "";

  if (containsBlockedTerm(value)) {
    return "O e-mail contém termo não permitido.";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value.trim())) {
    return "Informe um e-mail válido.";
  }

  return "";
}

export function InputCad({
  label,
  type,
  placeholder,
  id,
  Icon,
  erro,
  defaultValue,
  autoComplete,
  validator,
  onValidatedChange,
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [telValue, setTelValue] = useState(defaultValue ?? "");
  const [value, setValue] = useState(defaultValue ?? "");
  const [validationMessage, setValidationMessage] = useState("");

  const isPassword = type === "password";
  const isTel = type === "tel";
  const isMatricula = id === "matricula";

  const shouldTrimOnBlur =
    id === "nome" ||
    id === "apelido" ||
    id === "nome_social" ||
    id === "email" ||
    id === "senha" ||
    id === "confirmar" ||
    id === "confirmarSenha" ||
    id === "confirmar_senha" ||
    type === "email" ||
    type === "password";

  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  const currentValue = useMemo(() => {
    return isTel ? telValue : value;
  }, [isTel, telValue, value]);

  useEffect(() => {
    const message = validator ? validator(currentValue) : "";
    setValidationMessage(message);
  }, [currentValue, validator]);

  function emitValidation(nextValue: string) {
    const message = validator ? validator(nextValue) : "";
    setValidationMessage(message);
    onValidatedChange?.(!message, message, nextValue);
  }

  function handleValueChange(nextValue: string) {
    if (type === "date" && nextValue) {
      const anoLimite = 2100;
      const anoDigitado = parseInt(nextValue.split('-')[0], 10);

      if (anoDigitado > anoLimite) {
        // Substitui o ano pelo limite, mantendo o restante da string (-MM-DD)
        const dataAjustada = nextValue.replace(/^\d{4,}/, String(anoLimite));
        setValue(dataAjustada);
        emitValidation(dataAjustada);
        return;
      }
    }
    if (isTel) {
      const formatted = formatTelefone(nextValue);
      emitValidation(formatted);
      setTelValue(formatted);
      return;
    }

    if (isMatricula) {
      const cleaned = nextValue.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
      const letters = cleaned.slice(0, 2).replace(/[^a-zA-Z]/g, "").toUpperCase();
      const numbers = cleaned.slice(2).replace(/\D/g, "").slice(0, 8);
      const finalValue = `${letters}${numbers}`;

      setValue(finalValue);
      emitValidation(finalValue);
      return;
    }

    if (isPassword) {
      const limitedValue = nextValue.slice(0, 48);
      setValue(limitedValue);
      emitValidation(limitedValue);
      return;
    }

    setValue(nextValue);
    emitValidation(nextValue);
  }

  function handleBlur() {
    if (!shouldTrimOnBlur || isTel || isMatricula) return;

    const trimmedValue = currentValue.trim();

    if (trimmedValue === currentValue) return;

    setValue(trimmedValue);
    emitValidation(trimmedValue);
  }

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
          autoComplete={autoComplete}
          value={currentValue}
          onChange={(e) => handleValueChange(e.target.value)}
          onBlur={handleBlur}
          inputMode={isTel ? "numeric" : undefined}
          maxLength={isPassword ? 48 : undefined}
          className={`w-full border rounded-md p-2 text-sm outline-none transition-colors
            ${Icon ? "pl-9" : "pl-3"}
            ${isPassword ? "pr-10" : "pr-3"}
            ${erro || !!validationMessage
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

      {validationMessage && <span className="text-xs text-red-500 mt-1">{validationMessage}</span>}
    </div>
  );
}

export function SelectCad({
  label,
  id,
  placeholder,
  options,
  Icon,
  erro,
  value,
  onChange,
}: SelectProps) {
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
          value={value ?? ""}
          onChange={(e) => onChange?.(e.target.value)}
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