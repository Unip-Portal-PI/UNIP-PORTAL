// app/home/perfil/page.tsx
"use client";

import { useEffect, useState } from "react";
import { IconUser, IconHistory, IconAlertCircle } from "@tabler/icons-react";
import { Usuario, UserRole } from "@/src/types/user";
import { Auth } from "@/src/service/auth.service";
import { PerfilService } from "@/src/service/perfil.service";
import { AbaDadosPessoais } from "@/app/components/perfil/AbaDadosPessoais";
import { AbaHistoricoAluno } from "@/app/components/perfil/AbaHistoricoAluno";
import { AbaHistoricoColaborador } from "@/app/components/perfil/AbaHistoricoColaborador";

type Aba = "dados" | "historico";

export default function PerfilPage() {
  const sessao = Auth.getUser();
  const matricula = sessao?.matricula ?? "";
  const role = (sessao?.permission ?? "aluno") as UserRole;

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const [aba, setAba] = useState<Aba>("dados");

  async function carregar() {
    setLoading(true);
    setErro(false);
    try {
      const dados = await PerfilService.getDadosCompletos(matricula);
      if (!dados) { setErro(true); return; }
      setUsuario(dados);
    } catch {
      setErro(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregar(); }, [matricula]);

  const foto = PerfilService.getFoto(matricula);
  const inicial = usuario?.nome?.charAt(0).toUpperCase() ?? sessao?.apelido?.charAt(0).toUpperCase() ?? "U";

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-pulse">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-[#2a2a2a]" />
          <div className="space-y-2">
            <div className="h-5 bg-slate-200 dark:bg-[#2a2a2a] rounded w-40" />
            <div className="h-3 bg-slate-200 dark:bg-[#2a2a2a] rounded w-24" />
          </div>
        </div>
        <div className="h-10 bg-slate-200 dark:bg-[#2a2a2a] rounded-xl w-64 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-slate-200 dark:bg-[#2a2a2a] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (erro || !usuario) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <IconAlertCircle size={28} className="text-red-500" />
          </div>
          <p className="text-slate-600 dark:text-slate-300 font-medium">Erro ao carregar perfil.</p>
          <button onClick={carregar} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const ROLE_LABEL: Record<UserRole, string> = {
    aluno: "Aluno",
    colaborador: "Colaborador",
    adm: "Administrador",
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

      {/* Hero */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-[#FFDE00]/20 dark:bg-[#FFDE00]/10 border-2 border-[#FFDE00]/40 flex items-center justify-center overflow-hidden shrink-0">
          {foto ? (
            <img src={foto} alt="Foto" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-black text-amber-700 dark:text-[#FFDE00]">{inicial}</span>
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{usuario.nome}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">@{usuario.apelido}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-xs font-semibold text-amber-700 dark:text-[#FFDE00] bg-[#FFDE00]/15 dark:bg-[#FFDE00]/10 px-2 py-0.5 rounded-full">
              {ROLE_LABEL[role]}
            </span>
            <span className="text-xs text-slate-400 font-mono">{matricula}</span>
          </div>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-[#1a1a1a] rounded-xl mb-6 w-fit">
        <button
          onClick={() => setAba("dados")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            aba === "dados"
              ? "bg-white dark:bg-[#202020] text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          }`}
        >
          <IconUser size={15} /> Dados pessoais
        </button>
        <button
          onClick={() => setAba("historico")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            aba === "historico"
              ? "bg-white dark:bg-[#202020] text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          }`}
        >
          <IconHistory size={15} /> Histórico
        </button>
      </div>

      {/* Conteúdo */}
      {aba === "dados" && (
        <AbaDadosPessoais usuario={usuario} matricula={matricula} onAtualizado={carregar} />
      )}
      {aba === "historico" && role === "aluno" && (
        <AbaHistoricoAluno matricula={matricula} />
      )}
      {aba === "historico" && (role === "colaborador" || role === "adm") && (
        <AbaHistoricoColaborador matricula={matricula} />
      )}
    </div>
  );
}
