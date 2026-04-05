// app/components/eventos/ModalExcluir.tsx
"use client";

import { useState } from "react";
import { IconCalendarOff, IconX } from "@tabler/icons-react";
import { Evento } from "@/src/types/evento";

interface ModalExcluirProps {
  evento: Evento;
  onConfirmar: () => Promise<void>;
  onFechar: () => void;
}

export function ModalExcluir({ evento, onConfirmar, onFechar }: ModalExcluirProps) {
  const [loading, setLoading] = useState(false);

  async function handleCancelar() {
    setLoading(true);
    try {
      await onConfirmar();
      onFechar();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div className="bg-white dark:bg-[#202020] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#303030]">
          <h2 className="font-bold text-slate-900 dark:text-white text-lg">Cancelar evento</h2>
          <button onClick={onFechar} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <IconX size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
              <IconCalendarOff size={22} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[350px]" title={evento.nome}>
                {evento.nome}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Ao cancelar, todos os inscritos serão removidos e os QR Codes serão apagados.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onFechar}
              className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 dark:border-[#404040] text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2a2a2a] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCancelar}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-bold transition-colors"
            >
              {loading ? "Cancelando..." : "Sim, cancelar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
