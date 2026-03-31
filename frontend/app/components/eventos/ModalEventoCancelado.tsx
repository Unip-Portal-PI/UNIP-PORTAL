"use client";

import { IconCalendarOff, IconX } from "@tabler/icons-react";

interface ModalEventoCanceladoProps {
  mensagem: string;
  onFechar: () => void;
}

export function ModalEventoCancelado({
  mensagem,
  onFechar,
}: ModalEventoCanceladoProps) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div className="bg-white dark:bg-[#202020] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#303030]">
          <h2 className="font-bold text-slate-900 dark:text-white text-lg">
            Evento cancelado
          </h2>
          <button
            onClick={onFechar}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <IconX size={20} />
          </button>
        </div>

        <div className="px-6 py-6 flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <IconCalendarOff size={28} className="text-amber-600 dark:text-amber-400" />
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300 text-center">
            {mensagem}
          </p>

          <button
            onClick={onFechar}
            className="w-full py-2.5 rounded-xl bg-[#FFDE00] hover:bg-[#e6c800] text-[#252525] text-sm font-bold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
