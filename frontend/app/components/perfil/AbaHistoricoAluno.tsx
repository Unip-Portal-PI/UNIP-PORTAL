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

interface Props {
  matricula: string;
}

interface InscricaoComEvento {
  inscricao: Inscricao;
  evento: Evento | null;
}

function ModalQR({ qrCode, eventoNome, onFechar }: { qrCode: string; eventoNome: string; onFechar: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onFechar(); }}
    >
      <div className="bg-white dark:bg-[#202020] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-[#303030]">
          <div>
            <p className="text-xs text-amber-500 font-bold uppercase tracking-wider">QR Code</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 line-clamp-1">{eventoNome}</p>
          </div>
          <button onClick={onFechar} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none">×</button>
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
          <p className="text-xs font-mono text-slate-400 text-center break-all">{qrCode}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Apresente este código no dia do evento para confirmar sua presença.
          </p>
          <button onClick={onFechar} className="w-full py-2.5 rounded-xl bg-[#FFDE00] hover:bg-[#e6c800] text-[#252525] text-sm font-bold transition-colors">
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
        // Busca todos os eventos (inclusive passados via getAllIncludingPast, senão getAll)
        const todosEventos = await EventoService.getAllIncludingPast();
        // Pega inscrições do aluno logado
        const inscricoes = todosEventos.flatMap((e) =>
          EventoService.getInscricoesEvento(e.id).filter((i) => i.alunoId === matricula)
        );
        // Também pega inscrições de eventos que podem não ter aparecido no getAll (passados)
        // Para cobrir esse caso, buscamos direto do estado interno via getInscricoesAluno
        const todasInscricoes: Inscricao[] = [];
        const eventosMap: Record<string, Evento> = {};
        todosEventos.forEach((e) => { eventosMap[e.id] = e; });

        inscricoes.forEach((i) => {
          if (!todasInscricoes.find((x) => x.id === i.id)) todasInscricoes.push(i);
        });

        const lista: InscricaoComEvento[] = todasInscricoes.map((insc) => ({
          inscricao: insc,
          evento: eventosMap[insc.eventoId] ?? null,
        }));

        // Ordena por data de inscrição mais recente
        lista.sort((a, b) =>
          new Date(b.inscricao.dataInscricao).getTime() - new Date(a.inscricao.dataInscricao).getTime()
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

  async function handleDownloadCertificado(inscricao: Inscricao, evento: Evento) {
    const jsPDFModule = await import("jspdf");
    const jsPDF = jsPDFModule.default;

    const dataEvento = new Date(evento.data + "T00:00:00").toLocaleDateString("pt-BR", {
      day: "2-digit", month: "long", year: "numeric",
    });
    const dataEmissao = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit", month: "long", year: "numeric",
    });

    // Canvas A4 paisagem em pixels
    const W = 1123, H = 794;
    const cvs = document.createElement("canvas");
    cvs.width = W;
    cvs.height = H;
    const ctx = cvs.getContext("2d")!;
    const cx = W / 2;

    const CINZA_ESCURO = "#2e2e2e";
    const CINZA_MEDIO = "#6b6b6b";
    const CINZA_LEVE = "#999999";
    const AMARELO = "#FACB14";

    function carregarImagem(src: string): Promise<HTMLImageElement> {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.src = src;
      });
    }

    const [bg, logoAvp, logoUnip] = await Promise.all([
      carregarImagem("/img/bg_certificado.png"),
      carregarImagem("/img/logo_avp.png"),
      carregarImagem("/img/logo_unip.png"),
    ]);

    // ── Fundo ────────────────────────────────────────────────────────────────
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(bg, 0, 0, W, H);

    // ── Logos ────────────────────────────────────────────────────────────────
    const logoH = 52;

    const avpW = logoH * (logoAvp.naturalWidth / logoAvp.naturalHeight);
    ctx.drawImage(logoAvp, 56, 18, avpW, logoH);

    const unipW = logoH * (logoUnip.naturalWidth / logoUnip.naturalHeight);
    ctx.drawImage(logoUnip, W - unipW - 56, 18, unipW, logoH);

    // ── Linha amarela ─────────────────────────────────────────────────────────
    // ctx.strokeStyle = AMARELO;
    // ctx.lineWidth = 2;
    // ctx.beginPath();
    // ctx.moveTo(W * 0.18, 86);
    // ctx.lineTo(W * 0.82, 86);
    // ctx.stroke();

    // ── Conteúdo centralizado ─────────────────────────────────────────────────
    const base = 390;

    ctx.textAlign = "center";

    ctx.fillStyle = CINZA_MEDIO;
    ctx.font = "16px Georgia, serif";
    ctx.fillText("Certificamos que", cx, base - 148);

    ctx.font = "bold 30px Georgia, serif";
    ctx.fillStyle = CINZA_ESCURO;
    ctx.fillText(inscricao.alunoNome, cx, base - 106);

    const nomeW = ctx.measureText(inscricao.alunoNome).width;
    ctx.strokeStyle = AMARELO;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - nomeW / 2 - 20, base - 94);
    ctx.lineTo(cx + nomeW / 2 + 20, base - 94);
    ctx.stroke();

    ctx.font = "13px Georgia, serif";
    ctx.fillStyle = CINZA_MEDIO;
    ctx.fillText(
      `Matrícula: ${inscricao.alunoMatricula}   |   Curso/Área: ${inscricao.alunoArea}`,
      cx, base - 70
    );

    ctx.font = "16px Georgia, serif";
    ctx.fillText("participou do evento", cx, base - 36);

    ctx.font = "bold 21px Georgia, serif";
    ctx.fillStyle = CINZA_ESCURO;
    ctx.fillText(`"${evento.nome}"`, cx, base - 4);

    ctx.font = "13px Georgia, serif";
    ctx.fillStyle = CINZA_MEDIO;
    ctx.fillText(
      `Data: ${dataEvento}   |   Horário: ${evento.horario}   |   Local: ${evento.local}`,
      cx, base + 34
    );

    ctx.font = "12px Georgia, serif";
    ctx.fillText(
      "A presença foi devidamente confirmada por meio do sistema AVP Conecta.",
      cx, base + 60
    );

    ctx.strokeStyle = "#cccccc";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(W * 0.18, base + 82);
    ctx.lineTo(W * 0.82, base + 82);
    ctx.stroke();

    ctx.font = "11px Georgia, serif";
    ctx.fillStyle = CINZA_MEDIO;
    ctx.fillText(
      `Emitido em ${dataEmissao}   |   Código de verificação: ${inscricao.qrCode}`,
      cx, base + 106
    );

    ctx.font = "9.5px Georgia, serif";
    ctx.fillStyle = CINZA_LEVE;
    ctx.fillText(
      "Este certificado é válido como comprovante de participação e foi gerado automaticamente pelo Portal AVP Conecta.",
      cx, base + 128
    );

    // ── Converte canvas → PDF via jsPDF ──────────────────────────────────────
    const imgData = cvs.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [W, H],
    });

    pdf.addImage(imgData, "PNG", 0, 0, W, H);
    pdf.save(`certificado_${evento.nome.replace(/\s+/g, "_")}_${inscricao.alunoMatricula}.pdf`);
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-[#202020] rounded-2xl border border-slate-100 dark:border-[#303030] p-4 animate-pulse">
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
        <p className="text-sm text-slate-500 dark:text-slate-400">Erro ao carregar histórico.</p>
      </div>
    );
  }

  if (itens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-[#2a2a2a] flex items-center justify-center">
          <IconCalendarOff size={24} className="text-slate-400" />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Você ainda não se inscreveu em nenhum evento.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {itens.map(({ inscricao, evento }) => {
          const confirmado = inscricao.presencaConfirmada;
          const dataEvento = evento
            ? new Date(evento.data + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
            : "—";

          return (
            <div
              key={inscricao.id}
              className={`bg-white dark:bg-[#202020] rounded-2xl border shadow-sm p-4 transition-colors ${confirmado
                  ? "border-emerald-200 dark:border-emerald-800/30 bg-emerald-50/30 dark:bg-emerald-900/5"
                  : "border-slate-100 dark:border-[#303030]"
                }`}
            >
              <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
                {/* Ícone */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${confirmado ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-[#FFDE00]/15 dark:bg-[#FFDE00]/10"
                  }`}>
                  <IconCalendar size={20} className={confirmado ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-[#FFDE00]"} />
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
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#404040] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2a2a2a] transition-colors"
                    title="Ver QR Code"
                  >
                    <IconQrcode size={14} /> QR
                  </button>

                  {/* Certificado */}
                  {/* <button
                    onClick={() => evento && handleDownloadCertificado(inscricao, evento)}
                    disabled={!confirmado || !evento}
                    title={confirmado ? "Baixar certificado" : "Disponível após confirmação de presença"}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${confirmado && evento
                        ? "border border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        : "border border-slate-200 dark:border-[#404040] text-slate-300 dark:text-slate-600 cursor-not-allowed"
                      }`}
                  >
                    <IconDownload size={14} /> Certificado
                  </button> */}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {qrAberto && (
        <ModalQR
          qrCode={qrAberto.qrCode}
          eventoNome={itens.find((i) => i.inscricao.id === qrAberto.id)?.evento?.nome ?? "Evento"}
          onFechar={() => setQrAberto(null)}
        />
      )}
    </>
  );
}
