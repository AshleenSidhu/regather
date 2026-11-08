import { useId } from "react";

export type LotlMood = "idle" | "wave" | "happy" | "sleep" | "carry";

type LotlProps = {
  mood?: LotlMood;
  className?: string;
  /** 0..1 gill glow. "inherit" follows a --glow set on a parent (the breathing exercise). */
  glow?: number | "inherit";
  /** A few bubbles drift up from Lotl. */
  bubbles?: boolean;
  /** Accessible name. Pass "" when Lotl is purely decorative. */
  title?: string;
};

// One feathery gill frond pointing along +x from the origin.
const FROND = "M0 0 C6 -8 20 -12 33 -8 C40 -6 41 3 35 6 C22 11 8 7 0 0Z";

// [anchor x, anchor y, angle] for the left and right gills.
const GILLS_L: [number, number, number][] = [
  [52, 58, -150],
  [44, 76, -178],
  [48, 95, -205],
];
const GILLS_R: [number, number, number][] = [
  [148, 58, -30],
  [156, 76, -2],
  [152, 95, 25],
];

/**
 * Lotl, the Regather axolotl. Soft, round and pink; never shown hurt or missing a limb.
 * Moods: idle (floats, blinks), wave (says hi), happy (hops with sparkles), sleep (on a
 * lily pad), carry (holds a little envelope).
 */
export function Lotl({ mood = "idle", className, glow, bubbles = false, title = "Lotl the axolotl" }: LotlProps) {
  const uid = useId().replace(/:/g, "");
  const body = `lb-${uid}`;
  const gill = `lg-${uid}`;
  const tail = `lt-${uid}`;
  const pad = `lp-${uid}`;
  const decorative = title === "";

  return (
    <svg
      viewBox="0 0 200 196"
      className={`lotl ${className ?? ""}`}
      data-mood={mood}
      data-glow={glow === undefined ? undefined : "on"}
      style={typeof glow === "number" ? ({ "--glow": glow } as React.CSSProperties) : undefined}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : title}
      xmlns="http://www.w3.org/2000/svg"
    >
      {!decorative && <title>{title}</title>}
      <defs>
        <radialGradient id={body} cx="0.42" cy="0.32" r="0.8">
          <stop offset="0" stopColor="#fff3f5" />
          <stop offset="0.55" stopColor="#fcd0d9" />
          <stop offset="1" stopColor="#f3a7b9" />
        </radialGradient>
        <linearGradient id={gill} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ec6f8d" />
          <stop offset="1" stopColor="#fbb7c6" />
        </linearGradient>
        <linearGradient id={tail} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f7b6c6" />
          <stop offset="1" stopColor="#f9d7c9" />
        </linearGradient>
        <radialGradient id={pad} cx="0.5" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#a9dcb6" />
          <stop offset="1" stopColor="#6cbb89" />
        </radialGradient>
      </defs>

      {mood === "sleep" && (
        <g>
          <ellipse cx="100" cy="182" rx="92" ry="14" fill={`url(#${pad})`} />
          <path d="M100 182 L150 172 L156 182Z" fill="#e3f4e8" opacity="0.6" />
        </g>
      )}

      <g className="l-float">
        {/* tail, behind everything */}
        <g className="l-tail">
          <path
            d="M128 150 C150 146 168 152 182 140 C190 134 194 146 186 156 C172 172 146 172 124 166 Z"
            fill={`url(#${tail})`}
          />
          <path d="M134 158 C152 160 170 156 182 146" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* body */}
        <ellipse cx="100" cy="142" rx="40" ry="31" fill={`url(#${body})`} />
        <ellipse cx="100" cy="150" rx="24" ry="16" fill="#fff" opacity="0.4" />
        <ellipse cx="84" cy="172" rx="10" ry="6" fill="#f6b5c4" />
        <ellipse cx="116" cy="172" rx="10" ry="6" fill="#f6b5c4" />

        {/* gills */}
        {[...GILLS_L, ...GILLS_R].map(([x, y, a], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${a})`}>
            <g className={`l-gill ${i < 3 ? "l-gill-l" : "l-gill-r"}`} style={{ "--d": `${(i % 3) * 0.45}s`, transformOrigin: "0% 50%" } as React.CSSProperties}>
              <path d={FROND} fill={`url(#${gill})`} />
              <circle cx="14" cy="-7" r="3" fill="#fbb7c6" />
              <circle cx="24" cy="-8.5" r="2.6" fill="#fcc4d0" />
              <circle cx="20" cy="7" r="2.4" fill="#f7a0b4" />
            </g>
          </g>
        ))}

        {/* head */}
        <ellipse cx="100" cy="82" rx="60" ry="47" fill={`url(#${body})`} />
        <ellipse cx="80" cy="52" rx="22" ry="9" fill="#fff" opacity="0.4" transform="rotate(-12 80 52)" />

        {/* face */}
        {mood === "happy" ? (
          <g fill="none" stroke="#243052" strokeWidth="3.4" strokeLinecap="round">
            <path d="M72 88 Q79 79 86 88" />
            <path d="M114 88 Q121 79 128 88" />
          </g>
        ) : mood === "sleep" ? (
          <g fill="none" stroke="#243052" strokeWidth="3.2" strokeLinecap="round">
            <path d="M72 85 Q79 91 86 85" />
            <path d="M114 85 Q121 91 128 85" />
          </g>
        ) : (
          <g className="l-eyes">
            <circle cx="79" cy="85" r="7" fill="#243052" />
            <circle cx="121" cy="85" r="7" fill="#243052" />
            <circle cx="81.5" cy="82" r="2.4" fill="#fff" />
            <circle cx="123.5" cy="82" r="2.4" fill="#fff" />
          </g>
        )}
        <ellipse cx="64" cy="101" rx="10" ry="6" fill="#f37f9a" opacity="0.4" />
        <ellipse cx="136" cy="101" rx="10" ry="6" fill="#f37f9a" opacity="0.4" />
        <path
          d={mood === "happy" ? "M90 100 Q100 113 110 100" : "M92 102 Q100 109 108 102"}
          fill={mood === "happy" ? "#e8798f" : "none"}
          stroke="#d86a83"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* arms */}
        <ellipse cx="68" cy="146" rx="9" ry="13" transform="rotate(28 68 146)" fill="#f8bfcc" />
        {/* The position lives on the outer group; the wave animates only the inner one.
            (A CSS animation replaces an element's transform attribute, so putting both on
            one group made the arm jump off the body while waving.) */}
        <g transform="translate(124 134)">
          <g className="l-arm-r">
            <ellipse cx="8" cy="11" rx="9" ry="13" transform="rotate(-28 8 11)" fill="#f8bfcc" />
          </g>
        </g>

        {/* a little envelope, held in front */}
        {mood === "carry" && (
          <g transform="translate(76 128) rotate(-4)">
            <rect width="48" height="32" rx="5" fill="#fffaf4" stroke="#f0c9b8" strokeWidth="1.5" />
            <path d="M2 3 L24 19 L46 3" fill="none" stroke="#f0c9b8" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M24 22 c-3 -4 -8 -1 -5 3 l5 4 l5 -4 c3 -4 -2 -7 -5 -3z" fill="#f2849c" />
          </g>
        )}
      </g>

      {mood === "happy" && (
        <g fill="#ffd27a">
          {[
            [30, 40, "0s"],
            [172, 34, "0.4s"],
            [20, 120, "0.8s"],
            [182, 110, "0.2s"],
          ].map(([x, y, d], i) => (
            <path
              key={i}
              className="l-sparkle"
              style={{ "--d": d } as React.CSSProperties}
              transform={`translate(${x} ${y})`}
              d="M0 -9 L2.4 -2.4 L9 0 L2.4 2.4 L0 9 L-2.4 2.4 L-9 0 L-2.4 -2.4Z"
            />
          ))}
        </g>
      )}

      {mood === "sleep" && (
        <g fill="#f2f0ff" fontFamily="var(--font-fraunces), serif" fontWeight="700">
          <text className="l-zzz" x="150" y="40" fontSize="16" style={{ "--d": "0s" } as React.CSSProperties}>z</text>
          <text className="l-zzz" x="160" y="30" fontSize="12" style={{ "--d": "1.3s" } as React.CSSProperties}>z</text>
          <text className="l-zzz" x="168" y="22" fontSize="10" style={{ "--d": "2.6s" } as React.CSSProperties}>z</text>
        </g>
      )}

      {bubbles && (
        <g fill="#e3f3fc" stroke="#a9d4ee" strokeWidth="1.4">
          <circle className="l-bubble" style={{ "--d": "0s" } as React.CSSProperties} cx="150" cy="40" r="5" />
          <circle className="l-bubble" style={{ "--d": "1.6s" } as React.CSSProperties} cx="160" cy="52" r="3.5" />
          <circle className="l-bubble" style={{ "--d": "3.1s" } as React.CSSProperties} cx="144" cy="30" r="4" />
        </g>
      )}
    </svg>
  );
}
