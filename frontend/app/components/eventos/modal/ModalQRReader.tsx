// app/components/eventos/ModalQRReader.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  IconX,
  IconQrcode,
  IconCheck,
  IconAlertCircle,
  IconCamera,
  IconCameraOff,
  IconKeyboard,
} from "@tabler/icons-react";
import { Inscricao } from "@/src/types/evento";

interface ModalQRReaderProps {
  eventoNome: string;
  onLer: (qrCode: string) => Promise<Inscricao>;
  onFechar: () => void;
  presencasConfirmadas: Inscricao[];
}

type Modo = "camera" | "manual";
type CameraStatus = "idle" | "solicitando" | "ativa" | "negada" | "erro";

export function ModalQRReader({
  eventoNome,
  onLer,
  onFechar,
  presencasConfirmadas,
}: ModalQRReaderProps) {
  const [modo, setModo] = useState<Modo>("camera");
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("idle");
  const [inputManual, setInputManual] = useState("");
  const [resultado, setResultado] = useState<Inscricao | null>(null);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerRef = useRef<unknown>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const readerDivId = "qr-reader-camera";

  // ── Inicia câmera ──────────────────────────────────────────────────────────
  const iniciarCamera = useCallback(async () => {
    setCameraStatus("solicitando");
    setErro("");

    try {
      // Importação dinâmica para não quebrar SSR
      const { Html5Qrcode } = await import("html5-qrcode");

      const html5QrCode = new Html5Qrcode(readerDivId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" }, // câmera traseira
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decodedText) => {
          // QR Code lido com sucesso
          await pararCamera();
          await handleLer(decodedText);
        },
        () => {
          // Frame sem QR Code — ignora silenciosamente
        }
      );

      setCameraStatus("ativa");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (
        msg.includes("Permission") ||
        msg.includes("NotAllowed") ||
        msg.includes("permission")
      ) {
        setCameraStatus("negada");
        setErro("Permissão de câmera negada. Use o modo manual ou libere nas configurações do browser.");
      } else {
        setCameraStatus("erro");
        setErro("Não foi possível acessar a câmera. Tente o modo manual.");
      }
    }
  }, []);
  // Dentro do componente, antes do return
  function qrStyles(id: string) {
    return `
  #${id} { width: 100% !important; height: 100% !important; padding: 0 !important; }
  #${id}__dashboard { display: none !important; }
  #${id}__scan_region { width: 100% !important; height: 100% !important; border: none !important; box-shadow: none !important; }
  #${id}__scan_region > img { display: none !important; }
  #${id}__scan_region > div { display: none !important; }
  #${id} video { position: absolute !important; inset: 0 !important; width: 100% !important; height: 100% !important; object-fit: cover !important; display: block !important; }
  @keyframes scan {
    0%, 100% { transform: translateY(-80px); }
    50%       { transform: translateY(80px); }
  }
`;
  }
  const pararCamera = useCallback(async () => {
    try {
      const scanner = scannerRef.current as {
        isScanning: boolean;
        stop: () => Promise<void>;
        clear: () => void;
      } | null;

      if (scanner?.isScanning) {
        await scanner.stop();
        scanner.clear();
      }
    } catch {
      // ignora erro ao parar
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    scannerRef.current = null;
    setCameraStatus("idle");
  }, []);

  // Inicia câmera ao abrir no modo câmera
  useEffect(() => {
    let cancelado = false;
  
    if (modo === "camera") {
      // Pequeno delay garante que o DOM da div já existe
      const timer = setTimeout(() => {
        if (!cancelado) iniciarCamera();
      }, 50);
  
      return () => {
        cancelado = true;
        clearTimeout(timer);
        pararCamera();
      };
    } else {
      pararCamera();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [modo]);

  // Para câmera ao fechar modal
  useEffect(() => {
    return () => {
      pararCamera();
    };
  }, []);

  // ── Processamento do código ────────────────────────────────────────────────
  async function handleLer(codigo: string) {
    if (!codigo.trim()) return;
    setLoading(true);
    setErro("");
    setResultado(null);
    try {
      const insc = await onLer(codigo.trim());
      setResultado(insc);
      setInputManual("");
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "QR Code inválido.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmitManual(e: React.FormEvent) {
    e.preventDefault();
    handleLer(inputManual);
  }

  function trocarModo(novoModo: Modo) {
    setResultado(null);
    setErro("");
    setModo(novoModo);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div className="bg-white dark:bg-[#202020] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#303030]">
          <div className="flex items-center gap-2">
            <IconQrcode size={20} className="text-[#FFDE00]" />
            <h2 className="font-bold text-slate-900 dark:text-white text-lg">
              Check-in — {eventoNome}
            </h2>
          </div>
          <button
            onClick={onFechar}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <IconX size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Tabs de modo */}
          <div className="flex gap-2 bg-slate-100 dark:bg-[#2a2a2a] rounded-xl p-1">
            <button
              type="button"
              onClick={() => trocarModo("camera")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-colors ${modo === "camera"
                  ? "bg-white dark:bg-[#202020] text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
            >
              <IconCamera size={15} />
              Câmera
            </button>
            <button
              type="button"
              onClick={() => trocarModo("manual")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-colors ${modo === "manual"
                  ? "bg-white dark:bg-[#202020] text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
            >
              <IconKeyboard size={15} />
              Manual
            </button>
          </div>

          {/* ── MODO CÂMERA ── */}
          {modo === "camera" && (
            <div className="space-y-3">
              {/* Área do scanner */}
              <div className="relative bg-slate-900 rounded-xl overflow-hidden" style={{ minHeight: 260 }}>
                {/* Div onde o html5-qrcode injeta o vídeo */}
                <div id={readerDivId} className="w-full" />

                {/* Overlay de status */}
                {cameraStatus === "solicitando" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900">
                    <div className="w-8 h-8 border-2 border-[#FFDE00] border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-300 text-sm">Acessando câmera...</p>
                  </div>
                )}

                {(cameraStatus === "negada" || cameraStatus === "erro") && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900 p-6">
                    <IconCameraOff size={36} className="text-slate-500" />
                    <p className="text-slate-400 text-sm text-center">{erro}</p>
                    <button
                      type="button"
                      onClick={iniciarCamera}
                      className="px-4 py-2 bg-[#FFDE00] hover:bg-[#e6c800] text-slate-900 text-sm font-bold rounded-lg transition-colors"
                    >
                      Tentar novamente
                    </button>
                  </div>
                )}

                {/* Mira de scan quando câmera ativa */}
                {cameraStatus === "ativa" && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 relative">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#FFDE00] rounded-tl-sm" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#FFDE00] rounded-tr-sm" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#FFDE00] rounded-bl-sm" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#FFDE00] rounded-br-sm" />
                      <div className="absolute left-2 right-2 h-0.5 bg-[#FFDE00]/60 animate-[scan_2s_ease-in-out_infinite] top-1/2" />
                    </div>
                    <p className="absolute bottom-3 text-white/60 text-xs">
                      Aponte para o QR Code
                    </p>
                  </div>
                )}
              </div>

              {/* Resultado ou erro após leitura pela câmera */}
              {resultado && <FeedbackSucesso resultado={resultado} />}
              {erro && cameraStatus !== "negada" && cameraStatus !== "erro" && (
                <FeedbackErro mensagem={erro} />
              )}
            </div>
          )}

          {/* ── MODO MANUAL ── */}
          {modo === "manual" && (
            <div className="space-y-3">
              <form onSubmit={handleSubmitManual} className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  Código do QR
                </label>
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputManual}
                    onChange={(e) => setInputManual(e.target.value)}
                    placeholder="Cole ou digite o código QR..."
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-[#505050] rounded-lg text-sm bg-slate-50 dark:bg-[#2a2a2a] text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#FFDE00] transition-colors font-mono"
                  />
                  <button
                    type="submit"
                    disabled={loading || !inputManual.trim()}
                    className="px-4 py-2 bg-[#FFDE00] hover:bg-[#e6c800] disabled:opacity-50 text-slate-900 text-sm font-bold rounded-lg transition-colors"
                  >
                    {loading ? "..." : "Ler"}
                  </button>
                </div>
              </form>

              {resultado && <FeedbackSucesso resultado={resultado} />}
              {erro && <FeedbackErro mensagem={erro} />}
            </div>
          )}

          {/* Lista de presenças */}
          {presencasConfirmadas.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Presenças confirmadas ({presencasConfirmadas.length})
              </p>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {presencasConfirmadas.map((insc) => (
                  <div
                    key={insc.id}
                    className="flex items-center justify-between bg-slate-50 dark:bg-[#2a2a2a] rounded-lg px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {insc.alunoNome}
                      </p>
                      <p className="text-xs text-slate-400">{insc.alunoCurso}</p>
                    </div>
                    <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                      ✓ Presente
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Animação da linha de scan */}
      <style jsx>{`
        @keyframes scan {
          0%, 100% { transform: translateY(-80px); }
          50% { transform: translateY(80px); }
        }
      `}</style>
    </div>
  );
}

// ── Sub-componentes de feedback ──────────────────────────────────────────────

function FeedbackSucesso({ resultado }: { resultado: Inscricao }) {
  return (
    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-xl p-4 flex items-start gap-3">
      <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center shrink-0 mt-0.5">
        <IconCheck size={16} className="text-emerald-600" />
      </div>
      <div>
        <p className="font-bold text-emerald-700 dark:text-emerald-300 text-sm">
          Presença confirmada!
        </p>
        <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">
          {resultado.alunoNome} — {resultado.alunoCurso}
        </p>
        <p className="text-xs text-emerald-500 mt-0.5">
          Matrícula: {resultado.alunoMatricula}
        </p>
      </div>
    </div>
  );
}

function FeedbackErro({ mensagem }: { mensagem: string }) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl p-4 flex items-start gap-3">
      <div className="w-8 h-8 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center shrink-0 mt-0.5">
        <IconAlertCircle size={16} className="text-red-500" />
      </div>
      <p className="text-sm text-red-600 dark:text-red-400">{mensagem}</p>
    </div>
  );
}