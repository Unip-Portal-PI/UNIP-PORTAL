// app/components/eventos/EventoCard.tsx
"use client";

import { useRouter } from "next/navigation";
import {
  IconCalendar,
  IconClock,
  IconUsers,
  IconExternalLink,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import { Evento } from "@/src/types/evento";
import { UserRole } from "@/src/types/user";
import { isInscricaoEncerrada, canEdit, canDelete } from "@/src/utils/evento.helpers";

interface EventoCardProps {
  evento: Evento;
  role: UserRole;
  isInscrito: boolean;
  canCancelarInscricao: boolean;
  onInscrever: (evento: Evento) => void;
  onCancelarInscricao: (evento: Evento) => void;
  onEditar: (evento: Evento) => void;
  onExcluir: (evento: Evento) => void;
}

export function EventoCard({
  evento,
  role,
  isInscrito,
  canCancelarInscricao,
  onInscrever,
  onCancelarInscricao,
  onEditar,
  onExcluir,
}: EventoCardProps) {
  const router = useRouter();
  const encerrado = isInscricaoEncerrada(evento);
  const vagasLivres = evento.vagas - evento.vagasOcupadas;
  const porcento = Math.min((evento.vagasOcupadas / evento.vagas) * 100, 100);

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

  const dataFormatada = new Date(evento.data + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const descricaoResumo =
    (evento.descricaoCompleta ?? "").trim() ||
    (evento.descricaoBreve ?? "").trim() ||
    "Sem descrição disponível.";

  function handleCardClick() {
    router.push(`/home/eventos/${evento.id}`);
  }

  return (
    <div className="bg-white dark:bg-[#202020] rounded-2xl border border-slate-100 dark:border-[#303030] shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
      {/* Banner */}
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
              Evento<br />AVP
            </span>
          </div>
        )}

        {!isInscrito && status === "disponivel" && (
          <span
            className={`absolute top-3 left-3 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow ${
              porcento >= 60 ? "bg-amber-400" : "bg-green-500"
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

        {evento.tipoInscricao === "externa" && (
          <span className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            <IconExternalLink size={11} />
            Inscrição externa
          </span>
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Nome */}
        <h3
          className="font-bold text-slate-900 dark:text-white text-base leading-snug cursor-pointer hover:text-[#FFDE00] dark:hover:text-[#FFDE00] transition-colors line-clamp-2"
          onClick={handleCardClick}
        >
          {evento.nome}
        </h3>

        {/* Início da descrição com elipse em uma linha */}
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1 leading-relaxed break-words">
          {descricaoResumo}
        </p>

        {/* Meta: data e turno */}
        <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <IconCalendar size={13} />
            {dataFormatada}
          </span>
          <span className="flex items-center gap-1">
            <IconClock size={13} />
            {evento.turno} · {evento.horario}
          </span>
        </div>

        {/* Barra de vagas */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <IconUsers size={12} />
              {status === "esgotado" ? "Sem vagas" : `${vagasLivres} vagas restantes`}
            </span>
            <span>{evento.vagasOcupadas}/{evento.vagas}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-[#363636] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: `${porcento}%` }}
            />
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2 mt-auto pt-1">
          {role === "aluno" && (
            <>
              {isInscrito && !canCancelarInscricao ? (
                <div className="flex-1 py-2 rounded-md text-center text-sm font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">
                  Presença confirmada
                </div>
              ) : (
                <button
                  onClick={() => (isInscrito ? onCancelarInscricao(evento) : onInscrever(evento))}
                  disabled={!isInscrito && (status === "esgotado" || encerrado)}
                  className={`flex-1 py-2 cursor-pointer rounded-md text-sm font-bold transition-colors ${
                    isInscrito
                      ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-950/30"
                      : status === "esgotado" || encerrado
                        ? "bg-slate-100 dark:bg-[#2a2a2a] text-slate-400 dark:text-slate-600 cursor-not-allowed"
                        : "bg-[#FFDE00] hover:bg-[#e6c800] text-[#252525]"
                  }`}
                >
                  {isInscrito
                    ? "Cancelar inscricao"
                    : encerrado
                      ? "Inscrições encerradas"
                      : status === "esgotado"
                        ? "Esgotado"
                        : "Inscrever-se"}
                </button>
              )}
            </>
          )}

          {canEdit(role) && (
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
              className="flex cursor-pointer items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium border border-red-200 dark:border-red-900/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <IconTrash size={14} />
            </button>
          )}

          <button
            onClick={handleCardClick}
            className={`${role === "aluno" ? "" : "flex-1"} py-2 px-3 cursor-pointer rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2a2a2a] border border-slate-200 dark:border-[#404040] transition-colors`}
          >
            Ver detalhes
          </button>
        </div>
      </div>
    </div>
  );
}