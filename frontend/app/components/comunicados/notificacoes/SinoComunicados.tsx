// app/components/comunicados/notificacoes/SinoComunicados.tsx
"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Megaphone } from "lucide-react";
import { useComunicadosNaoLidos } from "@/src/hooks/useComunicadosNaoLidos";
import { ComunicadoService } from "@/src/service/comunicado.service";

export function SinoComunicados() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { notificacoes, totalNaoLidos, carregando, marcarLido, marcarTodosLidos } =
    useComunicadosNaoLidos();

  // Fecha ao clicar fora
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleIrParaComunicado(id: string) {
    marcarLido(id);
    setAberto(false);
    router.push(`/home/comunicado/${id}`);
  }

  function formatarData(iso: string) {
    const d = new Date(iso);
    const agora = new Date();
    const diffMs = agora.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMin / 60);
    const diffD = Math.floor(diffH / 24);
    if (diffMin < 1) return "Agora";
    if (diffMin < 60) return `${diffMin}min atrás`;
    if (diffH < 24) return `${diffH}h atrás`;
    if (diffD < 7) return `${diffD}d atrás`;
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  }

  return (
    <div className="relative" ref={ref}>
      {/* Botão sino */}
      <button
        onClick={() => setAberto((v) => !v)}
        className="relative flex items-center justify-center w-9 h-9 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#2a2a2a] transition-colors focus:outline-none"
        title="Notificações"
        aria-label={`${totalNaoLidos} comunicados não lidos`}
      >
        <Bell className="w-5 h-5" />
        {totalNaoLidos > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#FFDE00] text-[#252525] text-[10px] font-black rounded-full flex items-center justify-center px-1 leading-none shadow">
            {totalNaoLidos > 99 ? "99+" : totalNaoLidos}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {aberto && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#202020] rounded-2xl shadow-2xl border border-slate-100 dark:border-[#303030] overflow-hidden z-50">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-[#2a2a2a]">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Comunicados
              </span>
              {totalNaoLidos > 0 && (
                <span className="text-xs font-bold text-amber-600 dark:text-[#FFDE00] bg-[#FFDE00]/15 px-1.5 py-0.5 rounded-full">
                  {totalNaoLidos} novo{totalNaoLidos > 1 ? "s" : ""}
                </span>
              )}
            </div>
            {totalNaoLidos > 0 && (
              <button
                onClick={marcarTodosLidos}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Marcar todos como lidos"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Tudo lido
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-80 overflow-y-auto">
            {carregando ? (
              <div className="flex flex-col gap-2 p-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-[#2a2a2a] mt-1.5 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-slate-200 dark:bg-[#2a2a2a] rounded w-3/4" />
                      <div className="h-2.5 bg-slate-200 dark:bg-[#2a2a2a] rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notificacoes.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-2 text-slate-400">
                <Bell className="w-7 h-7 opacity-40" />
                <p className="text-xs font-medium">Nenhum comunicado ativo</p>
              </div>
            ) : (
              <div className="py-1">
                {notificacoes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleIrParaComunicado(n.id)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-[#2a2a2a] ${
                      !n.lido ? "bg-[#FFDE00]/5 dark:bg-[#FFDE00]/5" : ""
                    }`}
                  >
                    {/* Bolinha de não lido */}
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
                        n.lido
                          ? "bg-slate-200 dark:bg-[#404040]"
                          : "bg-[#FFDE00]"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm leading-snug line-clamp-2 ${
                          n.lido
                            ? "text-slate-500 dark:text-slate-400 font-normal"
                            : "text-slate-900 dark:text-white font-semibold"
                        }`}
                      >
                        {n.titulo}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {n.assunto && (
                          <span className="text-[10px] font-medium text-amber-500 dark:text-amber-400 truncate">
                            {n.assunto}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatarData(n.criadoEm)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 dark:border-[#2a2a2a] px-4 py-2.5">
            <button
              onClick={() => { setAberto(false); router.push("/home/comunicado"); }}
              className="w-full text-xs font-bold text-amber-600 dark:text-[#FFDE00] hover:underline text-center transition-colors"
            >
              Ver todos os comunicados →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
