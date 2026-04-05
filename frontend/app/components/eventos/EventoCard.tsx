// app/components/eventos/EventoCard.tsx
"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  IconCalendar,
  IconCalendarOff,
  IconClock,
  IconUsers,
  IconExternalLink,
  IconEdit,
} from "@tabler/icons-react";
import { Evento } from "@/src/types/evento";
import { UserRole } from "@/src/types/user";
import {
  isInscricaoEncerrada,
  canEditEvent,
  canDelete,
} from "@/src/utils/evento.helpers";
import { isAcontecendoAgora } from "@/src/utils/evento.helpers";
import { BadgeAcontecendoAgora } from "@/app/components/eventos/BadgeAcontecendoAgora";



interface EventoCardProps {
  evento: Evento;
  role: UserRole;
  currentUserId?: string;
  isInscrito: boolean;
  canCancelarInscricao: boolean;
  onInscrever: (evento: Evento) => void;
  onCancelarInscricao: (evento: Evento) => void;
  onEditar: (evento: Evento) => void;
  onExcluir: (evento: Evento) => void;
}

function formatarLink(valor: string) {
  if (/^https?:\/\//i.test(valor)) return valor;
  return `https://${valor}`;
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

export function EventoCard({
  evento,
  role,
  currentUserId,
  isInscrito,
  canCancelarInscricao,
  onInscrever,
  onCancelarInscricao,
  onEditar,
  onExcluir,
}: EventoCardProps) {
  const router = useRouter();
  const podeEditarEvento = canEditEvent(evento, role, currentUserId);
  const encerrado = isInscricaoEncerrada(evento);
  const vagasLivres = evento.vagas - evento.vagasOcupadas;
  const porcento = Math.min((evento.vagasOcupadas / evento.vagas) * 100, 100);
  const [mostrarModalCancelamento, setMostrarModalCancelamento] = useState(false);
  const acontecendoAgora = isAcontecendoAgora(evento);
  const status =
    porcento >= 100
      ? "esgotado"
      : porcento >= 92
        ? "quase_esgotado"
        : "disponivel";

  const barColor =
    status === "esgotado"
      ? "bg-red-600"
      : status === "quase_esgotado"
        ? "bg-red-400"
        : porcento >= 60
          ? "bg-amber-400"
          : "bg-emerald-500";

  const dataFormatada = new Date(evento.data + "T00:00:00").toLocaleDateString(
    "pt-BR",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );

  const descricaoResumo =
    (evento.descricaoCompleta ?? "").trim() ||
    (evento.descricaoBreve ?? "").trim() ||
    "Sem descrição disponível.";

  const resumoFormatado = useMemo(() => {
    return renderResumoFormatado(descricaoResumo);
  }, [descricaoResumo]);

  function handleCardClick() {
    router.push(`/home/eventos/${evento.id}`);
  }

  return (
    <div className="bg-white dark:bg-[#202020] rounded-2xl border border-slate-100 dark:border-[#303030] shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
      <div
        className="relative cursor-pointer overflow-hidden"
        onClick={handleCardClick}
      >
        {evento.banner ? (
          <img
            src={evento.banner}
            alt={evento.nome}
            className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-40 bg-gradient-to-br from-[#FFDE00] to-amber-500 flex items-center justify-center">
            <span className="text-[#252525] text-4xl font-black opacity-20 select-none text-center">
              Evento
              <br />
              AVP
            </span>
          </div>
        )}

        {!isInscrito && status === "disponivel" && (
          <span
            className={`absolute top-3 left-3 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow ${porcento >= 60 ? "bg-amber-400" : "bg-green-500"
              }`}
          >
            Disponível
          </span>
        )}

        {!isInscrito && status === "quase_esgotado" && (
          <span className="absolute top-3 left-3 bg-red-400 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
            Quase esgotado
          </span>
        )}

        {!isInscrito && status === "esgotado" && (
          <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
            Esgotado
          </span>
        )}

        {isInscrito && (
          <span className="absolute top-3 left-3 bg-[#FFDE00] text-[#252525] border border-[#e6c800]/60 text-xs font-bold px-2.5 py-1 rounded-full shadow">
            Inscrito ✓
          </span>
        )}

        {evento.area && (
          <span className="absolute bottom-3 left-3 bg-black/60 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
            {evento.area}
          </span>
        )}

        {evento.tipoInscricao === "externa" && (
          <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            <IconExternalLink size={11} />
            Inscrição externa
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 p-4 gap-3">
        <h3
          className="font-bold text-slate-900 dark:text-white text-base leading-snug cursor-pointer hover:text-[#FFDE00] dark:hover:text-[#FFDE00] transition-colors line-clamp-2"
          onClick={handleCardClick}
        >
          {evento.nome}
        </h3>

        <div className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1 leading-relaxed break-words">
          {resumoFormatado}
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <IconCalendar size={13} />
            {dataFormatada}
          </span>
          <span className="flex items-center gap-1">
            <IconClock size={13} />
            {evento.turno} · {evento.horario}
          </span>
          {acontecendoAgora && <BadgeAcontecendoAgora />}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <IconUsers size={12} />
              {status === "esgotado"
                ? "Sem vagas"
                : `${vagasLivres} vagas restantes`}
            </span>
            <span>
              {evento.vagasOcupadas}/{evento.vagas}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-[#363636] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: `${porcento}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-auto pt-1">
          {role === "aluno" && (
            <>
              {isInscrito && !canCancelarInscricao ? (
                <div className="flex-1 py-2 rounded-md text-center text-sm font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">
                  Presença confirmada
                </div>
              ) : (
                <button
                  onClick={() =>
                    isInscrito
                      ? setMostrarModalCancelamento(true)
                      : onInscrever(evento)
                  }
                  disabled={!isInscrito && (status === "esgotado" || encerrado)}
                  className={`flex-1 py-2 cursor-pointer rounded-md text-sm font-bold transition-colors ${isInscrito
                    ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-950/30"
                    : status === "esgotado" || encerrado
                      ? "bg-slate-100 dark:bg-[#2a2a2a] text-slate-400 dark:text-slate-600 cursor-not-allowed"
                      : "bg-[#FFDE00] hover:bg-[#e6c800] text-[#252525]"
                    }`}
                >
                  {isInscrito
                    ? "Cancelar inscrição"
                    : encerrado
                      ? "Inscrições encerradas"
                      : status === "esgotado"
                        ? "Esgotado"
                        : "Inscrever-se"}
                </button>
              )}
            </>
          )}

          {podeEditarEvento && (
            <button
              onClick={() => onEditar(evento)}
              className="flex cursor-pointer items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium border border-slate-200 dark:border-[#404040] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2a2a2a] transition-colors"
            >
              <IconEdit size={14} />
              Editar
            </button>
          )}

          {canDelete(role) && (
            <button
              onClick={() => onExcluir(evento)}
              title="Cancelar evento"
              className="flex cursor-pointer items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium border border-amber-200 dark:border-amber-900/40 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
            >
              <IconCalendarOff size={14} />
            </button>
          )}

          <button
            onClick={handleCardClick}
            className={`${role === "aluno" ? "" : "flex-1"
              } py-2 px-3 cursor-pointer rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2a2a2a] border border-slate-200 dark:border-[#404040] transition-colors`}
          >
            Ver detalhes
          </button>
        </div>
      </div>
      {mostrarModalCancelamento && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setMostrarModalCancelamento(false)}
        >
          <div
            className="bg-white dark:bg-[#202020] rounded-2xl border border-slate-100 dark:border-[#303030] shadow-lg p-6 max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center flex-shrink-0">
                <IconCalendarOff size={18} className="text-red-500" />
              </div>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                Cancelar inscrição?
              </p>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
              Tem certeza que deseja cancelar sua inscrição em{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {evento.nome}
              </span>
              ? Essa ação não pode ser desfeita.
            </p>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setMostrarModalCancelamento(false)}
                className="px-4 py-2 rounded-md text-sm font-medium border border-slate-200 dark:border-[#404040] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={() => {
                  setMostrarModalCancelamento(false);
                  onCancelarInscricao(evento);
                }}
                className="px-4 py-2 rounded-md text-sm font-bold bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
              >
                Sim, cancelar inscrição
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
