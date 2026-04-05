// app/components/eventos/ModalFormEvento.tsx
"use client";

import { useRef, useState } from "react";
import { IconX } from "@tabler/icons-react";
import { Evento, Visibilidade } from "@/src/types/evento";
import { UserRole } from "@/src/types/user";
import { FormEvento, FormEventoRef } from "./FormEvento";

interface ModalFormEventoProps {
  evento?: Evento | null;
  // ✅ role recebido da page para controlar visibilidade de campos
  role: UserRole;
  onSalvar: (dados: Omit<Evento, "id" | "criadoEm" | "vagasOcupadas">) => Promise<void>;
  onFechar: () => void;
}

export function ModalFormEvento({ evento, role, onSalvar, onFechar }: ModalFormEventoProps) {
  const isEdicao = !!evento?.id;
  const formRef = useRef<FormEventoRef>(null);
  const [loading, setLoading] = useState(false);
  const [modoEdicao, setModoEdicao] = useState<Visibilidade>(
    evento?.modoEdicao ?? "privada"
  );

  const isPublica = modoEdicao === "publica";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      {/* Container — flex coluna com altura máxima */}
      <div className="bg-white dark:bg-[#202020] rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">

        {/* ── Header — fixo no topo ── */}
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-100 dark:border-[#303030] shrink-0">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-lg">
              {isEdicao ? "Editar evento" : "Novo evento"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Edicao {isPublica ? "publica" : "privada"}
            </p>
          </div>

          <div className="flex items-start gap-3">
            <button
              onClick={onFechar}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <IconX size={20} />
            </button>
          </div>
        </div>

        {/* ── Campos — única área com scroll ── */}
        <div className="flex-1 overflow-y-auto px-6 pt-5">
          <FormEvento
            ref={formRef}
            inicial={evento ?? undefined}
            modoEdicao={modoEdicao}
            role={role}
            onSalvar={onSalvar}
            onLoadingChange={setLoading}
          />
        </div>

        {/* ── Botões — fixos no rodapé ── */}
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
            {loading ? "Salvando..." : isEdicao ? "Salvar alterações" : "Criar evento"}
          </button>
        </div>

      </div>
    </div>
  );
}