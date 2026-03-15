// app/auth/cadastro/page.tsx
"use client"; 

import { useRouter } from "next/navigation";
import { InputCad } from "@/app/components/input_cad";
import { User, AtSign, Lock, Hash, UserRound } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import PublicGuard from "@/app/components/PublicGuard";

export default function Cadastro() {
  const router = useRouter();

  return (
    <PublicGuard>
      <main className="min-h-screen bg-white flex flex-col items-center justify-between p-4">
        <div className="flex-1 flex items-center justify-center w-full">
          <div className="w-full md:min-w-[400px] md:max-w-[500px] rounded-2xl p-8 flex flex-col">

            <div className="flex items-center justify-center gap-4 mb-6">
              <Image src="/img/logo_avp.png" alt="AVP Conecta" width={130} height={80} className="object-contain" />
              <div className="w-14" />
              <Image src="/img/logo_unip.png" alt="UNIP" width={130} height={80} className="object-contain" />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 text-center mb-6">Cadastre-se</h2>

            <form className="flex flex-col gap-4">
              <InputCad id="nome" label="Nome completo" type="text" placeholder="Digite seu nome" Icon={User} />
              <InputCad id="matricula" label="Matrícula" type="text" placeholder="Digite sua matrícula" Icon={Hash} />
              <InputCad id="email" label="E-mail" type="email" placeholder="Digite seu e-mail" Icon={AtSign} />
              <InputCad id="senha" label="Senha" type="password" placeholder="Digite sua senha" Icon={Lock} />
              <InputCad id="confirmar" label="Confirmar senha" type="password" placeholder="Digite novamente a senha" Icon={Lock} />

              <button
                type="button"
                onClick={() => router.push("/auth/login")}
                className="bg-[#0f0f1e] text-white font-bold py-3 rounded-md mt-2 hover:bg-slate-800 transition-all text-lg"
              >
                Cadastrar
              </button>
            </form>

            <p className="text-center text-sm mt-6">
              Já tem um cadastro?{" "}
              <Link href="/auth/login" className="text-blue-600 hover:underline">Login</Link>
            </p>
          </div>
        </div>

        <footer className="w-full text-xs text-slate-500 text-center py-4">
          AVP Conecta © {new Date().getFullYear()} – Todos os direitos reservados.
        </footer>
      </main>
    </PublicGuard>
  );
}
