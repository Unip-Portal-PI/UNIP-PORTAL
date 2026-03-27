// app/auth/reset-senha/page.tsx
"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { AtSign, Lock, CheckCircle } from "lucide-react";
import { InputCad } from "@/app/components/inputCad";
import { Auth } from "@/src/service/auth.service";

type Etapa = "email" | "codigo" | "nova-senha" | "sucesso";

function Logos({ mounted, isDark }: { mounted: boolean; isDark: boolean }) {
  const avpLogo = !mounted
    ? "/img/logo_avp.png"
    : isDark
      ? "/img/logo_avp_dark.png"
      : "/img/logo_avp.png";

  const unipLogo = !mounted
    ? "/img/logo_unip.png"
    : isDark
      ? "/img/logo_unip_dark.png"
      : "/img/logo_unip.png";

  return (
    <div className="flex items-center justify-center gap-4 mb-6">
      <Image
        src={avpLogo}
        alt="AVP Conecta"
        width={100}
        height={60}
        className="object-contain"
        priority
      />
      <div className="w-6" />
      <Image
        src={unipLogo}
        alt="UNIP"
        width={100}
        height={60}
        className="object-contain"
        priority
      />
    </div>
  );
}

function ResetSenhaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [etapa, setEtapa] = useState<Etapa>("email");
  const [matricula, setMatricula] = useState("");
  const [email, setEmail] = useState("");
  const [emailPreview, setEmailPreview] = useState("");
  const [codigo, setCodigo] = useState(["", "", "", "", "", ""]);
  const [erroSenha, setErroSenha] = useState("");
  const [erroFluxo, setErroFluxo] = useState("");
  const [tokenRedefinicao, setTokenRedefinicao] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (etapa === "codigo") {
      inputsRef.current[0]?.focus();
    }
  }, [etapa]);

  function handleOtpChange(value: string, index: number) {
    const onlyDigits = value.replace(/\D/g, "");

    if (!onlyDigits) {
      const novo = [...codigo];
      novo[index] = "";
      setCodigo(novo);
      return;
    }

    if (onlyDigits.length > 1) {
      const chars = onlyDigits.slice(0, 6).split("");
      const novo = ["", "", "", "", "", ""];

      for (let i = 0; i < 6; i++) {
        novo[i] = chars[i] ?? "";
      }

      setCodigo(novo);

      const focusIndex = Math.min(chars.length, 6) - 1;
      if (focusIndex >= 0) {
        inputsRef.current[focusIndex]?.focus();
      }
      return;
    }

    const novo = [...codigo];
    novo[index] = onlyDigits;
    setCodigo(novo);

    if (index < codigo.length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();

    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);

    if (!pasted) return;

    const chars = pasted.split("");
    const novo = ["", "", "", "", "", ""];

    for (let i = 0; i < 6; i++) {
      novo[i] = chars[i] ?? "";
    }

    setCodigo(novo);

    const focusIndex = Math.min(pasted.length, 6) - 1;
    if (focusIndex >= 0) {
      inputsRef.current[focusIndex]?.focus();
    }
  }

  function handleOtpKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === "Backspace") {
      if (codigo[index]) {
        const novo = [...codigo];
        novo[index] = "";
        setCodigo(novo);
        return;
      }

      if (index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    }
  }

  function isEmailFormatoValido(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  async function carregarPreviewUsuario(matriculaValor: string) {
    const matriculaNormalizada = matriculaValor.trim();

    if (!matriculaNormalizada) return;

    setLoading(true);
    setErroFluxo("");

    const resultado = await Auth.previewPasswordReset(matriculaNormalizada);

    setLoading(false);

    if (!resultado.sucesso || !resultado.emailPreview) {
      setEmailPreview("");
      setErroFluxo(resultado.mensagem || "Usuario nao encontrado para a matricula informada.");
      return;
    }

    setMatricula(resultado.matricula ?? matriculaNormalizada);
    setEmailPreview(resultado.emailPreview);
  }

  useEffect(() => {
    const matriculaFromQuery = searchParams.get("matricula")?.trim() ?? "";
    const chosen = matriculaFromQuery;

    if (chosen) {
      setMatricula(chosen);
      void carregarPreviewUsuario(chosen);
    } else {
      setErroFluxo("Informe sua matricula na tela de login antes de recuperar a senha.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleEnviarEmail(emailDestino: string) {
    const normalized = emailDestino.trim().toLowerCase();

    if (!normalized) {
      setErroFluxo("Informe o e-mail antes de enviar.");
      return;
    }

    if (!isEmailFormatoValido(normalized)) {
      setErroFluxo("Informe um e-mail valido.");
      return;
    }

    if (!matricula || !emailPreview) {
      setErroFluxo("Nao foi possivel identificar a matricula. Volte ao login e tente novamente.");
      return;
    }

    setLoading(true);
    setErroFluxo("");

    const resultado = await Auth.requestPasswordReset(matricula, normalized);

    setLoading(false);

    if (!resultado.sucesso) {
      setErroFluxo(
        resultado.mensagem === "Nao foi possivel enviar o e-mail de recuperacao. Verifique as credenciais do provedor."
          ? "No momento nao foi possivel enviar o e-mail de recuperacao. Tente novamente em instantes ou contate o suporte."
          : resultado.mensagem
      );
      return;
    }

    setEmail(normalized);
    setEtapa("codigo");
  }

  async function handleConfirmarCodigo() {
    const codigoCompleto = codigo.join("");

    if (!codigoCompleto) {
      setErroFluxo("Informe o codigo recebido no e-mail.");
      return;
    }

    if (codigoCompleto.length !== 6) {
      setErroFluxo("O codigo deve ter 6 digitos.");
      return;
    }

    setLoading(true);
    setErroFluxo("");

    const resultado = await Auth.validateResetCode(email, codigoCompleto);

    setLoading(false);

    if (!resultado.sucesso || !resultado.tokenRedefinicao) {
      setErroFluxo(resultado.mensagem || "Codigo invalido.");
      return;
    }

    setTokenRedefinicao(resultado.tokenRedefinicao);
    setEtapa("nova-senha");
  }

  async function handleRedefinirSenha() {
    const novaSenha = (document.getElementById("nova-senha") as HTMLInputElement).value;
    const confirmarSenha = (document.getElementById("confirmar-senha") as HTMLInputElement).value;

    if (!novaSenha || !confirmarSenha) {
      setErroSenha("Preencha os dois campos de senha.");
      return;
    }

    if (novaSenha.length < 6) {
      setErroSenha("A senha deve ter ao menos 6 caracteres.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErroSenha("As senhas nao coincidem.");
      return;
    }

    setLoading(true);
    setErroSenha("");

    const resultado = await Auth.resetPassword(tokenRedefinicao, novaSenha);

    setLoading(false);

    if (!resultado.sucesso) {
      setErroSenha(resultado.mensagem || "Nao foi possivel redefinir a senha.");
      return;
    }

    setEtapa("sucesso");
  }

  return (
    <main className="min-h-screen bg-white dark:bg-[#303030] flex flex-col items-center justify-between p-4 transition-colors">
      <div className="flex-1 flex items-center justify-center w-full">
        <div className="w-full md:min-w-[400px] md:max-w-[500px] rounded-2xl p-8 flex flex-col">
          {etapa === "email" && (
            <>
              <Logos mounted={mounted} isDark={isDark} />

              <div className="flex flex-col items-center mb-6 gap-2">
                <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-full">
                  <Lock className="w-8 h-8 text-slate-600 dark:text-slate-300" />
                </div>

                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Recuperação de senha
                </h2>

                <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                  Informe o e-mail completo da conta para a matricula{" "}
                  <strong>{matricula || "-"}</strong>.
                </p>
              </div>

              <div className="mb-4">
                <InputCad
                  id="email"
                  label="E-mail"
                  type="email"
                  placeholder="Digite seu e-mail"
                  Icon={AtSign}
                />
              </div>

              {emailPreview && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-3 text-center">
                  E-mail cadastrado para esta matricula: <strong>{emailPreview}</strong>
                </p>
              )}

              <button
                onClick={() => {
                  const val = (document.getElementById("email") as HTMLInputElement).value;
                  handleEnviarEmail(val);
                }}
                disabled={loading || !matricula || !emailPreview}
                className="bg-[#0f0f1e] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer dark:bg-white dark:text-slate-900 text-white font-bold py-3 rounded-md hover:bg-slate-800 dark:hover:bg-slate-100 transition-all text-lg"
              >
                {loading ? "Enviando..." : "Enviar"}
              </button>

              {erroFluxo && <p className="text-sm text-red-500 mt-3">{erroFluxo}</p>}

              <p className="text-center text-sm mt-6">
                <Link
                  href="/auth/login"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Voltar ao login
                </Link>
              </p>
            </>
          )}

          {etapa === "codigo" && (
            <>
              <Logos mounted={mounted} isDark={isDark} />

              <div className="flex flex-col items-center mb-6 gap-2">
                <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-full">
                  <Lock className="w-8 h-8 text-slate-600 dark:text-slate-300" />
                </div>

                <h2 className="text-xl font-bold text-slate-900 dark:text-white text-center">
                  Informe o código enviado para seu e-mail
                </h2>

                <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                  Enviamos um código para{" "}
                  <strong className="dark:text-slate-200">{email}</strong>
                </p>
              </div>

              <div className="flex justify-center gap-3 mb-6">
                {codigo.map((val, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      inputsRef.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={val}
                    onChange={(e) => handleOtpChange(e.target.value, i)}
                    onPaste={handleOtpPaste}
                    onKeyDown={(e) => handleOtpKeyDown(e, i)}
                    className="w-12 h-12 text-center text-xl font-bold border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-md outline-none focus:border-[#0f0f1e] dark:focus:border-white transition-colors"
                  />
                ))}
              </div>

              <button
                onClick={handleConfirmarCodigo}
                disabled={loading}
                className="bg-[#0f0f1e] cursor-pointer dark:bg-white dark:text-slate-900 text-white font-bold py-3 rounded-md hover:bg-slate-800 dark:hover:bg-slate-100 transition-all text-lg"
              >
                {loading ? "Validando..." : "Confirmar"}
              </button>

              {erroFluxo && <p className="text-sm text-red-500 mt-3">{erroFluxo}</p>}

              <p className="text-center text-sm mt-6">
                <button
                  onClick={() => setEtapa("email")}
                  className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Voltar
                </button>
              </p>
            </>
          )}

          {etapa === "nova-senha" && (
            <>
              <Logos mounted={mounted} isDark={isDark} />

              <div className="flex flex-col items-center mb-6 gap-2">
                <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-full">
                  <Lock className="w-8 h-8 text-slate-600 dark:text-slate-300" />
                </div>

                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Crie uma nova senha
                </h2>
              </div>

              <div className="flex flex-col gap-4 mb-4">
                <InputCad
                  id="nova-senha"
                  label="Nova senha"
                  type="password"
                  placeholder="Digite a nova senha"
                  Icon={Lock}
                />

                <InputCad
                  id="confirmar-senha"
                  label="Confirmar nova senha"
                  type="password"
                  placeholder="Repita a nova senha"
                  Icon={Lock}
                />
              </div>

              <button
                onClick={handleRedefinirSenha}
                disabled={loading}
                className="bg-[#0f0f1e] cursor-pointer dark:bg-white dark:text-slate-900 text-white font-bold py-3 rounded-md hover:bg-slate-800 dark:hover:bg-slate-100 transition-all text-lg"
              >
                {loading ? "Redefinindo..." : "Redefinir senha"}
              </button>

              {erroSenha && <p className="text-sm text-red-500 mt-3">{erroSenha}</p>}
            </>
          )}

          {etapa === "sucesso" && (
            <>
              <Logos mounted={mounted} isDark={isDark} />

              <div className="flex flex-col items-center text-center gap-3">
                <div className="bg-emerald-100 dark:bg-emerald-900/40 p-4 rounded-full">
                  <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                </div>

                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Senha redefinida com sucesso
                </h2>

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Agora você já pode entrar novamente com sua nova senha.
                </p>

                <button
                  onClick={() => router.push("/auth/login")}
                  className="mt-4 bg-[#0f0f1e] cursor-pointer dark:bg-white dark:text-slate-900 text-white font-bold py-3 px-6 rounded-md hover:bg-slate-800 dark:hover:bg-slate-100 transition-all text-lg"
                >
                  Ir para o login
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <footer className="w-full text-xs text-slate-500 dark:text-white text-center py-4">
        AVP Conecta © {new Date().getFullYear()} – Todos os direitos reservados.
      </footer>
    </main>
  );
}

export default function ResetSenhaPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-white dark:bg-[#303030] flex items-center justify-center">
          <p className="text-slate-600 dark:text-slate-300">Carregando...</p>
        </main>
      }
    >
      <ResetSenhaContent />
    </Suspense>
  );
}