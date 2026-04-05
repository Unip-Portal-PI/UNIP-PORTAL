"use client";

import { useEffect, useState } from "react";
import {
  IconCalendar,
  IconSpeakerphone,
  IconUsers,
  IconAlertCircle,
  IconCalendarOff,
  IconCircleCheck,
  IconExternalLink,
} from "@tabler/icons-react";
import { Evento, Inscricao } from "@/src/types/evento";
import { Comunicado } from "@/src/types/comunicado";
import { EventoService } from "@/src/service/evento.service";
import { ComunicadoService } from "@/src/service/comunicado.service";
import { Auth } from "@/src/service/auth.service";
import { UserRole } from "@/src/types/user";
import { useRouter } from "next/navigation";

interface Props {
  matricula: string;
}

interface EventoHistorico {
  evento: Evento;
  inscricoes: Inscricao[];
}

function SectionHeader({
  icone,
  titulo,
  contagem,
}: {
  icone: React.ReactNode;
  titulo: string;
  contagem: number;
}) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="w-8 h-8 bg-[#FFDE00]/20 dark:bg-[#FFDE00]/10 rounded-xl flex items-center justify-center">
        {icone}
      </div>
      <div>
        <h3 className="font-bold text-slate-900 dark:text-white text-sm">
          {titulo}
        </h3>
        <p className="text-xs text-slate-400">{contagem} item(s)</p>
      </div>
    </div>
  );
}

export function AbaHistoricoColaborador({ matricula }: Props) {
  const router = useRouter();
  const [eventos, setEventos] = useState<EventoHistorico[]>([]);
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const [expandidoEventoId, setExpandidoEventoId] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      setErro(false);

      try {
        const sessao = Auth.getUser();
        const role = (sessao?.permission ?? "aluno") as UserRole;
        const isAdmin = role === "adm";

        const [todosEventos, todosComunicados] = await Promise.all([
          isAdmin
            ? EventoService.getAll()
            : EventoService.getMeusEventosCriados(),
          isAdmin
            ? ComunicadoService.getAll()
            : ComunicadoService.getMine(),
        ]);

        const eventosComInscricoes = await Promise.all(
          todosEventos.map(async (evento) => ({
            evento,
            inscricoes: await EventoService.getInscricoesEvento(evento.id),
          }))
        );

        const eventosOrdenados = [...eventosComInscricoes].sort((a, b) => {
          const dataA = new Date(
            `${a.evento.data}T${a.evento.horario || "00:00"}:00`
          ).getTime();
          const dataB = new Date(
            `${b.evento.data}T${b.evento.horario || "00:00"}:00`
          ).getTime();
          return dataB - dataA;
        });

        const comunicadosOrdenados = [...todosComunicados].sort((a, b) => {
          const dataA = new Date(a.criadoEm).getTime();
          const dataB = new Date(b.criadoEm).getTime();
          return dataB - dataA;
        });

        setEventos(eventosOrdenados);
        setComunicados(comunicadosOrdenados);
      } catch {
        setErro(true);
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, [matricula]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#202020] rounded-2xl border border-slate-100 dark:border-[#303030] p-4 animate-pulse"
          >
            <div className="flex gap-4">
              <div className="w-11 h-11 rounded-xl bg-slate-200 dark:bg-[#2a2a2a] shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-[#2a2a2a] rounded w-2/3" />
                <div className="h-3 bg-slate-200 dark:bg-[#2a2a2a] rounded w-1/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (erro) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <IconAlertCircle size={24} className="text-red-500" />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Erro ao carregar histórico.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <SectionHeader
          icone={
            <IconCalendar
              size={16}
              className="text-amber-600 dark:text-[#FFDE00]"
            />
          }
          titulo="Eventos"
          contagem={eventos.length}
        />

        {eventos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 bg-white dark:bg-[#202020] rounded-2xl border border-slate-100 dark:border-[#303030]">
            <IconCalendarOff
              size={24}
              className="text-slate-300 dark:text-slate-600"
            />
            <p className="text-sm text-slate-400">Nenhum evento encontrado.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {eventos.map(({ evento, inscricoes }) => {
              const confirmados = inscricoes.filter(
                (i) => i.presencaConfirmada
              ).length;
              const total = inscricoes.length;
              const porcento =
                total > 0 ? Math.round((confirmados / total) * 100) : 0;
              const expandido = expandidoEventoId === evento.id;

              const dataFormatada = new Date(
                evento.data + "T00:00:00"
              ).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });

              return (
                <div
                  key={evento.id}
                  className="bg-white dark:bg-[#202020] rounded-2xl border border-slate-100 dark:border-[#303030] shadow-sm overflow-hidden"
                >
                  <div className="flex items-start gap-4 p-4 flex-wrap sm:flex-nowrap">
                    <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-[#FFDE00]/60 to-amber-400">
                      {evento.banner && (
                        <img
                          src={evento.banner}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-1 truncate max-w-[550px]" title={evento.nome}>
                        {evento.nome}
                      </p>

                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <IconCalendar size={11} /> {dataFormatada}
                        </span>

                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <IconUsers size={11} /> {total} inscritos
                        </span>

                        {total > 0 && (
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <IconCircleCheck size={11} /> {confirmados}/{total} presenças
                          </span>
                        )}
                      </div>

                      {total > 0 && (
                        <div className="mt-2 w-full max-w-[200px]">
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-[#363636] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{ width: `${porcento}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {porcento}% de presença confirmada
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => router.push(`/home/eventos/${evento.id}`)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#404040] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2a2a2a] transition-colors"
                      >
                        <IconExternalLink size={13} /> Ver
                      </button>

                      {total > 0 && (
                        <button
                          onClick={() =>
                            setExpandidoEventoId(expandido ? null : evento.id)
                          }
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#404040] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2a2a2a] transition-colors"
                        >
                          <IconUsers size={13} />{" "}
                          {expandido ? "Ocultar" : "Inscritos"}
                        </button>
                      )}
                    </div>
                  </div>

                  {expandido && (
                    <div className="border-t border-slate-100 dark:border-[#2a2a2a] bg-slate-50 dark:bg-[#1a1a1a]">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 dark:border-[#2a2a2a]">
                              <th className="px-4 py-2 font-bold text-slate-500 uppercase tracking-wide">
                                Nome
                              </th>
                              <th className="px-4 py-2 font-bold text-slate-500 uppercase tracking-wide hidden sm:table-cell">
                                Matrícula
                              </th>
                              <th className="px-4 py-2 font-bold text-slate-500 uppercase tracking-wide">
                                Presença
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {inscricoes.map((insc) => (
                              <tr
                                key={insc.id}
                                className="border-b border-slate-100 dark:border-[#2a2a2a] last:border-0 hover:bg-slate-100 dark:hover:bg-[#252525]"
                              >
                                <td className="px-4 py-2 text-slate-700 dark:text-slate-300 font-medium">
                                  {insc.alunoNome}
                                </td>
                                <td className="px-4 py-2 text-slate-500 font-mono hidden sm:table-cell">
                                  {insc.alunoMatricula}
                                </td>
                                <td className="px-4 py-2">
                                  {insc.presencaConfirmada ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                                      <IconCircleCheck size={12} /> Confirmada
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">
                                      Aguardando
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <SectionHeader
          icone={
            <IconSpeakerphone
              size={16}
              className="text-amber-600 dark:text-[#FFDE00]"
            />
          }
          titulo="Comunicados publicados"
          contagem={comunicados.length}
        />

        {comunicados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 bg-white dark:bg-[#202020] rounded-2xl border border-slate-100 dark:border-[#303030]">
            <IconSpeakerphone
              size={24}
              className="text-slate-300 dark:text-slate-600"
            />
            <p className="text-sm text-slate-400">
              Nenhum comunicado publicado.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {comunicados.map((c) => {
              const dataFormatada = new Date(c.criadoEm).toLocaleDateString(
                "pt-BR",
                {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }
              );

              return (
                <div
                  key={c.id}
                  className="bg-white dark:bg-[#202020] rounded-2xl border border-slate-100 dark:border-[#303030] shadow-sm p-4 flex items-start gap-4 flex-wrap sm:flex-nowrap"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#FFDE00]/15 dark:bg-[#FFDE00]/10 flex items-center justify-center shrink-0">
                    <IconSpeakerphone
                      size={18}
                      className="text-amber-600 dark:text-[#FFDE00]"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-1" title={c.titulo}>
                      {c.titulo}
                    </p>

                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {c.assunto && (
                        <span className="text-[10px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-wider">
                          {c.assunto}
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        {dataFormatada}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                      {c.resumo}
                    </p>
                  </div>

                  <button
                    onClick={() => router.push(`/home/comunicado/${c.id}`)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#404040] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2a2a2a] transition-colors shrink-0"
                  >
                    <IconExternalLink size={13} /> Ver
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}