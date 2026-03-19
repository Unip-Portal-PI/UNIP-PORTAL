// app/home/comunicado/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import {
  IconPlus,
  IconAlertCircle,
  IconSpeakerphone,
} from "@tabler/icons-react";
import { Comunicado } from "@/src/types/comunicado";
import { UserRole } from "@/src/types/user";
import { ComunicadoService } from "@/src/service/comunicado.service";
import {
  CURSOS_COMUNICADO,
  canEditComunicado,
  canDeleteAllComunicados,
  isAutor,
} from "@/src/utils/comunicado.helpers";
import { Auth } from "@/src/service/auth.service";

import { ComunicadoCard } from "@/app/components/comunicados/modal/ComunicadoCard";
import { ModalComunicado } from "@/app/components/comunicados/modal/ModalComunicado";
import { ModalExcluirComunicado } from "@/app/components/comunicados/modal/ModalExcluirComunicado";
import { ModalFormComunicado } from "@/app/components/comunicados/modal/ModalFormComunicado";
import { CarrosselComunicados } from "@/app/components/comunicados/CarrosselComunicados";
import { FilterInput } from "@/app/components/eventos/filters/FilterInput";
import { FilterSelect } from "@/app/components/eventos/filters/FilterSelect";

export default function ComunicadoPage() {
  const sessao = Auth.getUser();
  const role = (sessao?.permission ?? "aluno") as UserRole;
  const matricula = sessao?.matricula ?? "";
  const nome = sessao?.nome ?? "";

  // ── Estado ──────────────────────────────────────────────────────────────────
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [loading, setLoading] = useState(true);
  const [erroCarga, setErroCarga] = useState(false);

  // Filtros
  const [search, setSearch] = useState("");
  const [curso, setCurso] = useState(CURSOS_COMUNICADO[0]); // "Todos"

  // Modais
  const [modalVer, setModalVer] = useState<Comunicado | null>(null);
  const [modalExcluir, setModalExcluir] = useState<Comunicado | null>(null);
  const [modalForm, setModalForm] = useState<Comunicado | null | "novo">(null);

  // ── Carga ────────────────────────────────────────────────────────────────────
  async function carregarComunicados() {
    setLoading(true);
    setErroCarga(false);
    try {
      const data = await ComunicadoService.getAll();
      setComunicados(data);
    } catch {
      setErroCarga(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarComunicados();
  }, []);

  // ── Filtros ──────────────────────────────────────────────────────────────────
  const comunicadosFiltrados = useMemo(() => {
    return comunicados.filter((c) => {
      const matchSearch =
        search === "" ||
        c.titulo.toLowerCase().includes(search.toLowerCase()) ||
        c.assunto.toLowerCase().includes(search.toLowerCase()) ||
        c.resumo.toLowerCase().includes(search.toLowerCase());

      const matchCurso =
        curso === "Todos" ||
        c.visibilidade.includes("Todos") ||
        c.visibilidade.includes(curso);

      return matchSearch && matchCurso;
    });
  }, [comunicados, search, curso]);

  // ── Ações ────────────────────────────────────────────────────────────────────
  async function handleSalvar(
    dados: Omit<Comunicado, "id" | "criadoEm">
  ) {
    if (modalForm === "novo") {
      await ComunicadoService.criar(dados);
    } else if (modalForm && typeof modalForm !== "string") {
      await ComunicadoService.editar(modalForm.id, dados);
    }
    await carregarComunicados();
    setModalForm(null);
  }

  async function handleExcluir(comunicado: Comunicado) {
    await ComunicadoService.excluir(comunicado.id);
    await carregarComunicados();
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Comunicados</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {comunicadosFiltrados.length} comunicado(s) encontrado(s)
          </p>
        </div>

        {canEditComunicado(role) && (
          <button
            onClick={() => setModalForm("novo")}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#FFDE00] dark:bg-yellow-400 hover:bg-[#e6c800] dark:hover:bg-yellow-300 text-[#252525] text-sm font-bold rounded-[4] transition-colors shadow-sm"
          >
            <IconPlus size={18} />
            Novo comunicado
          </button>
        )}
      </div>

      {/* Carrossel de destaques */}
      {!loading && !erroCarga && comunicados.length > 0 && (
        <CarrosselComunicados
          comunicados={comunicados}
          onAbrir={setModalVer}
        />
      )}

      {/* Filtros */}
      <div className="bg-white dark:bg-[#202020] rounded-2xl border border-slate-100 dark:border-[#303030] shadow-sm p-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FilterInput
            label="Procurar"
            placeholder="Título ou assunto..."
            value={search}
            onChange={setSearch}
          />
          <FilterSelect
            label="Curso / Área"
            value={curso}
            onChange={setCurso}
            options={CURSOS_COMUNICADO}
          />
        </div>
      </div>

      {/* Estado: carregando */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#202020] rounded-2xl border border-slate-100 dark:border-[#303030] overflow-hidden animate-pulse"
            >
              <div className="h-40 bg-slate-200 dark:bg-[#2a2a2a]" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-slate-200 dark:bg-[#2a2a2a] rounded w-3/4" />
                <div className="h-3 bg-slate-200 dark:bg-[#2a2a2a] rounded w-full" />
                <div className="h-3 bg-slate-200 dark:bg-[#2a2a2a] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estado: erro */}
      {!loading && erroCarga && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <IconAlertCircle size={28} className="text-red-500" />
          </div>
          <p className="text-slate-600 dark:text-slate-300 font-medium">
            Falha ao carregar comunicados.
          </p>
          <button
            onClick={carregarComunicados}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Estado: sem resultados */}
      {!loading && !erroCarga && comunicadosFiltrados.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-14 h-14 bg-slate-100 dark:bg-[#2a2a2a] rounded-full flex items-center justify-center">
            <IconSpeakerphone size={28} className="text-slate-400" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Nenhum comunicado encontrado com esses filtros.
          </p>
        </div>
      )}

      {/* Grid de comunicados */}
      {!loading && !erroCarga && comunicadosFiltrados.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {comunicadosFiltrados.map((comunicado) => (
            <ComunicadoCard
              key={comunicado.id}
              comunicado={comunicado}
              role={role}
              matricula={matricula}
              onVerConteudo={setModalVer}
              onEditar={(c) => setModalForm(c)}
              onExcluir={(c) => setModalExcluir(c)}
            />
          ))}
        </div>
      )}

      {/* ── MODAIS ── */}

      {modalVer && (
        <ModalComunicado
          comunicado={modalVer}
          onFechar={() => setModalVer(null)}
        />
      )}

      {modalExcluir && (
        <ModalExcluirComunicado
          comunicado={modalExcluir}
          onConfirmar={() => handleExcluir(modalExcluir)}
          onFechar={() => setModalExcluir(null)}
        />
      )}

      {modalForm !== null && (
        <ModalFormComunicado
          comunicado={modalForm === "novo" ? null : modalForm}
          matricula={matricula}
          nome={nome}
          onSalvar={handleSalvar}
          onFechar={() => setModalForm(null)}
        />
      )}
    </div>
  );
}
