// app/home/eventos/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconPlus,
  IconQrcode,
  IconAlertCircle,
  IconCalendarOff,
} from "@tabler/icons-react";
import { Evento, Inscricao } from "@/src/types/evento";
import { UserRole } from "@/src/types/user";
import { EventoService } from "@/src/service/evento.service";
import { TURNOS, canCreate, canEdit } from "@/src/utils/evento.helpers";
import { CURSOS } from "@/src/utils/cursos.helpers";
import { Auth } from "@/src/service/auth.service";
import { EventoCard } from "@/app/components/eventos/EventoCard";
import { ModalInscricao } from "@/app/components/eventos/ModalInscricao";
import { ModalExcluir } from "@/app/components/eventos/ModalExcluir";
import { ModalFormEvento } from "@/app/components/eventos/ModalFormEvento";
import { ModalQRReader } from "@/app/components/eventos/ModalQRReader";
import { ModalDesinscricaoSucesso } from "@/app/components/eventos/ModalDesinscricaoSucesso";
import { ModalEventoCancelado } from "@/app/components/eventos/ModalEventoCancelado";
import { CarrosselEventos } from "@/app/components/eventos/CarrosselEventos";
import { FilterInput } from "@/app/components/filters/FilterInput";
import { FilterSelect } from "@/app/components/filters/FilterSelect";
import { FilterDate } from "@/app/components/filters/FilterDate";
import AuthGuard from "@/src/guard/AuthGuard";

const LIMIT = 12;

const TURNO_API: Record<string, string> = {
  "Manhã": "manha",
  "Tarde": "tarde",
  "Noite": "noite",
};

type UsuarioEventos = {
  id: string;
  apelido: string;
  nome: string;
  matricula: string;
  area: string;
  email: string;
  role: UserRole;
};

// ── Skeleton de card ─────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#202020] rounded-2xl border border-slate-100 dark:border-[#303030] overflow-hidden animate-pulse">
      <div className="h-40 bg-slate-200 dark:bg-[#2a2a2a]" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-200 dark:bg-[#2a2a2a] rounded w-3/4" />
        <div className="h-3 bg-slate-200 dark:bg-[#2a2a2a] rounded w-full" />
        <div className="h-3 bg-slate-200 dark:bg-[#2a2a2a] rounded w-1/2" />
      </div>
    </div>
  );
}

export default function EventosPage() {
  // ── Sessão ────────────────────────────────────────────────────────────────
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<UserRole>("aluno");
  const [user, setUser] = useState<UsuarioEventos>({
    id: "", apelido: "", nome: "", matricula: "", area: "", email: "", role: "aluno",
  });

  // ── Carrossel (fetch independente) ────────────────────────────────────────
  const [eventosCarrossel, setEventosCarrossel] = useState<Evento[]>([]);
  const [loadingCarrossel, setLoadingCarrossel] = useState(true);

  // ── Grid com infinite scroll ──────────────────────────────────────────────
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [totalEventos, setTotalEventos] = useState(0);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [loadingMais, setLoadingMais] = useState(false);
  const [erroCarga, setErroCarga] = useState(false);

  // ── Filtros ───────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [curso, setCurso] = useState(CURSOS[0]);
  const [turno, setTurno] = useState(TURNOS[0]);
  const [dataEvento, setDataEvento] = useState("");

  // ── Inscrições ────────────────────────────────────────────────────────────
  const [minhasInscricoes, setMinhasInscricoes] = useState<Record<string, Inscricao>>({});

  // ── Modais ────────────────────────────────────────────────────────────────
  const [modalInscricao, setModalInscricao] = useState<Evento | null>(null);
  const [modalExcluir, setModalExcluir] = useState<Evento | null>(null);
  const [modalForm, setModalForm] = useState<Evento | null | "novo">(null);
  const [modalQR, setModalQR] = useState<Evento | null>(null);
  const [modalDesinscricaoSucesso, setModalDesinscricaoSucesso] = useState<Evento | null>(null);
  const [mensagemEventoCancelado, setMensagemEventoCancelado] = useState("");
  const [presencasConfirmadas, setPresencasConfirmadas] = useState<Inscricao[]>([]);

  // ── Refresh key para forçar re-fetch após CRUD ───────────────────────────
  const [refreshKey, setRefreshKey] = useState(0);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const sentinelRef = useRef<HTMLDivElement>(null);
  // ref que sempre aponta para a função mais recente (evita closure stale no observer)
  const carregarMaisRef = useRef<() => void>(() => {});
  const roleRef = useRef<UserRole>("aluno");

  // ── Debounce search ───────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // ── Carrossel — fetch independente dos filtros do usuário ─────────────────
  useEffect(() => {
    setLoadingCarrossel(true);
    EventoService.getScroll({ skip: 0, limit: 5, sort: "recentes" })
      .then((r) => setEventosCarrossel(r.items))
      .catch(() => {})
      .finally(() => setLoadingCarrossel(false));
  }, []);

  // ── Fetch inicial / reset ao mudar filtros ────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    setEventos([]);
    setSkip(0);
    setHasMore(true);
    setLoadingInicial(true);
    setErroCarga(false);

    const currentRole = roleRef.current;

    (async () => {
      try {
        const [scrollResult, inscricoesList] = await Promise.all([
          EventoService.getScroll({
            skip: 0,
            limit: LIMIT,
            search: searchQuery || undefined,
            area: curso !== "Todos" ? curso : undefined,
            turno: TURNO_API[turno] || undefined,
            data: dataEvento || undefined,
          }),
          currentRole === "aluno" ? EventoService.getMinhasInscricoes() : Promise.resolve(null),
        ]);

        if (cancelled) return;

        setEventos(scrollResult.items);
        setTotalEventos(scrollResult.total);
        setHasMore(scrollResult.temMais);
        setSkip(scrollResult.items.length);

        if (inscricoesList) {
          setMinhasInscricoes(
            Object.fromEntries(inscricoesList.map((i) => [i.eventoId, i]))
          );
        }
      } catch {
        if (!cancelled) setErroCarga(true);
      } finally {
        if (!cancelled) setLoadingInicial(false);
      }
    })();

    return () => { cancelled = true; };
  }, [searchQuery, curso, turno, dataEvento, refreshKey]);

  // ── Carregar mais eventos (chamado pelo IntersectionObserver) ─────────────
  function carregarMais(currentSkip: number) {
    if (loadingMais || loadingInicial) return;

    let cancelled = false;
    setLoadingMais(true);

    EventoService.getScroll({
      skip: currentSkip,
      limit: LIMIT,
      search: searchQuery || undefined,
      area: curso !== "Todos" ? curso : undefined,
      turno: TURNO_API[turno] || undefined,
      data: dataEvento || undefined,
    })
      .then((result) => {
        if (cancelled) return;
        setEventos((prev) => [...prev, ...result.items]);
        setTotalEventos(result.total);
        setHasMore(result.temMais);
        setSkip(currentSkip + result.items.length);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingMais(false); });

    return () => { cancelled = true; };
  }

  // ── Atualizar ref da função carregarMais a cada render ────────────────────
  // (IntersectionObserver usa sempre a versão mais recente sem recriar o observer)
  carregarMaisRef.current = () => {
    if (!hasMore || loadingMais || loadingInicial) return;
    carregarMais(skip);
  };

  // ── Scroll listener — dispara ao chegar perto do fim da página ──────────
  useEffect(() => {
    function handleScroll() {
      const distanciaDoFim = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
      if (distanciaDoFim <= 300) carregarMaisRef.current();
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Após qualquer batch concluir, verifica se ainda está no fim da página ─
  useEffect(() => {
    if (loadingInicial || loadingMais || !hasMore) return;
    const distanciaDoFim = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
    if (distanciaDoFim <= 300) carregarMaisRef.current();
  }, [loadingInicial, loadingMais, hasMore]);

  // ── Helpers de sessão ─────────────────────────────────────────────────────
  useEffect(() => {
    const sessao = Auth.getUser();
    const currentRole = (sessao?.permission ?? "aluno") as UserRole;
    roleRef.current = currentRole;
    setRole(currentRole);
    setUser({
      id: sessao?.id ?? "",
      apelido: sessao?.apelido ?? "",
      nome: sessao?.nome ?? "",
      matricula: sessao?.matricula ?? "",
      area: sessao?.area ?? "",
      email: sessao?.email ?? "",
      role: currentRole,
    });
    setMounted(true);
  }, []);

  // ── Reset do scroll (após CRUD) ───────────────────────────────────────────
  function resetScroll() {
    setRefreshKey((k) => k + 1);
  }

  // ── Handlers de filtro ────────────────────────────────────────────────────
  function handleCurso(value: string) { setCurso(value); }
  function handleTurno(value: string) { setTurno(value); }
  function handleData(value: string) { setDataEvento(value); }

  // ── CRUD handlers ─────────────────────────────────────────────────────────
  function isInscrito(eventoId: string) {
    return !!minhasInscricoes[eventoId];
  }

  async function handleInscrever(evento: Evento) {
    if (evento.tipoInscricao === "externa" && evento.urlExterna) {
      window.open(evento.urlExterna, "_blank");
      return;
    }
    setModalInscricao(evento);
  }

  async function handleConfirmarInscricao(evento: Evento): Promise<Inscricao> {
    const result = await EventoService.inscrever(evento.id);
    setMinhasInscricoes((prev) => ({ ...prev, [evento.id]: result }));
    setEventos((prev) =>
      prev.map((e) => e.id === evento.id ? { ...e, vagasOcupadas: e.vagasOcupadas + 1 } : e)
    );
    return result;
  }

  async function handleCancelarInscricao(evento: Evento) {
    await EventoService.cancelarInscricao(evento.id);
    setMinhasInscricoes((prev) => {
      const { [evento.id]: _, ...rest } = prev;
      return rest;
    });
    setEventos((prev) =>
      prev.map((e) =>
        e.id === evento.id ? { ...e, vagasOcupadas: Math.max(0, e.vagasOcupadas - 1) } : e
      )
    );
    setModalDesinscricaoSucesso(evento);
  }

  async function handleSalvarEvento(dados: Omit<Evento, "id" | "criadoEm" | "vagasOcupadas">) {
    if (modalForm === "novo") {
      await EventoService.criar(dados);
    } else if (modalForm && typeof modalForm !== "string") {
      await EventoService.editar(modalForm.id, dados);
    }
    setModalForm(null);
    // Refetch carrossel (novo evento pode ser o mais recente)
    EventoService.getScroll({ skip: 0, limit: 5, sort: "recentes" })
      .then((r) => setEventosCarrossel(r.items))
      .catch(() => {});
    resetScroll();
  }

  async function handleExcluir(evento: Evento) {
    const response = await EventoService.cancelar(evento.id);
    setEventos((prev) => prev.filter((e) => e.id !== evento.id));
    setEventosCarrossel((prev) => prev.filter((e) => e.id !== evento.id));
    setTotalEventos((prev) => Math.max(0, prev - 1));
    setMensagemEventoCancelado(response.mensagem);
    setModalExcluir(null);
  }

  async function handleQRConfirmar(qrCode: string): Promise<Inscricao> {
    if (!modalQR) throw new Error("Evento não selecionado para check-in.");
    const result = await EventoService.confirmarPresenca(modalQR.id, qrCode);
    setPresencasConfirmadas((prev) => {
      const exists = prev.find((p) => p.id === result.id);
      return exists ? prev : [...prev, result];
    });
    return result;
  }

  async function abrirModalQR(evento: Evento) {
    const inscricoes = await EventoService.getInscricoesEvento(evento.id);
    setPresencasConfirmadas(inscricoes.filter((i) => i.presencaConfirmada));
    setModalQR(evento);
  }

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Eventos</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {loadingInicial ? "Carregando..." : `${totalEventos} evento(s) encontrado(s)`}
            </p>
          </div>

          {mounted && canCreate(role) && (
            <button
              onClick={() => setModalForm("novo")}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#FFDE00] dark:bg-yellow-400 hover:bg-[#e6c800] dark:hover:bg-yellow-300 text-[#252525] text-sm font-bold rounded-[4] transition-colors shadow-sm"
            >
              <IconPlus size={18} />
              Novo evento
            </button>
          )}
        </div>

        {/* ── Carrossel ── */}
        {loadingCarrossel && (
          <div className="w-full rounded-2xl overflow-hidden border border-slate-100 dark:border-[#303030] mb-8 animate-pulse">
            <div className="relative h-52 sm:h-[380px] bg-slate-200 dark:bg-[#2a2a2a]">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 space-y-2">
                <div className="h-4 bg-white/20 rounded-full w-24" />
                <div className="h-6 bg-white/20 rounded w-2/3" />
                <div className="h-4 bg-white/20 rounded w-1/2" />
              </div>
              <div className="absolute bottom-4 right-5 flex gap-1.5">
                <div className="w-5 h-2 bg-white/30 rounded-full" />
                <div className="w-2 h-2 bg-white/20 rounded-full" />
                <div className="w-2 h-2 bg-white/20 rounded-full" />
              </div>
            </div>
          </div>
        )}

        {!loadingCarrossel && eventosCarrossel.length > 0 && (
          <CarrosselEventos eventos={eventosCarrossel} />
        )}

        {/* ── Filtros ── */}
        <div className="bg-white dark:bg-[#202020] rounded-2xl border border-slate-100 dark:border-[#303030] shadow-sm p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <FilterInput
              label="Procurar"
              placeholder="Nome do evento..."
              value={search}
              onChange={setSearch}
            />
            <FilterSelect
              label="Curso"
              value={curso}
              onChange={handleCurso}
              options={CURSOS}
            />
            <FilterSelect
              label="Turno"
              value={turno}
              onChange={handleTurno}
              options={TURNOS}
            />
            <FilterDate
              label="Data"
              value={dataEvento}
              onChange={handleData}
            />
          </div>
        </div>

        {/* ── Erro ── */}
        {!loadingInicial && erroCarga && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <IconAlertCircle size={28} className="text-red-500" />
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-medium">
              Falha ao carregar eventos.
            </p>
            <button
              onClick={() => setSearchQuery((q) => q)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* ── Skeleton inicial ── */}
        {loadingInicial && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: LIMIT }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        )}

        {/* ── Vazio ── */}
        {!loadingInicial && !erroCarga && eventos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-14 h-14 bg-slate-100 dark:bg-[#2a2a2a] rounded-full flex items-center justify-center">
              <IconCalendarOff size={28} className="text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Nenhum evento encontrado com esses filtros.
            </p>
          </div>
        )}

        {/* ── Grid de eventos ── */}
        {!loadingInicial && !erroCarga && eventos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventos.map((evento) => (
              <div key={evento.id} className="relative">
                <EventoCard
                  evento={evento}
                  role={role}
                  currentUserId={user.id}
                  isInscrito={isInscrito(evento.id)}
                  canCancelarInscricao={!minhasInscricoes[evento.id]?.presencaConfirmada}
                  onInscrever={handleInscrever}
                  onCancelarInscricao={handleCancelarInscricao}
                  onEditar={(e) => setModalForm(e)}
                  onExcluir={(e) => setModalExcluir(e)}
                />
                {mounted && canEdit(role) && (
                  <button
                    onClick={() => abrirModalQR(evento)}
                    className="absolute top-3 right-3 bg-white dark:bg-[#202020] border border-slate-200 dark:border-[#404040] shadow rounded-full p-1.5 text-slate-600 dark:text-slate-300 hover:bg-[#F3F3F3] dark:hover:bg-[#515151] transition-colors"
                    title="Leitor QR Code"
                  >
                    <IconQrcode size={26} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Skeleton de "carregar mais" ── */}
        {loadingMais && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        )}

        {/* ── Sentinel para IntersectionObserver ── */}
        <div ref={sentinelRef} className="h-1 mt-2" />

        {/* ── Fim da lista ── */}
        {!loadingInicial && !loadingMais && !hasMore && eventos.length > 0 && (
          <p className="text-center text-sm text-slate-400 dark:text-slate-500 mt-6 py-2">
            Todos os {totalEventos} evento(s) carregados.
          </p>
        )}

        {/* ── Modais ── */}
        {modalInscricao && (
          <ModalInscricao
            evento={modalInscricao}
            user={user}
            onConfirmar={() => handleConfirmarInscricao(modalInscricao)}
            onFechar={() => setModalInscricao(null)}
          />
        )}

        {modalExcluir && (
          <ModalExcluir
            evento={modalExcluir}
            onConfirmar={() => handleExcluir(modalExcluir)}
            onFechar={() => setModalExcluir(null)}
          />
        )}

        {modalForm !== null && (
          <ModalFormEvento
            evento={modalForm === "novo" ? null : modalForm}
            role={role}
            onSalvar={handleSalvarEvento}
            onFechar={() => setModalForm(null)}
          />
        )}

        {modalQR && (
          <ModalQRReader
            eventoNome={modalQR.nome}
            onLer={handleQRConfirmar}
            onFechar={() => setModalQR(null)}
            presencasConfirmadas={presencasConfirmadas}
          />
        )}

        {modalDesinscricaoSucesso && (
          <ModalDesinscricaoSucesso
            eventoNome={modalDesinscricaoSucesso.nome}
            onFechar={() => setModalDesinscricaoSucesso(null)}
          />
        )}

        {mensagemEventoCancelado && (
          <ModalEventoCancelado
            mensagem={mensagemEventoCancelado}
            onFechar={() => setMensagemEventoCancelado("")}
          />
        )}
      </div>
    </AuthGuard>
  );
}
