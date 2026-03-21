// app/components/gestor/usuarios/modal/ModaisGestor.tsx
"use client";

import { IconTrash, IconX, IconCheck, IconAlertTriangle } from "@tabler/icons-react";

// ── Modal base ───────────────────────────────────────────────────────────────
interface ModalBaseProps {
  aberto: boolean;
  onFechar: () => void;
  children: React.ReactNode;
  maxW?: string;
}

function ModalBase({ aberto, onFechar, children, maxW = "max-w-sm" }: ModalBaseProps) {
  if (!aberto) return null;
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onFechar(); }}
    >
      <div className={`bg-white dark:bg-[#202020] rounded-2xl shadow-2xl w-full ${maxW} overflow-hidden`}>
        {children}
      </div>
    </div>
  );
}

// ── Modal confirmação excluir ─────────────────────────────────────────────────
interface ModalConfirmarProps {
  aberto: boolean;
  titulo: string;
  mensagem: string;
  onConfirmar: () => void;
  onCancelar: () => void;
  loading?: boolean;
}

export function ModalConfirmarExcluir({
  aberto,
  titulo,
  mensagem,
  onConfirmar,
  onCancelar,
  loading,
}: ModalConfirmarProps) {
  return (
    <ModalBase aberto={aberto} onFechar={onCancelar}>
      <div className="p-6 flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <IconTrash size={26} className="text-red-500" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{titulo}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{mensagem}</p>
        </div>
        <div className="flex gap-3 w-full">
          <button
            onClick={onCancelar}
            className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 dark:border-[#404040] text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2a2a2a] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-bold transition-colors"
          >
            {loading ? "Excluindo..." : "Sim, excluir"}
          </button>
        </div>
      </div>
    </ModalBase>
  );
}

// ── Modal sucesso ─────────────────────────────────────────────────────────────
interface ModalSucessoProps {
  aberto: boolean;
  mensagem: string;
  onOk: () => void;
}

export function ModalSucessoGestor({ aberto, mensagem, onOk }: ModalSucessoProps) {
  return (
    <ModalBase aberto={aberto} onFechar={onOk}>
      <div className="p-6 flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <IconCheck size={28} className="text-emerald-500" />
        </div>
        <p className="text-base font-bold text-slate-900 dark:text-white">{mensagem}</p>
        <button
          onClick={onOk}
          className="w-full py-2.5 rounded-xl bg-[#FFDE00] hover:bg-[#e6c800] text-[#252525] text-sm font-bold transition-colors"
        >
          OK
        </button>
      </div>
    </ModalBase>
  );
}

// ── Modal erro ────────────────────────────────────────────────────────────────
interface ModalErroProps {
  aberto: boolean;
  mensagem: string;
  onOk: () => void;
}

export function ModalErroGestor({ aberto, mensagem, onOk }: ModalErroProps) {
  return (
    <ModalBase aberto={aberto} onFechar={onOk}>
      <div className="p-6 flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <IconAlertTriangle size={28} className="text-red-500" />
        </div>
        <p className="text-base font-bold text-slate-900 dark:text-white">{mensagem}</p>
        <button
          onClick={onOk}
          className="w-full py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors"
        >
          OK
        </button>
      </div>
    </ModalBase>
  );
}
