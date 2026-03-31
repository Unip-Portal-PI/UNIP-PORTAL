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
  const bloqueioMesmoDia = erro.includes("mais de um evento por dia");

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
    const [copiado, setCopiado] = useState(false);

    function handleCopiar() {
      navigator.clipboard.writeText(code);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }

    return (
      <div className="flex flex-col items-center gap-2 min-w-0">
        <div className="bg-white p-3 rounded-xl shadow-inner border border-slate-200">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${seed}`}
            alt="QR Code"
            width={160}
            height={160}
            className="rounded"
          />
        </div>

        <div className="relative flex items-center justify-center w-[160px] min-w-0">
          <button
            onClick={handleCopiar}
            className="group flex items-center gap-1.5 cursor-pointer min-w-0 max-w-full"
            type="button"
          >
            <p className="text-xs text-slate-400 font-mono text-center truncate min-w-0 max-w-full group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors">
              {code}
            </p>

            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors"
            >
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
            </svg>
          </button>

          {copiado && (
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-medium px-2 py-0.5 rounded pointer-events-none whitespace-nowrap z-10">
              Copiado!
            </span>
          )}
        </div>
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
            {etapa === "sucesso" && "Inscrição realizada!"}
            {etapa === "erro" &&
              (bloqueioMesmoDia
                ? "Inscrição não permitida"
                : "Ops! Algo deu errado")}
          </h2>
          <button
            onClick={onFechar}
            className="text-slate-400 cursor-pointer hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
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
                  className="flex-1 cursor-pointer py-2.5 rounded-xl border-2 border-slate-200 dark:border-[#404040] text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2a2a2a] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmar}
                  disabled={loading}
                  className="flex-1 cursor-pointer py-2.5 rounded-xl bg-[#FFDE00] hover:bg-[#e6c800] text-[#252525] disabled:opacity-60 text-sm font-bold transition-colors"
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
                className="w-full cursor-pointer py-2.5 rounded-xl bg-[#FFDE00] hover:bg-[#e6c800] text-[#252525] text-sm font-bold transition-colors"
              >
                Fechar
              </button>
            </div>
          )}

          {/* ── ERRO ── */}
          {etapa === "erro" && (
            <div className="flex flex-col items-center gap-4 py-2">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  bloqueioMesmoDia
                    ? "bg-amber-100 dark:bg-amber-900/30"
                    : "bg-red-100 dark:bg-red-900/30"
                }`}
              >
                <IconX size={28} className="text-red-500" />
              </div>
              <div className="space-y-2 text-center">
                <p className="text-sm text-slate-600 dark:text-slate-300">{erro}</p>
                {bloqueioMesmoDia && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Você já possui uma inscrição em outro evento na data de{" "}
                    {new Date(`${evento.data}T00:00:00`).toLocaleDateString("pt-BR")}.
                  </p>
                )}
              </div>
              <button
                onClick={onFechar}
                className="w-full cursor-pointer py-2.5 rounded-xl border-2 border-slate-200 dark:border-[#404040] text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2a2a2a] transition-colors"
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
