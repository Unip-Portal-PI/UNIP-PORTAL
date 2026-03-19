// app/components/comunicados/modal/ModalExcluirComunicado.tsx
"use client";

import { useState } from "react";
import { IconTrash, IconX } from "@tabler/icons-react";
import { Comunicado } from "@/src/types/comunicado";

interface ModalExcluirComunicadoProps {
  comunicado: Comunicado;
  onConfirmar: () => Promise<void>;
  onFechar: () => void;
}

export function ModalExcluirComunicado({
  comunicado,
  onConfirmar,
  onFechar,
}: ModalExcluirComunicadoProps) {
  const [loading, setLoading] = useState(false);

  async function handleExcluir() {
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
          <h2 className="font-bold text-slate-900 dark:text-white text-lg">Excluir comunicado</h2>
          <button
            onClick={onFechar}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <IconX size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
              <IconTrash size={22} className="text-red-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                {comunicado.titulo}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Essa ação não pode ser desfeita.
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
              onClick={handleExcluir}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-bold transition-colors"
            >
              {loading ? "Excluindo..." : "Sim, excluir"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
