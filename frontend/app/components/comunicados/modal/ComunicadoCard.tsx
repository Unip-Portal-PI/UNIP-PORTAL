// app/components/comunicados/modal/ComunicadoCard.tsx
"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  IconEdit,
  IconTrash,
  IconPaperclip,
  IconCalendar,
  IconUser,
} from "@tabler/icons-react";
import { Comunicado } from "@/src/types/comunicado";
import { UserRole } from "@/src/types/user";
import {
  canEditComunicado,
  canDeleteAllComunicados,
  parseAssuntos,
} from "@/src/utils/comunicado.helpers";

interface ComunicadoCardProps {
  comunicado: Comunicado;
  role: UserRole;
  matricula: string;
  onVerConteudo: (c: Comunicado) => void;
  onEditar: (c: Comunicado) => void;
  onExcluir: (c: Comunicado) => void;
}

function formatarLink(valor: string) {
  if (/^https?:\/\//i.test(valor)) return valor;
  return `https://${valor}`;
}

function resumirConteudoFormatado(texto: string, max = 180) {
  const conteudo = String(texto ?? "").trim();
  if (!conteudo) return "";

  if (conteudo.length <= max) return conteudo;
  return `${conteudo.slice(0, max).trim()}...`;
}

function renderResumoFormatado(texto: string) {
  if (!texto) return null;

  const partes = texto.split(/(\*[^\*]+\*|@\S+)/g).filter(Boolean);

  return partes.map((parte, index) => {
    if (/^\*[^\*]+\*$/.test(parte)) {
      return (
        <strong
          key={index}
          className="font-bold text-slate-700 dark:text-slate-200"
        >
          {parte.slice(1, -1)}
        </strong>
      );
    }

    if (/^@\S+$/.test(parte)) {
      const textoLink = parte.slice(1);
      const href = formatarLink(textoLink);

      return (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          onClick={(e) => e.stopPropagation()}
          className="font-semibold text-[#e6c800] dark:text-[#FFDE00] hover:underline break-all"
        >
          {textoLink}
        </a>
      );
    }

    return <span key={index}>{parte}</span>;
  });
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

  const podeEditar = canEditComunicado(role);
  const podeExcluir = canDeleteAllComunicados(role);

  const dataFormatada = new Date(comunicado.criadoEm).toLocaleDateString(
    "pt-BR",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );

  const resumoFormatado = useMemo(() => {
    const resumo = resumirConteudoFormatado(comunicado.conteudo, 180);
    return renderResumoFormatado(resumo);
  }, [comunicado.conteudo]);

  function handleAbrir() {
    onVerConteudo(comunicado);
    router.push(`/home/comunicado/${comunicado.id}`);
  }

  return (
    <div className="bg-white dark:bg-[#202020] rounded-2xl border shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all duration-200">
      <div
        className="relative cursor-pointer overflow-hidden"
        onClick={handleAbrir}
      >
        {comunicado.banner ? (
          <img
            src={comunicado.banner}
            alt={comunicado.titulo}
            className="w-full h-72 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-72 bg-gradient-to-br from-[#FFDE00] to-amber-500 flex items-center justify-center">
            <span className="text-[#252525] text-5xl font-black opacity-40 select-none text-center">
              Comunicado
              <br />
              AVP
            </span>
          </div>
        )}

        {parseAssuntos(comunicado.assunto).length > 0 && (
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
            {parseAssuntos(comunicado.assunto).map((item) => (
              <span
                key={item}
                className="bg-black/60 text-white text-xs px-2.5 py-1 rounded-full font-medium"
              >
                {item}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-6 gap-4">
        <h3
          className="font-bold text-slate-900 dark:text-white text-xl leading-snug cursor-pointer hover:text-amber-600 dark:hover:text-[#FFDE00] transition-colors line-clamp-2 truncate max-w-[450px]"  title={comunicado.titulo}
          onClick={handleAbrir}
        >
          {comunicado.titulo}
        </h3>

        <div className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed break-words line-clamp-4">
          {resumoFormatado}
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-slate-400 dark:text-slate-500">
          <span className="flex items-center gap-1">
            <IconCalendar size={13} />
            {dataFormatada}
          </span>
          <span className="flex items-center gap-1">
            <IconUser size={13} />
            {comunicado.criadoPorNome}
          </span>
          {comunicado.anexos.length > 0 && (
            <span className="flex items-center gap-1 text-amber-500 dark:text-amber-400">
              <IconPaperclip size={13} />
              {comunicado.anexos.length} anexo(s)
            </span>
          )}
        </div>

        <div className="h-px bg-slate-100 dark:bg-[#2a2a2a]" />

        <div className="flex items-center gap-2 mt-auto">
          <button
            onClick={handleAbrir}
            className="flex-1 py-3 px-4 cursor-pointer rounded-md text-sm font-bold bg-[#FFDE00] hover:bg-[#e6c800] text-[#252525] transition-colors"
          >
            Ler comunicado
          </button>

          {podeEditar && (
            <button
              onClick={() => onEditar(comunicado)}
              className="flex cursor-pointer items-center gap-1.5 px-3 py-3 rounded-md text-sm font-medium border border-slate-200 dark:border-[#404040] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2a2a2a] transition-colors"
            >
              <IconEdit size={15} />
            </button>
          )}

          {podeExcluir && (
            <button
              onClick={() => onExcluir(comunicado)}
              className="flex cursor-pointer items-center gap-1.5 px-3 py-3 rounded-md text-sm font-medium border border-red-200 dark:border-red-900/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <IconTrash size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}