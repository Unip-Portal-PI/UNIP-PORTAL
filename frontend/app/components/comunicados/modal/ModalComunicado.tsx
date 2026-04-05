// app/components/comunicados/modal/ModalComunicado.tsx
"use client";

import {
  IconX,
  IconPaperclip,
  IconDownload,
  IconAlertTriangle,
  IconCalendar,
  IconUser,
  IconEye,
  IconExternalLink,
} from "@tabler/icons-react";
import { Comunicado } from "@/src/types/comunicado";
import { isComunicadoExpirado, parseAssuntos } from "@/src/utils/comunicado.helpers";
import { renderConteudoFormatado } from "@/src/utils/comunicado.formatter";

interface ModalComunicadoProps {
  comunicado: Comunicado | null;
  onFechar: () => void;
}

export function ModalComunicado({ comunicado, onFechar }: ModalComunicadoProps) {
  if (!comunicado) return null;

  const expirado = isComunicadoExpirado(comunicado);

  const dataFormatada = new Date(comunicado.criadoEm).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const dataValidadeFormatada = comunicado.dataValidade
    ? new Date(comunicado.dataValidade + "T00:00:00").toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
    : null;

  function handleDownload(url: string, nome: string) {
    const link = document.createElement("a");
    link.href = url;
    link.download = nome;
    link.click();
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div className="bg-white dark:bg-[#202020] rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 dark:border-[#303030] shrink-0 gap-4">
          <div className="flex-1 min-w-0">

            <h2 className="font-bold text-slate-900 dark:text-white text-lg leading-snug line-clamp-2 truncate max-w-[350px]"  title={comunicado.titulo}>
              {comunicado.titulo}
            </h2>
          </div>
          <button
            onClick={onFechar}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0 mt-0.5"
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Corpo com scroll */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Banner */}
          {comunicado.banner && (
            <img
              src={comunicado.banner}
              alt={comunicado.titulo}
              className="w-full h-68 object-cover rounded-xl"
            />
          )}

          {/* Aviso: expirado */}
          {expirado && (
            <div className="flex items-center gap-3 bg-slate-100 dark:bg-[#2a2a2a] rounded-xl p-4 border border-slate-200 dark:border-[#404040]">
              <IconAlertTriangle size={20} className="text-slate-400 shrink-0" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Este comunicado <strong>expirou</strong> em {dataValidadeFormatada} e pode estar desatualizado.
              </p>
            </div>
          )}

          {/* Meta */}
          <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-[#2a2a2a] pb-4">
            <span className="flex items-center gap-1.5">
              <IconUser size={13} />
              <span className="font-medium text-slate-700 dark:text-slate-200">{comunicado.criadoPorNome}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <IconCalendar size={13} />
              {dataFormatada}
            </span>
            {dataValidadeFormatada && (
              <span className="flex items-center gap-1.5">
                <IconEye size={13} />
                Válido até {dataValidadeFormatada}
              </span>
            )}
          </div>
          <div className="mb-1 flex flex-wrap gap-1">
            {parseAssuntos(comunicado.assunto).length > 0
              ? parseAssuntos(comunicado.assunto).map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-amber-100 px-2 py-1.5 text-[12px] leading-none font-medium text-amber-600 dark:bg-[#FFDE00]/10 dark:text-[#FFDE00]"
                >
                  {item}
                </span>
              ))
              : (
                <span className="rounded-full bg-amber-100 px-2 py-1.5 text-[12px] leading-none font-medium text-amber-600 dark:bg-[#FFDE00]/10 dark:text-[#FFDE00]">
                  Comunicado
                </span>
              )}
          </div>
          {/* Conteúdo formatado */}
          <div className="max-w-none">
            {renderConteudoFormatado(comunicado.conteudo)}
          </div>

          {/* Anexos */}
          {comunicado.anexos.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-[#2a2a2a]">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <IconPaperclip size={14} />
                Anexos ({comunicado.anexos.length})
              </p>
              <div className="space-y-2">
                {comunicado.anexos.map((anexo) => (
                  <div
                    key={anexo.id}
                    className="flex items-center justify-between bg-slate-50 dark:bg-[#2a2a2a] rounded-xl px-4 py-3 border border-slate-100 dark:border-[#363636]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                        <IconPaperclip size={14} className="text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                          {anexo.nome}
                        </p>
                        <p className="text-xs text-slate-400">
                          {anexo.tipo.toUpperCase()} · {anexo.tamanhoMB.toFixed(1)} MB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <a
                        href={anexo.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#363636] border border-slate-200 dark:border-[#505050] text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#404040] transition-colors"
                      >
                        <IconExternalLink size={13} />
                        Visualizar
                      </a>
                      
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-[#303030] shrink-0">
          <button
            onClick={onFechar}
            className="w-full py-3 rounded-xl border-2 border-slate-200 dark:border-[#404040] text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2a2a2a] transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
