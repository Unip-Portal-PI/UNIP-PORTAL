// app/components/eventos/modal/ModalListaInscritos.tsx
"use client";

import { useState, useCallback } from "react";
import {
  IconX,
  IconUsers,
  IconChevronDown,
  IconChevronUp,
  IconCircleCheck,
  IconClock,
} from "@tabler/icons-react";
import { Inscricao } from "@/src/types/evento";

interface Props {
  eventoNome: string;
  inscricoes: Inscricao[];
  onFechar: () => void;
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function ModalListaInscritos({ eventoNome, inscricoes, onFechar }: Props) {
  const total = inscricoes.length;
  const confirmados = inscricoes.filter((i) => i.presencaConfirmada).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onFechar}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl border border-slate-100 dark:border-[#303030] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-start justify-between p-5 border-b border-slate-100 dark:border-[#2a2a2a] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <IconUsers size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                Lista de Inscritos
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                {eventoNome}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mr-2">
              <span>
                <strong className="text-slate-800 dark:text-slate-200">{total}</strong> inscritos
              </span>
              <span>
                <strong className="text-emerald-600 dark:text-emerald-400">{confirmados}</strong> presenças
              </span>
            </div>
            <button
              onClick={onFechar}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#2a2a2a] text-slate-500 dark:text-slate-400 transition-colors"
            >
              <IconX size={18} />
            </button>
          </div>
        </div>

        {/* Resumo mobile */}
        <div className="sm:hidden flex items-center gap-4 px-5 py-2 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-[#2a2a2a] bg-slate-50 dark:bg-[#1e1e1e] shrink-0">
          <span>
            <strong className="text-slate-800 dark:text-slate-200">{total}</strong> inscritos
          </span>
          <span>
            <strong className="text-emerald-600 dark:text-emerald-400">{confirmados}</strong> presenças confirmadas
          </span>
        </div>

        {/* Tabela com scroll */}
        <div className="overflow-auto flex-1">
          {inscricoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <IconUsers size={32} className="text-slate-300 dark:text-slate-600" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Nenhum aluno inscrito neste evento ainda.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-[#1e1e1e] sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Nome
                  </th>
                  <th className="hidden sm:table-cell px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Matrícula
                  </th>
                  <th className="hidden md:table-cell px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Área
                  </th>
                  <th className="hidden lg:table-cell px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Inscrito em
                  </th>
                  <th className="hidden lg:table-cell px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Presença
                  </th>
                  {/* Coluna da seta — some no lg */}
                  <th className="lg:hidden px-3 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {inscricoes.map((insc) => (
                  <ExpandableRow key={insc.id} insc={insc} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Linha com clique na linha inteira, só ativo abaixo de lg (1024px) ────────

function ExpandableRow({ insc }: { insc: Inscricao }) {
  const [expandida, setExpandida] = useState(false);
  const dataFormatada = formatarData(insc.dataInscricao);

  // Só expande se a largura atual for menor que lg (1024px).
  // No desktop todas as colunas já aparecem, então o clique não faz nada.
  const handleRowClick = useCallback(() => {
    if (window.innerWidth < 1024) {
      setExpandida((v) => !v);
    }
  }, []);

  return (
    <>
      <tr
        onClick={handleRowClick}
        className={[
          "border-b border-slate-100 dark:border-[#2a2a2a] transition-colors",
          insc.presencaConfirmada
            ? "hover:bg-[#eafde6] dark:hover:bg-[#3d5838]"
            : "hover:bg-slate-50 dark:hover:bg-[#252525]",
          // cursor-pointer só em telas menores que lg; no desktop fica padrão
          "cursor-pointer lg:cursor-default",
          insc.presencaConfirmada
            ? "bg-[#DFFCD7] dark:bg-[#42573C]"
            : expandida
            ? "bg-slate-50/60 dark:bg-[#222]"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* Nome — sempre visível */}
        <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-200">
          {insc.alunoNome}
        </td>

        {/* Matrícula — sm+ */}
        <td className="hidden sm:table-cell px-4 py-3 text-sm text-slate-600 dark:text-slate-300 font-mono">
          {insc.alunoMatricula}
        </td>

        {/* Área — md+ */}
        <td className="hidden md:table-cell px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
          {insc.alunoArea}
        </td>

        {/* Inscrito em — lg+ */}
        <td className="hidden lg:table-cell px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
          {dataFormatada}
        </td>

        {/* Presença — lg+ */}
        <td className="hidden lg:table-cell px-4 py-3 text-sm">
          {insc.presencaConfirmada ? (
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
              <IconCircleCheck size={14} /> Confirmada
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 text-xs">
              <IconClock size={14} /> Pendente
            </span>
          )}
        </td>

        {/* Seta indicadora — some no lg, pointer-events-none pois o clique é da linha */}
        <td className="lg:hidden px-3 py-3 text-right">
          <span
            aria-hidden="true"
            className="inline-flex items-center justify-center p-1 rounded-lg text-slate-400 dark:text-slate-500 pointer-events-none"
          >
            {expandida ? <IconChevronUp size={15} /> : <IconChevronDown size={15} />}
          </span>
        </td>
      </tr>

      {/* Linha expandida — renderizada só abaixo de lg */}
      {expandida && (
        <tr className="lg:hidden bg-slate-50 dark:bg-[#1e1e1e] border-b border-slate-100 dark:border-[#2a2a2a]">
          <td colSpan={3} className="px-4 py-3">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {/* Matrícula — só no mobile puro */}
              <div className="sm:hidden">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Matrícula
                </dt>
                <dd className="text-sm text-slate-700 dark:text-slate-300 mt-0.5 font-mono">
                  {insc.alunoMatricula}
                </dd>
              </div>

              {/* Área — abaixo de md */}
              <div className="md:hidden">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Área
                </dt>
                <dd className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">
                  {insc.alunoArea}
                </dd>
              </div>

              {/* Inscrito em — sempre no expand (lg nunca renderiza isso) */}
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Inscrito em
                </dt>
                <dd className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">
                  {dataFormatada}
                </dd>
              </div>

              {/* Presença — sempre no expand */}
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Presença
                </dt>
                <dd className="mt-0.5">
                  {insc.presencaConfirmada ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                      <IconCircleCheck size={14} /> Confirmada
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 text-xs">
                      <IconClock size={14} /> Pendente
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </td>
        </tr>
      )}
    </>
  );
}