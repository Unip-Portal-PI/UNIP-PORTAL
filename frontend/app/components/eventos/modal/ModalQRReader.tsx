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
type CameraStatus = "idle" | "solicitando" | "ativa" | "negada" | "erro" | "sem-suporte";

// ✅ Verifica se o browser suporta câmera ANTES de tentar qualquer coisa
function browserSuportaCamera(): boolean {
  if (typeof window === "undefined") return false;
  // Câmera via getUserMedia só funciona em HTTPS (ou localhost)
  const isSecure =
    window.location.protocol === "https:" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  const temMediaDevices =
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === "function";
  return isSecure && temMediaDevices;
}

export function ModalQRReader({
  eventoNome,
  onLer,
  onFechar,
  presencasConfirmadas,
}: ModalQRReaderProps) {
  // ✅ Já começa no modo manual se o browser não suportar câmera
  const [modo, setModo] = useState<Modo>(() =>
    browserSuportaCamera() ? "camera" : "manual"
  );
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("idle");
  const [inputManual, setInputManual] = useState("");
  const [resultado, setResultado] = useState<Inscricao | null>(null);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [suportaCamera] = useState(browserSuportaCamera);

  const scannerRef = useRef<unknown>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const readerDivId = "qr-reader-camera";

  // ── Para câmera ────────────────────────────────────────────────────────────
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
      // ignora
    }
    scannerRef.current = null;
    setCameraStatus("idle");
  }, []);

  // ── Inicia câmera ──────────────────────────────────────────────────────────
  const iniciarCamera = useCallback(async () => {
    // ✅ Checagem antecipada — evita o erro "Camera streaming not supported"
    if (!browserSuportaCamera()) {
      setCameraStatus("sem-suporte");
      setErro("Câmera não disponível neste browser. Acesse via HTTPS ou use o modo manual.");
      return;
    }

    setCameraStatus("solicitando");
    setErro("");
    setResultado(null);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      await pararCamera();

      const html5QrCode = new Html5Qrcode(readerDivId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        async (decodedText) => {
          await pararCamera();
          await handleLer(decodedText);
        },
        () => {
          // frame sem QR — ignora
        }
      );

      setCameraStatus("ativa");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);

      // ✅ Trata "Camera streaming not supported" separadamente
      const isSemSuporte =
        msg.includes("streaming not supported") ||
        msg.includes("not supported") ||
        msg.includes("secure") ||
        msg.includes("https");

      const isPermissionError =
        msg.includes("Permission") ||
        msg.includes("NotAllowed") ||
        msg.includes("permission") ||
        msg.includes("dismissed") ||
        msg.includes("denied");

      if (isSemSuporte) {
        setCameraStatus("sem-suporte");
        setErro("Câmera não suportada neste browser. Acesse via HTTPS ou use o modo manual.");
      } else if (isPermissionError) {
        setCameraStatus("negada");
        setErro("Permissão de câmera negada. Libere nas configurações do browser ou use o modo manual.");
      } else {
        setCameraStatus("erro");
        setErro("Não foi possível acessar a câmera. Tente o modo manual.");
      }

      console.error("[ModalQRReader] Erro ao iniciar câmera:", msg);
    }
  }, [pararCamera]);

  // ── Inicia câmera ao montar ────────────────────────────────────────────────
  useEffect(() => {
    if (modo !== "camera") return;
    const timer = setTimeout(() => iniciarCamera(), 150);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Para câmera ao desmontar ───────────────────────────────────────────────
  useEffect(() => {
    return () => { pararCamera(); };
  }, [pararCamera]);

  // ── Processamento do QR ────────────────────────────────────────────────────
  const handleLer = useCallback(async (codigo: string) => {
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
  }, [onLer]);

  function handleSubmitManual(e: React.FormEvent) {
    e.preventDefault();
    handleLer(inputManual);
  }

  async function trocarModo(novoModo: Modo) {
    setResultado(null);
    setErro("");
    if (modo === "camera" && novoModo === "manual") await pararCamera();
    setModo(novoModo);
    if (novoModo === "camera") setTimeout(() => iniciarCamera(), 150);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onFechar(); }}
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
          <button onClick={onFechar} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <IconX size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* ✅ Tabs — só mostra aba câmera se browser suportar */}
          {suportaCamera && (
            <div className="flex gap-2 bg-slate-100 dark:bg-[#2a2a2a] rounded-xl p-1">
              <button
                type="button"
                onClick={() => trocarModo("camera")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-colors ${
                  modo === "camera"
                    ? "bg-[#FFDE00] dark:bg-yellow-400 text-[#252525] dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                <IconCamera size={15} />
                Câmera
              </button>
              <button
                type="button"
                onClick={() => trocarModo("manual")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-colors ${
                  modo === "manual"
                    ? "bg-[#FFDE00] dark:bg-yellow-400 text-[#252525] dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                <IconKeyboard size={15} />
                Manual
              </button>
            </div>
          )}

          {/* ✅ Aviso quando browser não suporta câmera (HTTP) */}
          {!suportaCamera && (
            <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-3">
              <IconCameraOff size={16} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Câmera indisponível. Use o código manual abaixo.
              </p>
            </div>
          )}

          {/* ── MODO CÂMERA ── */}
          {modo === "camera" && (
            <div className="space-y-3">
              <div className="relative bg-slate-900 rounded-xl overflow-hidden" style={{ height: 320 }}>
                <div id={readerDivId} style={{ width: "100%", height: "100%" }} />

                {/* Overlay: solicitando */}
                {cameraStatus === "solicitando" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900 z-10">
                    <div className="w-8 h-8 border-2 border-[#FFDE00] border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-300 text-sm">Acessando câmera...</p>
                  </div>
                )}

                {/* Overlay: sem suporte / negada / erro */}
                {(cameraStatus === "negada" || cameraStatus === "erro" || cameraStatus === "sem-suporte") && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900 p-6 z-10">
                    <IconCameraOff size={36} className="text-slate-500" />
                    <p className="text-slate-400 text-sm text-center">{erro}</p>
                    <div className="flex gap-2 flex-wrap justify-center">
                      {/* Só mostra "Tentar novamente" se não for falta de suporte */}
                      {cameraStatus !== "sem-suporte" && (
                        <button
                          type="button"
                          onClick={iniciarCamera}
                          className="px-4 py-2 bg-[#FFDE00] hover:bg-[#e6c800] text-slate-900 text-sm font-bold rounded-lg transition-colors"
                        >
                          Tentar novamente
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => trocarModo("manual")}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-lg transition-colors"
                      >
                        Usar manual
                      </button>
                    </div>
                  </div>
                )}

                {/* Mira de scan */}
                {cameraStatus === "ativa" && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                    <div className="w-64 h-64 relative">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#FFDE00] rounded-tl-sm" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#FFDE00] rounded-tr-sm" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#FFDE00] rounded-bl-sm" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#FFDE00] rounded-br-sm" />
                      <div
                        className="absolute left-2 right-2 h-0.5 bg-[#FFDE00]/60 top-1/2"
                        style={{ animation: "qrscan 2s ease-in-out infinite" }}
                      />
                    </div>
                    <p className="absolute bottom-3 text-white/60 text-xs">
                      Aponte para o QR Code
                    </p>
                  </div>
                )}
              </div>

              {resultado && <FeedbackSucesso resultado={resultado} />}
              {erro && !["negada", "erro", "sem-suporte"].includes(cameraStatus) && (
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
                    autoComplete="off"
                    autoFocus
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
        </div>
      </div>

      <style jsx>{`
        @keyframes qrscan {
          0%, 100% { transform: translateY(-80px); }
          50%       { transform: translateY(80px); }
        }
      `}</style>
    </div>
  );
}

function FeedbackSucesso({ resultado }: { resultado: Inscricao }) {
  return (
    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-xl p-4 flex items-start gap-3">
      <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center shrink-0 mt-0.5">
        <IconCheck size={16} className="text-emerald-600" />
      </div>
      <div>
        <p className="font-bold text-emerald-700 dark:text-emerald-300 text-sm">Presença confirmada!</p>
        <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">
          {resultado.alunoNome} — {resultado.alunoArea}
        </p>
        <p className="text-xs text-emerald-500 mt-0.5">Matrícula: {resultado.alunoMatricula}</p>
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