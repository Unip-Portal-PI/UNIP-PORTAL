"use client";

import { useState, useMemo, useEffect } from "react";
import {
  IconX,
  IconUserPlus,
  IconSearch,
  IconCheck,
  IconUsers,
} from "@tabler/icons-react";
import { Evento, Inscricao } from "@/src/types/evento";
import { UsuarioGestorService } from "@/src/service/usuarioGestor.service";
import { UsuarioGestor } from "@/src/types/usuarioGestor";

interface Props {
  evento: Evento;
  inscricoesAtuais: Inscricao[];
  onFechar: () => void;
  onInscrever: (alunoId: string) => Promise<void>;
}

export function ModalInscricaoManual({
  evento,
  inscricoesAtuais,
  onFechar,
  onInscrever,
}: Props) {
  const [busca, setBusca] = useState("");
  const [todosUsuarios, setTodosUsuarios] = useState<UsuarioGestor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAlunoId, setLoadingAlunoId] = useState<string | null>(null);
  const [inscritosRecentemente, setInscritosRecentemente] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function carregar() {
      try {
        const users = await UsuarioGestorService.getAll();
        // Apenas alunos (permissão 'aluno')
        setTodosUsuarios(users.filter((u) => u.permission === "aluno"));
      } catch (error) {
        console.error("Erro ao carregar usuários:", error);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  const alunosExibidos = useMemo(() => {
    const inscritosIds = new Set([
      ...inscricoesAtuais.map((i) => i.alunoId),
      ...Array.from(inscritosRecentemente)
    ]);
    
    const filtrados = todosUsuarios.filter((u) => {
      // ✅ Mantemos na lista se foi inscrito recentemente para mostrar o feedback
      const jaInscritoAntes = inscricoesAtuais.some(i => i.alunoId === u.id);
      if (jaInscritoAntes) return false;

      const termo = busca.toLowerCase().trim();
      if (!termo) return true;

      return (
        u.nome.toLowerCase().includes(termo) ||
        u.matricula.toLowerCase().includes(termo) ||
        u.email.toLowerCase().includes(termo)
      );
    });

    // Retorna apenas os primeiros 20 para não sobrecarregar o DOM
    return filtrados.slice(0, 20);
  }, [todosUsuarios, inscricoesAtuais, busca, inscritosRecentemente]);

  async function handleInscrever(alunoId: string) {
    setLoadingAlunoId(alunoId);
    try {
      await onInscrever(alunoId);
      // ✅ Adiciona ao estado local para feedback imediato
      setInscritosRecentemente(prev => new Set(prev).add(alunoId));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao inscrever aluno.");
    } finally {
      setLoadingAlunoId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onFechar} />

      <div
        className="relative z-10 w-full max-w-2xl max-h-[85vh] flex flex-col bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl border border-slate-100 dark:border-[#303030] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-4 p-5 border-b border-slate-100 dark:border-[#2a2a2a] shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 bg-[#FFDE00]/10 rounded-xl flex items-center justify-center shrink-0">
                <IconUserPlus size={18} className="text-[#e6c800] dark:text-[#FFDE00]" />
              </div>

              <div className="min-w-0">
                <h2 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                  Inscrição Manual
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate" title={evento.nome}>
                  Selecionar aluno para {evento.nome}
                </p>
              </div>
            </div>

            <button
              onClick={onFechar}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#2a2a2a] text-slate-500 dark:text-slate-400 transition-colors shrink-0"
            >
              <IconX size={18} />
            </button>
          </div>

          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <IconSearch size={16} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar aluno por nome, matrícula ou e-mail..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#252525] border border-slate-200 dark:border-[#404040] rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FFDE00]/20 focus:border-[#FFDE00] transition-all"
            />
          </div>
        </div>

        <div className="overflow-auto flex-1 p-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
               <div className="w-8 h-8 border-4 border-[#FFDE00]/30 border-t-[#FFDE00] rounded-full animate-spin" />
               <p className="text-sm text-slate-500">Carregando alunos...</p>
            </div>
          ) : alunosExibidos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <IconUsers size={32} className="text-slate-300 dark:text-slate-600" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {busca 
                  ? "Nenhum aluno encontrado disponível para inscrição." 
                  : "Não há mais alunos disponíveis para este evento."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {alunosExibidos.map((aluno) => {
                const jaInscritoRecente = inscritosRecentemente.has(aluno.id);
                
                return (
                  <div
                    key={aluno.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-50 dark:border-[#2a2a2a] hover:bg-slate-50 dark:hover:bg-[#252525] transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                        {aluno.nome}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="font-mono">{aluno.matricula}</span>
                        <span>{aluno.area}</span>
                      </div>
                    </div>

                    {jaInscritoRecente ? (
                      <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-100 dark:border-emerald-500/20">
                        <IconCheck size={14} />
                        Inscrito
                      </span>
                    ) : (
                      <button
                        onClick={() => handleInscrever(aluno.id)}
                        disabled={loadingAlunoId !== null}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFDE00] hover:bg-[#e6c800] text-[#252525] text-xs font-bold transition-all disabled:opacity-50"
                      >
                        {loadingAlunoId === aluno.id ? (
                          "Inscrevendo..."
                        ) : (
                          <>
                            <IconCheck size={14} />
                            Inscrever
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-[#2a2a2a] shrink-0 bg-slate-50 dark:bg-[#1c1c1c]">
           <p className="text-[10px] text-slate-400 text-center uppercase tracking-wider font-semibold">
             Mostrando até 20 alunos. Use a busca para encontrar outros.
           </p>
        </div>
      </div>
    </div>
  );
}
