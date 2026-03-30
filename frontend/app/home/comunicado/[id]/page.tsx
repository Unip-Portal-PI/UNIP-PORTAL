// app/home/comunicado/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconCalendar,
  IconUser,
  IconEye,
  IconPaperclip,
  IconAlertTriangle,
  IconEdit,
  IconTrash,
  IconExternalLink,
  IconAlertCircle,
} from "@tabler/icons-react";
import { Comunicado } from "@/src/types/comunicado";
import { UserRole } from "@/src/types/user";
import { ComunicadoService } from "@/src/service/comunicado.service";
import {
  isComunicadoExpirado,
  canEditComunicado,
  canDeleteAllComunicados,
  isAutor,
  parseAssuntos,
} from "@/src/utils/comunicado.helpers";
import { renderConteudoFormatado } from "@/src/utils/comunicado.formatter";
import { Auth } from "@/src/service/auth.service";
import { ModalFormComunicado } from "@/app/components/comunicados/modal/ModalFormComunicado";
import { ModalExcluirComunicado } from "@/app/components/comunicados/modal/ModalExcluirComunicado";
import AuthGuard from "@/src/guard/AuthGuard";

export default function ComunicadoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const sessao = Auth.getUser();
  const role = (sessao?.permission ?? "aluno") as UserRole;
  const matricula = sessao?.matricula ?? "";
  const nome = sessao?.nome ?? "";

  const [comunicado, setComunicado] = useState<Comunicado | null>(null);
  const [loading, setLoading] = useState(true);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [modalForm, setModalForm] = useState(false);
  const [modalExcluir, setModalExcluir] = useState(false);

  async function carregar() {
    setLoading(true);
    try {
      const data = await ComunicadoService.getById(id);
      if (!data) { setNaoEncontrado(true); return; }

      setComunicado(data);
    } catch {
      setNaoEncontrado(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregar(); }, [id]);

  async function handleSalvar(dados: Omit<Comunicado, "id" | "criadoEm">) {
    if (!comunicado) return;
    await ComunicadoService.editar(comunicado.id, dados);
    await carregar();
    setModalForm(false);
  }

  async function handleExcluir() {
    if (!comunicado) return;
    await ComunicadoService.excluir(comunicado.id);
    router.push("/home/comunicado");
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-pulse">
        <div className="h-4 w-24 bg-slate-200 dark:bg-[#2a2a2a] rounded mb-6" />
        <div className="h-56 bg-slate-200 dark:bg-[#2a2a2a] rounded-2xl mb-6" />
        <div className="space-y-3">
          <div className="h-7 bg-slate-200 dark:bg-[#2a2a2a] rounded w-3/4" />
          <div className="h-4 bg-slate-200 dark:bg-[#2a2a2a] rounded w-1/2" />
          <div className="h-4 bg-slate-200 dark:bg-[#2a2a2a] rounded w-full mt-6" />
          <div className="h-4 bg-slate-200 dark:bg-[#2a2a2a] rounded w-5/6" />
          <div className="h-4 bg-slate-200 dark:bg-[#2a2a2a] rounded w-4/6" />
        </div>
      </div>
    );
  }

  if (naoEncontrado || !comunicado) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-8"
        >
          <IconArrowLeft size={16} />
          Voltar
        </button>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-[#2a2a2a] flex items-center justify-center">
            <IconAlertCircle size={32} className="text-slate-400" />
          </div>
          <p className="text-lg font-bold text-slate-700 dark:text-slate-200">
            Comunicado não encontrado
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-xs">
            Este comunicado pode ter sido removido ou não existe mais.
          </p>
          <button
            onClick={() => router.push("/home/comunicado")}
            className="mt-2 px-5 py-2.5 bg-[#FFDE00] hover:bg-[#e6c800] text-[#252525] text-sm font-bold rounded-xl transition-colors"
          >
            Ver todos os comunicados
          </button>
        </div>
      </div>
    );
  }

  const expirado = isComunicadoExpirado(comunicado);
  const podeEditar = canEditComunicado(role);
  const podeExcluir = canDeleteAllComunicados(role);

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

  return (
    <AuthGuard>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <button
            onClick={() => router.push("/home/comunicado")}
            className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <IconArrowLeft size={16} />
            Comunicados
          </button>

          {(podeEditar || podeExcluir) && (
            <div className="flex gap-2">
              {podeEditar && (
                <button
                  onClick={() => setModalForm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#404040] text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2a2a2a] transition-colors"
                >
                  <IconEdit size={14} />
                  Editar
                </button>
              )}
              {podeExcluir && (
                <button
                  onClick={() => setModalExcluir(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/40 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <IconTrash size={14} />
                  Excluir
                </button>
              )}
            </div>
          )}
        </div>

        {comunicado.banner ? (
          <div className="w-full h-56 sm:h-72 rounded-2xl overflow-hidden mb-6 shadow-sm">
            <img src={comunicado.banner} alt={comunicado.titulo} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full h-60 rounded-2xl bg-gradient-to-br from-[#FFDE00]/70 to-amber-400 flex items-center justify-center mb-6 shadow-sm">
            <span className="text-[#252525] text-5xl font-black opacity-40 select-none text-center">
              Comunicado<br />AVP
            </span>
          </div>
        )}

        {parseAssuntos(comunicado.assunto).length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {parseAssuntos(comunicado.assunto).map((item) => (
              <span key={item} className="inline-block rounded-full bg-[#FFDE00]/20 px-3 py-1 text-xs font-black text-amber-700 dark:text-[#FFDE00]">
                {item}
              </span>
            ))}
          </div>
        )}

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-snug mb-4">
          {comunicado.titulo}
        </h1>

        <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 mb-5 pb-5 border-b border-slate-100 dark:border-[#2a2a2a]">
          <span className="flex items-center gap-1.5">
            <IconUser size={13} />
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {comunicado.criadoPorNome}
            </span>
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

        {expirado && (
          <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4 mb-6">
            <IconAlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Este comunicado <strong>expirou em {dataValidadeFormatada}</strong> e pode estar desatualizado.
            </p>
          </div>
        )}

        <div className="max-w-none">
          {renderConteudoFormatado(comunicado.conteudo)}
        </div>

        {comunicado.anexos.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-[#2a2a2a]">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-3">
              <IconPaperclip size={15} />
              Anexos ({comunicado.anexos.length})
            </h2>
            <div className="space-y-2.5">
              {comunicado.anexos.map((anexo) => (
                <div key={anexo.id} className="flex items-center justify-between bg-slate-50 dark:bg-[#2a2a2a] rounded-xl px-4 py-3 border border-slate-100 dark:border-[#363636] group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#FFDE00]/20 dark:bg-[#FFDE00]/10 flex items-center justify-center shrink-0">
                      <IconPaperclip size={15} className="text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{anexo.nome}</p>
                      <p className="text-xs text-slate-400">{anexo.tipo.toUpperCase()} · {anexo.tamanhoMB.toFixed(1)} MB</p>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-2 shrink-0">
                    <a href={anexo.url} target="_blank" rel="noreferrer noopener" className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 dark:border-[#505050] dark:bg-[#363636] dark:text-slate-300 dark:hover:bg-[#404040]">
                      <IconExternalLink size={13} />
                      Visualizar
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-[#2a2a2a] flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400">Visível para:</span>
          {comunicado.visibilidade.map((v) => (
            <span key={v} className="text-xs bg-slate-100 dark:bg-[#2a2a2a] text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-full">
              {v}
            </span>
          ))}
        </div>

        <div className="mt-8">
          <button onClick={() => router.push("/home/comunicado")} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-slate-200 dark:border-[#404040] text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2a2a2a] transition-colors">
            <IconArrowLeft size={16} />
            Voltar para comunicados
          </button>
        </div>
      </div>

      {modalForm && comunicado && (
        <ModalFormComunicado
          comunicado={comunicado}
          matricula={matricula}
          nome={nome}
          onSalvar={handleSalvar}
          onFechar={() => setModalForm(false)}
        />
      )}

      {modalExcluir && comunicado && (
        <ModalExcluirComunicado
          comunicado={comunicado}
          onConfirmar={handleExcluir}
          onFechar={() => setModalExcluir(false)}
        />
      )}
    </AuthGuard>
  );
}
