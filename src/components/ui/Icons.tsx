// Hand-drawn icon set for Regather. Rounded strokes, soft fills, never sharp or alarming.

type IconProps = { className?: string; title?: string };

function Svg({ className, title, children, viewBox = "0 0 24 24" }: IconProps & { children: React.ReactNode; viewBox?: string }) {
  return (
    <svg
      viewBox={viewBox}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      {children}
    </svg>
  );
}

/* ---------- navigation ---------- */

export const PondIcon = (p: IconProps) => (
  <Svg {...p}>
    <ellipse cx="12" cy="15" rx="9" ry="4.5" />
    <ellipse cx="12" cy="15" rx="4.5" ry="2" />
    <path d="M8 8.5c1.2-2.6 4-3.3 5.4-1.7 1 1.1.4 2.7-.9 3" />
  </Svg>
);
export const ChatsIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 12.5c0-3.6 3.1-6 7-6s7 2.4 7 6-3.1 6-7 6c-.9 0-1.7-.1-2.5-.3L5 19.5l1-3.1C4.7 15.3 4 14 4 12.5Z" />
    <circle cx="8.5" cy="12.5" r=".5" fill="currentColor" />
    <circle cx="11" cy="12.5" r=".5" fill="currentColor" />
    <circle cx="13.5" cy="12.5" r=".5" fill="currentColor" />
  </Svg>
);
export const JarIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 3.5h8M8.5 3.5v2.2C6.4 6.6 5 8.6 5 11v6.5a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V11c0-2.4-1.4-4.4-3.5-5.3V3.5" />
    <path d="M10 13.2c-.9-1.3.6-2.6 2-1.3 1.4-1.3 2.9 0 2 1.3L12 15.4Z" fill="currentColor" stroke="none" opacity=".85" />
  </Svg>
);
export const CalmIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 20c-4.5 0-7.5-3-7.5-7.5C8 12.5 11 14 12 20Z" />
    <path d="M12 20c4.5 0 7.5-3 7.5-7.5-3.5 0-6.5 1.5-7.5 7.5Z" />
    <path d="M12 20c-2-4-2-9 0-14.5 2 5.5 2 10.5 0 14.5Z" />
  </Svg>
);
export const MeIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="10" r="5.5" />
    <path d="M6.5 8.5 4 7M6.5 11 4 11.5M17.5 8.5 20 7M17.5 11l2.5.5" />
    <path d="M10.3 11.6c.9.6 2.5.6 3.4 0" />
    <path d="M7 20.5c1-2.6 3-4 5-4s4 1.4 5 4" />
  </Svg>
);

/* ---------- actions ---------- */

export const SendIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </Svg>
);
export const HelpIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 20s-7-4.3-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.7-7 10-7 10Z" />
  </Svg>
);
export const PhoneIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6.5 4h3l1.5 4-2 1.3a10 10 0 0 0 5.7 5.7L16 13l4 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 4.5 6a2 2 0 0 1 2-2Z" />
  </Svg>
);
export const PeopleIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="9" cy="9" r="3" />
    <circle cx="16.5" cy="10" r="2.4" />
    <path d="M3.5 19c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5M14.5 15c2.6-.6 5 .6 6 3.5" />
  </Svg>
);
export const SproutIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 20v-8" />
    <path d="M12 12c0-3.5-2.5-6-6.5-6 0 3.5 2.5 6 6.5 6Z" />
    <path d="M12 14c0-3 2.2-5.2 6-5.2 0 3-2.2 5.2-6 5.2Z" />
  </Svg>
);
export const BackIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M15 5l-7 7 7 7" />
  </Svg>
);
export const CloseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);
export const PauseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 6v12M15 6v12" />
  </Svg>
);
export const PlayIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 5.5v13l10-6.5Z" />
  </Svg>
);
export const CheckIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
);

/* ---------- daily check-in: how today felt, as weather (score 1..5) ---------- */

export const WEATHER_CHECKIN = [
  { score: 1, word: "stormy", label: "Stormy" },
  { score: 2, word: "rainy", label: "Rainy" },
  { score: 3, word: "cloudy", label: "Cloudy" },
  { score: 4, word: "sunny", label: "Sunny" },
  { score: 5, word: "a little rainbow", label: "A little rainbow" },
] as const;

export function DayWeatherIcon({ score, className }: { score: number; className?: string }) {
  const cloud = (fill: string, stroke: string) => (
    <path d="M14 30a7 7 0 0 1 .8-14A10 10 0 0 1 34 14.5 7.5 7.5 0 0 1 35 30Z" fill={fill} stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" />
  );
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      {score === 1 && (
        <g>
          {cloud("#a9b4cf", "#7d8bb0")}
          <path d="M13 9c3-3 8-2 9 1" fill="none" stroke="#7d8bb0" strokeWidth="1.6" strokeLinecap="round" />
          {[16, 23, 30].map((x, i) => (
            <path key={x} d={`M${x} ${34 + (i % 2) * 2}l-2 6`} stroke="#6fa3d6" strokeWidth="2.4" strokeLinecap="round" />
          ))}
          <path d="M8 40c4-2 6 2 10 0" fill="none" stroke="#9db2d4" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      )}
      {score === 2 && (
        <g>
          {cloud("#dbe6f3", "#9fb6d4")}
          {[17, 25, 33].map((x, i) => (
            <path key={x} d={`M${x} ${34 + (i % 2) * 3}c-1 2-1 3.5 0 3.5s1-1.5 0-3.5Z`} fill="#7fb9e6" stroke="#5ea4dc" strokeWidth="1" />
          ))}
        </g>
      )}
      {score === 3 && (
        <g>
          <circle cx="32" cy="15" r="7" fill="#ffe2a0" opacity=".9" />
          {cloud("#f4f6fb", "#b6c3d9")}
        </g>
      )}
      {score === 4 && (
        <g>
          <circle cx="24" cy="24" r="9" fill="#ffd36e" stroke="#f0b244" strokeWidth="1.6" />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * Math.PI) / 4;
            return (
              <path
                key={i}
                d={`M${24 + Math.cos(a) * 13} ${24 + Math.sin(a) * 13}L${24 + Math.cos(a) * 17} ${24 + Math.sin(a) * 17}`}
                stroke="#f0b244"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            );
          })}
          <path d="M20.5 25.5c1.8 1.6 5.2 1.6 7 0" fill="none" stroke="#c98a2a" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      )}
      {score === 5 && (
        <g fill="none" strokeLinecap="round" strokeWidth="3">
          <path d="M8 34a16 16 0 0 1 32 0" stroke="#f59ab0" />
          <path d="M12 34a12 12 0 0 1 24 0" stroke="#ffd36e" />
          <path d="M16 34a8 8 0 0 1 16 0" stroke="#8fd3a8" />
          <path d="M20 34a4 4 0 0 1 8 0" stroke="#86c3e6" />
          <ellipse cx="9" cy="35" rx="5" ry="3" fill="#fff" stroke="#c9d6ea" strokeWidth="1.4" />
          <ellipse cx="39" cy="35" rx="5" ry="3" fill="#fff" stroke="#c9d6ea" strokeWidth="1.4" />
        </g>
      )}
    </svg>
  );
}

/* ---------- note stickers (match the note_sticker enum) ---------- */

export function Sticker({ kind, className }: { kind: string; className?: string }) {
  if (kind === "lily") {
    return (
      <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
        <ellipse cx="20" cy="30" rx="16" ry="5" fill="#8fd3a8" />
        <path d="M20 29c-6 0-9-6-8-11 3 1 6 4 8 11Z" fill="#f7b3c4" />
        <path d="M20 29c6 0 9-6 8-11-3 1-6 4-8 11Z" fill="#f7b3c4" />
        <path d="M20 29c-3-5-3-11 0-16 3 5 3 11 0 16Z" fill="#fcd2dc" />
        <circle cx="20" cy="26" r="2" fill="#ffd36e" />
      </svg>
    );
  }
  if (kind === "axolotl") {
    return (
      <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
        {[-150, -180, -210].map((a) => (
          <path key={a} d="M0 0c2-3 7-4 10-2-2 3-7 4-10 2Z" fill="#f08aa2" transform={`translate(10 18) rotate(${a + 180}) scale(-1 1)`} />
        ))}
        {[-30, 0, 30].map((a) => (
          <path key={a} d="M0 0c2-3 7-4 10-2-2 3-7 4-10 2Z" fill="#f08aa2" transform={`translate(30 18) rotate(${a})`} />
        ))}
        <ellipse cx="20" cy="20" rx="12" ry="10" fill="#fcd0d9" />
        <circle cx="16" cy="19" r="1.8" fill="#243052" />
        <circle cx="24" cy="19" r="1.8" fill="#243052" />
        <path d="M18 23.5q2 1.6 4 0" fill="none" stroke="#d86a83" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  // shell
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <path d="M20 8c8 0 14 7 14 15 0 5-3 9-14 9S6 28 6 23C6 15 12 8 20 8Z" fill="#ffd9c4" stroke="#f2b08f" strokeWidth="1.4" />
      {[-12, -6, 0, 6, 12].map((dx) => (
        <path key={dx} d={`M20 31L${20 + dx * 1.1} 10`} stroke="#f2b08f" strokeWidth="1.2" strokeLinecap="round" />
      ))}
      <path d="M15 32h10l-2 3h-6Z" fill="#f2b08f" />
    </svg>
  );
}

export const ChevronDownIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 9.5l6 6 6-6" />
  </Svg>
);
export const RestartIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12a7 7 0 1 0 2.1-5" />
    <path d="M5 4.5V8h3.5" />
  </Svg>
);
export const StopIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="7" y="7" width="10" height="10" rx="2.5" fill="currentColor" stroke="none" />
  </Svg>
);
