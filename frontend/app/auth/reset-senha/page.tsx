// app/auth/reset-senha/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { AtSign, Lock, CheckCircle } from "lucide-react";
import { InputCad } from "@/app/components/inputCad";

type Etapa = "email" | "codigo" | "nova-senha" | "sucesso";

export default function ResetSenha() {
  const router = useRouter();
  const [etapa, setEtapa] = useState<Etapa>("email");
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState(["", "", "", "", ""]);
  const [erroSenha, setErroSenha] = useState("");
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (etapa === "codigo") {
      inputsRef.current[0]?.focus();
    }
  }, [etapa]);

  function handleOtpChange(value: string, index: number) {
    if (!/^\d*$/.test(value)) return;
    const novo = [...codigo];
    novo[index] = value.slice(-1);
    setCodigo(novo);
    if (value && index < 4) inputsRef.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key === "Backspace" && !codigo[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handleEnviarEmail() {
    if (!email) return;
    setEtapa("codigo");
  }

  function handleConfirmarCodigo() {
    if (codigo.join("").length === 5) {
      setEtapa("nova-senha");
    }
  }

  function handleRedefinirSenha() {
    const novaSenha = (document.getElementById("nova-senha") as HTMLInputElement).value;
    const confirmSenha = (document.getElementById("confirm-senha") as HTMLInputElement).value;

    if (!novaSenha || novaSenha !== confirmSenha) {
      setErroSenha("As senhas não coincidem");
      return;
    }
    if (novaSenha.length < 4) {
      setErroSenha("A senha deve ter pelo menos 4 caracteres");
      return;
    }
    setErroSenha("");
    setEtapa("sucesso");
  }

  const Logos = () => (
    <div className="flex items-center justify-center gap-4 mb-6">
      <Image src={isDark ? "/img/logo_avp_dark.png" : "/img/logo_avp.png"} alt="AVP Conecta" width={100} height={60} className="object-contain" />
      <div className="w-6" />
      <Image src={isDark ? "/img/logo_unip_dark.png" : "/img/logo_unip.png"} alt="UNIP" width={100} height={60} className="object-contain" />
    </div>
  );

  return (
    <main className="min-h-screen bg-white dark:bg-[#303030] flex flex-col items-center justify-between p-4 transition-colors">
      <div className="flex-1 flex items-center justify-center w-full">
        <div className="w-full md:min-w-[400px] md:max-w-[460px] rounded-2xl p-8 flex flex-col">

          {/* ── ETAPA 1: E-mail ── */}
          {etapa === "email" && (
            <>
              <Logos />
              <div className="flex flex-col items-center mb-6 gap-2">
                <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-full">
                  <Lock className="w-8 h-8 text-slate-600 dark:text-slate-300" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Recuperação de senha</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                  Informe o e-mail cadastrado, enviaremos um código de recuperação.
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

              <button
                onClick={() => {
                  const val = (document.getElementById("email") as HTMLInputElement).value;
                  setEmail(val);
                  handleEnviarEmail();
                }}
                className="bg-[#0f0f1e] dark:bg-white dark:text-slate-900 text-white font-bold py-3 rounded-md hover:bg-slate-800 dark:hover:bg-slate-100 transition-all text-lg"
              >
                Enviar
              </button>

              <p className="text-center text-sm mt-6">
                <Link href="/auth/login" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Voltar ao login
                </Link>
              </p>
            </>
          )}

          {/* ── ETAPA 2: Código OTP ── */}
          {etapa === "codigo" && (
            <>
              <Logos />
              <div className="flex flex-col items-center mb-6 gap-2">
                <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-full">
                  <Lock className="w-8 h-8 text-slate-600 dark:text-slate-300" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white text-center">
                  Informe o código enviado para seu e-mail
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                  Enviamos um código para <strong className="dark:text-slate-200">{email}</strong>
                </p>
              </div>

              <div className="flex justify-center gap-3 mb-6">
                {codigo.map((val, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputsRef.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={val}
                    onChange={(e) => handleOtpChange(e.target.value, i)}
                    onKeyDown={(e) => handleOtpKeyDown(e, i)}
                    className="w-12 h-12 text-center text-xl font-bold border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg outline-none focus:border-[#0f0f1e] dark:focus:border-white transition-colors"
                  />
                ))}
              </div>

              <button
                onClick={handleConfirmarCodigo}
                className="bg-[#0f0f1e] dark:bg-white dark:text-slate-900 text-white font-bold py-3 rounded-md hover:bg-slate-800 dark:hover:bg-slate-100 transition-all text-lg"
              >
                Confirmar
              </button>

              <p className="text-center text-sm mt-6">
                <button onClick={() => setEtapa("email")} className="text-blue-600 dark:text-blue-400 hover:underline">
                  Voltar
                </button>
              </p>
            </>
          )}

          {/* ── ETAPA 3: Nova senha ── */}
          {etapa === "nova-senha" && (
            <>
              <Logos />
              <div className="flex flex-col items-center mb-6 gap-2">
                <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-full">
                  <Lock className="w-8 h-8 text-slate-600 dark:text-slate-300" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Crie uma nova senha</h2>
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
                  id="confirm-senha"
                  label="Confirmar senha"
                  type="password"
                  placeholder="Confirme a nova senha"
                  Icon={Lock}
                />
                {erroSenha && (
                  <span className="text-xs text-red-500">{erroSenha}</span>
                )}
              </div>

              <button
                onClick={handleRedefinirSenha}
                className="bg-[#0f0f1e] dark:bg-white dark:text-slate-900 text-white font-bold py-3 rounded-md hover:bg-slate-800 dark:hover:bg-slate-100 transition-all text-lg"
              >
                Confirmar
              </button>
            </>
          )}

          {/* ── ETAPA 4: Sucesso ── */}
          {etapa === "sucesso" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="bg-green-100 dark:bg-green-900/40 p-5 rounded-full">
                <CheckCircle className="w-12 h-12 text-green-500 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Senha redefinida!</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                Sua senha foi redefinida com sucesso.
              </p>
              <button
                onClick={() => router.push("/auth/login")}
                className="w-full bg-[#0f0f1e] dark:bg-white dark:text-slate-900 text-white font-bold py-3 rounded-md mt-4 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all text-lg"
              >
                Ir para o login
              </button>
            </div>
          )}

        </div>
      </div>

      <footer className="w-full text-xs text-slate-500 dark:text-white text-center py-4">
        AVP Conecta © {new Date().getFullYear()} – Todos os direitos reservados.
      </footer>
    </main>
  );
}