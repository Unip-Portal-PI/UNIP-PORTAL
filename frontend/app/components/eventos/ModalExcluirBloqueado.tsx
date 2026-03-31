// app/components/eventos/ModalExcluirBloqueado.tsx
"use client";

import { IconAlertTriangle, IconEyeOff, IconX } from "@tabler/icons-react";

interface ModalExcluirBloqueadoProps {
  eventoNome: string;
  totalInscritos: number;
  onOcultar: () => void;
  onFechar: () => void;
}

export function ModalExcluirBloqueado({
  eventoNome,
  totalInscritos,
  onOcultar,
  onFechar,
}: ModalExcluirBloqueadoProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm bg-black/50"
      onClick={onFechar}
    >
      <div
        className="bg-white dark:bg-[#202020] rounded-2xl border border-slate-100 dark:border-[#303030] shadow-2xl w-full max-w-md mx-4 p-6 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
              <IconAlertTriangle size={20} className="text-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Não é possível excluir
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {totalInscritos} inscrito{totalInscritos !== 1 ? "s" : ""} neste evento
              </p>
            </div>
          </div>
          <button
            onClick={onFechar}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors mt-0.5 cursor-pointer"
          >
            <IconX size={18} />
          </button>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          O evento{" "}
          <span className="font-semibold text-slate-800 dark:text-slate-100">
            {eventoNome}
          </span>{" "}
          possui inscritos e não pode ser excluído.
        </p>

        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4">
          <p className="text-sm text-amber-700 dark:text-amber-400 font-medium mb-1">
            Deseja ocultar o evento?
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-500 leading-relaxed">
            Mudar a visibilidade para <strong>privado</strong> impede que novos alunos vejam ou se inscrevam, mas mantém os inscritos atuais.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onFechar}
            className="flex-1 py-2.5 rounded-md text-sm font-bold border border-slate-200 dark:border-[#404040] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={onOcultar}
            className="flex-1 py-2.5 rounded-md text-sm font-bold bg-amber-400 hover:bg-amber-500 text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <IconEyeOff size={15} />
            Tornar privado
          </button>
        </div>
      </div>
    </div>
  );
}