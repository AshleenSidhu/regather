import { PondSwimmer } from "./PondSwimmer";

export type AwakeLight = { id: string; name: string };

type PondSceneProps = {
  /** Week of the 8-week cohort (1..8). Things grow in as the weeks pass; nothing ever wilts. */
  week: number;
  /** People awake right now, shown as little glowing lights above the water. */
  awake?: AwakeLight[];
  className?: string;
  /** Lotl swims back and forth. */
  swimmer?: boolean;
};

const PADS = [
  { x: 70, y: 112, rx: 30, w: 1 },
  { x: 318, y: 120, rx: 26, w: 1 },
  { x: 196, y: 134, rx: 22, w: 2 },
  { x: 128, y: 140, rx: 18, w: 5 },
  { x: 262, y: 144, rx: 20, w: 6 },
];
const FLOWERS = [
  { x: 74, y: 104, w: 3, c: "#f7b3c4" },
  { x: 320, y: 112, w: 5, c: "#fff1d6" },
  { x: 198, y: 128, w: 7, c: "#f7b3c4" },
];
const LIGHT_SPOTS = [
  [18, 22], [34, 12], [52, 26], [66, 10], [80, 24], [26, 34], [60, 38], [88, 14],
];

export function PondScene({ week, awake = [], className = "", swimmer = true }: PondSceneProps) {
  const w = Math.max(1, Math.min(8, week));
  return (
    <div className={`relative overflow-hidden rounded-[28px] ${className}`}>
      <svg viewBox="0 0 400 170" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id="pond-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5fb0c9" />
            <stop offset="1" stopColor="#2f6f8c" />
          </linearGradient>
          <radialGradient id="pond-shine" cx="0.5" cy="0" r="0.8">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* banks + water */}
        <path d="M0 70 Q60 58 130 66 T260 62 T400 68 V170 H0Z" fill="#7fbf8f" opacity="0.55" />
        <path d="M-10 84 Q80 70 200 78 T410 80 V170 H-10Z" fill="url(#pond-water)" />
        <g className="pond-water">
          <path d="M0 86 Q50 80 100 86 T200 86 T300 86 T424 86" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.5" />
          <path d="M20 100 Q70 95 120 100 T220 100 T320 100 T444 100" fill="none" stroke="#fff" strokeOpacity="0.18" strokeWidth="1.2" />
        </g>
        <ellipse cx="200" cy="84" rx="200" ry="30" fill="url(#pond-shine)" />

        {/* ripples */}
        {[[110, 128, "0s"], [290, 104, "1.6s"], [220, 150, "2.8s"]].map(([x, y, d], i) => (
          <ellipse key={i} className="ripple-ring" style={{ "--d": d } as React.CSSProperties} cx={x} cy={y} rx="16" ry="5" fill="none" stroke="#fff" strokeOpacity="0.5" />
        ))}

        {/* reeds (week 2+) */}
        {w >= 2 && (
          <g className="grow-in" style={{ "--d": "0.2s" } as React.CSSProperties}>
            {[18, 26, 32, 372, 380].map((x, i) => (
              <path key={x} d={`M${x} 88 Q${x + (i % 2 ? 4 : -3)} 60 ${x + 2} ${36 + (i % 3) * 8}`} stroke="#4f9a6a" strokeWidth="3" strokeLinecap="round" fill="none" />
            ))}
            {w >= 6 && <ellipse cx="28" cy="44" rx="3" ry="9" fill="#9a6b4a" />}
            {w >= 6 && <ellipse cx="376" cy="40" rx="3" ry="9" fill="#9a6b4a" />}
          </g>
        )}

        {/* lily pads */}
        {PADS.filter((p) => w >= p.w).map((p, i) => (
          <g key={i} className="grow-in" style={{ "--d": `${0.15 * i}s` } as React.CSSProperties}>
            <g className="lily-pad" style={{ "--d": `${i * 1.3}s` } as React.CSSProperties}>
              <ellipse cx={p.x} cy={p.y} rx={p.rx} ry={p.rx * 0.32} fill="#6cbb89" />
              <path d={`M${p.x} ${p.y} L${p.x + p.rx} ${p.y - 3} L${p.x + p.rx * 0.9} ${p.y + 4}Z`} fill="#2f6f8c" opacity="0.9" />
              <ellipse cx={p.x - p.rx * 0.2} cy={p.y - 1.5} rx={p.rx * 0.5} ry={p.rx * 0.12} fill="#a9dcb6" opacity="0.7" />
            </g>
          </g>
        ))}

        {/* flowers (week 3+) */}
        {FLOWERS.filter((f) => w >= f.w).map((f, i) => (
          <g key={i} transform={`translate(${f.x} ${f.y})`}>
          <g className="grow-in" style={{ "--d": `${0.5 + i * 0.2}s` } as React.CSSProperties}>
            <path d="M0 0c-7 0-10-7-9-12 3 1 7 5 9 12Z" fill={f.c} />
            <path d="M0 0c7 0 10-7 9-12-3 1-7 5-9 12Z" fill={f.c} />
            <path d="M0 0c-3-6-3-12 0-17 3 5 3 11 0 17Z" fill="#fff" opacity="0.85" />
            <circle cx="0" cy="-4" r="2.2" fill="#ffd36e" />
            {w >= 7 && <circle cx="0" cy="-6" r="10" fill="#ffd36e" opacity="0.18" className="glow-pulse" />}
          </g>
          </g>
        ))}

        {/* fish (week 4+, more at week 6) */}
        {w >= 4 && (
          <g className="fish" style={{ "--x": "70px", "--dur": "18s" } as React.CSSProperties}>
            <path d="M150 118c6-5 14-5 18 0-4 5-12 5-18 0Zm0 0-6-4v8Z" fill="#ffb27a" opacity="0.85" />
          </g>
        )}
        {w >= 6 && (
          <g className="fish" style={{ "--x": "-80px", "--dur": "22s", "--d": "-6s" } as React.CSSProperties}>
            <path d="M300 146c5-4 11-4 14 0-3 4-9 4-14 0Zm0 0-5-3v6Z" fill="#ffe08a" opacity="0.85" />
          </g>
        )}
      </svg>

      {/* awake now: little lights hovering over the water */}
      {awake.length > 0 && (
        <ul aria-label="Awake right now" className="absolute inset-x-0 top-0 h-1/2">
          {awake.slice(0, LIGHT_SPOTS.length).map((p, i) => {
            const [x, y] = LIGHT_SPOTS[i];
            return (
              <li
                key={p.id}
                className="bob absolute"
                style={{ left: `${x}%`, top: `${y}%`, "--d": `${i * 0.7}s` } as React.CSSProperties}
              >
                <span className="awake-light glow-pulse block h-4 w-4 rounded-full" style={{ "--d": `${i * 0.5}s` } as React.CSSProperties} />
                <span className="sr-only">{p.name}</span>
              </li>
            );
          })}
        </ul>
      )}

      {swimmer && <PondSwimmer />}
    </div>
  );
}
