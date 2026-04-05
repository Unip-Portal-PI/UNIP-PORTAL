"use client";

import { useRef, useState } from "react";

interface TooltipProps {
  text: string;
  children?: React.ReactNode;
}

export function Tooltip({ text, children }: TooltipProps) {
  const ref = useRef<HTMLSpanElement>(null);

  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [visible, setVisible] = useState(false);
  const [render, setRender] = useState(false);

  let timeout: NodeJS.Timeout;

  function calcularPosicao() {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;

    const margin = 8;
    const tooltipWidth = 220;

    let left = rect.left + rect.width / 2;
    let top = rect.top - margin;

    // evita sair lateral
    if (left - tooltipWidth / 2 < 8) {
      left = tooltipWidth / 2 + 8;
    }

    if (left + tooltipWidth / 2 > window.innerWidth - 8) {
      left = window.innerWidth - tooltipWidth / 2 - 8;
    }

    // se não tiver espaço acima → joga pra baixo
    if (rect.top < 60) {
      top = rect.bottom + margin;
    }

    setPos({ top, left });
  }

  function handleEnter() {
    timeout = setTimeout(() => {
      calcularPosicao();
      setRender(true);

      // pequeno delay pra animar
      setTimeout(() => setVisible(true), 10);
    }, 250); // delay UX (melhora muito)
  }

  function handleLeave() {
    clearTimeout(timeout);
    setVisible(false);

    setTimeout(() => setRender(false), 150); // espera animação sair
  }

  return (
    <>
      <span
        ref={ref}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        className="inline-flex items-center"
      >
        {children || (
          <span className="ml-1 text-slate-400 cursor-help text-xs">ⓘ</span>
        )}
      </span>

      {render && (
        <div
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            transform: visible
              ? "translate(-50%, -100%) scale(1)"
              : "translate(-50%, -95%) scale(0.95)",
            opacity: visible ? 1 : 0,
            zIndex: 9999,
            width: 220,
            transition: "all 0.15s ease",
          }}
          className="pointer-events-none"
        >
          <div className="relative rounded-lg bg-slate-800 dark:bg-slate-700 text-white text-xs px-3 py-2 shadow-lg leading-relaxed">
            {text}

            {/* seta */}
            <span className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-slate-800 dark:border-t-slate-700" />
          </div>
        </div>
      )}
    </>
  );
}