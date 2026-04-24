// app/components/gestor/modal/ModalFormUsuario.tsx
"use client";

import { useRef, useState } from "react";
import { IconX } from "@tabler/icons-react";
import { UsuarioGestor } from "@/src/types/usuarioGestor";
import { FormUsuario, FormUsuarioRef } from "./FormUsuario";

interface ModalFormUsuarioProps {
  usuario?: UsuarioGestor | null;
  criadoPor: string;
  onSalvar: (dados: Omit<UsuarioGestor, "id" | "criadoEm" | "atualizadoEm">) => Promise<void>;
  onFechar: () => void;
}

export function ModalFormUsuario({
  usuario,
  criadoPor,
  onSalvar,
  onFechar,
}: ModalFormUsuarioProps) {
  const isEdicao = !!usuario?.id;
  const formRef = useRef<FormUsuarioRef>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"

    >
      <div className="bg-white dark:bg-[#202020] rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#303030] shrink-0">
          <h2 className="font-bold text-slate-900 dark:text-white text-lg">
            {isEdicao ? "Editar usuário" : "Novo usuário"}
          </h2>
          <button
            onClick={onFechar}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Campos */}
        <div className="flex-1 overflow-y-auto px-6 pt-5">
          <FormUsuario
            ref={formRef}
            inicial={usuario ?? undefined}
            isEdicao={isEdicao}
            criadoPor={criadoPor}
            onSalvar={onSalvar}
            onLoadingChange={setLoading}
          />
        </div>

        {/* Botões */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-[#303030] shrink-0">
          <button
            type="button"
            onClick={onFechar}
            className="flex-1 py-3 rounded-md border-2 border-slate-200 dark:border-[#404040] text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2a2a2a] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => formRef.current?.submit()}
            className="flex-1 py-3 rounded-md bg-[#FFDE00] hover:bg-[#e6c800] disabled:opacity-60 text-[#252525] text-sm font-bold transition-colors"
          >
            {loading ? "Salvando..." : isEdicao ? "Salvar alterações" : "Criar usuário"}
          </button>
        </div>
      </div>
    </div>
  );
}
