// app/auth/login/page.tsx

"use client";

import { useState } from "react";
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
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  async function handleLogin() {
    const matricula = (document.getElementById("matricula") as HTMLInputElement).value;
    const senha = (document.getElementById("senha") as HTMLInputElement).value;
    const resultado = await Auth.login(matricula, senha);
    if (resultado.sucesso) {
      setErro(false);
      showLoading();
      router.push("/home");
    } else {
      setErro(true);
    }
  }

  return (
    <PublicGuard>
      <main className="min-h-screen bg-white dark:bg-[#303030] flex flex-col items-center justify-between p-4 transition-colors">
        <div className="flex-1 flex items-center justify-center w-full">
          <div className="w-full md:min-w-[400px] md:max-w-[500px] rounded-2xl p-8 flex flex-col">

            {/* Logos */}
            <div className="flex items-center justify-center gap-4 mb-2">
              <Image src={isDark ? "/img/logo_avp_dark.png" : "/img/logo_avp.png"} alt="AVP Conecta" width={130} height={80} className="object-contain" />
              <div className="w-10" />
              <Image src={isDark ? "/img/logo_unip_dark.png" : "/img/logo_unip.png"} alt="UNIP" width={130} height={80} className="object-contain" />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-6">Login</h2>

            <div className="flex flex-col gap-4">
              <InputCad
                id="matricula"
                label="Matrícula"
                type="text"
                placeholder="Digite sua matrícula"
                Icon={Hash}
                erro={erro}
              />

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="senha" className="font-bold text-sm text-slate-800 dark:text-slate-200">Senha</label>
                  <Link href="/auth/reset-senha" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                    Esqueceu sua senha?
                  </Link>
                </div>
                <InputCad
                  id="senha"
                  label=""
                  type="password"
                  placeholder="Digite sua senha"
                  Icon={Lock}
                  erro={erro}
                />
                {erro && (
                  <span className="text-xs text-red-500 mt-1">
                    Matrícula ou senha inválidos
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleLogin}
                className="bg-[#0f0f1e] dark:bg-yellow-400 dark:text-slate-900 text-white font-bold py-3 rounded-md mt-2 hover:bg-slate-800 dark:hover:bg-yellow-300 transition-all text-lg"
              >
                Entrar
              </button>
            </div>

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