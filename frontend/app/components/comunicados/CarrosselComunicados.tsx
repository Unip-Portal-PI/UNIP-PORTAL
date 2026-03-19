// app/components/comunicados/CarrosselComunicados.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { IconChevronLeft, IconChevronRight, IconExternalLink } from "@tabler/icons-react";
import { Comunicado } from "@/src/types/comunicado";
import { isComunicadoExpirado } from "@/src/utils/comunicado.helpers";
import { ComunicadoService } from "@/src/service/comunicado.service";

interface CarrosselComunicadosProps {
  comunicados: Comunicado[];
  onAbrir: (c: Comunicado) => void;
}

export function CarrosselComunicados({ comunicados, onAbrir }: CarrosselComunicadosProps) {
  const destaques = comunicados
    .filter((c) => !isComunicadoExpirado(c))
    .slice(0, 5);

  const [idx, setIdx] = useState(0);

  const avancar = useCallback(() => {
    setIdx((prev) => (prev + 1) % destaques.length);
  }, [destaques.length]);

  const voltar = () => {
    setIdx((prev) => (prev - 1 + destaques.length) % destaques.length);
  };

  useEffect(() => {
    if (destaques.length <= 1) return;
    const timer = setInterval(avancar, 5000);
    return () => clearInterval(timer);
  }, [avancar, destaques.length]);

  if (destaques.length === 0) return null;

  const atual = destaques[idx];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-[#303030] mb-8 group">
      {/* Slide */}
      <div
        className="relative h-52 sm:h-64 cursor-pointer"
        onClick={() => {
          ComunicadoService.marcarLido(atual.id);
          onAbrir(atual);
        }}
      >
        {atual.banner ? (
          <img
            src={atual.banner}
            alt={atual.titulo}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#FFDE00] to-amber-500 flex items-center justify-center">
            <span className="text-[#252525] text-8xl font-black opacity-10 select-none">
              {atual.titulo[0]}
            </span>
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Conteúdo */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          {atual.assunto && (
            <span className="inline-block bg-[#FFDE00] text-[#252525] text-xs font-black px-2.5 py-0.5 rounded-full mb-2">
              {atual.assunto}
            </span>
          )}
          <h2 className="text-white font-bold text-lg leading-snug line-clamp-2">
            {atual.titulo}
          </h2>
          <p className="text-white/70 text-sm mt-1 line-clamp-1 flex items-center gap-1">
            <IconExternalLink size={12} />
            Clique para ler o comunicado completo
          </p>
        </div>
      </div>

      {/* Botões anterior/próximo */}
      {destaques.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); voltar(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
          >
            <IconChevronLeft size={18} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); avancar(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
          >
            <IconChevronRight size={18} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-3 right-5 flex gap-1.5">
            {destaques.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === idx
                    ? "bg-[#FFDE00] w-5"
                    : "bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
