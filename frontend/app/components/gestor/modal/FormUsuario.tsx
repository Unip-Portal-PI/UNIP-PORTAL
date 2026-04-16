"use client";

import { useState, useImperativeHandle, forwardRef } from "react";
import { User, AtSign, Lock, Hash, BookOpen } from "lucide-react";
import { UsuarioGestor, StatusUsuario } from "@/src/types/usuarioGestor";
import { UserRole } from "@/src/types/user";
import { CURSOS } from "@/src/utils/cursos.helpers";
import { Tooltip } from "@/app/components/Tooltip";
import {
  InputCad,
  SelectCad,
  validateEmail,
  validateMatricula,
  validateSenha,
  validateBlockedTermsField,
} from "@/app/components/inputCad";

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
  tooltip?: string;
}

function Campo({ label, erro, children, required, span2, tooltip }: CampoProps) {
  return (
    <div className={span2 ? "sm:col-span-2" : ""}>
      <label className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 mb-1">
        {label}
        {tooltip && <Tooltip text={tooltip} />}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {erro && <p className="mt-1 text-xs text-red-500">{erro}</p>}
    </div>
  );
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
    const statusInicial: StatusUsuario =
      typeof inicial?.ativo === "boolean"
        ? inicial.ativo
          ? "ativo"
          : "inativo"
        : INITIAL.status;

    const [form, setForm] = useState<FormData>({
      ...INITIAL,
      ...inicial,
      senha: "",
      status: statusInicial,
      ativo: statusInicial === "ativo",
    });

    const [erros, setErros] = useState<Record<string, string>>({});

    // Atalho para saber se o perfil atual é aluno
    const isAluno = form.permission === "aluno";

    function set<K extends keyof FormData>(key: K, value: FormData[K]) {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErros((prev) => ({ ...prev, [key]: "" }));
    }

    function handlePermissionChange(p: UserRole) {
      set("permission", p);
      // Se não for aluno, limpa a área para string vazia
      if (p !== "aluno") {
        setForm((prev) => ({ ...prev, permission: p, area: "Todos" }));
      } else {
        // Ao voltar para aluno, restaura o valor padrão se estiver vazio
        setForm((prev) => ({
          ...prev,
          permission: p,
          area: prev.area || CURSOS[1],
        }));
      }
      setErros((prev) => ({ ...prev, permission: "", area: "" }));
    }

    function validar(): boolean {
      const e: Record<string, string> = {};

      if (!form.nome.trim()) e.nome = "Nome é obrigatório.";
      else {
        const nomeErro = validateBlockedTermsField("Nome completo", form.nome);
        if (nomeErro) e.nome = nomeErro;
      }

      if (!form.apelido.trim()) e.apelido = "Apelido é obrigatório.";
      else {
        const apelidoErro = validateBlockedTermsField("Apelido", form.apelido);
        if (apelidoErro) e.apelido = apelidoErro;
      }

      if (!form.email.trim()) e.email = "E-mail é obrigatório.";
      else {
        const emailErro = validateEmail(form.email);
        if (emailErro) e.email = emailErro;
      }

      if (!form.matricula.trim()) e.matricula = "Matrícula é obrigatória.";
      else {
        const matriculaErro = validateMatricula(form.matricula);
        if (matriculaErro) e.matricula = matriculaErro;
      }

      // Área só é obrigatória se for aluno
      if (isAluno && !form.area.trim()) e.area = "Área é obrigatória.";

      if (!isEdicao) {
        if (!form.senha.trim()) e.senha = "Senha é obrigatória.";
        else {
          const senhaErro = validateSenha(form.senha);
          if (senhaErro) e.senha = senhaErro;
          else if (form.senha.length < 6) e.senha = "Mínimo 6 caracteres.";
        }
      } else if (form.senha.trim()) {
        const senhaErro = validateSenha(form.senha);
        if (senhaErro) e.senha = senhaErro;
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
            nome: form.nome.trim(),
            apelido: form.apelido.trim(),
            email: form.email.trim(),
            // Se não for aluno, garante string vazia
            area: isAluno ? form.area : "Todos",
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
        <Campo label="Nome completo" required span2 tooltip="Nome completo do usuário. Evite abreviações e apelidos aqui.">
          <InputCad
            id="nome"
            label=""
            type="text"
            placeholder="Nome completo"
            Icon={User}
            erro={!!erros.nome}
            defaultValue={form.nome}
            validator={(value) => {
              if (!value.trim()) return "";
              return validateBlockedTermsField("Nome completo", value);
            }}
            onValidatedChange={(_, message, value) => {
              set("nome", value);
              if (message) setErros((prev) => ({ ...prev, nome: message }));
            }}
          />
        </Campo>

        <Campo label="Apelido" tooltip="Nome curto que será exibido no sistema." required>
          <InputCad
            id="apelido"
            label=""
            type="text"
            placeholder="Como prefere ser chamado(a)"
            Icon={User}
            erro={!!erros.apelido}
            defaultValue={form.apelido}
            validator={(value) => {
              if (!value.trim()) return "";
              return validateBlockedTermsField("Apelido", value);
            }}
            onValidatedChange={(_, message, value) => {
              set("apelido", value);
              if (message) setErros((prev) => ({ ...prev, apelido: message }));
            }}
          />
        </Campo>

        <Campo label="Matrícula" tooltip="Identificador único do aluno/colaborador. Ex: CC20230456." required>
          <InputCad
            id="matricula"
            label=""
            type="text"
            placeholder="Ex: CC20230456"
            Icon={Hash}
            erro={!!erros.matricula}
            defaultValue={form.matricula}
            validator={validateMatricula}
            onValidatedChange={(_, message, value) => {
              set("matricula", value);
              if (message) setErros((prev) => ({ ...prev, matricula: message }));
            }}
          />
        </Campo>

        <Campo label="E-mail" tooltip="E-mail institucional ou válido para login e comunicação." required span2>
          <InputCad
            id="email"
            label=""
            type="email"
            placeholder="email@unip.br"
            Icon={AtSign}
            erro={!!erros.email}
            defaultValue={form.email}
            validator={validateEmail}
            onValidatedChange={(_, message, value) => {
              set("email", value);
              if (message) setErros((prev) => ({ ...prev, email: message }));
            }}
          />
        </Campo>

<<<<<<< HEAD
        <Campo
          label={isEdicao ? "Nova senha" : "Senha"}
          tooltip={isEdicao ? "Preencha apenas se quiser redefinir a senha deste usuário." : "Mínimo de 6 caracteres. Evite senhas fracas como 123456."}
          required={!isEdicao}
          span2
          erro={erros.senha}
        >
          <InputCad
            id="senha"
            label=""
            type="password"
            placeholder={isEdicao ? "Deixe em branco para não alterar" : "Mínimo 6 caracteres"}
            Icon={Lock}
            erro={!!erros.senha}
            defaultValue={form.senha}
            validator={(value) => {
              if (isEdicao && !value.trim()) return "";
              return validateSenha(value);
            }}
            onValidatedChange={(_, message, value) => {
              set("senha", value);
              if (message) {
                setErros((prev) => ({ ...prev, senha: message }));
              }
            }}
          />
          {isEdicao && (
            <p className="mt-1 text-xs text-slate-400">Opcional — deixe em branco para não alterar.</p>
          )}
        </Campo>
=======
        {!isEdicao && (
          <Campo label="Senha" tooltip="Mínimo de 48 caracteres. Evite senhas fracas como 123456." required span2>
            <InputCad
              id="senha"
              label=""
              type="password"
              placeholder="Mínimo 48 caracteres"
              Icon={Lock}
              erro={!!erros.senha}
              defaultValue={form.senha}
              validator={validateSenha}
              onValidatedChange={(_, message, value) => {
                set("senha", value);
                if (message) setErros((prev) => ({ ...prev, senha: message }));
              }}
            />
          </Campo>
        )}
>>>>>>> alexkz

        <Campo label="Perfil de acesso" tooltip="Define o nível de acesso no sistema: aluno, colaborador ou administrador." required>
          <div className="flex gap-2">
            {(["aluno", "colaborador", "adm"] as UserRole[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePermissionChange(p)}
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

        {/* Área: só exibe se for aluno */}
        {isAluno && (
          <Campo label="Área" tooltip="Curso ou área do usuário dentro da instituição." erro={erros.area} required>
            <SelectCad
              id="area"
              label=""
              placeholder="Selecione a área"
              options={CURSOS.filter((curso) => curso !== "Todos")}
              Icon={BookOpen}
              erro={!!erros.area}
              value={form.area}
              onChange={(value) => set("area", value)}
            />
          </Campo>
        )}

        {isEdicao && (
          <Campo label="Status" tooltip="Usuário ativo pode acessar o sistema. Inativo fica bloqueado." required>
            <div className="flex gap-2">
              {(["ativo", "inativo"] as StatusUsuario[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    set("status", s);
                    set("ativo", s === "ativo");
                  }}
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