// app/components/comunicados/modal/FormComunicado.tsx
"use client";

import {
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  IconUpload,
  IconX,
  IconPaperclip,
  IconAlertCircle,
} from "@tabler/icons-react";
import { Comunicado, ComunicadoAnexo } from "@/src/types/comunicado";
import { CURSOS_COMUNICADO } from "@/src/utils/comunicado.helpers";

const MAX_ANEXO_MB = 10;
const TIPOS_ACEITOS = ["application/pdf", "image/jpeg", "image/png"];
const EXTENSOES_ACEITAS = ".pdf,.jpg,.jpeg,.png";

type FormData = Omit<Comunicado, "id" | "criadoEm" | "criadoPor" | "criadoPorNome">;

export interface FormComunicadoRef {
  submit: () => void;
}

interface FormComunicadoProps {
  inicial?: Partial<Comunicado>;
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
  titulo: "",
  assunto: "",
  conteudo: "",
  resumo: "",
  banner: "",
  visibilidade: ["Todos"],
  anexos: [],
  dataValidade: "",
  removido: false,
};

const inputCls =
  "w-full px-3 py-2 border rounded-md text-sm bg-slate-50 dark:bg-[#2a2a2a] text-slate-800 dark:text-slate-200 focus:outline-none transition-colors";

function inputBorder(erros: Record<string, string>, key: string) {
  return erros[key]
    ? "border-red-400 dark:border-red-600 focus:border-red-500"
    : "border-slate-300 dark:border-[#505050] focus:border-[#FFDE00] dark:focus:border-[#FFDE00]";
}

export const FormComunicado = forwardRef<FormComunicadoRef, FormComunicadoProps>(
  ({ inicial, onSalvar, onLoadingChange }, ref) => {
    const [form, setForm] = useState<FormData>({ ...INITIAL, ...inicial });
    const [erros, setErros] = useState<Record<string, string>>({});
    const [erroAnexo, setErroAnexo] = useState("");
    const bannerInputRef = useRef<HTMLInputElement>(null);
    const anexoInputRef = useRef<HTMLInputElement>(null);

    function set<K extends keyof FormData>(key: K, value: FormData[K]) {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErros((prev) => ({ ...prev, [key]: "" }));
    }

    function validar(): boolean {
      const e: Record<string, string> = {};
      if (!form.titulo.trim()) e.titulo = "Título é obrigatório.";
      if (!form.conteudo.trim()) e.conteudo = "Conteúdo é obrigatório.";
      if (!form.resumo.trim()) e.resumo = "Resumo é obrigatório.";
      if (!form.dataValidade) e.dataValidade = "Data de validade é obrigatória.";
      else if (form.dataValidade < hoje) e.dataValidade = "Data de validade não pode ser retroativa.";
      setErros(e);
      return Object.keys(e).length === 0;
    }

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

    function handleAnexo(file: File) {
      setErroAnexo("");
      if (!TIPOS_ACEITOS.includes(file.type)) {
        setErroAnexo("Tipo inválido. Use PDF, JPG ou PNG.");
        return;
      }
      const tamanhoMB = file.size / (1024 * 1024);
      if (tamanhoMB > MAX_ANEXO_MB) {
        setErroAnexo(`Arquivo muito grande. Máximo: ${MAX_ANEXO_MB}MB.`);
        return;
      }
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
      const tipo = ext === "pdf" ? "pdf" : ext === "png" ? "png" : "jpg";
      const novoAnexo: ComunicadoAnexo = {
        id: String(Date.now()),
        nome: file.name,
        url: URL.createObjectURL(file),
        tipo: tipo as "pdf" | "jpg" | "png",
        tamanhoMB: parseFloat(tamanhoMB.toFixed(2)),
      };
      set("anexos", [...form.anexos, novoAnexo]);
    }

    function removerAnexo(id: string) {
      set("anexos", form.anexos.filter((a) => a.id !== id));
    }

    function toggleCurso(curso: string) {
      if (curso === "Todos") {
        set("visibilidade", ["Todos"]);
        return;
      }
      const semTodos = form.visibilidade.filter((v) => v !== "Todos");
      if (semTodos.includes(curso)) {
        const novo = semTodos.filter((v) => v !== curso);
        set("visibilidade", novo.length === 0 ? ["Todos"] : novo);
      } else {
        set("visibilidade", [...semTodos, curso]);
      }
    }

    return (
      <div className="flex flex-col gap-5 pb-2">

        {/* Banner */}
        <Campo label="Banner do comunicado">
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
                <p className="text-xs text-slate-300 dark:text-slate-500">PNG, JPG — recomendado 1200×400px</p>
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

        {/* Título */}
        <Campo label="Título" erro={erros.titulo} required>
          <input
            type="text"
            value={form.titulo}
            onChange={(e) => set("titulo", e.target.value)}
            placeholder="Ex: Reunião Geral — Resultados Q1"
            className={`${inputCls} ${inputBorder(erros, "titulo")}`}
          />
        </Campo>

        {/* Assunto */}
        <Campo label="Assunto">
          <input
            type="text"
            value={form.assunto}
            onChange={(e) => set("assunto", e.target.value)}
            placeholder="Ex: RH, Tecnologia, Institucional..."
            className={`${inputCls} border-slate-300 dark:border-[#505050] focus:border-[#FFDE00]`}
          />
        </Campo>

        {/* Resumo */}
        <Campo label="Resumo" erro={erros.resumo} required>
          <textarea
            rows={2}
            value={form.resumo}
            onChange={(e) => set("resumo", e.target.value)}
            placeholder="Breve descrição exibida nos cards do feed..."
            maxLength={200}
            className={`${inputCls} resize-none ${inputBorder(erros, "resumo")}`}
          />
          <p className="text-xs text-slate-400 text-right">{form.resumo.length}/200</p>
        </Campo>

        {/* Conteúdo */}
        <Campo label="Conteúdo" erro={erros.conteudo} required>
          <textarea
            rows={6}
            value={form.conteudo}
            onChange={(e) => set("conteudo", e.target.value)}
            placeholder="Escreva o conteúdo completo do comunicado aqui. Você pode usar HTML básico para formatação."
            className={`${inputCls} resize-none ${inputBorder(erros, "conteudo")}`}
          />
          <p className="text-xs text-slate-400">Dica: use &lt;strong&gt;, &lt;p&gt;, &lt;ul&gt; para formatar.</p>
        </Campo>

        {/* Visibilidade */}
        <Campo label="Visibilidade (cursos que podem ver)" required>
          <div className="flex flex-wrap gap-2 mt-1">
            {CURSOS_COMUNICADO.map((curso) => {
              const ativo =
                curso === "Todos"
                  ? form.visibilidade.includes("Todos")
                  : form.visibilidade.includes(curso) && !form.visibilidade.includes("Todos");
              return (
                <button
                  key={curso}
                  type="button"
                  onClick={() => toggleCurso(curso)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                    ativo
                      ? "border-[#FFDE00] bg-[#FFDE00]/15 text-amber-700 dark:text-[#FFDE00]"
                      : "border-slate-200 dark:border-[#404040] text-slate-500 dark:text-slate-400 hover:border-[#FFDE00]/50"
                  }`}
                >
                  {curso}
                </button>
              );
            })}
          </div>
        </Campo>

        {/* Data de validade */}
        <Campo label="Data de validade" erro={erros.dataValidade} required>
          <input
            type="date"
            value={form.dataValidade}
            min={hoje}
            onChange={(e) => set("dataValidade", e.target.value)}
            className={`${inputCls} ${inputBorder(erros, "dataValidade")}`}
          />
          <p className="text-xs text-slate-400">
            Após essa data o comunicado aparecerá como expirado.
          </p>
        </Campo>

        {/* Anexos */}
        <Campo label={`Anexos (PDF, JPG, PNG — máx. ${MAX_ANEXO_MB}MB cada)`}>
          <div
            className="border-2 border-dashed border-slate-300 dark:border-[#505050] rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-[#FFDE00] transition-colors"
            onClick={() => anexoInputRef.current?.click()}
          >
            <IconPaperclip size={20} className="text-slate-400" />
            <p className="text-sm text-slate-400">Clique para adicionar um anexo</p>
          </div>
          <input
            ref={anexoInputRef}
            type="file"
            accept={EXTENSOES_ACEITAS}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleAnexo(file);
              e.target.value = "";
            }}
          />
          {erroAnexo && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <IconAlertCircle size={12} /> {erroAnexo}
            </p>
          )}

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
                    <span className="text-xs text-slate-400">({a.tamanhoMB} MB)</span>
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

FormComunicado.displayName = "FormComunicado";
