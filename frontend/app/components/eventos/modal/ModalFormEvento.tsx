// app/components/eventos/ModalFormEvento.tsx
"use client";

import { IconX } from "@tabler/icons-react";
import { Evento } from "@/src/types/evento";
import { FormEvento } from "./FormEvento";

interface ModalFormEventoProps {
  evento?: Evento | null;
  onSalvar: (dados: Omit<Evento, "id" | "criadoEm" | "vagasOcupadas">) => Promise<void>;
  onFechar: () => void;
}

export function ModalFormEvento({ evento, onSalvar, onFechar }: ModalFormEventoProps) {
  const isEdicao = !!evento?.id;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center bg-black/50 p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div className="bg-white dark:bg-[#202020] rounded-2xl shadow-2xl w-full max-w-2xl my-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#303030]">
          <h2 className="font-bold text-slate-900 dark:text-white text-lg">
            {isEdicao ? "Editar evento" : "Novo evento"}
          </h2>
          <button
            onClick={onFechar}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <IconX size={20} />
          </button>
        </div>

        <div className="px-6 py-5">
          <FormEvento
            inicial={evento ?? undefined}
            onSalvar={onSalvar}
            onCancelar={onFechar}
          />
        </div>
      </div>
    </div>
  );
}
