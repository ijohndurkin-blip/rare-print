/* eslint-disable @next/next/no-img-element */
import type { MockupKind } from "@/lib/products";

/**
 * Lightweight SVG "in situ" previews so customers can picture the finished
 * product. `images` are trimmed design renders (one per side).
 */
export function Mockup({
  kind,
  images,
  ratio,
  label,
}: {
  kind: MockupKind;
  images: string[];
  /** width / height of the finished artwork */
  ratio: number;
  label?: string;
}) {
  const img = images[0];
  switch (kind) {
    case "shopfront":
      return <Shopfront image={img} ratio={ratio} label={label} />;
    case "hanging":
      return <Hanging image={img} ratio={ratio} />;
    case "aboard":
      return <ABoard image={img} ratio={ratio} />;
    case "window":
      return <WindowMock image={img} ratio={ratio} />;
    case "van":
      return <Van image={img} ratio={ratio} />;
    case "rollerbanner":
      return <RollerBanner image={img} ratio={ratio} />;
    case "banner":
      return <BannerMock image={img} ratio={ratio} />;
    case "wall":
      return <Wall image={img} ratio={ratio} />;
    case "mug":
      return <Mug image={img} />;
    case "tote":
      return <Tote image={img} ratio={ratio} />;
    case "coaster":
    case "sticker":
      return <Round image={img} kind={kind} />;
    case "card":
    case "paper":
    default:
      return <Flat images={images} ratio={ratio} kind={kind} />;
  }
}

function fit(ratio: number, maxW: number, maxH: number) {
  let w = maxW;
  let h = w / ratio;
  if (h > maxH) {
    h = maxH;
    w = h * ratio;
  }
  return { w, h };
}

export function Shopfront({ image, ratio, label }: { image?: string; ratio: number; label?: string }) {
  const W = 1000;
  const sign = fit(ratio, 900, 260);
  const top = 70;
  const sx = (W - sign.w) / 2;
  const bodyTop = top + sign.h + 20;
  const H = bodyTop + 430;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Shop front preview">
      <defs>
        <pattern id="bricks" width="60" height="30" patternUnits="userSpaceOnUse">
          <rect width="60" height="30" fill="#b45f45" />
          <path d="M0 15H60M30 0V15M0 30V15M60 30V15" stroke="#9a4c36" strokeWidth="2" />
        </pattern>
        <linearGradient id="glass" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#cfe8f5" />
          <stop offset="0.5" stopColor="#9cc6dc" />
          <stop offset="1" stopColor="#6d9fbb" />
        </linearGradient>
        <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#e0f2fe" />
          <stop offset="1" stopColor="#f8fafc" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#sky)" />
      <rect x="20" y="20" width={W - 40} height={H - 60} fill="url(#bricks)" />
      {/* fascia */}
      <rect x={sx - 14} y={top - 14} width={sign.w + 28} height={sign.h + 28} fill="#1f2937" rx="4" />
      {image ? (
        <image href={image} x={sx} y={top} width={sign.w} height={sign.h} preserveAspectRatio="none" />
      ) : (
        <g>
          <rect x={sx} y={top} width={sign.w} height={sign.h} fill="#ffffff" />
          <text x={W / 2} y={top + sign.h / 2} textAnchor="middle" dominantBaseline="middle" fontFamily="Poppins, sans-serif" fontWeight="800" fontSize={Math.min(sign.h * 0.42, 90)} fill="#0f172a">
            {label ?? "YOUR SHOP"}
          </text>
        </g>
      )}
      {/* lights */}
      {[0.2, 0.5, 0.8].map((p) => (
        <g key={p}>
          <path d={`M${sx + sign.w * p} ${top - 14} v-26 h30`} stroke="#111827" strokeWidth="5" fill="none" />
          <path d={`M${sx + sign.w * p + 22} ${top - 40} l20 10 l-34 0 z`} fill="#111827" />
        </g>
      ))}
      {/* window + door */}
      <rect x="70" y={bodyTop + 30} width="560" height="330" fill="#1f2937" />
      <rect x="82" y={bodyTop + 42} width="536" height="306" fill="url(#glass)" />
      <path d={`M120 ${bodyTop + 60} l120 0 l-160 260 l0 -120 z`} fill="#ffffff" opacity="0.25" />
      <rect x="690" y={bodyTop + 10} width="230" height="350" fill="#1f2937" />
      <rect x="704" y={bodyTop + 24} width="202" height="336" fill="#334155" />
      <rect x="722" y={bodyTop + 40} width="166" height="180" fill="url(#glass)" />
      <circle cx="880" cy={bodyTop + 260} r="7" fill="#fbbf24" />
      <rect x="0" y={H - 60} width={W} height="60" fill="#94a3b8" />
      <rect x="0" y={H - 60} width={W} height="8" fill="#64748b" />
    </svg>
  );
}

function Hanging({ image, ratio }: { image?: string; ratio: number }) {
  const s = fit(ratio, 380, 380);
  const x = 300;
  const y = 150;
  return (
    <svg viewBox="0 0 800 640" className="h-auto w-full">
      <rect width="800" height="640" fill="#e2e8f0" />
      <rect x="0" y="0" width="140" height="640" fill="#cbd5e1" />
      <rect x="140" y="80" width={x + s.w - 80} height="12" fill="#1f2937" />
      <path d="M140 160 L260 92" stroke="#1f2937" strokeWidth="8" />
      <line x1={x + 40} y1="92" x2={x + 40} y2={y} stroke="#1f2937" strokeWidth="5" />
      <line x1={x + s.w - 40} y1="92" x2={x + s.w - 40} y2={y} stroke="#1f2937" strokeWidth="5" />
      <rect x={x - 6} y={y - 6} width={s.w + 12} height={s.h + 12} fill="#111827" rx="6" />
      {image && <image href={image} x={x} y={y} width={s.w} height={s.h} preserveAspectRatio="none" />}
    </svg>
  );
}

function ABoard({ image, ratio }: { image?: string; ratio: number }) {
  const s = fit(ratio, 300, 430);
  const x = 400 - s.w / 2;
  const y = 90;
  return (
    <svg viewBox="0 0 800 640" className="h-auto w-full">
      <rect width="800" height="640" fill="#f1f5f9" />
      <rect y="560" width="800" height="80" fill="#94a3b8" />
      <path d={`M${x - 24} ${y - 24} L${x + s.w + 24} ${y - 24} L${x + s.w + 60} 570 L${x - 60} 570 Z`} fill="#1f2937" />
      {image && <image href={image} x={x} y={y} width={s.w} height={s.h} preserveAspectRatio="none" />}
      <rect x={x - 40} y={y - 50} width={s.w + 80} height="24" rx="8" fill="#111827" />
    </svg>
  );
}

function WindowMock({ image, ratio }: { image?: string; ratio: number }) {
  const s = fit(ratio, 640, 420);
  const x = 400 - s.w / 2;
  const y = 60 + (420 - s.h) / 2;
  return (
    <svg viewBox="0 0 800 560" className="h-auto w-full">
      <defs>
        <linearGradient id="glass2" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#dbeafe" />
          <stop offset="1" stopColor="#93c5fd" />
        </linearGradient>
      </defs>
      <rect width="800" height="560" fill="#334155" />
      <rect x="60" y="40" width="680" height="460" fill="url(#glass2)" />
      {image && <image href={image} x={x} y={y} width={s.w} height={s.h} preserveAspectRatio="none" opacity="0.95" />}
      <path d="M60 40 L300 40 L60 380 Z" fill="#fff" opacity="0.18" />
      <rect x="40" y="500" width="720" height="24" fill="#1e293b" />
    </svg>
  );
}

function Van({ image, ratio }: { image?: string; ratio: number }) {
  const s = fit(ratio, 300, 160);
  return (
    <svg viewBox="0 0 900 500" className="h-auto w-full">
      <rect width="900" height="500" fill="#f1f5f9" />
      <rect y="420" width="900" height="80" fill="#64748b" />
      <path d="M80 400 V140 Q80 110 110 110 H560 Q600 110 620 140 L720 260 Q820 280 820 330 V400 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="4" />
      <path d="M580 140 L660 250 H580 Z" fill="#93c5fd" />
      <line x1="560" y1="120" x2="560" y2="400" stroke="#cbd5e1" strokeWidth="3" />
      {image && <image href={image} x={540 - s.w - 30} y={190} width={s.w} height={s.h} preserveAspectRatio="none" />}
      <circle cx="220" cy="410" r="52" fill="#1f2937" />
      <circle cx="220" cy="410" r="22" fill="#94a3b8" />
      <circle cx="680" cy="410" r="52" fill="#1f2937" />
      <circle cx="680" cy="410" r="22" fill="#94a3b8" />
    </svg>
  );
}

function RollerBanner({ image, ratio }: { image?: string; ratio: number }) {
  const s = fit(ratio, 320, 560);
  const x = 400 - s.w / 2;
  return (
    <svg viewBox="0 0 800 680" className="h-auto w-full">
      <rect width="800" height="680" fill="#f8fafc" />
      <rect y="620" width="800" height="60" fill="#e2e8f0" />
      <rect x={x - 4} y="36" width={s.w + 8} height="10" rx="4" fill="#475569" />
      {image && <image href={image} x={x} y={44} width={s.w} height={s.h} preserveAspectRatio="none" />}
      <rect x={x - 16} y={44 + s.h - 6} width={s.w + 32} height="34" rx="10" fill="#94a3b8" />
      <rect x={x - 30} y={44 + s.h + 26} width="40" height="6" rx="3" fill="#64748b" />
      <rect x={x + s.w - 10} y={44 + s.h + 26} width="40" height="6" rx="3" fill="#64748b" />
    </svg>
  );
}

function BannerMock({ image, ratio }: { image?: string; ratio: number }) {
  const s = fit(ratio, 760, 320);
  const x = 450 - s.w / 2;
  const y = 120;
  return (
    <svg viewBox="0 0 900 520" className="h-auto w-full">
      <rect width="900" height="520" fill="#dcfce7" />
      <rect y="440" width="900" height="80" fill="#86efac" />
      {Array.from({ length: 19 }).map((_, i) => (
        <rect key={i} x={i * 50} y="90" width="8" height="360" fill="#475569" />
      ))}
      <rect x="0" y="96" width="900" height="8" fill="#475569" />
      <rect x="0" y="420" width="900" height="8" fill="#475569" />
      {image && <image href={image} x={x} y={y} width={s.w} height={s.h} preserveAspectRatio="none" />}
      {[0, 1].map((r) =>
        [0, 0.25, 0.5, 0.75, 1].map((c) => (
          <circle key={`${r}${c}`} cx={x + 10 + c * (s.w - 20)} cy={y + 10 + r * (s.h - 20)} r="5" fill="#e5e7eb" stroke="#6b7280" strokeWidth="2" />
        )),
      )}
    </svg>
  );
}

function Wall({ image, ratio }: { image?: string; ratio: number }) {
  const s = fit(ratio, 820, 420);
  const x = 450 - s.w / 2;
  return (
    <svg viewBox="0 0 900 600" className="h-auto w-full">
      <rect width="900" height="600" fill="#f5f5f4" />
      {image && <image href={image} x={x} y={40} width={s.w} height={s.h} preserveAspectRatio="none" />}
      <rect y="470" width="900" height="130" fill="#a8a29e" />
      <rect x="250" y="390" width="400" height="90" rx="20" fill="#334155" />
      <rect x="230" y="420" width="440" height="70" rx="18" fill="#475569" />
      <rect x="270" y="490" width="14" height="30" fill="#1e293b" />
      <rect x="616" y="490" width="14" height="30" fill="#1e293b" />
    </svg>
  );
}

function Mug({ image }: { image?: string }) {
  // Show the left and right halves of the wrap as two mug views.
  const view = (offset: 0 | 1) => (
    <svg viewBox="0 0 400 360" className="h-auto w-full" key={offset}>
      <defs>
        <clipPath id={`mug-body-${offset}`}>
          <path d="M80 70 H300 V300 Q300 325 275 325 H105 Q80 325 80 300 Z" />
        </clipPath>
        <linearGradient id={`mug-shade-${offset}`} x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.28" />
          <stop offset="0.18" stopColor="#000" stopOpacity="0.05" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0.25" />
          <stop offset="0.8" stopColor="#000" stopOpacity="0.06" />
          <stop offset="1" stopColor="#000" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <ellipse cx="190" cy="335" rx="130" ry="14" fill="#000" opacity="0.08" />
      <path
        d={offset === 0 ? "M300 115 Q370 115 370 195 Q370 275 300 275" : "M80 115 Q10 115 10 195 Q10 275 80 275"}
        stroke="#f1f5f9"
        strokeWidth="26"
        fill="none"
      />
      <path d="M80 70 H300 V300 Q300 325 275 325 H105 Q80 325 80 300 Z" fill="#ffffff" />
      {image && (
        <g clipPath={`url(#mug-body-${offset})`}>
          <image
            href={image}
            x={offset === 0 ? 190 - 341 * 0.25 : 190 - 341 * 0.75}
            y="83"
            width="341"
            height="228"
            preserveAspectRatio="none"
          />
        </g>
      )}
      <path d="M80 70 H300 V300 Q300 325 275 325 H105 Q80 325 80 300 Z" fill={`url(#mug-shade-${offset})`} />
      <ellipse cx="190" cy="70" rx="110" ry="14" fill="#e2e8f0" stroke="#cbd5e1" />
    </svg>
  );
  return <div className="grid grid-cols-2 gap-4">{[view(0), view(1)]}</div>;
}

function Tote({ image, ratio }: { image?: string; ratio: number }) {
  const s = fit(ratio, 260, 280);
  const x = 300 - s.w / 2;
  return (
    <svg viewBox="0 0 600 640" className="h-auto w-full">
      <rect width="600" height="640" fill="#fafaf9" />
      <path d="M210 190 Q210 60 300 60 Q390 60 390 190" stroke="#d6c7a1" strokeWidth="18" fill="none" />
      <path d="M130 180 H470 L490 600 H110 Z" fill="#efe6cf" />
      {image && <image href={image} x={x} y={260} width={s.w} height={s.h} preserveAspectRatio="xMidYMid meet" />}
    </svg>
  );
}

function Round({ image, kind }: { image?: string; kind: "coaster" | "sticker" }) {
  return (
    <svg viewBox="0 0 600 500" className="h-auto w-full">
      <defs>
        <clipPath id="round-clip">
          <circle cx="300" cy="240" r="180" />
        </clipPath>
      </defs>
      <rect width="600" height="500" fill={kind === "coaster" ? "#d6b88a" : "#e2e8f0"} />
      <circle cx="306" cy="250" r={kind === "sticker" ? 196 : 186} fill="#000" opacity="0.15" />
      {kind === "sticker" && <circle cx="300" cy="240" r="192" fill="#fff" />}
      <circle cx="300" cy="240" r="180" fill="#fff" />
      {image && (
        <g clipPath="url(#round-clip)">
          <image href={image} x="120" y="60" width="360" height="360" preserveAspectRatio="none" />
        </g>
      )}
    </svg>
  );
}

function Flat({ images, ratio, kind }: { images: string[]; ratio: number; kind: MockupKind }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 p-6 sm:p-10">
      {images.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={`Side ${i + 1}`}
          style={{
            aspectRatio: String(ratio),
            width: ratio >= 1 ? `min(100%, ${kind === "card" ? 340 : 420}px)` : undefined,
            height: ratio < 1 ? `min(60vh, ${kind === "card" ? 340 : 520}px)` : undefined,
            transform: `rotate(${i === 0 ? -3 : 4}deg)`,
          }}
          className={`bg-white object-cover shadow-[0_20px_40px_-12px_rgba(15,23,42,0.45)] ${kind === "card" ? "rounded-md" : ""}`}
        />
      ))}
    </div>
  );
}
