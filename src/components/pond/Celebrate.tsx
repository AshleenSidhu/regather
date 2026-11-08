const COLORS = ["#f5a3b5", "#ffc96b", "#86cfa0", "#7cc3d6", "#fde3e8"];

/** A burst of bubbles rising: confetti, but soft. Purely decorative. */
export function Celebrate({ count = 14 }: { count?: number }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-6 mx-auto h-0 w-40">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="cele-bubble"
          style={{
            left: `${(i * 37) % 100}%`,
            "--s": `${8 + ((i * 7) % 12)}px`,
            "--x": `${((i * 53) % 120) - 60}px`,
            "--d": `${(i % 7) * 0.12}s`,
            "--c": COLORS[i % COLORS.length],
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
