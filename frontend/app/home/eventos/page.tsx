"use client";

import { useState, useMemo } from "react";
import { Evento } from "@/lib/types/events";
import { EVENTOS_MOCK } from "@/lib/data/eventos";
import { CURSOS, TURNOS } from "@/lib/data/filtros";

 import { FilterInput } from "@/app/components/filters/FilterInput"; 
 import { FilterSelect } from "@/app/components/filters/FilterSelect"; 
 import { FilterDateRange } from "@/app/components/filters/FilterDateRange";

import {
  IconSearch,
  IconCalendar,
  IconMapPin,
  IconUsers,
  IconChevronDown,
} from "@tabler/icons-react";

// ─── Helpers ───────────────────────────────────────────────────────────────────
function vagasRestantes(evento: Evento) {
  return evento.vagas - evento.inscritos;
}

function progressColor(evento: Evento) {
  if (evento.esgotado) return "bg-red-400";
  const pct = evento.inscritos / evento.vagas;
  if (pct >= 0.85) return "bg-orange-400";
  return "bg-green-400";
}

function turnoColor(turno: string) {
  if (turno === "Manhã") return "bg-slate-800 text-white";
  if (turno === "Noite") return "bg-indigo-700 text-white";
  return "bg-amber-600 text-white";
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function EventoCard({ evento }: { evento: Evento }) {
  const restantes = vagasRestantes(evento);
  const pct = Math.min((evento.inscritos / evento.vagas) * 100, 100);

  return (
    <div className="bg-white dark:bg-[#202020] rounded-2xl shadow-sm border flex flex-col overflow-hidden hover:shadow-md transition-shadow">
      {/* Banner */}
      <div className="relative">
        <div className="w-full h-40 bg-[#f5eee8] dark:bg-slate-700 flex items-center justify-center overflow-hidden">
          {evento.banner ? (
            <img src={evento.banner} alt={evento.titulo} className="w-full h-full object-cover" />
          ) : (
            <img
              src="/img/banner_test.png"
              alt="banner padrão"
              className="w-full h-full object-cover opacity-70"
            />
          )}
        </div>

        {/* Turno badge */}
        <span className={`absolute top-3 left-3 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${turnoColor(evento.turno)}`}>
          {evento.turno}
        </span>

        {/* Vagas / Esgotado badge */}
        <span className={`absolute top-3 right-3 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${evento.esgotado ? "text-red-500" : "text-green-500"}`}>
          {evento.esgotado ? "Esgotado" : `${restantes} vagas`}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div>
          <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">
            {evento.curso}
          </p>
          <h3 className="text-[15px] font-bold text-slate-900 dark:text-white leading-snug">
            {evento.titulo}
          </h3>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
            {evento.descricao}
          </p>
        </div>

        {/* Meta */}
        <div className="flex flex-col gap-1.5 text-[12px] text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <IconCalendar size={13} className="text-slate-400 dark:text-slate-500 shrink-0" />
            <span>{evento.data}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <IconMapPin size={13} className="text-slate-400 dark:text-slate-500 shrink-0" />
            <span>{evento.local}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <IconUsers size={13} className="text-slate-400 dark:text-slate-500 shrink-0" />
            <span>{evento.inscritos}/{evento.vagas} inscritos</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${progressColor(evento)}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* CTA */}
        <button
          disabled={!!evento.esgotado}
          className={`mt-auto w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${evento.esgotado
              ? "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-600"
              : "bg-[#F5C518] hover:bg-[#e0b514] text-slate-900"
            }`}
        >
          {evento.esgotado ? "Esgotado" : "Inscreva-se"}
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function EventosPage() {
  const [search, setSearch] = useState("");
  const [curso, setCurso] = useState("Todos os cursos");
  const [turno, setTurno] = useState("Todos");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const filtered = useMemo(() => {
    return EVENTOS_MOCK.filter((e) => {
      const matchSearch =
        !search || e.titulo.toLowerCase().includes(search.toLowerCase());
      const matchCurso = curso === "Todos os cursos" || e.curso === curso;
      const matchTurno = turno === "Todos" || e.turno === turno;
      return matchSearch && matchCurso && matchTurno;
    });
  }, [search, curso, turno, dataInicio, dataFim]);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Eventos</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Encontre e inscreva-se nos eventos disponíveis para seu curso.
          </p>
        </div>


      {/* Filters */}
      <div className="bg-white dark:bg-[#202020] rounded-2xl border border-slate-100 dark:border-[#303030] shadow-sm p-4 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">

            {/* Linha 1 (md) / coluna 1 (filters): Busca */}
            <FilterInput
              label="Procurar"
              placeholder="Nome do evento..."
              value={search}
              onChange={setSearch}
            />

            {/* Linha 1 (md) / coluna 2 (filters): Curso */}
            <FilterSelect
              label="Curso"
              value={curso}
              onChange={setCurso}
              options={CURSOS}
            />

            {/* Linha 2 (md) / coluna 3 (filters): Turno */}
            <FilterSelect
              label="Turno"
              value={turno}
              onChange={setTurno}
              options={TURNOS}
            />

            {/* Linha 2 (md) / coluna 4 (filters): Período */}
            <FilterDateRange
              label="Período"
              valueInicio={dataInicio}
              valueFim={dataFim}
              onChangeInicio={setDataInicio}
              onChangeFim={setDataFim}
            />

          </div>
        </div>

        {/* List header */}
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Lista de Eventos</h2>
          <span className="text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">
            {filtered.length} {filtered.length === 1 ? "evento" : "eventos"}
          </span>
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((evento) => (
              <EventoCard key={evento.id} evento={evento} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-600">
            <IconSearch size={40} className="mb-3 opacity-40" />
            <p className="text-sm font-medium">Nenhum evento encontrado</p>
            <p className="text-xs mt-1">Tente ajustar os filtros de busca</p>
          </div>
        )}
      </div>
    </div>
  );
}