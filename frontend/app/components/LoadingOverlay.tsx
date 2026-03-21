// app/components/LoadingOverlay.tsx
"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
export default function LoadingOverlay() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white/70 dark:bg-slate-900/80 backdrop-blur-sm transition-colors">
      <Image
        src= {isDark ? "/img/logo_avp_dark.png" : "/img/logo_avp.png"}
        alt="AVP Conecta"
        width={100}
        height={100}
        className="object-contain mb-6"
      />
      {/* Circle progress */}
      <svg className="animate-spin w-10 h-10 text-[#0f0f1e] dark:text-white" viewBox="0 0 24 24" fill="none">
        <circle
          className="opacity-20"
          cx="12" cy="12" r="10"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="opacity-80"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
    </div>
  );
}