// app/components/eventos/ModalDesinscricaoSucesso.tsx
"use client";

import { IconCircleCheck, IconX } from "@tabler/icons-react";

interface ModalDesinscricaoSucessoProps {
  eventoNome?: string;
  onFechar: () => void;
}

export function ModalDesinscricaoSucesso({
  eventoNome,
  onFechar,
}: ModalDesinscricaoSucessoProps) {
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={onFechar}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-slate-100 dark:border-[#303030] bg-white dark:bg-[#202020] shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onFechar}
          className="absolute top-3 right-3 rounded-full p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <IconX size={18} />
        </button>

        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
            <IconCircleCheck
              size={30}
              className="text-emerald-600 dark:text-emerald-400"
            />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Inscrição cancelada
            </h2>

            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {eventoNome
                ? `Você se desinscreveu com sucesso do evento "${eventoNome}".`
                : "Você se desinscreveu com sucesso deste evento."}
            </p>
          </div>

          <button
            type="button"
            onClick={onFechar}
            className="w-full py-3 rounded-md bg-[#FFDE00] hover:bg-[#e6c800] text-[#252525] text-sm font-bold transition-colors"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}