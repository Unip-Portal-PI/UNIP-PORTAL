"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  IconPlus,
  IconAlertCircle,
  IconUsers,
  IconEdit,
  IconTrash,
  IconRefresh,
  IconEye,
  IconChevronDown,
  IconChevronUp,
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconDownload,
} from "@tabler/icons-react";
import { UsuarioGestor, PERMISSION_LABEL, PERMISSION_COR } from "@/src/types/usuarioGestor";
import { UserRole } from "@/src/types/user";
import { UsuarioGestorService } from "@/src/service/usuarioGestor.service";
import { UsuarioGestorExportService } from "@/src/service/usuarioGestorExport.service";
import { Auth } from "@/src/service/auth.service";
import { BadgeUsuario } from "./modal/BadgeUsuario";
import { ModalFormUsuario } from "./modal/ModalFormUsuario";
import { ModalDetalhesUsuario } from "./modal/ModalDetalhesUsuario";
import { ModalConfirmarExcluir, ModalSucessoGestor, ModalErroGestor } from "./modal/ModaisGestor";
import { ModalExportarUsuarios } from "./modal/ModalExportarUsuarios";
import { FilterInput } from "@/app/components/filters/FilterInput";
import { FilterSelect } from "@/app/components/filters/FilterSelect";

const FILTRO_PERFIS = ["Todos", "Aluno", "Colaborador", "Administrador"];
const FILTRO_STATUS = ["Todos", "Ativos", "Inativos", "Excluídos"];

export function TabelaUsuarios() {
  const sessao = Auth.getUser();
  const adminMatricula = sessao?.matricula ?? "";

  const [usuarios, setUsuarios] = useState<UsuarioGestor[]>([]);
  const [loading, setLoading] = useState(true);
  const [erroCarga, setErroCarga] = useState(false);

  const [search, setSearch] = useState("");
  const [filtroPerfil, setFiltroPerfil] = useState(FILTRO_PERFIS[0]);
  const [filtroStatus, setFiltroStatus] = useState(FILTRO_STATUS[0]);

  const [modalForm, setModalForm] = useState<UsuarioGestor | null | "novo">(null);
  const [modalDetalhes, setModalDetalhes] = useState<UsuarioGestor | null>(null);
  const [modalExcluir, setModalExcluir] = useState<UsuarioGestor | null>(null);
  const [modalExportar, setModalExportar] = useState(false);

  const [loadingExcluir, setLoadingExcluir] = useState(false);
  const [loadingExportar, setLoadingExportar] = useState(false);

  const [sucesso, setSucesso] = useState("");
  const [erro, setErro] = useState("");
  const [porPagina, setPorPagina] = useState(10);
  const [pagina, setPagina] = useState(1);

  async function carregar() {
    setLoading(true);
    setErroCarga(false);
    try {
      const data = await UsuarioGestorService.getAll();
      setUsuarios(data);
    } catch {
      setErroCarga(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      if (filtroStatus === "Ativos" && (u.deletedAt || !u.ativo)) return false;
      if (filtroStatus === "Inativos" && (u.deletedAt || u.ativo)) return false;
      if (filtroStatus === "Excluídos" && !u.deletedAt) return false;

      const perfilMap: Record<string, UserRole> = {
        Aluno: "aluno",
        Colaborador: "colaborador",
        Administrador: "adm",
      };

      if (filtroPerfil !== "Todos" && u.permission !== perfilMap[filtroPerfil]) return false;

      const q = search.toLowerCase();
      return (
        !q ||
        u.nome.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.matricula.toLowerCase().includes(q) ||
        u.area.toLowerCase().includes(q)
      );
    });
  }, [usuarios, search, filtroPerfil, filtroStatus]);

  const totalAtivos = usuariosFiltrados.filter((u) => !u.deletedAt && u.ativo).length;
  const totalExcluidos = usuariosFiltrados.filter((u) => !!u.deletedAt).length;

  async function handleSalvar(dados: Omit<UsuarioGestor, "id" | "criadoEm" | "atualizadoEm">) {
    try {
      if (modalForm === "novo") {
        await UsuarioGestorService.criar(dados);
        setSucesso("Usuário criado com sucesso!");
      } else if (modalForm && typeof modalForm !== "string") {
        await UsuarioGestorService.editar(modalForm.id, dados);
        setSucesso("Usuário atualizado com sucesso!");
      }
      await carregar();
      setModalForm(null);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao salvar usuário.");
    }
  }

  async function handleExcluir() {
    if (!modalExcluir) return;
    setLoadingExcluir(true);
    try {
      const err = await UsuarioGestorService.excluir(modalExcluir.id, adminMatricula);
      if (err) {
        setErro(err);
        return;
      }
      setSucesso("Usuário excluído com sucesso.");
      await carregar();
      setModalExcluir(null);
    } finally {
      setLoadingExcluir(false);
    }
  }

  async function handleRestaurar(u: UsuarioGestor) {
    await UsuarioGestorService.restaurar(u.id);
    setSucesso("Usuário restaurado com sucesso.");
    await carregar();
  }

  async function handleExportar(payload: {
    perfis: UserRole[];
    status: ("ativo" | "inativo" | "excluido")[];
    tipoArquivo: "excel" | "pdf";
  }) {
    setLoadingExportar(true);
    try {
      await UsuarioGestorExportService.exportar({
        usuarios,
        perfis: payload.perfis,
        status: payload.status,
        tipoArquivo: payload.tipoArquivo,
      });

      setModalExportar(false);
      setSucesso(
        payload.tipoArquivo === "excel"
          ? "Arquivo Excel exportado com sucesso!"
          : "Arquivo PDF exportado com sucesso!"
      );
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao exportar usuários.");
    } finally {
      setLoadingExportar(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestão de Usuários</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {usuariosFiltrados.length} usuário(s) encontrado(s)
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setModalExportar(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#252525] border border-slate-200 cursor-pointer dark:border-[#333] hover:bg-[#EBEBEB] dark:hover:bg-slate-700 text-slate-700 dark:text-slate-100 text-sm font-bold rounded-md transition-colors shadow-sm"
          >
            <IconDownload size={18} />
            Exportar
          </button>

          <button
            onClick={() => setModalForm("novo")}
            className="flex items-center cursor-pointer gap-2 px-4 py-2.5 bg-[#FFDE00] hover:bg-[#e6c800] text-[#252525] text-sm font-bold rounded-md transition-colors shadow-sm"
          >
            <IconPlus size={18} />
            Novo usuário
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#202020] rounded-2xl border border-slate-100 dark:border-[#303030] shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FilterInput
            label="Buscar"
            placeholder="Nome, e-mail ou matrícula..."
            value={search}
            onChange={setSearch}
          />
          <FilterSelect
            label="Perfil"
            value={filtroPerfil}
            onChange={setFiltroPerfil}
            options={FILTRO_PERFIS}
          />
          <FilterSelect
            label="Status"
            value={filtroStatus}
            onChange={setFiltroStatus}
            options={FILTRO_STATUS}
          />
        </div>
      </div>

      {erroCarga && !loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <IconAlertCircle size={28} className="text-red-500" />
          </div>
          <p className="text-slate-600 dark:text-slate-300 font-medium">
            Falha ao carregar usuários.
          </p>
          <button
            onClick={carregar}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {!erroCarga && (
        <div className="w-full flex flex-col bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm border border-slate-100 dark:border-[#303030] overflow-hidden">
          <div className="flex items-start justify-between p-5 border-b border-slate-100 dark:border-[#2a2a2a] shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#FFDE00]/20 dark:bg-[#FFDE00]/10 rounded-lg flex items-center justify-center">
                <IconUsers size={30} className="text-[#3A3726] dark:text-[#FFDE00]" />
              </div>

              <div>
                <h2 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                  Usuários
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {usuariosFiltrados.length} no total
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mr-2">
              <span>
                <strong className="text-emerald-600 dark:text-emerald-400">{totalAtivos}</strong>{" "}
                ativos
              </span>
              {totalExcluidos > 0 && (
                <span>
                  <strong className="text-red-500">{totalExcluidos}</strong> excluídos
                </span>
              )}
            </div>
          </div>

          <div className="sm:hidden flex items-center gap-4 px-5 py-2 text-sm text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-[#2a2a2a] bg-slate-50 dark:bg-[#1e1e1e] shrink-0">
            <span>
              <strong className="text-emerald-600 dark:text-emerald-400">{totalAtivos}</strong>{" "}
              ativos
            </span>
            {totalExcluidos > 0 && (
              <span>
                <strong className="text-red-500">{totalExcluidos}</strong> excluídos
              </span>
            )}
          </div>

          <div className="overflow-auto flex-1 relative z-0">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-[#1e1e1e] sticky top-0 z-[1]">
                <tr>
                  <th className="px-4 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Usuário
                  </th>
                  <th className="hidden sm:table-cell px-4 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    E-mail
                  </th>
                  <th className="hidden md:table-cell px-4 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Matrícula
                  </th>
                  <th className="hidden lg:table-cell px-4 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Perfil
                  </th>
                  <th className="hidden lg:table-cell px-4 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Ações
                  </th>
                  <th className="lg:hidden px-3 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {loading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr
                      key={i}
                      className="border-b border-slate-100 dark:border-[#2a2a2a] animate-pulse"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-[#2a2a2a]" />
                          <div className="space-y-1.5">
                            <div className="h-3 bg-slate-200 dark:bg-[#2a2a2a] rounded w-28" />
                            <div className="h-2.5 bg-slate-200 dark:bg-[#2a2a2a] rounded w-16" />
                          </div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3">
                        <div className="h-3 bg-slate-200 dark:bg-[#2a2a2a] rounded w-40" />
                      </td>
                      <td className="hidden md:table-cell px-4 py-3">
                        <div className="h-3 bg-slate-200 dark:bg-[#2a2a2a] rounded w-24" />
                      </td>
                      <td className="hidden lg:table-cell px-4 py-3">
                        <div className="h-5 bg-slate-200 dark:bg-[#2a2a2a] rounded-full w-20" />
                      </td>
                      <td className="hidden lg:table-cell px-4 py-3">
                        <div className="h-5 bg-slate-200 dark:bg-[#2a2a2a] rounded-full w-16" />
                      </td>
                      <td className="px-4 py-3" />
                      <td className="lg:hidden px-3 py-3" />
                    </tr>
                  ))}

                {!loading && usuariosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-[#2a2a2a] rounded-full flex items-center justify-center">
                          <IconUsers size={22} className="text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-400 font-medium">
                          Nenhum usuário encontrado com esses filtros.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading &&
                  usuariosFiltrados.map((u) => (
                    <LinhaUsuario
                      key={u.id}
                      usuario={u}
                      ehOProprioAdmin={u.matricula === adminMatricula}
                      onDetalhes={() => setModalDetalhes(u)}
                      onEditar={() => setModalForm(u)}
                      onExcluir={() => setModalExcluir(u)}
                      onRestaurar={() => handleRestaurar(u)}
                    />
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalForm !== null && (
        <ModalFormUsuario
          usuario={modalForm === "novo" ? null : modalForm}
          criadoPor={adminMatricula}
          onSalvar={handleSalvar}
          onFechar={() => setModalForm(null)}
        />
      )}

      <ModalDetalhesUsuario
        usuario={modalDetalhes}
        onFechar={() => setModalDetalhes(null)}
        onEditar={(u) => setModalForm(u)}
      />

      <ModalConfirmarExcluir
        aberto={!!modalExcluir}
        titulo="Excluir usuário"
        mensagem={`Deseja excluir "${modalExcluir?.nome}"? Essa ação pode ser revertida.`}
        onConfirmar={handleExcluir}
        onCancelar={() => setModalExcluir(null)}
        loading={loadingExcluir}
      />

      <ModalExportarUsuarios
        aberto={modalExportar}
        loading={loadingExportar}
        onFechar={() => setModalExportar(false)}
        onExportar={handleExportar}
      />

      <ModalSucessoGestor aberto={!!sucesso} mensagem={sucesso} onOk={() => setSucesso("")} />
      <ModalErroGestor aberto={!!erro} mensagem={erro} onOk={() => setErro("")} />
    </div>
  );
}

interface LinhaUsuarioProps {
  usuario: UsuarioGestor;
  ehOProprioAdmin: boolean;
  onDetalhes: () => void;
  onEditar: () => void;
  onExcluir: () => void;
  onRestaurar: () => void;
}

function LinhaUsuario({
  usuario: u,
  ehOProprioAdmin,
  onDetalhes,
  onEditar,
  onExcluir,
  onRestaurar,
}: LinhaUsuarioProps) {
  const [expandida, setExpandida] = useState(false);
  const excluido = !!u.deletedAt;
  const inicial = u.nome.charAt(0).toUpperCase();

  const handleRowClick = useCallback(() => {
    if (window.innerWidth < 1024) setExpandida((v) => !v);
  }, []);

  return (
    <>
      <tr
        onClick={handleRowClick}
        className={[
          "border-b border-slate-100 dark:border-[#2a2a2a] transition-colors",
          "cursor-pointer lg:cursor-default",
          excluido ? "opacity-50" : "",
          "hover:bg-slate-50 dark:hover:bg-[#252525]",
          expandida ? "bg-slate-50/60 dark:bg-[#222]" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FFDE00]/20 dark:bg-[#FFDE00]/10 flex items-center justify-center text-sm font-black text-amber-700 dark:text-[#FFDE00] shrink-0">
              {inicial}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                {u.nome}
              </p>
              <p className="text-sm text-slate-400 truncate max-w-[120px]">@{u.apelido}</p>
            </div>
          </div>
        </td>

        <td className="hidden sm:table-cell px-4 py-3 text-base text-slate-600 dark:text-slate-300">
          {u.email}
        </td>

        <td className="hidden md:table-cell px-4 py-3 text-sm font-mono text-slate-500 dark:text-slate-400">
          {u.matricula}
        </td>

        <td className="hidden lg:table-cell px-4 py-3">
          <BadgeUsuario label={PERMISSION_LABEL[u.permission]} cor={PERMISSION_COR[u.permission]} />
        </td>

        <td className="hidden lg:table-cell px-4 py-3 text-sm">
          {excluido ? (
            <span className="inline-flex items-center gap-1 text-red-500 dark:text-red-400 font-semibold text-sm">
              <IconCircleX size={18} /> Excluído
            </span>
          ) : u.ativo ? (
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
              <IconCircleCheck size={18} /> Ativo
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 text-sm">
              <IconClock size={18} /> Inativo
            </span>
          )}
        </td>

        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-1">
            {excluido ? (
              <button
                onClick={onRestaurar}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
              >
                <IconRefresh size={18} /> Restaurar
              </button>
            ) : (
              <>
                <button
                  onClick={onDetalhes}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#2a2a2a] transition-colors"
                  title="Detalhes"
                >
                  <IconEye size={20} />
                </button>
                <button
                  onClick={onEditar}
                  className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  title="Editar"
                >
                  <IconEdit size={20} />
                </button>
                {!ehOProprioAdmin && u.permission !== "adm" && (
                  <button
                    onClick={onExcluir}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Excluir"
                  >
                    <IconTrash size={20} />
                  </button>
                )}
              </>
            )}
          </div>
        </td>

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
                  E-mail
                </dt>
                <dd className="text-sm text-slate-700 dark:text-slate-300 mt-0.5 break-all">
                  {u.email}
                </dd>
              </div>

              <div className="md:hidden">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Matrícula
                </dt>
                <dd className="text-sm text-slate-700 dark:text-slate-300 mt-0.5 font-mono">
                  {u.matricula}
                </dd>
              </div>

              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Área
                </dt>
                <dd className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">{u.area}</dd>
              </div>

              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Perfil
                </dt>
                <dd className="mt-1">
                  <BadgeUsuario
                    label={PERMISSION_LABEL[u.permission]}
                    cor={PERMISSION_COR[u.permission]}
                  />
                </dd>
              </div>

              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Status
                </dt>
                <dd className="mt-0.5">
                  {excluido ? (
                    <span className="inline-flex items-center gap-1 text-red-500 dark:text-red-400 font-semibold text-sm">
                      <IconCircleX size={14} /> Excluído
                    </span>
                  ) : u.ativo ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                      <IconCircleCheck size={14} /> Ativo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 text-sm">
                      <IconClock size={14} /> Inativo
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