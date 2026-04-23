import { getAreaGradient } from "@/src/utils/evento.helpers";


interface BannerEventoFallback {
  areas: string[];
  className?: string;
}

export function EventoBannerFallback({ areas, className = "" }: BannerEventoFallback) {
  const { bg, blobs } = getAreaGradient(areas);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: bg }}
    >
      {blobs.map((color, i) => (
        <div
          key={i}
          className={`absolute rounded-full blur-[28px] ${["animate-blob1","animate-blob2","animate-blob3"][i]}`}
          style={{
            background: color,
            opacity: 0.55 - i * 0.1,
            width: `${[200, 150, 120][i]}px`,
            height: `${[200, 150, 120][i]}px`,
            top: `${[-50, 80, 30][i]}px`,
            left: `${[-30, 120, 300][i]}px`,
          }}
        />
      ))}
      <span
        className="absolute inset-0 flex items-center justify-center font-black text-center leading-tight select-none"
        style={{ color: "rgba(255,255,255,0.12)", fontSize: "clamp(2rem, 8vw, 3.5rem)" }}
      >
        Evento<br />AVP
      </span>
    </div>
  );
}