// app/components/comunicados/modal/ModalFormComunicado.tsx
"use client";

import { useRef, useState } from "react";
import { IconX } from "@tabler/icons-react";
import { Comunicado } from "@/src/types/comunicado";
import { FormComunicado, FormComunicadoRef } from "./FormComunicado";

interface ModalFormComunicadoProps {
  comunicado?: Comunicado | null;
  matricula: string;
  nome: string;
  onSalvar: (dados: Omit<Comunicado, "id" | "criadoEm">) => Promise<void>;
  onFechar: () => void;
}

export function ModalFormComunicado({
  comunicado,
  matricula,
  nome,
  onSalvar,
  onFechar,
}: ModalFormComunicadoProps) {
  const isEdicao = !!comunicado?.id;
  const formRef = useRef<FormComunicadoRef>(null);
  const [loading, setLoading] = useState(false);

  async function handleSalvar(dados: Omit<Comunicado, "id" | "criadoEm" | "criadoPor" | "criadoPorNome">) {
    await onSalvar({ ...dados, criadoPor: matricula, criadoPorNome: nome });
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div className="bg-white dark:bg-[#202020] rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#303030] shrink-0">
          <h2 className="font-bold text-slate-900 dark:text-white text-lg">
            {isEdicao ? "Editar comunicado" : "Novo comunicado"}
          </h2>
          <button
            onClick={onFechar}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Campos com scroll */}
        <div className="flex-1 overflow-y-auto px-6 pt-5">
          <FormComunicado
            ref={formRef}
            inicial={comunicado ?? undefined}
            onSalvar={handleSalvar}
            onLoadingChange={setLoading}
          />
        </div>

        {/* Botões */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-[#303030] shrink-0">
          <button
            type="button"
            onClick={onFechar}
            className="flex-1 py-3 rounded-xl border-2 border-slate-200 dark:border-[#404040] text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2a2a2a] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => formRef.current?.submit()}
            className="flex-1 py-3 rounded-xl bg-[#FFDE00] hover:bg-[#e6c800] disabled:opacity-60 text-slate-900 text-sm font-bold transition-colors"
          >
            {loading ? "Salvando..." : isEdicao ? "Salvar alterações" : "Publicar"}
          </button>
        </div>
      </div>
    </div>
  );
}
