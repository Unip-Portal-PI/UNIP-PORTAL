// app/components/gestor/usuarios/modal/FormUsuario.tsx
"use client";

import { useState, useImperativeHandle, forwardRef } from "react";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { UsuarioGestor, StatusUsuario } from "@/src/types/usuarioGestor";
import { UserRole } from "@/src/types/user";
import { CURSOS } from "@/src/utils/cursos.helpers";

export interface FormUsuarioRef {
  submit: () => void;
}

type FormData = {
  matricula: string;
  nome: string;
  apelido: string;
  email: string;
  senha: string;
  area: string;
  permission: UserRole;
  status: StatusUsuario;
  ativo: boolean;
};

interface FormUsuarioProps {
  inicial?: Partial<UsuarioGestor>;
  isEdicao?: boolean;
  criadoPor: string;
  onSalvar: (dados: Omit<UsuarioGestor, "id" | "criadoEm" | "atualizadoEm">) => Promise<void>;
  onLoadingChange?: (v: boolean) => void;
}

interface CampoProps {
  label: string;
  erro?: string;
  children: React.ReactNode;
  required?: boolean;
  span2?: boolean;
}

function Campo({ label, erro, children, required, span2 }: CampoProps) {
  return (
    <div className={span2 ? "sm:col-span-2" : ""}>
      <label className="text-sm font-bold text-slate-700 dark:text-slate-200 block mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {erro && <p className="mt-1 text-xs text-red-500">{erro}</p>}
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 border rounded-md text-sm bg-slate-50 dark:bg-[#2a2a2a] text-slate-800 dark:text-slate-200 focus:outline-none transition-colors";

function inputBorder(erros: Record<string, string>, key: string) {
  return erros[key]
    ? "border-red-400 dark:border-red-600"
    : "border-slate-300 dark:border-[#505050] focus:border-[#FFDE00]";
}

const INITIAL: FormData = {
  matricula: "",
  nome: "",
  apelido: "",
  email: "",
  senha: "",
  area: CURSOS[1],
  permission: "aluno",
  status: "ativo",
  ativo: true,
};

export const FormUsuario = forwardRef<FormUsuarioRef, FormUsuarioProps>(
  ({ inicial, isEdicao, criadoPor, onSalvar, onLoadingChange }, ref) => {
    const [form, setForm] = useState<FormData>({
      ...INITIAL,
      ...inicial,
      senha: "", // nunca pré-preenche senha
      status: (inicial?.ativo ? "ativo" : "inativo") as StatusUsuario,
    });
    const [erros, setErros] = useState<Record<string, string>>({});
    const [mostrarSenha, setMostrarSenha] = useState(false);

    function set<K extends keyof FormData>(key: K, value: FormData[K]) {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErros((prev) => ({ ...prev, [key]: "" }));
    }

    function validar(): boolean {
      const e: Record<string, string> = {};
      if (!form.nome.trim()) e.nome = "Nome é obrigatório.";
      if (!form.apelido.trim()) e.apelido = "Apelido é obrigatório.";
      if (!form.email.trim()) e.email = "E-mail é obrigatório.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        e.email = "E-mail inválido.";
      if (!form.matricula.trim()) e.matricula = "Matrícula é obrigatória.";

      // Senha obrigatória só na criação
      if (!isEdicao) {
        if (!form.senha.trim()) e.senha = "Senha é obrigatória.";
        else if (form.senha.length < 6) e.senha = "Mínimo 6 caracteres.";
      }

      setErros(e);
      return Object.keys(e).length === 0;
    }

    useImperativeHandle(ref, () => ({
      submit: async () => {
        if (!validar()) return;
        onLoadingChange?.(true);
        try {
          await onSalvar({
            matricula: form.matricula,
            nome: form.nome,
            apelido: form.apelido,
            email: form.email,
            area: form.area,
            permission: form.permission,
            status: form.status,
            ativo: form.status === "ativo",
            criadoPor,
            senha: form.senha,
          });
        } finally {
          onLoadingChange?.(false);
        }
      },
    }));

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2">

        {/* Nome */}
        <Campo label="Nome completo" erro={erros.nome} required span2>
          <input
            type="text"
            value={form.nome}
            onChange={(e) => set("nome", e.target.value)}
            placeholder="Nome completo"
            className={`${inputCls} ${inputBorder(erros, "nome")}`}
          />
        </Campo>

        {/* Apelido */}
        <Campo label="Apelido" erro={erros.apelido} required>
          <input
            type="text"
            value={form.apelido}
            onChange={(e) => set("apelido", e.target.value)}
            placeholder="Como prefere ser chamado(a)"
            className={`${inputCls} ${inputBorder(erros, "apelido")}`}
          />
        </Campo>

        {/* Matrícula */}
        <Campo label="Matrícula" erro={erros.matricula} required>
          <input
            type="text"
            value={form.matricula}
            onChange={(e) => set("matricula", e.target.value)}
            placeholder="Ex: CC20230456"
            disabled={isEdicao}
            className={`${inputCls} ${inputBorder(erros, "matricula")} ${isEdicao ? "opacity-50 cursor-not-allowed" : ""}`}
          />
          {isEdicao && (
            <p className="text-xs text-slate-400 mt-0.5">A matrícula não pode ser alterada.</p>
          )}
        </Campo>

        {/* E-mail */}
        <Campo label="E-mail" erro={erros.email} required span2>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="email@unip.br"
            className={`${inputCls} ${inputBorder(erros, "email")}`}
          />
        </Campo>

        {/* Senha — só na criação */}
        {!isEdicao && (
          <Campo label="Senha" erro={erros.senha} required span2>
            <div className="relative">
              <input
                type={mostrarSenha ? "text" : "password"}
                value={form.senha}
                onChange={(e) => set("senha", e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className={`${inputCls} pr-10 ${inputBorder(erros, "senha")}`}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                {mostrarSenha ? <IconEyeOff size={15} /> : <IconEye size={15} />}
              </button>
            </div>
          </Campo>
        )}

        {/* Área */}
        <Campo label="Área" required>
          <div className="relative">
            <select
              value={form.area}
              onChange={(e) => set("area", e.target.value)}
              className={`${inputCls} border-slate-300 dark:border-[#505050] focus:border-[#FFDE00] appearance-none pr-10 w-full`}
            >
              {CURSOS.filter((curso) => curso !== "Todos").map((a) => <option key={a}>{a}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </Campo>

        {/* Perfil */}
        <Campo label="Perfil de acesso" required>
          <div className="flex gap-2">
            {(["aluno", "colaborador", "adm"] as UserRole[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => set("permission", p)}
                className={`flex-1 py-2 rounded-md border text-xs font-bold transition-colors capitalize ${
                  form.permission === p
                    ? "border-[#FFDE00] bg-[#FFDE00]/15 text-amber-700 dark:text-[#FFDE00]"
                    : "border-slate-200 dark:border-[#404040] text-slate-500 dark:text-slate-400 hover:border-[#FFDE00]/50"
                }`}
              >
                {p === "adm" ? "Admin" : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </Campo>

        {/* Status — só na edição */}
        {isEdicao && (
          <Campo label="Status" required>
            <div className="flex gap-2">
              {(["ativo", "inativo"] as StatusUsuario[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { set("status", s); set("ativo", s === "ativo"); }}
                  className={`flex-1 py-2 rounded-md border text-xs font-bold transition-colors capitalize ${
                    form.status === s
                      ? s === "ativo"
                        ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                        : "border-slate-400 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      : "border-slate-200 dark:border-[#404040] text-slate-400 hover:border-slate-300"
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </Campo>
        )}

      </div>
    );
  }
);

FormUsuario.displayName = "FormUsuario";
