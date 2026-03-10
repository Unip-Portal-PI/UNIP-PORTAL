// app/auth/cadastro/page.tsx
import { InputCad } from "@/app/components/input_cad"; // Importe o componente InputCad
import { User, AtSign, Lock, Hash } from "lucide-react"; // Ícones de exemplo
import Link from "next/link";

export default function Cadastro() {
  return (
    <main className="min-h-screen bg-slate-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl flex w-full max-w-4xl overflow-hidden">
        
        {/* Lado Esquerdo: Formulário */}
        <div className="w-full md:w-1/2 p-8 lg:p-12">
          <div className="flex flex-col items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Crie sua conta</h2>
          </div>

          <form className="flex flex-col gap-4">
            <InputCad 
              id="nome" label="Nome completo" type="text" 
              placeholder="Digite seu nome" Icon={User} 
            />
            <InputCad 
              id="apelido" label="Apelido" type="text" 
              placeholder="Digite seu apelido" Icon={User} 
            />
            <InputCad 
              id="matricula" label="Matrícula" type="text" 
              placeholder="Digite o número da matrícula" Icon={Hash} 
            />
            <InputCad 
              id="email" label="E-mail" type="email" 
              placeholder="Digite seu e-mail" Icon={AtSign} 
            />
            <InputCad 
              id="senha" label="Senha" type="password" 
              placeholder="Digite sua senha" Icon={Lock} 
            />
            <InputCad 
              id="confirmar" label="Confirmar senha" type="password" 
              placeholder="Digite novamente a senha" Icon={Lock} 
            />

            <button className="bg-[#0f0f1e] text-white font-bold py-3 rounded-md mt-4 hover:bg-slate-800 transition-all">
              Cadastrar
            </button>
          </form>

          <p className="text-center text-sm mt-6">
            Já tem um cadastro? <Link href="/auth/login" className="text-blue-600 hover:underline">Login</Link>
          </p>
        </div>

        {/* Lado Direito: Banner Boas-vindas */}
        <div className="hidden md:flex w-1/2 bg-slate-100 flex-col items-center justify-center p-12 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Bem-vindo ao portal!</h1>
          <p className="text-slate-600 leading-relaxed">
            Acesse comunicados, calendário acadêmico e informações do seu campus em um único lugar.
          </p>
        </div>
        
      </div>
    </main>
  );
}

