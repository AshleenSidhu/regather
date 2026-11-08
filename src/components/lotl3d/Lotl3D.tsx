"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Lotl, type LotlMood } from "@/components/lotl/Lotl";
import { useSky } from "@/components/sky/SkyProvider";
import type { Lotl3DMode, Lotl3DMood } from "./LotlModel";

// three.js only loads in the browser, and only on pages that show a 3D Lotl.
const Scene = dynamic(() => import("./Lotl3DScene"), { ssr: false });

type Lotl3DProps = {
  mood?: Lotl3DMood;
  /** "stand" faces you and looks toward the pointer; "swim" swims back and forth across the box. */
  mode?: Lotl3DMode;
  /** 0..1 gill glow, read every frame (the breathing exercise). */
  glowRef?: React.RefObject<number>;
  /** Look toward the pointer anywhere on the page. */
  follow?: boolean;
  className?: string;
  /** Accessible name. "" when decorative. */
  title?: string;
  /** Shown until 3D is ready, and instead of it with reduced motion or no WebGL. */
  fallback?: React.ReactNode;
  fallbackMood?: LotlMood;
};

let webglOk: boolean | null = null;
function hasWebGL() {
  if (webglOk === null) {
    try {
      const c = document.createElement("canvas");
      webglOk = Boolean(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      webglOk = false;
    }
  }
  return webglOk;
}

const RM = "(prefers-reduced-motion: reduce)";
function subscribeRM(cb: () => void) {
  const mq = window.matchMedia(RM);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const can3D = () => !window.matchMedia(RM).matches && hasWebGL();

/**
 * Lotl in 3D for the big moments (home hero, the pond, breathing, welcome). Fades in once
 * ready; shows the SVG Lotl instead with reduced motion or without WebGL.
 */
export function Lotl3D({
  mood = "idle",
  mode = "stand",
  glowRef,
  follow = false,
  className = "",
  title = "Lotl the axolotl",
  fallback,
  fallbackMood,
}: Lotl3DProps) {
  const { phase } = useSky();
  const enabled = useSyncExternalStore(subscribeRM, can3D, () => false);
  const [ready, setReady] = useState(false);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!follow || !enabled) return;
    const move = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [follow, enabled]);

  const decorative = title === "";
  const svg = fallback ?? (
    <Lotl
      mood={fallbackMood ?? (mood === "happy" ? "happy" : "idle")}
      title=""
      className="lotl3d-svg"
    />
  );

  // Layout is inline so the canvas always fills its box, whatever CSS is loaded.
  const layer = (shown: boolean): React.CSSProperties => ({
    position: "absolute",
    inset: 0,
    display: "grid",
    placeItems: "center",
    opacity: shown ? 1 : 0,
    transition: "opacity 0.9s ease",
  });

  return (
    <div
      className={className}
      style={className ? { position: "relative" } : { position: "relative", width: "100%", height: "100%" }}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : title}
      aria-hidden={decorative ? true : undefined}
    >
      {/* With 3D available, Lotl simply fades in (no SVG underneath to ghost through). */}
      {!enabled && <div style={layer(true)}>{svg}</div>}
      {enabled && (
        <div style={layer(ready)}>
          <Scene
            phase={phase}
            mood={mood}
            mode={mode}
            glowRef={glowRef}
            pointerRef={follow ? pointer : undefined}
            onReady={() => setReady(true)}
          />
        </div>
      )}
    </div>
  );
}
