"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import type * as THREE from "three";
import type { Phase } from "@/lib/sky";
import { LotlModel, type LotlModelProps } from "./LotlModel";

// Light that matches the sky outside: warm at golden hour, moonlit at night.
const LIGHT: Record<Phase, { sky: string; ground: string; key: string; keyI: number; rim: string; glow: number }> = {
  dawn: { sky: "#fff0f4", ground: "#ffd9c4", key: "#ffe1d4", keyI: 2.3, rim: "#e9d5ff", glow: 0 },
  day: { sky: "#ffffff", ground: "#d4eef8", key: "#fff8ec", keyI: 2.5, rim: "#c7e7ff", glow: 0 },
  golden: { sky: "#fff0c8", ground: "#ffc9a8", key: "#ffd596", keyI: 2.6, rim: "#ffb38a", glow: 0.05 },
  dusk: { sky: "#e3d8ff", ground: "#f7b8c8", key: "#ffd0c2", keyI: 2, rim: "#a99cff", glow: 0.18 },
  night: { sky: "#c9d3ff", ground: "#4b4f93", key: "#dbe2ff", keyI: 1.7, rim: "#8fa2ff", glow: 0.32 },
};

export type Lotl3DSceneProps = Omit<LotlModelProps, "baseGlow"> & {
  phase: Phase;
  onReady: () => void;
};

export default function Lotl3DScene({ phase, onReady, ...model }: Lotl3DSceneProps) {
  const holder = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const l = LIGHT[phase];

  // Only animate while on screen.
  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "120px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const swim = model.mode === "swim";

  return (
    <div ref={holder} style={{ position: "absolute", inset: 0 }}>
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={[1, 1.75]}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
        camera={{ position: [0, swim ? 0 : 0.15, swim ? 9 : 7.2], fov: swim ? 26 : 32 }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          onReady();
        }}
        style={{ pointerEvents: "none" }}
        aria-hidden="true"
      >
        <hemisphereLight args={[l.sky, l.ground, 1.5]} />
        <directionalLight position={[3, 4, 5]} intensity={l.keyI} color={l.key} />
        <directionalLight position={[-4, 1, -3]} intensity={1.1} color={l.rim} />
        <ambientLight intensity={0.35} />
        <LotlModel {...model} baseGlow={l.glow} />
        {!swim && <Bubbles />}
      </Canvas>
    </div>
  );
}

// A few bubbles drifting up around Lotl, each on its own slow loop.
const BUBBLES = [
  { x: 1.5, z: 0.4, r: 0.09, speed: 0.32, off: 0 },
  { x: 1.75, z: 0.1, r: 0.06, speed: 0.4, off: 0.45 },
  { x: -1.6, z: 0.3, r: 0.07, speed: 0.36, off: 0.2 },
  { x: -1.35, z: 0.5, r: 0.05, speed: 0.44, off: 0.7 },
  { x: 1.25, z: 0.6, r: 0.045, speed: 0.5, off: 0.85 },
];

function Bubbles() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    BUBBLES.forEach((b, i) => {
      const m = refs.current[i];
      if (!m) return;
      const p = (t * b.speed * 0.25 + b.off) % 1; // 0..1 through the rise
      m.position.set(b.x + Math.sin(t * 1.3 + i) * 0.08, -1.2 + p * 3.4, b.z);
      const s = b.r * (0.6 + p * 0.6) * (p > 0.9 ? (1 - p) * 10 : 1);
      m.scale.setScalar(Math.max(0.0001, s));
    });
  });
  return (
    <>
      {BUBBLES.map((b, i) => (
        <mesh key={i} ref={(el) => { refs.current[i] = el; }}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshPhysicalMaterial color="#eaf7ff" transparent opacity={0.55} roughness={0.05} clearcoat={1} />
        </mesh>
      ))}
    </>
  );
}
