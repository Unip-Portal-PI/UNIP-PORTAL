// app/components/comunicados/modal/ComunicadoCard.tsx
"use client";

import { useRouter } from "next/navigation";
import {
  IconEdit,
  IconTrash,
  IconPaperclip,
  IconCalendar,
  IconUser,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { Comunicado } from "@/src/types/comunicado";
import { UserRole } from "@/src/types/user";
import {
  isComunicadoExpirado,
  canEditComunicado,
  canDeleteAllComunicados,
  isAutor,
} from "@/src/utils/comunicado.helpers";
import { ComunicadoService } from "@/src/service/comunicado.service";

interface ComunicadoCardProps {
  comunicado: Comunicado;
  role: UserRole;
  matricula: string;
  onVerConteudo: (c: Comunicado) => void;
  onEditar: (c: Comunicado) => void;
  onExcluir: (c: Comunicado) => void;
}

export function ComunicadoCard({
  comunicado,
  role,
  matricula,
  onVerConteudo,
  onEditar,
  onExcluir,
}: ComunicadoCardProps) {
  const router = useRouter();
  const expirado = isComunicadoExpirado(comunicado);
  const lido = ComunicadoService.isLido(comunicado.id);
  const podeEditar =
    canEditComunicado(role) &&
    (canDeleteAllComunicados(role) || isAutor(comunicado, matricula));
  const podeExcluir =
    canDeleteAllComunicados(role) || isAutor(comunicado, matricula);

  const dataFormatada = new Date(comunicado.criadoEm).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  function handleAbrir() {
    ComunicadoService.marcarLido(comunicado.id);
    router.push(`/home/comunicado/${comunicado.id}`);
  }

  return (
    <div
      className={`bg-white dark:bg-[#202020] rounded-2xl border shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all duration-200 ${
        expirado
          ? "border-slate-200 dark:border-[#303030] opacity-60"
          : lido
          ? "border-slate-100 dark:border-[#303030]"
          : "border-[#FFDE00]/40 dark:border-[#FFDE00]/20 ring-1 ring-[#FFDE00]/30"
      }`}
    >
      {/* Banner */}
      <div
        className="relative cursor-pointer overflow-hidden"
        onClick={handleAbrir}
      >
        {comunicado.banner ? (
          <img
            src={comunicado.banner}
            alt={comunicado.titulo}
            className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-40 bg-gradient-to-br from-[#FFDE00]/80 to-amber-400 flex items-center justify-center">
            <span className="text-[#252525] text-5xl font-black opacity-20 select-none">
              {comunicado.titulo[0]}
            </span>
          </div>
        )}

        {/* Badge Não lido */}
        {!lido && !expirado && (
          <span className="absolute top-3 left-3 bg-[#FFDE00] text-[#252525] text-xs font-black px-2.5 py-1 rounded-full shadow">
            Não lido
          </span>
        )}

        {/* Badge Expirado */}
        {expirado && (
          <span className="absolute top-3 left-3 bg-slate-600/80 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow flex items-center gap-1">
            <IconAlertTriangle size={11} />
            Expirado
          </span>
        )}

        {/* Badge Assunto */}
        {comunicado.assunto && (
          <span className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full font-medium">
            {comunicado.assunto}
          </span>
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Título */}
        <h3
          className="font-bold text-slate-900 dark:text-white text-base leading-snug cursor-pointer hover:text-amber-600 dark:hover:text-[#FFDE00] transition-colors line-clamp-2"
          onClick={handleAbrir}
        >
          {comunicado.titulo}
        </h3>

        {/* Resumo */}
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {comunicado.resumo}
        </p>

        {/* Meta */}
        <div className="flex flex-wrap gap-3 text-xs text-slate-400 dark:text-slate-500">
          <span className="flex items-center gap-1">
            <IconCalendar size={12} />
            {dataFormatada}
          </span>
          <span className="flex items-center gap-1">
            <IconUser size={12} />
            {comunicado.criadoPorNome}
          </span>
          {comunicado.anexos.length > 0 && (
            <span className="flex items-center gap-1 text-amber-500 dark:text-amber-400">
              <IconPaperclip size={12} />
              {comunicado.anexos.length} anexo(s)
            </span>
          )}
        </div>

        {/* Separador */}
        <div className="h-px bg-slate-100 dark:bg-[#2a2a2a]" />

        {/* Ações */}
        <div className="flex items-center gap-2 mt-auto">
          <button
            onClick={handleAbrir}
            className="flex-1 py-2 px-3 cursor-pointer rounded-md text-sm font-bold bg-[#FFDE00] hover:bg-[#e6c800] text-[#252525] transition-colors"
          >
            Ler comunicado
          </button>

          {podeEditar && (
            <button
              onClick={() => onEditar(comunicado)}
              className="flex cursor-pointer items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium border border-slate-200 dark:border-[#404040] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2a2a2a] transition-colors"
            >
              <IconEdit size={14} />
            </button>
          )}

          {podeExcluir && (
            <button
              onClick={() => onExcluir(comunicado)}
              className="flex cursor-pointer items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium border border-red-200 dark:border-red-900/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <IconTrash size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
