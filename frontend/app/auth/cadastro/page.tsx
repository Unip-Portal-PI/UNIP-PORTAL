"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  InputCad,
  SelectCad,
  validateSenha,
  validateMatricula,
  validateTelefone,
  validateBlockedTermsField,
  validateEmail,
} from "@/app/components/inputCad";
import { User, AtSign, Lock, Hash, Phone, BookOpen, Calendar } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import PublicGuard from "@/src/guard/PublicGuard";
import { CURSOS } from "@/src/utils/cursos.helpers";
import { Auth } from "@/src/service/auth.service";

function RequiredLabel({ text }: { text: string }) {
  return (
    <>
      {text} <span className="text-red-500">*</span>
    </>
  );
}

export default function Cadastro() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  // Estados dos campos
  const [matricula, setMatricula] = useState("");
  const [nome, setNome] = useState("");
  const [nomeSocial, setNomeSocial] = useState("");
  const [telefone, setTelefone] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [area, setArea] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");

  const isDark = mounted && resolvedTheme === "dark";

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({
    matricula: "",
    nome: "",
    nome_social: "",
    telefone: "",
    area: "",
    email: "",
    senha: "",
    confirmar: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  function setFieldValidation(field: string, _isValid: boolean, message: string) {
    setFieldErrors((prev) => {
      if (prev[field] === message) return prev;

      return {
        ...prev,
        [field]: message,
      };
    });
  }

  function parseMensagemErro(value: unknown): string {
    if (typeof value === "string") return value;
    if (!value) return "Não foi possível concluir o cadastro.";

    if (Array.isArray(value)) {
      const textos = value.map((item) => parseMensagemErro(item)).filter(Boolean);
      return textos.join(" | ");
    }

    if (typeof value === "object") {
      const obj = value as Record<string, unknown>;

      if (typeof obj.msg === "string") return obj.msg;
      if (typeof obj.mensagem === "string") return obj.mensagem;
      if (typeof obj.detail === "string") return obj.detail;

      if (Array.isArray(obj.detail)) {
        return obj.detail.map((item) => parseMensagemErro(item)).filter(Boolean).join(" | ");
      }

      return "Não foi possível concluir o cadastro.";
    }

    return String(value);
  }

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault();

    const missingRequiredFields = !matricula || !nome || !nomeSocial || !area || !email || !senha;

    const nextErrors = {
      matricula: validateMatricula(matricula),
      nome: validateBlockedTermsField("O nome completo", nome),
      nome_social: validateBlockedTermsField("O nome social", nomeSocial),
      telefone: validateTelefone(telefone),
      area: area ? "" : "Selecione uma área.",
      email: validateEmail(email),
      senha: validateSenha(senha),
      confirmar: senha !== confirmar ? "As senhas não coincidem." : "",
    };

    setFieldErrors(nextErrors);

    if (missingRequiredFields) {
      setErro("Preencha os campos obrigatórios.");
      return;
    }

    if (Object.values(nextErrors).some(Boolean)) {
      setErro("Corrija os campos inválidos.");
      return;
    }

    setLoading(true);
    setErro("");

    const resultado = await Auth.register({
      matricula,
      nome,
      apelido: nomeSocial,
      telefone,
      dataNascimento,
      area,
      email,
      senha,
    });

    setLoading(false);

    if (!resultado.sucesso) {
      setErro(parseMensagemErro(resultado.mensagem));
      return;
    }

    localStorage.setItem("matricula_lembrar", matricula);
    router.push("/auth/login");
  }

  return (
    <PublicGuard>
      <main className="min-h-screen bg-white dark:bg-[#303030] flex flex-col items-center justify-between p-4 transition-colors">
        <div className="flex-1 flex items-center justify-center w-full">
          <div className="w-full md:min-w-[400px] md:max-w-[500px] rounded-2xl p-8 flex flex-col">
            <div className="flex items-center justify-center gap-4 mb-6">
              <Image
                src={isDark ? "/img/logo_avp_dark.png" : "/img/logo_avp.png"}
                alt="AVP Conecta"
                width={100}
                height={60}
                className="object-contain"
                priority
              />
              <div className="w-6" />
              <Image
                src={isDark ? "/img/logo_unip_dark.png" : "/img/logo_unip.png"}
                alt="UNIP"
                width={100}
                height={60}
                className="object-contain"
                priority
              />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-6">
              Cadastre-se
            </h2>

            <form onSubmit={handleCadastro} className="flex flex-col gap-4">
              <InputCad
                id="matricula"
                label={<RequiredLabel text="Matrícula" />}
                type="text"
                placeholder="Digite sua matrícula"
                Icon={Hash}
                autoComplete="username"
                defaultValue={matricula}
                validator={(value) => {
                  if (!value.trim()) return "";
                  return validateMatricula(value);
                }}
                onValidatedChange={(_isValid, message, value) => {
                  setFieldValidation("matricula", !_isValid, message);
                  setMatricula(value);
                }}
              />

              <InputCad
                id="nome"
                label={<RequiredLabel text="Nome completo" />}
                type="text"
                placeholder="Digite seu nome completo"
                Icon={User}
                autoComplete="name"
                defaultValue={nome}
                validator={(value) => {
                  if (!value.trim()) return "";
                  return validateBlockedTermsField("O nome completo", value);
                }}
                onValidatedChange={(_isValid, message, value) => {
                  setFieldValidation("nome", !_isValid, message);
                  setNome(value);
                }}
              />

              <InputCad
                id="nome_social"
                label={<RequiredLabel text="Nome social" />}
                type="text"
                placeholder="Como prefere ser chamado(a)"
                Icon={User}
                autoComplete="nickname"
                defaultValue={nomeSocial}
                validator={(value) => {
                  if (!value.trim()) return "";
                  return validateBlockedTermsField("O nome social", value);
                }}
                onValidatedChange={(_isValid, message, value) => {
                  setFieldValidation("nome_social", !_isValid, message);
                  setNomeSocial(value);
                }}
              />

              <InputCad
                id="telefone"
                label="Telefone"
                type="tel"
                placeholder="(00) 00000-0000"
                Icon={Phone}
                autoComplete="tel"
                defaultValue={telefone}
                validator={(value) => {
                  if (!value.trim()) return "";
                  return validateTelefone(value);
                }}
                onValidatedChange={(_isValid, message, value) => {
                  setFieldValidation("telefone", !_isValid, message);
                  setTelefone(value);
                }}
              />

              <div className="flex flex-col gap-1 w-full">
                <label htmlFor="data_nasc" className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  Data de Nascimento
                </label>
                <div className="relative flex items-center">
                  <Calendar className="absolute left-3 text-[#4D4D4D] dark:text-slate-400 w-4 h-4" />
                  <input
                    id="data_nasc"
                    type="date"
                    className="w-full border border-slate-300 dark:border-[#505050] bg-blue-100 dark:bg-[#424242] rounded-md p-2 pl-9 text-sm outline-none focus:border-blue-500 dark:focus:border-blue-400 text-[#4D4D4D] dark:text-slate-200"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                  />
                </div>
              </div>

              <SelectCad
                id="area"
                label={<RequiredLabel text="Área" />}
                placeholder="Selecione sua Área"
                options={CURSOS.filter((curso) => curso !== "Todos")}
                Icon={BookOpen}
                value={area}
                onChange={setArea}
                erro={!!fieldErrors.area}
              />
              {fieldErrors.area && <span className="text-xs text-red-500">{fieldErrors.area}</span>}

              <InputCad
                id="email"
                label={<RequiredLabel text="E-mail" />}
                type="email"
                placeholder="Digite seu e-mail"
                Icon={AtSign}
                autoComplete="email"
                defaultValue={email}
                validator={(value) => {
                  if (!value.trim()) return "";
                  return validateEmail(value);
                }}
                onValidatedChange={(_isValid, message, value) => {
                  setFieldValidation("email", !_isValid, message);
                  setEmail(value);
                }}
              />

              <InputCad
                id="senha"
                label={<RequiredLabel text="Senha" />}
                type="password"
                placeholder="Digite sua senha"
                Icon={Lock}
                autoComplete="new-password"
                defaultValue={senha}
                validator={(value) => {
                  if (!value.trim()) return "";
                  return validateSenha(value);
                }}
                onValidatedChange={(_isValid, message, value) => {
                  setFieldValidation("senha", !_isValid, message);
                  setSenha(value);
                }}
              />

              <InputCad
                id="confirmar"
                label="Confirmar senha"
                type="password"
                placeholder="Repita sua senha"
                Icon={Lock}
                defaultValue={confirmar}
                onValidatedChange={(_isValid, _message, value) => setConfirmar(value)}
              />

              {erro && <p className="text-sm text-red-500">{erro}</p>}

              <button
                type="submit"
                disabled={loading}
                className="bg-[#0f0f1e] cursor-pointer dark:bg-white dark:text-slate-900 text-white font-bold py-3 rounded-md mt-2 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Cadastrando..." : "Cadastrar"}
              </button>
            </form>

            <p className="text-center text-sm mt-6 text-slate-600 dark:text-slate-400">
              Já tem um cadastro?{" "}
              <Link href="/auth/login" className="text-blue-600 dark:text-blue-400 hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>

        <footer className="w-full text-xs text-slate-500 dark:text-white text-center py-4">
          AVP Conecta © {new Date().getFullYear()} – Todos os direitos reservados.
        </footer>
      </main>
    </PublicGuard>
  );
}