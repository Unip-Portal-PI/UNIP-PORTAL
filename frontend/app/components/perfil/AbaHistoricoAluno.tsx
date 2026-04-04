// app/components/perfil/AbaHistoricoAluno.tsx
"use client";

import { useEffect, useState } from "react";
import {
  IconCalendar,
  IconQrcode,
  IconDownload,
  IconCircleCheck,
  IconClock,
  IconAlertCircle,
  IconCalendarOff,
} from "@tabler/icons-react";
import { Inscricao, Evento } from "@/src/types/evento";
import { EventoService } from "@/src/service/evento.service";
import { downloadCertificado } from "@/src/utils/certificado.helpers";

interface Props {
  matricula: string;
}

interface InscricaoComEvento {
  inscricao: Inscricao;
  evento: Evento | null;
}

function ModalQR({
  qrCode,
  eventoNome,
  onFechar,
}: {
  qrCode: string;
  eventoNome: string;
  onFechar: () => void;
}) {
  const [copiado, setCopiado] = useState(false);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div className="bg-white dark:bg-[#202020] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-[#303030]">
          <div>
            <p className="text-xs text-amber-500 font-bold uppercase tracking-wider">
              QR Code
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 line-clamp-1">
              {eventoNome}
            </p>
          </div>

          <button
            onClick={onFechar}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 p-6">
          <div className="bg-white p-3 rounded-xl shadow-inner border border-slate-100">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrCode)}`}
              alt="QR Code"
              width={180}
              height={180}
              className="rounded"
            />
          </div>

          <div className="relative flex items-center justify-center w-full min-w-0">
            <button
              onClick={() => {
                navigator.clipboard.writeText(qrCode);
                setCopiado(true);
                setTimeout(() => setCopiado(false), 2000);
              }}
              className="group flex items-center gap-1.5 cursor-pointer min-w-0 max-w-full"
            >
              <p className="text-xs text-slate-400 font-mono text-center truncate min-w-0 max-w-full group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors">
                {qrCode}
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

          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Apresente este código no dia do evento para confirmar sua presença.
          </p>

          <button
            onClick={onFechar}
            className="w-full py-2.5 rounded-xl bg-[#FFDE00] hover:bg-[#e6c800] text-[#252525] text-sm font-bold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export function AbaHistoricoAluno({ matricula }: Props) {
  const [itens, setItens] = useState<InscricaoComEvento[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const [qrAberto, setQrAberto] = useState<Inscricao | null>(null);

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      setErro(false);
      try {
        const inscricoes = await EventoService.getMinhasInscricoes();
        const eventos = await Promise.all(
          inscricoes.map((insc) => EventoService.getById(insc.eventoId))
        );

        const lista: InscricaoComEvento[] = inscricoes.map((insc, index) => ({
          inscricao: insc,
          evento: eventos[index] ?? null,
        }));

        // Ordena por data de inscrição mais recente
        lista.sort(
          (a, b) =>
            new Date(b.inscricao.dataInscricao).getTime() -
            new Date(a.inscricao.dataInscricao).getTime()
        );

        setItens(lista);
      } catch {
        setErro(true);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [matricula]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#202020] rounded-2xl border border-slate-100 dark:border-[#303030] p-4 animate-pulse"
          >
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-[#2a2a2a] shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-[#2a2a2a] rounded w-2/3" />
                <div className="h-3 bg-slate-200 dark:bg-[#2a2a2a] rounded w-1/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (erro) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <IconAlertCircle size={24} className="text-red-500" />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Erro ao carregar histórico.
        </p>
      </div>
    );
  }

  if (itens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-[#2a2a2a] flex items-center justify-center">
          <IconCalendarOff size={24} className="text-slate-400" />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Você ainda não se inscreveu em nenhum evento.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {itens.map(({ inscricao, evento }) => {
          const confirmado = inscricao.presencaConfirmada;

          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);
          const dataEventoDate = evento
            ? new Date(evento.data + "T00:00:00")
            : null;
          const diaPassou = dataEventoDate ? hoje > dataEventoDate : false;
          const certificadoDisponivel = confirmado && diaPassou;

          const dataEvento = evento
            ? new Date(evento.data + "T00:00:00").toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })
            : "—";

          return (
            <div
              key={inscricao.id}
              className={`bg-white dark:bg-[#202020] rounded-2xl border shadow-sm p-4 transition-colors ${
                confirmado
                  ? "border-emerald-200 dark:border-emerald-800/30 bg-emerald-50/30 dark:bg-emerald-900/5"
                  : "border-slate-100 dark:border-[#303030]"
              }`}
            >
              <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
                {/* Ícone */}
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    confirmado
                      ? "bg-emerald-100 dark:bg-emerald-900/30"
                      : "bg-[#FFDE00]/15 dark:bg-[#FFDE00]/10"
                  }`}
                >
                  <IconCalendar
                    size={20}
                    className={
                      confirmado
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-[#FFDE00]"
                    }
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm leading-snug line-clamp-1">
                    {evento?.nome ?? "Evento removido"}
                  </p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <IconCalendar size={11} /> {dataEvento}
                    </span>
                    {evento?.local && (
                      <span className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[160px]">
                        {evento.local}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status + ações */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {/* Badge presença */}
                  {confirmado ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full">
                      <IconCircleCheck size={13} /> Presença confirmada
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#2a2a2a] px-2.5 py-1 rounded-full">
                      <IconClock size={13} /> Aguardando
                    </span>
                  )}

                  {/* QR Code */}
                  <button
                    onClick={() => setQrAberto(inscricao)}
                    className="flex items-center cursor-pointer gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#404040] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2a2a2a] transition-colors"
                    title="Ver QR Code"
                  >
                    <IconQrcode size={14} /> QR
                  </button>

                  {/* Certificado */}
                  <button
                    onClick={() =>
                      evento && downloadCertificado(inscricao, evento)
                    }
                    disabled={!certificadoDisponivel || !evento}
                    title={
                      certificadoDisponivel
                        ? "Baixar certificado"
                        : !confirmado
                        ? "Disponível após confirmação de presença"
                        : "Disponível após o dia do evento"
                    }
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      certificadoDisponivel && evento
                        ? "border border-emerald-200 cursor-pointer dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        : "border border-slate-200 dark:border-[#404040] text-slate-300 dark:text-slate-600 cursor-not-allowed"
                    }`}
                  >
                    <IconDownload size={14} /> Certificado
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {qrAberto && (
        <ModalQR
          qrCode={qrAberto.qrCode}
          eventoNome={
            itens.find((i) => i.inscricao.id === qrAberto.id)?.evento?.nome ??
            "Evento"
          }
          onFechar={() => setQrAberto(null)}
        />
      )}
    </>
  );
}