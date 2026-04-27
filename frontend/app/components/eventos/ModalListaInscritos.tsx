"use client";

import { useState, useCallback } from "react";
import {
  IconX,
  IconUsers,
  IconChevronDown,
  IconChevronUp,
  IconCircleCheck,
  IconClock,
  IconFileSpreadsheet,
  IconFileTypePdf,
  IconUserMinus,
  IconUserCheck,
} from "@tabler/icons-react";
import { Evento, Inscricao } from "@/src/types/evento";
import { UserRole } from "@/src/types/user";
import { EventoInscricoesExportService } from "@/src/service/eventoInscricoesExport.service";

interface Props {
  evento: Evento;
  inscricoes: Inscricao[];
  role?: UserRole;
  currentUserId?: string;
  onFechar: () => void;
  onRemoverAluno?: (alunoId: string) => Promise<void>;
  onRemoverTodos?: () => Promise<void>;
  onConfirmarPresenca?: (qrCode: string) => Promise<unknown>;
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function ModalListaInscritos({ evento, inscricoes, role, currentUserId, onFechar, onRemoverAluno, onRemoverTodos, onConfirmarPresenca }: Props) {
  const sortedInscricoes = [...inscricoes].sort((a, b) =>
    a.alunoNome.localeCompare(b.alunoNome, "pt-BR", { sensitivity: "base" })
  );

  const total = sortedInscricoes.length;
  const confirmados = sortedInscricoes.filter((i) => i.presencaConfirmada).length;
  const [loadingExport, setLoadingExport] = useState<"excel" | "pdf" | null>(null);
  const [confirmandoTodos, setConfirmandoTodos] = useState(false);
  const [removendoTodos, setRemovendoTodos] = useState(false);

  const podeRemover =
    role === "adm" ||
    (role === "colaborador" &&
      !!currentUserId &&
      evento.colaboradores.some((c) => c.id === currentUserId));

  // Apenas quem não tem presença pode ser removido
  const temInscritosRemoviveis = sortedInscricoes.some((i) => !i.presencaConfirmada);

  async function handleExportar(tipoArquivo: "excel" | "pdf") {
    if (sortedInscricoes.length === 0) return;

    try {
      setLoadingExport(tipoArquivo);
      await EventoInscricoesExportService.exportar({
        evento,
        inscricoes: sortedInscricoes,
        tipoArquivo,
      });
    } catch (error) {
      console.error("[ModalListaInscritos] erro ao exportar:", error);
      alert("Não foi possível exportar a lista de inscritos.");
    } finally {
      setLoadingExport(null);
    }
  }

  async function handleConfirmarRemoverTodos() {
    if (!onRemoverTodos) return;
    setRemovendoTodos(true);
    try {
      await onRemoverTodos();
    } finally {
      setRemovendoTodos(false);
      setConfirmandoTodos(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl border border-slate-100 dark:border-[#303030] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-4 p-5 border-b border-slate-100 dark:border-[#2a2a2a] shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center shrink-0">
                <IconUsers size={18} className="text-blue-600 dark:text-blue-400" />
              </div>

              <div className="min-w-0">
                <h2 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                  Lista de Inscritos
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[550px]" title={evento.nome}>
                  {evento.nome}
                </p>
              </div>
            </div>

            <button
              onClick={onFechar}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#2a2a2a] text-slate-500 dark:text-slate-400 transition-colors shrink-0"
            >
              <IconX size={18} />
            </button>
          </div>

          <div className="flex flex-col items-start gap-3 inscritos:flex-row inscritos:items-center inscritos:justify-between">
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span>
                <strong className="text-slate-800 dark:text-slate-200">{total}</strong> inscritos
              </span>
              <span>
                <strong className="text-emerald-600 dark:text-emerald-400">{confirmados}</strong>{" "}
                presenças confirmadas
              </span>
            </div>

            <div className="flex flex-row items-start gap-2 self-start flex-wrap sm:flex-nowrap">
              {podeRemover && temInscritosRemoviveis && (
                <button
                  onClick={() => setConfirmandoTodos(true)}
                  disabled={removendoTodos || loadingExport !== null}
                  className="inline-flex w-auto items-center justify-center gap-2 rounded-xl border border-red-200 dark:border-red-900/40 px-4 py-2.5 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <IconUserMinus size={16} />
                  Desinscrever todos
                </button>
              )}

              <button
                onClick={() => handleExportar("excel")}
                disabled={loadingExport !== null || sortedInscricoes.length === 0}
                className="inline-flex w-auto items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-[#404040] px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
              >
                <IconFileSpreadsheet size={16} />
                {loadingExport === "excel" ? "Exportando Excel..." : "Exportar Excel"}
              </button>

              <button
                onClick={() => handleExportar("pdf")}
                disabled={loadingExport !== null || sortedInscricoes.length === 0}
                className="inline-flex w-auto items-center justify-center gap-2 rounded-xl bg-[#FFDE00] px-4 py-2.5 text-sm font-bold text-[#252525] transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
              >
                <IconFileTypePdf size={16} />
                {loadingExport === "pdf" ? "Exportando PDF..." : "Exportar PDF"}
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-auto flex-1">
          {sortedInscricoes.length === 0 ? (
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
                  {podeRemover && <th className="px-3 py-3 w-12" />}
                  <th className="lg:hidden px-3 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {sortedInscricoes.map((insc) => (
                  <ExpandableRow
                    key={insc.id}
                    insc={insc}
                    podeRemover={podeRemover}
                    onRemover={onRemoverAluno}
                    onConfirmarPresenca={onConfirmarPresenca}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {confirmandoTodos && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setConfirmandoTodos(false)}
        >
          <div
            className="bg-white dark:bg-[#202020] rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <IconUserMinus size={18} className="text-red-500 dark:text-red-400" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  Desinscrever todos
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {sortedInscricoes.filter(i => !i.presencaConfirmada).length} alunos serão removidos
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300">
              Tem certeza que deseja desinscrever <strong>todos</strong> os alunos deste evento? 
              Apenas aqueles sem presença confirmada serão removidos. Todos os alunos afetados receberão uma notificação.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setConfirmandoTodos(false)}
                disabled={removendoTodos}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-[#404040] text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2a2a2a] transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarRemoverTodos}
                disabled={removendoTodos}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors disabled:opacity-50"
              >
                {removendoTodos ? "Removendo..." : "Sim, desinscrever todos"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExpandableRow({
  insc,
  podeRemover,
  onRemover,
  onConfirmarPresenca,
}: {
  insc: Inscricao;
  podeRemover?: boolean;
  onRemover?: (alunoId: string) => Promise<void>;
  onConfirmarPresenca?: (qrCode: string) => Promise<unknown>;
}) {
  const [expandida, setExpandida] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [removendo, setRemovendo] = useState(false);
  const [confirmandoPresenca, setConfirmandoPresenca] = useState(false);
  const dataFormatada = formatarData(insc.dataInscricao);

  const handleRowClick = useCallback(() => {
    if (window.innerWidth < 1024) {
      setExpandida((v) => !v);
    }
  }, []);

  function abrirConfirmacao(e: React.MouseEvent) {
    e.stopPropagation();
    setConfirmando(true);
  }

  async function confirmarRemocao() {
    if (!onRemover) return;
    setRemovendo(true);
    try {
      await onRemover(insc.alunoId);
    } finally {
      setRemovendo(false);
      setConfirmando(false);
    }
  }

  async function handleConfirmarPresenca(e: React.MouseEvent) {
    e.stopPropagation();
    if (!onConfirmarPresenca) return;
    setConfirmandoPresenca(true);
    try {
      await onConfirmarPresenca(insc.qrCode);
    } finally {
      setConfirmandoPresenca(false);
    }
  }

  return (
    <>
      <tr
        onClick={handleRowClick}
        className={[
          "border-b border-slate-100 dark:border-[#2a2a2a] transition-colors",
          insc.presencaConfirmada
            ? "hover:bg-[#eafde6] dark:hover:bg-[#3d5838]"
            : "hover:bg-slate-50 dark:hover:bg-[#252525]",
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
        <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-200">
          {insc.alunoNome}
        </td>

        <td className="hidden sm:table-cell px-4 py-3 text-sm text-slate-600 dark:text-slate-300 font-mono">
          {insc.alunoMatricula}
        </td>

        <td className="hidden md:table-cell px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
          {insc.alunoArea}
        </td>

        <td className="hidden lg:table-cell px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
          {dataFormatada}
        </td>

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

        {podeRemover && (
          <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
            <div className="inline-flex items-center gap-1">
              {!insc.presencaConfirmada && onConfirmarPresenca && (
                <button
                  onClick={handleConfirmarPresenca}
                  disabled={confirmandoPresenca || removendo}
                  title="Confirmar presença"
                  className="inline-flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-50"
                >
                  <IconUserCheck size={15} />
                </button>
              )}
              {!insc.presencaConfirmada && (
                <button
                  onClick={abrirConfirmacao}
                  disabled={removendo || confirmandoPresenca}
                  title="Remover aluno"
                  className="inline-flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                >
                  <IconUserMinus size={15} />
                </button>
              )}
            </div>
          </td>
        )}

        <td className="lg:hidden px-3 py-3 text-right">
          <span
            aria-hidden="true"
            className="inline-flex items-center justify-center p-1 rounded-md text-slate-400 dark:text-slate-500 pointer-events-none"
          >
            {expandida ? <IconChevronUp size={15} /> : <IconChevronDown size={15} />}
          </span>
        </td>
      </tr>

      {expandida && (
        <tr className="lg:hidden bg-slate-50 dark:bg-[#1e1e1e] border-b border-slate-100 dark:border-[#2a2a2a]">
          <td colSpan={3} className="px-4 py-3">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              <div className="sm:hidden">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Matrícula
                </dt>
                <dd className="text-sm text-slate-700 dark:text-slate-300 mt-0.5 font-mono">
                  {insc.alunoMatricula}
                </dd>
              </div>

              <div className="md:hidden">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Área
                </dt>
                <dd className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">
                  {insc.alunoArea}
                </dd>
              </div>

              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Inscrito em
                </dt>
                <dd className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">
                  {dataFormatada}
                </dd>
              </div>

              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Presença
                </dt>
                <dd className="text-sm mt-0.5">
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

      {confirmando && (
        <tr>
          <td colSpan={99}>
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
              onClick={() => setConfirmando(false)}
            >
              <div
                className="bg-white dark:bg-[#202020] rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                    <IconUserMinus size={18} className="text-red-500 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">
                      Desinscrever aluno
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {insc.alunoNome}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Tem certeza que deseja desinscrever este aluno? Ele receberá uma notificação no próximo login.
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmando(false)}
                    disabled={removendo}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-[#404040] text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2a2a2a] transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmarRemocao}
                    disabled={removendo}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors disabled:opacity-50"
                  >
                    {removendo ? "Removendo..." : "Sim, desinscrever"}
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
