// app/auth/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { InputCad } from "@/app/components/inputCad";
import { Hash, Lock } from "lucide-react";
import { Auth } from "@/src/service/auth.service";
import PublicGuard from "@/src/guard/PublicGuard";
import { useLoading } from "@/app/components/LoadingContext";

export default function Login() {
  const router = useRouter();
  const { showLoading } = useLoading();
  const [erro, setErro] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erroRecuperacao, setErroRecuperacao] = useState("");
  const [lembrar, setLembrar] = useState(false);
  const [matriculaInicial, setMatriculaInicial] = useState("");
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    const salva = localStorage.getItem("matricula_lembrar");
    if (salva) {
      setMatriculaInicial(salva);
      setLembrar(true);
    }
  }, []);

  async function handleLogin() {
    if (isSubmitting) return;

    const matricula = (document.getElementById("matricula") as HTMLInputElement).value;
    const senha = (document.getElementById("senha") as HTMLInputElement).value;
    setErroRecuperacao("");
    setIsSubmitting(true);

    try {
      if (lembrar) {
        localStorage.setItem("matricula_lembrar", matricula);
      } else {
        localStorage.removeItem("matricula_lembrar");
      }

      const resultado = await Auth.login(matricula, senha);
      if (resultado.sucesso) {
        setErro(false);
        showLoading();
        router.push("/home/eventos");
      } else {
        setErro(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleIrParaRecuperacaoSenha() {
    const matriculaAtual =
      (document.getElementById("matricula") as HTMLInputElement | null)?.value?.trim() ?? "";

    if (!matriculaAtual) {
      setErroRecuperacao("Informe sua matricula para recuperar a senha.");
      return;
    }

    setErroRecuperacao("");
    router.push(`/auth/reset-senha?matricula=${encodeURIComponent(matriculaAtual)}`);
  }

  return (
    <PublicGuard>
      <main className="min-h-screen bg-white dark:bg-[#303030] flex flex-col items-center justify-between p-4 transition-colors">
        <div className="flex-1 flex items-center justify-center w-full">
          <div className="w-full md:min-w-[400px] md:max-w-[500px] rounded-2xl p-8 flex flex-col">

            {/* Logos */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <Image src={isDark ? "/img/smn-avp.png" : "/img/banner_semana_academica_ligth.png"} alt="AVP Conecta" width={420} height={260} className="object-contain" />
              {/* <div className="w-10" /> */}
              {/* <Image src={isDark ? "/img/logo_unip_dark.png" : "/img/logo_unip.png"} alt="UNIP" width={130} height={80} className="object-contain" /> */}
            </div>

            {/* <h2 className="text-2xl font-bold text-[#202020] dark:text-white text-center mb-6">Login</h2> */}

            {/* ✅ form com onSubmit — essencial para o browser oferecer salvar credenciais */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
              className="flex flex-col gap-4"
            >
              <InputCad
                id="matricula"
                label="Matrícula"
                type="text"
                placeholder="Digite sua matrícula"
                Icon={Hash}
                erro={erro}
                defaultValue={matriculaInicial}
                autoComplete="username"
              />

              <div className="flex flex-col gap-1">
                <InputCad
                  id="senha"
                  label="Senha"
                  type="password"
                  placeholder="Digite sua senha"
                  Icon={Lock}
                  erro={erro}
                  autoComplete="current-password"
                />

                <div className="flex items-center justify-between mt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={lembrar}
                      onChange={(e) => setLembrar(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 dark:border-[#505050] accent-[#0f0f1e] dark:accent-yellow-400 cursor-pointer"
                    />
                    <span className="text-xm text-slate-600 dark:text-slate-400">Lembre de mim</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleIrParaRecuperacaoSenha}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Esqueceu sua senha?
                  </button>
                </div>

                {erroRecuperacao && (
                  <span className="text-xs text-red-500 mt-1">{erroRecuperacao}</span>
                )}

                {erro && (
                  <span className="text-xs text-red-500 mt-1">
                    Matrícula ou senha inválidos
                  </span>
                )}
              </div>

              {/* ✅ type="submit" para o browser reconhecer o fluxo de login */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#0f0f1e] cursor-pointer dark:bg-yellow-400 dark:text-[#202020] text-white font-bold py-3 rounded-md mt-2 hover:bg-slate-800 dark:hover:bg-yellow-300 transition-all text-lg"
              >
                {isSubmitting ? "Entrando..." : "Entrar"}
              </button>
            </form>

            <p className="text-center text-sm mt-6 text-slate-600 dark:text-slate-400">
              Não possui acesso?{" "}
              <Link href="/auth/cadastro" className="text-blue-600 dark:text-blue-400 hover:underline">
                Criar conta
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
