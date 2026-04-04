// app/components/eventos/modal/FormEvento.tsx
"use client";

import {
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
  useMemo,
  useEffect,
} from "react";
import {
  IconUpload,
  IconX,
  IconPaperclip,
  IconCalendar,
  IconUsers,
} from "@tabler/icons-react";
import { FileService } from "@/src/service/file.service";
import { Evento, EventoColaborador, Visibilidade } from "@/src/types/evento";
import { CURSOS } from "@/src/utils/cursos.helpers";
import { UsuarioColaboradorService } from "@/src/service/usuarioColaborador.service";

type FormState = Omit<
  Evento,
  "id" | "criadoEm" | "vagasOcupadas" | "banner" | "anexos" | "descricaoBreve"
> & {
  banner: string;
  anexos: { id: string; nome: string; url: string }[];
};

export interface FormEventoRef {
  submit: () => void;
}

interface FormEventoProps {
  inicial?: Partial<Evento>;
  modoEdicao: Visibilidade;
  onSalvar: (
    dados: Omit<Evento, "id" | "criadoEm" | "vagasOcupadas">
  ) => Promise<void>;
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

function getTurnoFromHorario(horario?: string): "Manhã" | "Tarde" | "Noite" {
  if (!horario || !horario.includes(":")) return "Manhã";

  const [horaStr, minutoStr] = horario.split(":");
  const hora = Number(horaStr);
  const minuto = Number(minutoStr);

  if (Number.isNaN(hora) || Number.isNaN(minuto)) return "Manhã";

  const totalMinutos = hora * 60 + minuto;

  if (totalMinutos >= 300 && totalMinutos <= 720) return "Manhã";
  if (totalMinutos >= 721 && totalMinutos <= 1080) return "Tarde";
  return "Noite";
}

const INITIAL: FormState = {
  idCriador: undefined,
  nome: "",
  descricaoCompleta: "",
  area: "Todos",
  data: "",
  horario: "08:00",
  turno: "Manhã",
  local: "",
  dataLimiteInscricao: "",
  vagas: 50,
  tipoInscricao: "interna",
  urlExterna: "",
  visibilidade: "publica",
  modoEdicao: "privada",
  colaboradores: [],
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

function visibilidadeButtonClass(
  ativo: boolean,
  erros: Record<string, string>
) {
  if (ativo) {
    return "border-[#FFDE00] bg-[#FFDE00]/10 text-[#e6c800] dark:text-[#FFDE00] shadow-[inset_0_0_0_1px_rgba(255,222,0,0.35)]";
  }

  return erros.visibilidade
    ? "border-red-400 dark:border-red-600 text-slate-500 dark:text-slate-400"
    : "border-slate-300 dark:border-[#505050] text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-400";
}

export const FormEvento = forwardRef<FormEventoRef, FormEventoProps>(
  ({ inicial, modoEdicao, onSalvar, onLoadingChange }, ref) => {
    const initialHorario = inicial?.horario
      ? String(inicial.horario).slice(0, 5)
      : INITIAL.horario;

    const turnoInicial = getTurnoFromHorario(initialHorario);

    const [form, setForm] = useState<FormState>({
      ...INITIAL,
      ...inicial,
      area: inicial?.area?.trim() ? inicial.area : "Todos",
      horario: initialHorario,
      turno: turnoInicial,
      tipoInscricao: inicial?.tipoInscricao ?? "interna",
      visibilidade: inicial?.visibilidade ?? "publica",
      colaboradores: inicial?.colaboradores ?? [],
      descricaoCompleta: inicial?.descricaoCompleta ?? "",
      banner: inicial?.banner ?? "",
      anexos: (inicial?.anexos ?? []).map((anexo) => ({
        id: anexo.id,
        nome: anexo.nome,
        url: anexo.url,
      })),
    });

    const [erros, setErros] = useState<Record<string, string>>({});
    const [uploadingBanner, setUploadingBanner] = useState(false);
    const [erroAnexo, setErroAnexo] = useState("");
    const [uploadingAnexo, setUploadingAnexo] = useState(false);
    const [opcoesColaboradores, setOpcoesColaboradores] = useState<EventoColaborador[]>([]);

    const bannerInputRef = useRef<HTMLInputElement>(null);
    const anexoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      UsuarioColaboradorService.getAll()
        .then((data) => setOpcoesColaboradores(data))
        .catch(() => setOpcoesColaboradores([]));
    }, []);

    function set<K extends keyof FormState>(key: K, value: FormState[K]) {
      setForm((prev) => {
        const next = { ...prev, [key]: value };

        if (key === "horario") {
          next.turno = getTurnoFromHorario(String(value));
        }

        next.tipoInscricao = "interna";

        return next;
      });

      setErros((prev) => ({ ...prev, [key]: "" }));
    }

    function setVisibilidade(value: Visibilidade) {
      set("visibilidade", value);
    }

    function toggleColaborador(colaborador: EventoColaborador) {
      const existe = form.colaboradores.some((item) => item.id === colaborador.id);
      set(
        "colaboradores",
        existe
          ? form.colaboradores.filter((item) => item.id !== colaborador.id)
          : [...form.colaboradores, colaborador]
      );
    }

    const turnoCalculado = useMemo(
      () => getTurnoFromHorario(form.horario),
      [form.horario]
    );

    function validar(): boolean {
      const e: Record<string, string> = {};

      if (!form.nome.trim()) e.nome = "Nome é obrigatório.";
      if (!form.descricaoCompleta.trim()) {
        e.descricaoCompleta = "Descrição é obrigatória.";
      }

      if (!form.data) e.data = "Data é obrigatória.";
      else if (form.data < hoje) e.data = "Data não pode ser retroativa.";

      if (!form.horario) e.horario = "Horário é obrigatório.";
      if (!form.local.trim()) e.local = "Local é obrigatório.";

      if (!form.dataLimiteInscricao) {
        e.dataLimiteInscricao = "Data limite é obrigatória.";
      } else if (form.dataLimiteInscricao < hoje) {
        e.dataLimiteInscricao = "Data limite não pode ser retroativa.";
      }

      if (form.vagas < 1) e.vagas = "Deve ter ao menos 1 vaga.";
      if (!form.visibilidade) e.visibilidade = "Selecione a visibilidade.";

      setErros(e);
      return Object.keys(e).length === 0;
    }

    useImperativeHandle(ref, () => ({
      submit: async () => {
        if (!validar()) return;

        const payload: Omit<Evento, "id" | "criadoEm" | "vagasOcupadas"> = {
          ...form,
          descricaoBreve: "",
          turno: turnoCalculado,
          tipoInscricao: "interna",
          visibilidade: form.visibilidade,
          modoEdicao,
        };

        onLoadingChange?.(true);
        try {
          await onSalvar(payload);
        } finally {
          onLoadingChange?.(false);
        }
      },
    }));

    function removerAnexo(id: string) {
      set(
        "anexos",
        form.anexos.filter((a) => a.id !== id)
      );
    }

    async function handleBannerUpload(file: File) {
      onLoadingChange?.(true);
      setUploadingBanner(true);
      setErros((prev) => ({ ...prev, banner: "" }));

      try {
        const uploaded = await FileService.upload(file, "events/banners");
        set("banner", uploaded.url);
      } catch (error) {
        setErros((prev) => ({
          ...prev,
          banner:
            error instanceof Error
              ? error.message
              : "Nao foi possivel enviar o banner.",
        }));
      } finally {
        setUploadingBanner(false);
        onLoadingChange?.(false);
      }
    }

    async function handleAnexoUpload(file: File) {
      setErroAnexo("");
      onLoadingChange?.(true);
      setUploadingAnexo(true);

      try {
        const uploaded = await FileService.upload(file, "events/attachments");
        set("anexos", [
          ...form.anexos,
          {
            id: String(Date.now()),
            nome: file.name,
            url: uploaded.url,
          },
        ]);
      } catch (error) {
        setErroAnexo(
          error instanceof Error
            ? error.message
            : "Nao foi possivel enviar o anexo."
        );
      } finally {
        setUploadingAnexo(false);
        onLoadingChange?.(false);
      }
    }

    return (
      <div className="flex flex-col gap-5 pb-2">
        <Campo label="Banner do evento" erro={erros.banner}>
          <div
            className="border-2 border-dashed border-slate-300 dark:border-[#505050] rounded-xl h-36 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#FFDE00] transition-colors relative overflow-hidden"
            onClick={() => !uploadingBanner && bannerInputRef.current?.click()}
          >
            {form.banner ? (
              <>
                <img
                  src={form.banner}
                  alt="Banner"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                  onClick={(e) => {
                    e.stopPropagation();
                    set("banner", "");
                  }}
                >
                  <IconX size={14} />
                </button>
              </>
            ) : (
              <>
                <IconUpload size={24} className="text-slate-400" />
                <p className="text-sm text-slate-400">
                  {uploadingBanner
                    ? "Enviando banner..."
                    : "Clique para fazer upload do banner"}
                </p>
                <p className="text-xs text-slate-300 dark:text-slate-500">
                  PNG, JPG — recomendado 800×400px
                </p>
              </>
            )}
          </div>

          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) await handleBannerUpload(file);
              e.target.value = "";
            }}
          />
        </Campo>

        <Campo label="Nome do evento" erro={erros.nome} required>
          <input
            type="text"
            value={form.nome}
            maxLength={50}
            onChange={(e) => set("nome", e.target.value)}
            placeholder="Ex: Semana de Tecnologia 2025"
            className={`${inputCls} ${inputBorder(erros, "nome")}`}
          />
        </Campo>

        <Campo label="Descrição" erro={erros.descricaoCompleta} required>
          <textarea
            rows={4}
            value={form.descricaoCompleta}
            onChange={(e) => set("descricaoCompleta", e.target.value)}
            placeholder="Descreva o evento com detalhes..."
            className={`${inputCls} resize-none ${inputBorder(
              erros,
              "descricaoCompleta"
            )}`}
          />
          <p className="text-xs text-slate-400">
            Use * no início e no fim para negrito e @ no início para link. Ex:
            *texto* e @google.com
          </p>
        </Campo>

        <Campo label="Área vinculada" required>
          <select
            value={form.area}
            onChange={(e) => set("area", e.target.value)}
            className={`${inputCls} ${inputBorder(erros, "area")}`}
          >
            {[...CURSOS.slice(1), "Todos"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Campo>

        <Campo label="Visibilidade" erro={erros.visibilidade} required>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setVisibilidade("publica")}
              className={`h-11 rounded-lg border text-sm font-bold transition-colors ${visibilidadeButtonClass(
                form.visibilidade === "publica",
                erros
              )}`}
            >
              Pública
            </button>

            <button
              type="button"
              onClick={() => setVisibilidade("privada")}
              className={`h-11 rounded-lg border text-sm font-bold transition-colors ${visibilidadeButtonClass(
                form.visibilidade === "privada",
                erros
              )}`}
            >
              Privada
            </button>
          </div>
        </Campo>

        <Campo label="Colaboradores do evento">
          <div className="rounded-xl border border-slate-200 dark:border-[#404040] bg-slate-50 dark:bg-[#242424] p-3 space-y-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <IconUsers size={14} />
              Selecione colaboradores que podem editar este evento quando a edição estiver privada. Administradores continuam com acesso total.
            </div>

            {opcoesColaboradores.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhum colaborador disponível.</p>
            ) : (
              <div className="max-h-44 overflow-y-auto space-y-2">
                {opcoesColaboradores.map((colaborador) => {
                  const selecionado = form.colaboradores.some(
                    (item) => item.id === colaborador.id
                  );

                  return (
                    <button
                      key={colaborador.id}
                      type="button"
                      onClick={() => toggleColaborador(colaborador)}
                      className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                        selecionado
                          ? "border-[#FFDE00] bg-[#FFDE00]/10"
                          : "border-slate-200 dark:border-[#404040] hover:bg-slate-100 dark:hover:bg-[#2b2b2b]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                            {colaborador.nome}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {colaborador.email} · {colaborador.area || "Sem área"}
                          </p>
                        </div>
                        <span
                          className={`h-5 w-5 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                            selecionado
                              ? "border-[#FFDE00] bg-[#FFDE00] text-slate-900"
                              : "border-slate-300 dark:border-[#505050] text-transparent"
                          }`}
                        >
                          ✓
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Campo>

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

          <Campo label="Horário" erro={erros.horario} required>
            <input
              type="time"
              value={form.horario}
              onChange={(e) => set("horario", e.target.value)}
              className={`${inputCls} ${inputBorder(erros, "horario")}`}
            />
          </Campo>

          <Campo label="Turno" required>
            <input
              type="text"
              value={turnoCalculado}
              disabled
              readOnly
              className={`${inputCls} ${inputBorder(
                erros,
                "turno"
              )} opacity-80 cursor-not-allowed`}
            />
          </Campo>
        </div>

        <Campo label="Local" erro={erros.local} required>
          <input
            type="text"
            value={form.local}
            onChange={(e) => set("local", e.target.value)}
            placeholder="Ex: Auditório Principal – Bloco A"
            className={`${inputCls} ${inputBorder(erros, "local")}`}
          />
        </Campo>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo
            label="Data limite para inscrições"
            erro={erros.dataLimiteInscricao}
            required
          >
            <div className="relative">
              <IconCalendar
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="date"
                value={form.dataLimiteInscricao}
                min={hoje}
                onChange={(e) => set("dataLimiteInscricao", e.target.value)}
                className={`${inputCls} pl-8 ${inputBorder(
                  erros,
                  "dataLimiteInscricao"
                )}`}
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

        {/*
          Tipo de inscrição fixo como Interna (Sistema) ao cadastrar/editar
        */}

        <Campo label="Anexos">
          <div
            className="border-2 border-dashed border-slate-300 dark:border-[#505050] rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-[#FFDE00] transition-colors"
            onClick={() => !uploadingAnexo && anexoInputRef.current?.click()}
          >
            <IconPaperclip size={20} className="text-slate-400" />
            <p className="text-sm text-slate-400">
              {uploadingAnexo
                ? "Enviando anexo..."
                : "Clique para adicionar um anexo"}
            </p>
          </div>

          <input
            ref={anexoInputRef}
            type="file"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) await handleAnexoUpload(file);
              e.target.value = "";
            }}
          />

          {erroAnexo && <p className="text-xs text-red-500">{erroAnexo}</p>}

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
