"use client";

import { IconCalendarOff, IconX } from "@tabler/icons-react";
import { EventoCanceladoNotificacao } from "@/src/types/user";

interface ModalAvisosEventosCanceladosProps {
  eventos: EventoCanceladoNotificacao[];
  onFechar: () => void;
}

export function ModalAvisosEventosCancelados({
  eventos,
  onFechar,
}: ModalAvisosEventosCanceladosProps) {
  return (
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div className="bg-white dark:bg-[#202020] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#303030]">
          <h2 className="font-bold text-slate-900 dark:text-white text-lg">
            Eventos cancelados
          </h2>
          <button
            onClick={onFechar}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <IconX size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
              <IconCalendarOff size={22} className="text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Os eventos abaixo foram cancelados após a sua inscrição. Sua vaga foi removida e o QR Code correspondente foi invalidado.
            </p>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {eventos.map((evento) => (
              <div
                key={`${evento.eventoId}-${evento.data}`}
                className="rounded-xl border border-slate-200 dark:border-[#404040] bg-slate-50 dark:bg-[#2a2a2a] px-4 py-3"
              >
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {evento.nome}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {new Date(`${evento.data}T00:00:00`).toLocaleDateString("pt-BR")}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={onFechar}
            className="w-full py-2.5 rounded-xl bg-[#FFDE00] hover:bg-[#e6c800] text-[#252525] text-sm font-bold transition-colors"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}
