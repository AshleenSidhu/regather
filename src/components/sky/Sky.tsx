// Pure markup for the living sky. Which layer is visible is decided in CSS
// from <html data-phase="...">, set by SkyProvider.

// Deterministic "random" stars so server and client markup always match.
function makeStars(count: number) {
  let seed = 7;
  const next = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  return Array.from({ length: count }, (_, i) => ({
    left: `${(next() * 100).toFixed(1)}%`,
    top: `${(next() * 62).toFixed(1)}%`,
    size: 2 + Math.round(next() * 2),
    delay: `${(next() * 4).toFixed(1)}s`,
    first: i === 0,
  }));
}

const STARS = makeStars(30);

export function Sky() {
  return (
    <div className="sky-root" aria-hidden="true">
      <div className="sky-grad sky-grad-dawn" />
      <div className="sky-grad sky-grad-day" />
      <div className="sky-grad sky-grad-golden" />
      <div className="sky-grad sky-grad-dusk" />
      <div className="sky-grad sky-grad-night" />

      <div className="sky-blob sky-blob-1" />
      <div className="sky-blob sky-blob-2" />
      <div className="sky-blob sky-blob-3" />

      <div className="sky-cloud sky-cloud-1" />
      <div className="sky-cloud sky-cloud-2" />
      <div className="sky-cloud sky-cloud-3" />

      <div className="sky-stars">
        {STARS.map((s, i) => (
          <span
            key={i}
            className={`sky-star${s.first ? " sky-star-first" : ""}`}
            style={{
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              animationDelay: s.delay,
            }}
          />
        ))}
      </div>
      <div className="sky-moon" />
    </div>
  );
}
