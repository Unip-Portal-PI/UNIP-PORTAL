// app/components/eventos/ModalInscricao.tsx
"use client";

import { useState } from "react";
import { IconX, IconQrcode, IconUser, IconBook, IconId } from "@tabler/icons-react";
import { Evento } from "@/src/types/evento";
import { UserProfile } from "@/src/types/user";
import { Inscricao } from "@/src/types/evento";

interface ModalInscricaoProps {
  evento: Evento;
  user: UserProfile;
  onConfirmar: () => Promise<Inscricao>;
  onFechar: () => void;
}

export function ModalInscricao({ evento, user, onConfirmar, onFechar }: ModalInscricaoProps) {
  const [etapa, setEtapa] = useState<"confirmacao" | "sucesso" | "erro">("confirmacao");
  const [inscricao, setInscricao] = useState<Inscricao | null>(null);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleConfirmar() {
    setLoading(true);
    try {
      const result = await onConfirmar();
      setInscricao(result);
      setEtapa("sucesso");
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao realizar inscrição.");
      setEtapa("erro");
    } finally {
      setLoading(false);
    }
  }

  // QR Code visual simples baseado no código
  function QrCodeDisplay({ code }: { code: string }) {
    const seed = encodeURIComponent(code);
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="bg-white p-3 rounded-xl shadow-inner border border-slate-200">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${seed}`}
            alt="QR Code"
            width={160}
            height={160}
            className="rounded"
          />
        </div>
        <p className="text-xs text-slate-400 font-mono">{code}…</p>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div className="bg-white dark:bg-[#202020] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#303030]">
          <h2 className="font-bold text-slate-900 dark:text-white text-lg">
            {etapa === "confirmacao" && "Confirmar inscrição"}
            {etapa === "sucesso" && "Inscrição realizada! 🎉"}
            {etapa === "erro" && "Ops! Algo deu errado"}
          </h2>
          <button
            onClick={onFechar}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <IconX size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* ── CONFIRMAÇÃO ── */}
          {etapa === "confirmacao" && (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Confira seus dados antes de confirmar:
              </p>

              <div className="bg-slate-50 dark:bg-[#2a2a2a] rounded-xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                  <IconUser size={15} className="text-slate-400" />
                  <span className="font-medium">Nome:</span> {user.nome}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                  <IconId size={15} className="text-slate-400" />
                  <span className="font-medium">Matrícula:</span> {user.matricula}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                  <IconBook size={15} className="text-slate-400" />
                  <span className="font-medium">Área:</span> {user.area}
                </div>
              </div>

              

              <div className="flex gap-3 pt-1">
                <button
                  onClick={onFechar}
                  className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 dark:border-[#404040] text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2a2a2a] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmar}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-[#FFDE00] hover:bg-[#e6c800] text-[#252525] disabled:opacity-60 text-sm font-bold transition-colors"
                >
                  {loading ? "Inscrevendo..." : "Confirmar inscrição"}
                </button>
              </div>
            </>
          )}

          {/* ── SUCESSO ── */}
          {etapa === "sucesso" && inscricao && (
            <div className="flex flex-col items-center gap-4 py-2">
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                Guarde este QR Code. Ele será necessário para confirmar sua presença no evento.
              </p>
              <QrCodeDisplay code={inscricao.qrCode} />
              <div className="w-full bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-100 dark:border-emerald-800/30 flex items-center gap-2">
                <IconQrcode size={18} className="text-emerald-500" />
                <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                  QR Code salvo na sua conta
                </p>
              </div>
              <button
                onClick={onFechar}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors"
              >
                Fechar
              </button>
            </div>
          )}

          {/* ── ERRO ── */}
          {etapa === "erro" && (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <IconX size={28} className="text-red-500" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 text-center">{erro}</p>
              <button
                onClick={onFechar}
                className="w-full py-2.5 rounded-xl border-2 border-slate-200 dark:border-[#404040] text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2a2a2a] transition-colors"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
