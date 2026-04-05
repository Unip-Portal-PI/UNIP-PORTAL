// app/components/perfil/ModalFeedbackPerfil.tsx
"use client";

import { IconCircleCheck, IconCircleX, IconX } from "@tabler/icons-react";

interface ModalFeedbackPerfilProps {
  tipo: "sucesso" | "erro";
  titulo: string;
  mensagem: string;
  onFechar: () => void;
}

export function ModalFeedbackPerfil({
  tipo,
  titulo,
  mensagem,
  onFechar,
}: ModalFeedbackPerfilProps) {
  const sucesso = tipo === "sucesso";

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={onFechar}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-slate-100 dark:border-[#303030] bg-white dark:bg-[#202020] shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão X fechar */}
        <button
          type="button"
          onClick={onFechar}
          className="absolute top-3 right-3 rounded-full p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <IconX size={18} />
        </button>

        <div className="flex flex-col items-center text-center gap-4">
          {/* Ícone */}
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center ${
              sucesso
                ? "bg-emerald-100 dark:bg-emerald-900/20"
                : "bg-red-100 dark:bg-red-900/20"
            }`}
          >
            {sucesso ? (
              <IconCircleCheck
                size={30}
                className="text-emerald-600 dark:text-emerald-400"
              />
            ) : (
              <IconCircleX
                size={30}
                className="text-red-500 dark:text-red-400"
              />
            )}
          </div>

          {/* Texto */}
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {titulo}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {mensagem}
            </p>
          </div>

          {/* Botão confirmar */}
          <button
            type="button"
            onClick={onFechar}
            className={`w-full py-3 rounded-md text-sm font-bold transition-colors ${
              sucesso
                ? "bg-[#FFDE00] hover:bg-[#e6c800] text-[#252525]"
                : "bg-red-500 hover:bg-red-600 text-white"
            }`}
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}