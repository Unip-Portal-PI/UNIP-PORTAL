// app/components/gestor/usuarios/modal/BadgeUsuario.tsx
"use client";

interface BadgeProps {
  label: string;
  cor: "green" | "red" | "yellow" | "blue" | "gray" | "purple";
}

const MAP: Record<BadgeProps["cor"], string> = {
  green:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  red:    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  yellow: "bg-[#FFDE00]/20 text-amber-700 dark:bg-[#FFDE00]/10 dark:text-[#FFDE00]",
  blue:   "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  gray:   "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
  purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

export function BadgeUsuario({ label, cor }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold ${MAP[cor]}`}
    >
      {label}
    </span>
  );
}
