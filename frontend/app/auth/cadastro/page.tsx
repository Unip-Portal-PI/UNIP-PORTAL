// app/auth/cadastro/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InputCad, SelectCad } from "@/app/components/inputCad";
import { User, AtSign, Lock, Hash, Phone, BookOpen, Calendar } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import PublicGuard from "@/src/guard/PublicGuard";
import { CURSOS } from "@/src/utils/cursos.helpers";
import { Auth } from "@/src/service/auth.service";

export default function Cadastro() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault();

    const matricula = (document.getElementById("matricula") as HTMLInputElement).value;
    const nome = (document.getElementById("nome") as HTMLInputElement).value;
    const apelido = (document.getElementById("apelido") as HTMLInputElement).value;
    const telefone = (document.getElementById("telefone") as HTMLInputElement).value;
    const dataNascimento = (document.getElementById("data_nasc") as HTMLInputElement).value;
    const area = (document.getElementById("area") as HTMLSelectElement).value;
    const email = (document.getElementById("email") as HTMLInputElement).value;
    const senha = (document.getElementById("senha") as HTMLInputElement).value;
    const confirmar = (document.getElementById("confirmar") as HTMLInputElement).value;

    if (senha !== confirmar) {
      setErro("As senhas nao coincidem.");
      return;
    }

    setLoading(true);
    setErro("");
    const resultado = await Auth.register({
      matricula,
      nome,
      apelido,
      telefone,
      dataNascimento,
      area,
      email,
      senha,
    });
    setLoading(false);

    if (!resultado.sucesso) {
      setErro(resultado.mensagem);
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
              />
              <div className="w-6" />
              <Image
                src={isDark ? "/img/logo_unip_dark.png" : "/img/logo_unip.png"}
                alt="UNIP"
                width={100}
                height={60}
                className="object-contain"
              />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-6">
              Cadastre-se
            </h2>

            {/* ✅ form com onSubmit para o browser oferecer salvar credenciais */}
            <form onSubmit={handleCadastro} className="flex flex-col gap-4">
              <InputCad id="matricula" label="Matrícula" type="text" placeholder="Digite sua matrícula" Icon={Hash} autoComplete="username" />
              <InputCad id="nome" label="Nome completo" type="text" placeholder="Digite seu nome completo" Icon={User} autoComplete="name" />
              <InputCad id="apelido" label="Apelido" type="text" placeholder="Como prefere ser chamado(a)" Icon={User} autoComplete="nickname" />
              <InputCad id="telefone" label="Telefone" type="tel" placeholder="(00) 00000-0000" Icon={Phone} autoComplete="tel" />
              <InputCad id="data_nasc" label="Data de Nascimento" type="date" placeholder="" Icon={Calendar} autoComplete="bday" />
              <SelectCad id="area" label="Área" placeholder="Selecione sua Área" options={CURSOS.filter((curso) => curso !== "Todos")} Icon={BookOpen} />
              <InputCad id="email" label="E-mail" type="email" placeholder="Digite seu e-mail" Icon={AtSign} autoComplete="email" />
              <InputCad id="senha" label="Senha" type="password" placeholder="Digite sua senha" Icon={Lock} autoComplete="new-password" />
              <InputCad id="confirmar" label="Confirmar senha" type="password" placeholder="Repita sua senha" Icon={Lock} autoComplete="new-password" />

              {erro && <p className="text-sm text-red-500">{erro}</p>}
              <button
                type="submit"
                disabled={loading}
                className="bg-[#0f0f1e] cursor-pointer dark:bg-white dark:text-slate-900 text-white font-bold py-3 rounded-md mt-2 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all text-lg"
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
