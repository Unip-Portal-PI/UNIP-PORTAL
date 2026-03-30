// app/components/eventos/CarrosselEventos.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconCalendar,
  IconClock,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { Evento } from "@/src/types/evento";

interface CarrosselEventosProps {
  eventos: Evento[];
}

function formatarData(data: string) {
  if (!data) return "-";
  return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function CarrosselEventos({ eventos }: CarrosselEventosProps) {
  const router = useRouter();
  const [indexAtual, setIndexAtual] = useState(0);

  const itens = useMemo(() => {
    return eventos.slice(0, 5);
  }, [eventos]);

  useEffect(() => {
    if (itens.length <= 1) return;

    const interval = setInterval(() => {
      setIndexAtual((prev) => (prev + 1) % itens.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [itens.length]);

  useEffect(() => {
    if (indexAtual > itens.length - 1) {
      setIndexAtual(0);
    }
  }, [indexAtual, itens.length]);

  if (itens.length === 0) return null;

  const evento = itens[indexAtual];
  const descricao =
    (evento.descricaoCompleta ?? "").trim() ||
    (evento.descricaoBreve ?? "").trim() ||
    "Sem descrição disponível.";

  function abrirEvento(id: string) {
    router.push(`/home/eventos/${id}`);
  }

  function voltar() {
    setIndexAtual((prev) => (prev === 0 ? itens.length - 1 : prev - 1));
  }

  function avancar() {
    setIndexAtual((prev) => (prev + 1) % itens.length);
  }

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-slate-100 dark:border-[#303030] mb-8 bg-white dark:bg-[#202020] shadow-sm">
      <div className="relative h-52 sm:h-[380px] group">
        <div
          className="absolute inset-0 cursor-pointer"
          onClick={() => abrirEvento(evento.id)}
        >
          {evento.banner ? (
            <img
              src={evento.banner}
              alt={evento.nome}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#FFDE00] via-amber-400 to-amber-600 flex items-center justify-center">
              <span className="text-[#252525] text-4xl sm:text-6xl font-black opacity-20 select-none text-center">
                Evento
                <br />
                AVP
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
        </div>

        {evento.area && (
          <div className="absolute top-4 left-4 pointer-events-none">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-black/60 text-white text-xs font-semibold shadow">
              {evento.area}
            </span>
          </div>
        )}

        {itens.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                voltar();
              }}
              className="absolute left-4 top-1/2 z-10 -translate-y-1/2 w-10 h-10 rounded-full bg-black/35 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
              aria-label="Evento anterior"
            >
              <IconChevronLeft size={22} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                avancar();
              }}
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 w-10 h-10 rounded-full bg-black/35 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
              aria-label="Próximo evento"
            >
              <IconChevronRight size={22} />
            </button>
          </>
        )}

        <div
          className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 text-white cursor-pointer"
          onClick={() => abrirEvento(evento.id)}
        >
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#FFDE00] text-[#252525] text-xs font-bold mb-3">
            Últimos eventos
          </div>

          <h2 className="text-xl sm:text-3xl font-bold leading-tight max-w-3xl line-clamp-2">
            {evento.nome}
          </h2>

          <p className="mt-2 text-sm sm:text-base text-white/85 max-w-2xl line-clamp-2">
            {descricao}
          </p>

          <div className="mt-3 flex flex-wrap gap-4 text-xs sm:text-sm text-white/90">
            <span className="inline-flex items-center gap-1.5">
              <IconCalendar size={16} />
              {formatarData(evento.data)}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <IconClock size={16} />
              {evento.turno} · {evento.horario}
            </span>
          </div>
        </div>

        {itens.length > 1 && (
          <div className="absolute bottom-4 right-5 z-10 flex gap-1.5">
            {itens.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIndexAtual(i);
                }}
                className={`rounded-full transition-all ${
                  i === indexAtual
                    ? "w-5 h-2 bg-white"
                    : "w-2 h-2 bg-white/45 hover:bg-white/70"
                }`}
                aria-label={`Ir para slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}