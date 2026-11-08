import { useId } from "react";

type AxolotlProps = {
  className?: string;
  /** Rest on a lily pad (used at night) instead of swimming. */
  resting?: boolean;
  /** Blow a few bubbles. */
  bubbles?: boolean;
  /** Plays the swim / gill / tail animations. Reduced-motion users get a still pose. */
  animated?: boolean;
  title?: string;
};

// Gill feather pointing along +x from the origin.
const GILL = "M0 0 C10 -8 30 -8 46 -2 C30 7 10 6 0 0Z";

export function Axolotl({
  className,
  resting = false,
  bubbles = true,
  animated = true,
  title = "Regather axolotl",
}: AxolotlProps) {
  const uid = useId().replace(/:/g, "");
  const body = `body-${uid}`;
  const tail = `tail-${uid}`;
  const gill = `gill-${uid}`;
  const pad = `pad-${uid}`;
  const a = (cls: string) => (animated ? cls : undefined);

  return (
    <svg
      viewBox="0 0 320 230"
      className={className}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <defs>
        {/* userSpaceOnUse keeps one smooth colour across body + head */}
        <linearGradient
          id={body}
          gradientUnits="userSpaceOnUse"
          x1="150"
          y1="70"
          x2="275"
          y2="175"
        >
          <stop offset="0" stopColor="#fff1ec" />
          <stop offset="0.55" stopColor="#fdd3cb" />
          <stop offset="1" stopColor="#f8b4bb" />
        </linearGradient>
        <linearGradient id={tail} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#fbc9c4" />
          <stop offset="1" stopColor="#dcc4f2" />
        </linearGradient>
        <linearGradient id={gill} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f08a90" />
          <stop offset="1" stopColor="#fbb2ad" />
        </linearGradient>
        <radialGradient id={pad} cx="0.5" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#b9e0bf" />
          <stop offset="1" stopColor="#8cc9a0" />
        </radialGradient>
      </defs>

      {resting && (
        <g>
          <ellipse cx="190" cy="186" rx="104" ry="20" fill={`url(#${pad})`} />
          <path d="M190 186 L230 170 L240 186Z" fill="#dff1ea" opacity="0.55" />
          <g transform="translate(262 168)">
            <circle r="8" fill="#fbd9e4" />
            <circle r="3.4" fill="#fff3a8" />
          </g>
        </g>
      )}

      <g className={a(resting ? "axo-rest" : "axo-float")}>
        {/* tail */}
        <g className={a("axo-tail")}>
          <path
            d="M166 120 C128 102 90 112 56 94 C36 84 20 94 27 110 C40 138 88 154 132 148 C148 146 160 142 170 136 Z"
            fill={`url(#${tail})`}
          />
          <path
            d="M150 128 C116 124 84 120 52 100"
            fill="none"
            stroke="#fff"
            strokeOpacity="0.5"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>

        {/* back gills (behind the head) */}
        <g transform="translate(212 96)" opacity="0.65">
          <g transform="rotate(-152)">
            <g className={a("axo-gill")} style={{ "--d": "0.3s" } as React.CSSProperties}>
              <path d={GILL} fill={`url(#${gill})`} />
            </g>
          </g>
          <g transform="rotate(-122)">
            <g className={a("axo-gill")} style={{ "--d": "0.9s" } as React.CSSProperties}>
              <path d={GILL} fill={`url(#${gill})`} />
            </g>
          </g>
        </g>

        {/* hind leg */}
        <g transform="translate(168 150)">
          <g className={a("axo-leg")} style={{ "--d": "0.4s" } as React.CSSProperties}>
            <ellipse cx="2" cy="10" rx="8" ry="12" transform="rotate(24)" fill="#f8bdc1" />
          </g>
        </g>

        {/* body + head */}
        <ellipse cx="190" cy="128" rx="64" ry="31" fill={`url(#${body})`} />
        <ellipse cx="234" cy="109" rx="42" ry="33" fill={`url(#${body})`} />
        <ellipse cx="196" cy="144" rx="40" ry="11" fill="#fff" opacity="0.38" />

        {/* front gills */}
        <g transform="translate(210 94)">
          <g transform="rotate(-166)">
            <g className={a("axo-gill")} style={{ "--d": "0s" } as React.CSSProperties}>
              <path d={GILL} fill={`url(#${gill})`} />
            </g>
          </g>
          <g transform="rotate(-138)">
            <g className={a("axo-gill")} style={{ "--d": "0.6s" } as React.CSSProperties}>
              <path d={GILL} fill={`url(#${gill})`} />
            </g>
          </g>
          <g transform="rotate(-110)">
            <g className={a("axo-gill")} style={{ "--d": "1.2s" } as React.CSSProperties}>
              <path d={GILL} fill={`url(#${gill})`} />
            </g>
          </g>
        </g>

        {/* front arm */}
        <g transform="translate(226 142)">
          <g className={a("axo-leg")}>
            <ellipse cx="2" cy="9" rx="7.5" ry="11" transform="rotate(-22)" fill="#f9c6c9" />
          </g>
        </g>

        {/* face */}
        <g className={a("axo-blink")}>
          <path
            d="M241 104 Q247.5 96.5 254 104"
            fill="none"
            stroke="#2f4569"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
        <circle cx="253" cy="119" r="6.5" fill="#f58f98" opacity="0.4" />
        <path
          d="M259 119 Q265 123 271 118"
          fill="none"
          stroke="#e58a92"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </g>

      {bubbles && (
        <g fill="#cfe8fb" stroke="#9fcdf2" strokeWidth="1.5">
          <circle className={a("axo-bubble")} style={{ "--d": "0s" } as React.CSSProperties} cx="286" cy="92" r="5" />
          <circle className={a("axo-bubble")} style={{ "--d": "1.5s" } as React.CSSProperties} cx="296" cy="104" r="3.5" />
          <circle className={a("axo-bubble")} style={{ "--d": "3s" } as React.CSSProperties} cx="282" cy="78" r="4" />
        </g>
      )}
    </svg>
  );
}
