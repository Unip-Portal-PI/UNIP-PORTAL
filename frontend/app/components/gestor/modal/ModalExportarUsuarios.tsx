"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  IconDownload,
  IconFileSpreadsheet,
  IconFileTypePdf,
  IconX,
  IconCheck,
} from "@tabler/icons-react";
import { UserRole } from "@/src/types/user";

export type ExportFileType = "excel" | "pdf";
export type ExportStatusOption = "ativo" | "inativo" | "excluido";

interface ModalExportarUsuariosProps {
  aberto: boolean;
  loading?: boolean;
  onFechar: () => void;
  onExportar: (payload: {
    perfis: UserRole[];
    status: ExportStatusOption[];
    tipoArquivo: ExportFileType;
  }) => Promise<void> | void;
}

const TODOS_PERFIS: { label: string; value: UserRole }[] = [
  { label: "Aluno", value: "aluno" },
  { label: "Colaborador", value: "colaborador" },
  { label: "Administrador", value: "adm" },
];

const TODOS_STATUS: { label: string; value: ExportStatusOption }[] = [
  { label: "Ativo", value: "ativo" },
  { label: "Inativo", value: "inativo" },
  { label: "Excluído", value: "excluido" },
];

export function ModalExportarUsuarios({
  aberto,
  loading = false,
  onFechar,
  onExportar,
}: ModalExportarUsuariosProps) {
  const [mounted, setMounted] = useState(false);
  const [perfisSelecionados, setPerfisSelecionados] = useState<UserRole[]>(
    TODOS_PERFIS.map((item) => item.value)
  );
  const [statusSelecionados, setStatusSelecionados] = useState<ExportStatusOption[]>(
    TODOS_STATUS.map((item) => item.value)
  );
  const [tipoArquivo, setTipoArquivo] = useState<ExportFileType>("excel");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!aberto) return;

    setPerfisSelecionados(TODOS_PERFIS.map((item) => item.value));
    setStatusSelecionados(TODOS_STATUS.map((item) => item.value));
    setTipoArquivo("excel");
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) onFechar();
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [aberto, loading, onFechar]);

  const todosPerfisMarcados = useMemo(
    () => perfisSelecionados.length === TODOS_PERFIS.length,
    [perfisSelecionados]
  );

  const todosStatusMarcados = useMemo(
    () => statusSelecionados.length === TODOS_STATUS.length,
    [statusSelecionados]
  );

  function alternarPerfil(value: UserRole) {
    setPerfisSelecionados((atual) =>
      atual.includes(value) ? atual.filter((item) => item !== value) : [...atual, value]
    );
  }

  function alternarStatus(value: ExportStatusOption) {
    setStatusSelecionados((atual) =>
      atual.includes(value) ? atual.filter((item) => item !== value) : [...atual, value]
    );
  }

  async function handleExportar() {
    if (perfisSelecionados.length === 0 || statusSelecionados.length === 0) return;

    await onExportar({
      perfis: perfisSelecionados,
      status: statusSelecionados,
      tipoArquivo,
    });
  }

  function cardOptionClass(selected: boolean) {
    return [
      "flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors",
      selected
        ? "border-[#FFDE00] bg-[#FFDE00]/15 text-amber-700 dark:text-[#FFDE00]"
        : "border-slate-200 dark:border-[#404040] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2a2a2a]",
    ].join(" ");
  }

  function fileOptionClass(selected: boolean) {
    return [
      "flex items-center gap-3 rounded-xl border px-4 py-4 text-left transition-colors",
      selected
        ? "border-[#FFDE00] bg-[#FFDE00]/15"
        : "border-slate-200 dark:border-[#404040] hover:bg-slate-50 dark:hover:bg-[#2a2a2a]",
    ].join(" ");
  }

  if (!mounted || !aberto) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"

    >
      <div className="bg-white dark:bg-[#202020] rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#303030] shrink-0">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-lg">
              Exportar usuários
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Escolha os perfis, status e o tipo do arquivo.
            </p>
          </div>

          <button
            onClick={onFechar}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <IconX size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pt-5 pb-2 space-y-6">
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                Perfis
              </h3>

              <button
                type="button"
                onClick={() =>
                  setPerfisSelecionados(
                    todosPerfisMarcados ? [] : TODOS_PERFIS.map((item) => item.value)
                  )
                }
                className="text-sm font-bold text-amber-700 dark:text-[#FFDE00] hover:opacity-80 transition-opacity"
              >
                {todosPerfisMarcados ? "Desmarcar todos" : "Marcar todos"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TODOS_PERFIS.map((item) => {
                const ativo = perfisSelecionados.includes(item.value);

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => alternarPerfil(item.value)}
                    className={cardOptionClass(ativo)}
                  >
                    <span className="text-sm font-bold">{item.label}</span>

                    <span
                      className={[
                        "w-5 h-5 rounded-md flex items-center justify-center border transition-colors",
                        ativo
                          ? "bg-[#FFDE00] border-[#FFDE00] text-[#252525]"
                          : "border-slate-300 dark:border-[#505050] text-transparent",
                      ].join(" ")}
                    >
                      <IconCheck size={14} />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                Status
              </h3>

              <button
                type="button"
                onClick={() =>
                  setStatusSelecionados(
                    todosStatusMarcados ? [] : TODOS_STATUS.map((item) => item.value)
                  )
                }
                className="text-sm font-bold text-amber-700 dark:text-[#FFDE00] hover:opacity-80 transition-opacity"
              >
                {todosStatusMarcados ? "Desmarcar todos" : "Marcar todos"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TODOS_STATUS.map((item) => {
                const ativo = statusSelecionados.includes(item.value);

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => alternarStatus(item.value)}
                    className={cardOptionClass(ativo)}
                  >
                    <span className="text-sm font-bold">{item.label}</span>

                    <span
                      className={[
                        "w-5 h-5 rounded-md flex items-center justify-center border transition-colors",
                        ativo
                          ? "bg-[#FFDE00] border-[#FFDE00] text-[#252525]"
                          : "border-slate-300 dark:border-[#505050] text-transparent",
                      ].join(" ")}
                    >
                      <IconCheck size={14} />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide mb-3">
              Tipo do arquivo
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTipoArquivo("excel")}
                className={fileOptionClass(tipoArquivo === "excel")}
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                  <IconFileSpreadsheet size={22} className="text-emerald-600 dark:text-emerald-400" />
                </div>

                <div className="text-left">
                  <p className="font-bold text-slate-800 dark:text-white">Excel</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">.xlsx</p>
                </div>

                {tipoArquivo === "excel" && (
                  <span className="ml-auto w-5 h-5 rounded-md flex items-center justify-center bg-[#FFDE00] border border-[#FFDE00] text-[#252525]">
                    <IconCheck size={14} />
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setTipoArquivo("pdf")}
                className={fileOptionClass(tipoArquivo === "pdf")}
              >
                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                  <IconFileTypePdf size={22} className="text-red-500 dark:text-red-400" />
                </div>

                <div className="text-left">
                  <p className="font-bold text-slate-800 dark:text-white">PDF</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">.pdf</p>
                </div>

                {tipoArquivo === "pdf" && (
                  <span className="ml-auto w-5 h-5 rounded-md flex items-center justify-center bg-[#FFDE00] border border-[#FFDE00] text-[#252525]">
                    <IconCheck size={14} />
                  </span>
                )}
              </button>
            </div>
          </section>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-[#303030] shrink-0">
          <button
            type="button"
            onClick={onFechar}
            disabled={loading}
            className="flex-1 py-3 rounded-xl border-2 border-slate-200 dark:border-[#404040] text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2a2a2a] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={
              loading || perfisSelecionados.length === 0 || statusSelecionados.length === 0
            }
            onClick={handleExportar}
            className="flex-1 py-3 rounded-xl bg-[#FFDE00] hover:bg-[#e6c800] disabled:opacity-60 disabled:cursor-not-allowed text-[#252525] text-sm font-bold transition-colors inline-flex items-center justify-center gap-2"
          >
            <IconDownload size={18} />
            {loading ? "Exportando..." : "Exportar"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}