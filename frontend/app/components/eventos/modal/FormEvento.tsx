// app/components/eventos/modal/FormEvento.tsx
"use client";

import { useState, useRef, useImperativeHandle, forwardRef } from "react";
import { IconUpload, IconX, IconPaperclip, IconCalendar } from "@tabler/icons-react";
import { Evento } from "@/src/types/evento";
import { CURSOS, TURNOS } from "@/src/utils/evento.helpers";

type FormData = Omit<Evento, "id" | "criadoEm" | "vagasOcupadas" | "banner" | "anexos"> & {
  banner: string;
  anexos: { id: string; nome: string; url: string }[];
};

export interface FormEventoRef {
  submit: () => void;
}

interface FormEventoProps {
  inicial?: Partial<Evento>;
  onSalvar: (dados: FormData) => Promise<void>;
  onLoadingChange?: (loading: boolean) => void;
}

interface CampoProps {
  label: string;
  erro?: string;
  children: React.ReactNode;
  required?: boolean;
}

function Campo({ label, erro, children, required }: CampoProps) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {erro && <p className="text-xs text-red-500">{erro}</p>}
    </div>
  );
}

const hoje = new Date().toISOString().split("T")[0];

const INITIAL: FormData = {
  nome: "",
  descricaoBreve: "",
  descricaoCompleta: "",
  area: CURSOS[1],
  data: "",
  horario: "08:00",
  turno: TURNOS[1],
  local: "",
  dataLimiteInscricao: "",
  vagas: 50,
  tipoInscricao: "interna",
  urlExterna: "",
  visibilidade: "publica",
  banner: "",
  anexos: [],
};

const inputCls =
  "w-full px-3 py-2 border rounded-md text-sm bg-slate-50 dark:bg-[#2a2a2a] text-slate-800 dark:text-slate-200 focus:outline-none transition-colors";

function inputBorder(erros: Record<string, string>, key: string) {
  return erros[key]
    ? "border-red-400 dark:border-red-600 focus:border-red-500"
    : "border-slate-300 dark:border-[#505050] focus:border-[#FFDE00] dark:focus:border-[#FFDE00]";
}

export const FormEvento = forwardRef<FormEventoRef, FormEventoProps>(
  ({ inicial, onSalvar, onLoadingChange }, ref) => {
    const [form, setForm] = useState<FormData>({ ...INITIAL, ...inicial });
    const [erros, setErros] = useState<Record<string, string>>({});
    const [anexoNome, setAnexoNome] = useState("");
    const bannerInputRef = useRef<HTMLInputElement>(null);

    function set<K extends keyof FormData>(key: K, value: FormData[K]) {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErros((prev) => ({ ...prev, [key]: "" }));
    }

    function validar(): boolean {
      const e: Record<string, string> = {};
      if (!form.nome.trim()) e.nome = "Nome é obrigatório.";
      if (!form.descricaoBreve.trim()) e.descricaoBreve = "Descrição breve é obrigatória.";
      if (!form.descricaoCompleta.trim()) e.descricaoCompleta = "Descrição completa é obrigatória.";
      if (!form.data) e.data = "Data é obrigatória.";
      else if (form.data < hoje) e.data = "Data não pode ser retroativa.";
      if (!form.local.trim()) e.local = "Local é obrigatório.";
      if (!form.dataLimiteInscricao) e.dataLimiteInscricao = "Data limite é obrigatória.";
      else if (form.dataLimiteInscricao < hoje) e.dataLimiteInscricao = "Data limite não pode ser retroativa.";
      if (form.vagas < 1) e.vagas = "Deve ter ao menos 1 vaga.";
      if (form.tipoInscricao === "externa" && !form.urlExterna?.trim())
        e.urlExterna = "URL externa é obrigatória para inscrição externa.";
      setErros(e);
      return Object.keys(e).length === 0;
    }

    // Expõe o método submit para a modal chamar pelo ref
    useImperativeHandle(ref, () => ({
      submit: async () => {
        if (!validar()) return;
        onLoadingChange?.(true);
        try {
          await onSalvar(form);
        } finally {
          onLoadingChange?.(false);
        }
      },
    }));

    function adicionarAnexo() {
      if (!anexoNome.trim()) return;
      set("anexos", [
        ...form.anexos,
        { id: String(Date.now()), nome: anexoNome.trim(), url: "#" },
      ]);
      setAnexoNome("");
    }

    function removerAnexo(id: string) {
      set("anexos", form.anexos.filter((a) => a.id !== id));
    }

    return (
      <div className="flex flex-col gap-5 pb-2">

        {/* Banner */}
        <Campo label="Banner do evento">
          <div
            className="border-2 border-dashed border-slate-300 dark:border-[#505050] rounded-xl h-36 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#FFDE00] transition-colors relative overflow-hidden"
            onClick={() => bannerInputRef.current?.click()}
          >
            {form.banner ? (
              <>
                <img src={form.banner} alt="Banner" className="w-full h-full object-cover" />
                <button
                  type="button"
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                  onClick={(e) => { e.stopPropagation(); set("banner", ""); }}
                >
                  <IconX size={14} />
                </button>
              </>
            ) : (
              <>
                <IconUpload size={24} className="text-slate-400" />
                <p className="text-sm text-slate-400">Clique para fazer upload do banner</p>
                <p className="text-xs text-slate-300 dark:text-slate-500">PNG, JPG — recomendado 800×400px</p>
              </>
            )}
          </div>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => set("banner", ev.target?.result as string);
                reader.readAsDataURL(file);
              }
            }}
          />
        </Campo>

        {/* Nome */}
        <Campo label="Nome do evento" erro={erros.nome} required>
          <input
            type="text"
            value={form.nome}
            onChange={(e) => set("nome", e.target.value)}
            placeholder="Ex: Semana de Tecnologia 2025"
            className={`${inputCls} ${inputBorder(erros, "nome")}`}
          />
        </Campo>

        {/* Descrição breve */}
        <Campo label="Descrição breve" erro={erros.descricaoBreve} required>
          <input
            type="text"
            value={form.descricaoBreve}
            onChange={(e) => set("descricaoBreve", e.target.value)}
            placeholder="Resumo em uma linha"
            maxLength={120}
            className={`${inputCls} ${inputBorder(erros, "descricaoBreve")}`}
          />
          <p className="text-xs text-slate-400 text-right">{form.descricaoBreve.length}/120</p>
        </Campo>

        {/* Descrição completa */}
        <Campo label="Descrição completa" erro={erros.descricaoCompleta} required>
          <textarea
            rows={4}
            value={form.descricaoCompleta}
            onChange={(e) => set("descricaoCompleta", e.target.value)}
            placeholder="Descreva o evento com detalhes..."
            className={`${inputCls} resize-none ${inputBorder(erros, "descricaoCompleta")}`}
          />
        </Campo>

        {/* Curso */}
        <Campo label="Curso / Área vinculada" required>
          <select
            value={form.area}
            onChange={(e) => set("area", e.target.value)}
            className={`${inputCls} ${inputBorder(erros, "curso")}`}
          >
            {[...CURSOS.slice(1), "Todos"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Campo>

        {/* Data, horário, turno */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Campo label="Data" erro={erros.data} required>
            <input
              type="date"
              value={form.data}
              min={hoje}
              onChange={(e) => set("data", e.target.value)}
              className={`${inputCls} ${inputBorder(erros, "data")}`}
            />
          </Campo>
          <Campo label="Horário" required>
            <input
              type="time"
              value={form.horario}
              onChange={(e) => set("horario", e.target.value)}
              className={`${inputCls} ${inputBorder(erros, "horario")}`}
            />
          </Campo>
          <Campo label="Turno" required>
            <select
              value={form.turno}
              onChange={(e) => set("turno", e.target.value)}
              className={`${inputCls} ${inputBorder(erros, "turno")}`}
            >
              {TURNOS.slice(1).map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Campo>
        </div>

        {/* Local */}
        <Campo label="Local" erro={erros.local} required>
          <input
            type="text"
            value={form.local}
            onChange={(e) => set("local", e.target.value)}
            placeholder="Ex: Auditório Principal – Bloco A"
            className={`${inputCls} ${inputBorder(erros, "local")}`}
          />
        </Campo>

        {/* Data limite e vagas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Data limite para inscrições" erro={erros.dataLimiteInscricao} required>
            <div className="relative">
              <IconCalendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={form.dataLimiteInscricao}
                min={hoje}
                onChange={(e) => set("dataLimiteInscricao", e.target.value)}
                className={`${inputCls} pl-8 ${inputBorder(erros, "dataLimiteInscricao")}`}
              />
            </div>
          </Campo>
          <Campo label="Número de vagas" erro={erros.vagas} required>
            <input
              type="number"
              min={1}
              value={form.vagas}
              onChange={(e) => set("vagas", Number(e.target.value))}
              className={`${inputCls} ${inputBorder(erros, "vagas")}`}
            />
          </Campo>
        </div>

        {/* Tipo de inscrição */}
        <Campo label="Tipo de inscrição" required>
          <div className="flex gap-3">
            {(["interna", "externa"] as const).map((tipo) => (
              <button
                key={tipo}
                type="button"
                onClick={() => set("tipoInscricao", tipo)}
                className={`flex-1 py-2.5 rounded-md border-2 text-sm font-bold transition-colors capitalize ${
                  form.tipoInscricao === tipo
                    ? "border-[#FFDE00] bg-[#FFDE00]/10 text-[#b89e00] dark:text-[#FFDE00]"
                    : "border-slate-200 dark:border-[#404040] text-slate-500 dark:text-slate-400 hover:border-[#FFDE00]/50"
                }`}
              >
                {tipo === "interna" ? "Interna (sistema)" : "Externa (link)"}
              </button>
            ))}
          </div>
          {form.tipoInscricao === "externa" && (
            <div className="mt-2">
              <input
                type="url"
                value={form.urlExterna}
                onChange={(e) => set("urlExterna", e.target.value)}
                placeholder="https://..."
                className={`${inputCls} ${inputBorder(erros, "urlExterna")}`}
              />
              {erros.urlExterna && (
                <p className="text-xs text-red-500 mt-1">{erros.urlExterna}</p>
              )}
            </div>
          )}
        </Campo>

        {/* Visibilidade */}
        <Campo label="Visibilidade" required>
          <div className="flex gap-3">
            {(["publica", "privada"] as const).map((vis) => (
              <button
                key={vis}
                type="button"
                onClick={() => set("visibilidade", vis)}
                className={`flex-1 py-2.5 rounded-md border-2 text-sm font-bold transition-colors capitalize ${
                  form.visibilidade === vis
                    ? "border-[#FFDE00] bg-[#FFDE00]/10 text-[#b89e00] dark:text-[#FFDE00]"
                    : "border-slate-200 dark:border-[#404040] text-slate-500 dark:text-slate-400 hover:border-[#FFDE00]/50"
                }`}
              >
                {vis === "publica" ? "Pública" : "Privada"}
              </button>
            ))}
          </div>
        </Campo>

        {/* Anexos */}
        <Campo label="Anexos (PDF)">
          <div className="flex gap-2">
            <input
              type="text"
              value={anexoNome}
              onChange={(e) => setAnexoNome(e.target.value)}
              placeholder="Nome do arquivo..."
              className={`flex-1 ${inputCls} border-slate-300 dark:border-[#505050] focus:border-[#FFDE00]`}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); adicionarAnexo(); }
              }}
            />
            <button
              type="button"
              onClick={adicionarAnexo}
              disabled={!anexoNome.trim()}
              className="px-3 py-2 bg-slate-200 dark:bg-[#363636] hover:bg-slate-300 dark:hover:bg-[#404040] disabled:opacity-40 text-slate-700 dark:text-slate-300 rounded-md text-sm transition-colors"
            >
              <IconPaperclip size={16} />
            </button>
          </div>

          {form.anexos.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {form.anexos.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between bg-slate-50 dark:bg-[#2a2a2a] rounded-md px-3 py-2"
                >
                  <span className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <IconPaperclip size={13} className="text-slate-400" />
                    {a.nome}
                  </span>
                  <button
                    type="button"
                    onClick={() => removerAnexo(a.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <IconX size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Campo>

      </div>
    );
  }
);

FormEvento.displayName = "FormEvento";