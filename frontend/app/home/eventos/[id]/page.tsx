// app/home/eventos/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconCalendar,
  IconClock,
  IconMapPin,
  IconUsers,
  IconPaperclip,
  IconExternalLink,
  IconAlertCircle,
  IconQrcode,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import { Evento, Inscricao } from "@/src/types/evento";
import { UserRole } from "@/src/types/user";
import { EventoService } from "@/src/service/evento.service";
import {
  canEdit,
  getStatusVaga,
  isInscricaoEncerrada,
  canDelete,
} from "@/src/utils/evento.helpers";
import { Auth } from "@/src/service/auth.service";
import { ModalInscricao } from "@/app/components/eventos/ModalInscricao";
import { ModalExcluir } from "@/app/components/eventos/ModalExcluir";
import { ModalFormEvento } from "@/app/components/eventos/ModalFormEvento";
import { ModalQRReader } from "@/app/components/eventos/ModalQRReader";
import { ModalListaInscritos } from "@/app/components/eventos/ModalListaInscritos";

export default function DetalheEventoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const sessao = Auth.getUser();
  const role = (sessao?.permission ?? "aluno") as UserRole;
  const user = {
    id: sessao?.id ?? "",
    apelido: sessao?.apelido ?? "",
    nome: sessao?.nome ?? "",
    matricula: sessao?.matricula ?? "",
    area: sessao?.area ?? "",
    email: sessao?.email ?? "",
    role,
  };

  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);

  // Modais
  const [modalInscricao, setModalInscricao] = useState(false);
  const [modalExcluir, setModalExcluir] = useState(false);
  const [modalForm, setModalForm] = useState(false);
  const [modalQRAluno, setModalQRAluno] = useState(false);
  const [modalQR, setModalQR] = useState(false);
  const [modalInscritos, setModalInscritos] = useState(false);
  const [presencasConfirmadas, setPresencasConfirmadas] = useState<Inscricao[]>([]);
  const [inscricaoAluno, setInscricaoAluno] = useState<Inscricao | null>(null);
  const [inscritosDoEvento, setInscritosDoEvento] = useState<Inscricao[]>([]);
  const [copiado, setCopiado] = useState(false);
  async function carregar() {
    setLoading(true);
    setErro(false);
    try {
      const data = await EventoService.getById(id);
      if (!data) {
        setErro(true);
        return;
      }
      setEvento(data);

      if (role === "aluno") {
        setInscricaoAluno(await EventoService.getMinhaInscricao(id));
      }

      if (canEdit(role)) {
        setInscritosDoEvento(await EventoService.getInscricoesEvento(id));
      }
    } catch {
      setErro(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-[#2a2a2a] rounded w-32" />
        <div className="h-64 bg-slate-200 dark:bg-[#2a2a2a] rounded-2xl" />
        <div className="space-y-3">
          <div className="h-6 bg-slate-200 dark:bg-[#2a2a2a] rounded w-2/3" />
          <div className="h-4 bg-slate-200 dark:bg-[#2a2a2a] rounded w-full" />
          <div className="h-4 bg-slate-200 dark:bg-[#2a2a2a] rounded w-full" />
        </div>
      </div>
    );
  }

  if (erro || !evento) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <IconAlertCircle size={28} className="text-red-500" />
        </div>
        <p className="text-slate-600 dark:text-slate-300 font-medium">
          Evento não encontrado ou falha ao carregar.
        </p>
        <button
          onClick={() => router.push("/home/eventos")}
          className="px-4 cursor-pointer py-2 bg-[#FFDE00] hover:bg-[#e6c800] text-[#252525] text-sm font-bold rounded-md transition-colors"
        >
          Voltar para eventos
        </button>
      </div>
    );
  }

  const status = getStatusVaga(evento);
  const encerrado = isInscricaoEncerrada(evento);
  const isInscrito = !!inscricaoAluno;
  const canCancelarInscricao = !!inscricaoAluno && !inscricaoAluno.presencaConfirmada;
  const vagasLivres = evento.vagas - evento.vagasOcupadas;
  const porcento = Math.min((evento.vagasOcupadas / evento.vagas) * 100, 100);

  const barColor =
    status === "esgotado"
      ? "bg-red-500"
      : status === "quase_esgotado"
        ? "bg-amber-400"
        : "bg-emerald-500";

  const dataFormatada = new Date(evento.data + "T00:00:00").toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const dataLimiteFormatada = new Date(
    evento.dataLimiteInscricao + "T00:00:00"
  ).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  async function handleConfirmarInscricao(): Promise<Inscricao> {
    const result = await EventoService.inscrever(evento!.id);
    setInscricaoAluno(result);
    setModalInscricao(false); // ← fecha ANTES de recarregar
    await carregar();
    return result;
  }

  async function handleCancelarInscricao() {
    await EventoService.cancelarInscricao(evento!.id);
    setInscricaoAluno(null);
    setModalQRAluno(false);
    await carregar();
  }

  async function handleSalvarEvento(
    dados: Omit<Evento, "id" | "criadoEm" | "vagasOcupadas">
  ) {
    await EventoService.editar(evento!.id, dados);
    await carregar();
    setModalForm(false);
  }

  async function handleExcluir() {
    await EventoService.excluir(evento!.id);
    router.push("/home/eventos");
  }

  async function handleQRConfirmar(qrCode: string): Promise<Inscricao> {
    if (!evento) throw new Error("Evento não encontrado.");
    const result = await EventoService.confirmarPresenca(evento.id, qrCode);
    setPresencasConfirmadas((prev) => {
      const exists = prev.find((p) => p.id === result.id);
      return exists ? prev : [...prev, result];
    });
    setInscritosDoEvento((prev) =>
      prev.map((inscricao) => (inscricao.id === result.id ? result : inscricao))
    );
    return result;
  }

  async function abrirModalQR() {
    const inscricoes = await EventoService.getInscricoesEvento(evento!.id);
    setInscritosDoEvento(inscricoes);
    const confirmadas = inscricoes.filter((i) => i.presencaConfirmada);
    setPresencasConfirmadas(confirmadas);
    setModalQR(true);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Voltar */}
      <button
        onClick={() => router.push("/home/eventos")}
        className="flex cursor-pointer items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-[#e6c800] dark:hover:text-[#FFDE00] transition-colors mb-6"
      >
        <IconArrowLeft size={16} />
        Voltar para eventos
      </button>

      {/* Banner */}
      {evento.banner ? (
        <img
          src={evento.banner}
          alt={evento.nome}
          className="w-full h-64 object-cover rounded-2xl mb-6 shadow-sm"
        />
      ) : (
        <div className="w-full h-64 rounded-2xl mb-6 bg-gradient-to-br from-[#FFDE00] to-[#e6c800] flex items-center justify-center shadow-sm">
          <span className="text-[#252525] text-7xl font-black opacity-20 text-center">Evento<br />AVP</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Nome e badges */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {status === "esgotado" && (
                <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold px-2.5 py-1 rounded-full">
                  Esgotado
                </span>
              )}
              {status === "quase_esgotado" && (
                <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full">
                  Últimas vagas!
                </span>
              )}
              {isInscrito && (
                <span className="bg-[#FFDE00]/10 dark:bg-[#FFDE00]/5 text-[#e6c800] dark:text-[#FFDE00] border border-[#e6c800]/60 dark:border-[#FFDE00]/40 text-xs font-bold px-2.5 py-1 rounded-full">
                  Inscrito ✓
                </span>
              )}
              {evento.tipoInscricao === "externa" && (
                <span className="bg-slate-100 dark:bg-[#2a2a2a] text-slate-500 dark:text-slate-400 text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                  <IconExternalLink size={11} />
                  Inscrição externa
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-snug">
              {evento.nome}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base">
              {evento.descricaoBreve}
            </p>
          </div>

          {/* Descrição completa */}
          <div className="bg-white dark:bg-[#202020] rounded-2xl border border-slate-100 dark:border-[#303030] p-5">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 uppercase tracking-wide">
              Sobre o evento
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {evento.descricaoCompleta}
            </p>
          </div>

          {/* Anexos — links ficam intocados */}
          {evento.anexos.length > 0 && (
            <div className="bg-white dark:bg-[#202020] rounded-2xl border border-slate-100 dark:border-[#303030] p-5">
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 uppercase tracking-wide">
                Anexos
              </h2>
              <div className="space-y-2">
                {evento.anexos.map((a) => (
                  <a
                    key={a.id}
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <IconPaperclip size={14} />
                    {a.nome}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Coluna lateral */}
        <div className="space-y-4">

          {/* Botão de inscrição (aluno) */}
          {role === "aluno" && (
            <>
              {evento.tipoInscricao === "externa" && evento.urlExterna ? (
                <a
                  href={evento.urlExterna}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-md bg-[#FFDE00] hover:bg-[#e6c800] text-[#252525] text-sm font-bold transition-colors"
                >
                  <IconExternalLink size={16} />
                  Inscrever-se (site externo)
                </a>
              ) : (
                <>
                  {isInscrito && !canCancelarInscricao ? (
                    <div className="w-full py-3 rounded-md text-sm font-bold text-center bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">
                      Presença confirmada
                    </div>
                  ) : (
                    <button
                      onClick={() => (isInscrito ? handleCancelarInscricao() : setModalInscricao(true))}
                      disabled={!isInscrito && (status === "esgotado" || encerrado)}
                      className={`w-full cursor-pointer py-3 rounded-md text-sm font-bold transition-colors ${isInscrito
                        ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-950/30"
                        : status === "esgotado" || encerrado
                          ? "bg-slate-100 dark:bg-[#2a2a2a] text-slate-400 dark:text-slate-600 cursor-not-allowed"
                          : "bg-[#FFDE00] hover:bg-[#e6c800] text-[#252525]"
                        }`}
                    >
                      {isInscrito
                        ? "Cancelar minha inscricao"
                        : encerrado
                          ? "Inscrições encerradas"
                          : status === "esgotado"
                            ? "Esgotado"
                            : "Inscrever-se neste evento"}
                    </button>
                  )}
                </>
              )}

              {/* Botão Ver QR Code — só quando inscrito */}
              {isInscrito && inscricaoAluno && (
                <button
                  onClick={() => setModalQRAluno(true)}
                  className="flex cursor-pointer items-center justify-center gap-2 w-full py-2.5 rounded-md border-2 border-[#FFDE00]/40 dark:border-[#FFDE00]/20 text-sm font-bold text-[#e6c800] dark:text-[#FFDE00] hover:bg-[#FFDE00]/10 dark:hover:bg-[#FFDE00]/5 transition-colors"
                >
                  <IconQrcode size={15} />
                  Ver meu QR Code
                </button>
              )}
            </>
          )}

          {/* Ações colaborador/adm */}
          {canEdit(role) && (
            <div className="space-y-2">
              <button
                onClick={() => setModalInscritos(true)}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-md border-2 border-slate-200 dark:border-[#404040] text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#2a2a2a] transition-colors"
              >
                <IconUsers size={15} />
                Ver inscritos
                {inscritosDoEvento.length > 0 && (
                  <span className="ml-auto bg-slate-200 dark:bg-[#333] text-slate-600 dark:text-slate-300 text-xs font-bold px-2 py-0.5 rounded-full">
                    {inscritosDoEvento.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setModalForm(true)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-md border-2 border-slate-200 dark:border-[#404040] text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#2a2a2a] transition-colors"
              >
                <IconEdit size={15} />
                Editar evento
              </button>

              <button
                onClick={abrirModalQR}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-md border-2 border-[#FFDE00]/40 dark:border-[#FFDE00]/20 text-sm font-bold text-[#e6c800] dark:text-[#FFDE00] hover:bg-[#FFDE00]/10 dark:hover:bg-[#FFDE00]/5 transition-colors"
              >
                <IconQrcode size={15} />
                Leitor QR Code (check-in)
              </button>

              {canDelete(role) && (
                <button
                  onClick={() => setModalExcluir(true)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-md border-2 border-red-200 dark:border-red-900/40 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <IconTrash size={15} />
                  Excluir evento
                </button>
              )}
            </div>
          )}
          {/* Informações */}
          <div className="bg-white dark:bg-[#202020] rounded-2xl border border-slate-100 dark:border-[#303030] p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
              Informações
            </h2>

            <div className="flex items-start gap-3 text-sm">
              <IconCalendar size={16} className="text-[#e6c800] dark:text-[#FFDE00] mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1).toLowerCase()}
                </p>
                <p className="text-slate-400 text-xs mt-0.5">
                  {evento.turno} · {evento.horario}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm">
              <IconMapPin size={16} className="text-[#e6c800] dark:text-[#FFDE00] mt-0.5 shrink-0" />
              <p className="text-slate-700 dark:text-slate-300">{evento.local}</p>
            </div>

            <div className="flex items-start gap-3 text-sm">
              <IconClock size={16} className="text-[#e6c800] dark:text-[#FFDE00] mt-0.5 shrink-0" />
              <div>
                <p className="text-slate-700 dark:text-slate-300">
                  Inscrições até{" "}
                  <span className="font-medium">{dataLimiteFormatada}</span>
                </p>
                {encerrado && (
                  <p className="text-red-500 text-xs mt-0.5">Inscrições encerradas</p>
                )}
              </div>
            </div>

            {/* Vagas */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <IconUsers size={14} className="text-[#e6c800] dark:text-[#FFDE00]" />
                  Vagas
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-xs">
                  {evento.vagasOcupadas}/{evento.vagas}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-[#363636] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${barColor}`}
                  style={{ width: `${porcento}%` }}
                />
              </div>
              <p className="text-xs text-slate-400">
                {status === "esgotado"
                  ? "Sem vagas disponíveis"
                  : `${vagasLivres} vagas restantes`}
              </p>
            </div>
          </div>


        </div>
      </div>

      {/* ── MODAIS ── */}
      {modalInscricao && (
        <ModalInscricao
          evento={evento}
          user={user}
          onConfirmar={handleConfirmarInscricao}
          onFechar={() => setModalInscricao(false)}
        />
      )}
      {modalExcluir && (
        <ModalExcluir
          evento={evento}
          onConfirmar={handleExcluir}
          onFechar={() => setModalExcluir(false)}
        />
      )}
      {modalForm && (
        <ModalFormEvento
          evento={evento}
          onSalvar={handleSalvarEvento}
          onFechar={() => setModalForm(false)}
        />
      )}
      {modalQR && (
        <ModalQRReader
          eventoNome={evento.nome}
          onLer={handleQRConfirmar}
          onFechar={() => setModalQR(false)}
          presencasConfirmadas={presencasConfirmadas}
        />
      )}
      {modalInscritos && (
        <ModalListaInscritos
          evento={evento}
          inscricoes={inscritosDoEvento}
          onFechar={() => setModalInscritos(false)}
        />
      )}

      {/* Modal QR Code do aluno — no nível raiz para funcionar corretamente */}
      {modalQRAluno && inscricaoAluno && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm bg-black/50"
          onClick={() => setModalQRAluno(false)}
        >
          <div
            className="bg-white dark:bg-[#202020] rounded-2xl border border-slate-100 dark:border-[#303030] p-6 flex flex-col items-center gap-4 shadow-2xl w-72"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Seu QR Code de presença
            </p>

            {/* Container da imagem com loading */}
            <div className="relative w-[200px] h-[200px] shadow rounded-md bg-white flex items-center justify-center">
              {/* Círculo de loading — some quando a imagem carrega */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="animate-spin w-10 h-10 text-slate-300" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="3"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
              </div>

              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(inscricaoAluno.qrCode)}`}
                alt="QR Code"
                width={180}
                height={180}
                className=" rounded-md opacity-0 transition-opacity duration-300"
                onLoad={(e) => {
                  // Quando carregar: mostra a imagem e some o spinner
                  (e.target as HTMLImageElement).classList.remove("opacity-0");
                  (e.target as HTMLImageElement).previousElementSibling?.classList.add("hidden");
                }}
              />
            </div>

            <div className="relative flex items-center justify-center w-full min-w-0">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(inscricaoAluno.qrCode);
                  setCopiado(true);
                  setTimeout(() => setCopiado(false), 2000);
                }}
                className="group flex items-center gap-1.5 cursor-pointer min-w-0 max-w-full"
              >
                <p className="text-xs text-slate-400 font-mono text-center truncate min-w-0 max-w-full group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors">
                  {inscricaoAluno.qrCode}
                </p>

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors"
                >
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
              </button>

              {copiado && (
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-medium px-2 py-0.5 rounded pointer-events-none whitespace-nowrap z-10">
                  Copiado!
                </span>
              )}
            </div>
            <button
              onClick={() => setModalQRAluno(false)}
              className="w-full cursor-pointer py-2 rounded-md bg-slate-100 dark:bg-[#2a2a2a] text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-200 dark:hover:bg-[#333] transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
