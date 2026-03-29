"use client";

import { useEffect, useMemo, useState } from "react";
import {
  IconPlus,
  IconQrcode,
  IconAlertCircle,
  IconCalendarOff,
} from "@tabler/icons-react";
import { Evento, Inscricao } from "@/src/types/evento";
import { UserRole } from "@/src/types/user";
import { EventoService } from "@/src/service/evento.service";
import { TURNOS, canEdit } from "@/src/utils/evento.helpers";
import { CURSOS } from "@/src/utils/cursos.helpers";
import { Auth } from "@/src/service/auth.service";
import { EventoCard } from "@/app/components/eventos/EventoCard";
import { ModalInscricao } from "@/app/components/eventos/ModalInscricao";
import { ModalExcluir } from "@/app/components/eventos/ModalExcluir";
import { ModalFormEvento } from "@/app/components/eventos/ModalFormEvento";
import { ModalQRReader } from "@/app/components/eventos/ModalQRReader";
import { CarrosselEventos } from "@/app/components/eventos/CarrosselEventos";
// import { FilterDateRange } from "@/app/components/eventos/filters/FilterDateRange";
import { FilterInput } from "@/app/components/filters/FilterInput";
import { FilterSelect } from "@/app/components/filters/FilterSelect";
import AuthGuard from "@/src/guard/AuthGuard";

type UsuarioEventos = {
  id: string;
  apelido: string;
  nome: string;
  matricula: string;
  area: string;
  email: string;
  role: UserRole;
};

function isEventoExpirado(evento: Evento) {
  if (!evento?.data) return false;

  const horario = evento.horario && evento.horario.trim() !== "" ? evento.horario : "23:59";
  const dataHoraEvento = new Date(`${evento.data}T${horario}:00`);

  if (Number.isNaN(dataHoraEvento.getTime())) return false;

  return dataHoraEvento.getTime() < Date.now();
}

export default function EventosPage() {
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<UserRole>("aluno");
  const [user, setUser] = useState<UsuarioEventos>({
    id: "",
    apelido: "",
    nome: "",
    matricula: "",
    area: "",
    email: "",
    role: "aluno",
  });

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [erroCarga, setErroCarga] = useState(false);

  const [search, setSearch] = useState("");
  const [curso, setCurso] = useState(CURSOS[0]);
  const [turno, setTurno] = useState(TURNOS[0]);

  const [modalInscricao, setModalInscricao] = useState<Evento | null>(null);
  const [modalExcluir, setModalExcluir] = useState<Evento | null>(null);
  const [modalForm, setModalForm] = useState<Evento | null | "novo">(null);
  const [modalQR, setModalQR] = useState<Evento | null>(null);
  const [presencasConfirmadas, setPresencasConfirmadas] = useState<Inscricao[]>([]);
  const [minhasInscricoes, setMinhasInscricoes] = useState<Record<string, Inscricao>>({});

  async function carregarEventos(currentRole: UserRole) {
    setLoading(true);
    setErroCarga(false);

    try {
      const data = await EventoService.getAll();
      setEventos(data);

      if (currentRole === "aluno") {
        const inscricoes = await Promise.all(
          data.map(async (evento) => {
            const inscricao = await EventoService.getMinhaInscricao(evento.id);
            return inscricao ? [evento.id, inscricao] : null;
          })
        );

        setMinhasInscricoes(
          Object.fromEntries(
            inscricoes.filter((item): item is [string, Inscricao] => item !== null)
          )
        );
      } else {
        setMinhasInscricoes({});
      }
    } catch {
      setErroCarga(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const sessao = Auth.getUser();
    const currentRole = (sessao?.permission ?? "aluno") as UserRole;

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
    carregarEventos(currentRole);
  }, []);

  const eventosDisponiveis = useMemo(() => {
    return eventos.filter((evento) => !isEventoExpirado(evento));
  }, [eventos]);

  const eventosDestaque = useMemo(() => {
    return [...eventosDisponiveis]
      .sort((a, b) => {
        const dataA = new Date(a.criadoEm ?? `${a.data}T${a.horario || "00:00"}:00`).getTime();
        const dataB = new Date(b.criadoEm ?? `${b.data}T${b.horario || "00:00"}:00`).getTime();
        return dataB - dataA;
      })
      .slice(0, 5);
  }, [eventosDisponiveis]);

  const eventosFiltrados = useMemo(() => {
    return eventosDisponiveis.filter((e) => {
      const nome = e.nome?.toLowerCase?.() ?? "";
      const descricaoCompleta = e.descricaoCompleta?.toLowerCase?.() ?? "";
      const descricaoBreve = e.descricaoBreve?.toLowerCase?.() ?? "";
      const termoBusca = search.toLowerCase();

      const matchSearch =
        search === "" ||
        nome.includes(termoBusca) ||
        descricaoCompleta.includes(termoBusca) ||
        descricaoBreve.includes(termoBusca);

      const matchCurso =
        curso === "Todos" || e.area === curso || e.area === "Todos";

      const matchTurno = turno === "Todos" || e.turno === turno;

      return matchSearch && matchCurso && matchTurno;
    });
  }, [eventosDisponiveis, search, curso, turno]);

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
    await carregarEventos(role);
    return result;
  }

  async function handleCancelarInscricao(evento: Evento) {
    await EventoService.cancelarInscricao(evento.id);
    await carregarEventos(role);
  }

  async function handleSalvarEvento(
    dados: Omit<Evento, "id" | "criadoEm" | "vagasOcupadas">
  ) {
    if (modalForm === "novo") {
      await EventoService.criar(dados);
    } else if (modalForm && typeof modalForm !== "string") {
      await EventoService.editar(modalForm.id, dados);
    }

    await carregarEventos(role);
    setModalForm(null);
  }

  async function handleExcluir(evento: Evento) {
    await EventoService.excluir(evento.id);
    await carregarEventos(role);
    setModalExcluir(null);
  }

  async function handleQRConfirmar(qrCode: string): Promise<Inscricao> {
    if (!modalQR) {
      throw new Error("Evento nao selecionado para check-in.");
    }

    const result = await EventoService.confirmarPresenca(modalQR.id, qrCode);

    setPresencasConfirmadas((prev) => {
      const exists = prev.find((p) => p.id === result.id);
      return exists ? prev : [...prev, result];
    });

    return result;
  }

  async function abrirModalQR(evento: Evento) {
    const inscricoes = await EventoService.getInscricoesEvento(evento.id);
    const confirmadas = inscricoes.filter((i) => i.presencaConfirmada);
    setPresencasConfirmadas(confirmadas);
    setModalQR(evento);
  }

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Eventos
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {eventosFiltrados.length} evento(s) encontrado(s)
            </p>
          </div>

          {mounted && canEdit(role) && (
            <div className="flex gap-2">
              <button
                onClick={() => setModalForm("novo")}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#FFDE00] dark:bg-yellow-400 hover:bg-[#e6c800] dark:hover:bg-yellow-300 text-[#252525] text-sm font-bold rounded-[4] transition-colors shadow-sm"
              >
                <IconPlus size={18} />
                Novo evento
              </button>
            </div>
          )}
        </div>

        {/* Skeleton: Carrossel */}
        {loading && (
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

        {/* Carrossel de destaques */}
        {!loading && !erroCarga && eventosDestaque.length > 0 && (
          <CarrosselEventos eventos={eventosDestaque} />
        )}

        {/* Filtros */}
        <div className="bg-white dark:bg-[#202020] rounded-2xl border border-slate-100 dark:border-[#303030] shadow-sm p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FilterInput
              label="Procurar"
              placeholder="Nome do evento..."
              value={search}
              onChange={setSearch}
            />
            <FilterSelect
              label="Curso"
              value={curso}
              onChange={setCurso}
              options={CURSOS}
            />
            <FilterSelect
              label="Turno"
              value={turno}
              onChange={setTurno}
              options={TURNOS}
            />
          </div>
        </div>

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

        {!loading && erroCarga && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <IconAlertCircle size={28} className="text-red-500" />
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-medium">
              Falha ao carregar eventos.
            </p>
            <button
              onClick={() => carregarEventos(role)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && !erroCarga && eventosFiltrados.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-14 h-14 bg-slate-100 dark:bg-[#2a2a2a] rounded-full flex items-center justify-center">
              <IconCalendarOff size={28} className="text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Nenhum evento encontrado com esses filtros.
            </p>
          </div>
        )}

        {!loading && !erroCarga && eventosFiltrados.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventosFiltrados.map((evento) => (
              <div key={evento.id} className="relative">
                <EventoCard
                  evento={evento}
                  role={role}
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
      </div>
    </AuthGuard>
  );
}
