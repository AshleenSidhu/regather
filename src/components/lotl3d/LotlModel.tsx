"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export type Lotl3DMood = "idle" | "happy";
export type Lotl3DMode = "stand" | "swim";

export type LotlModelProps = {
  mood: Lotl3DMood;
  mode: Lotl3DMode;
  /** 0..1, read every frame. Drives the gill glow (the breathing exercise). */
  glowRef?: React.RefObject<number>;
  /** Pointer position in -1..1 (window space), read every frame. Lotl looks toward it. */
  pointerRef?: React.RefObject<{ x: number; y: number }>;
  /** Extra resting glow, e.g. at night Lotl's gills glow a little on their own. */
  baseGlow: number;
};

// Lotl's own colours (match components/lotl/Lotl.tsx).
const C = {
  body: "#fbc6d2",
  belly: "#fff0f3",
  gill: "#f07d98",
  gillTip: "#fbb7c6",
  limb: "#f8bccb",
  fin: "#fde0e7",
  eye: "#1f2847",
  cheek: "#f37f9a",
  mouth: "#d2647f",
};

const GILL_TILTS = [0.62, 0.05, -0.55]; // top, middle, bottom gill on each side

/**
 * Lotl in 3D, built from soft primitives so it stays tiny (no model file to download).
 * Round head, three feathery gills a side, a little body, paddling legs and a tail that
 * swishes in a wave. Front faces +z.
 */
export function LotlModel({ mood, mode, glowRef, pointerRef, baseGlow }: LotlModelProps) {
  const root = useRef<THREE.Group>(null);
  const turn = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null);
  const gills = useRef<(THREE.Group | null)[]>([]);
  const tail = useRef<(THREE.Group | null)[]>([]);
  const legs = useRef<(THREE.Group | null)[]>([]);
  const arms = useRef<(THREE.Group | null)[]>([]);
  const nextBlink = useRef(2.5);
  // the gill materials, reached through a mesh so the glow can change every frame
  const glowMats = useRef<{ gill?: THREE.MeshPhysicalMaterial; tip?: THREE.MeshPhysicalMaterial }>({});
  const viewport = useThree((s) => s.viewport);

  const mats = useMemo(() => {
    const soft = (color: string, extra: Partial<THREE.MeshPhysicalMaterialParameters> = {}) =>
      new THREE.MeshPhysicalMaterial({ color, roughness: 0.55, sheen: 0.7, sheenColor: new THREE.Color("#fff4f6"), sheenRoughness: 0.5, ...extra });
    return {
      body: soft(C.body),
      belly: soft(C.belly, { roughness: 0.7 }),
      limb: soft(C.limb),
      fin: soft(C.fin, { transparent: true, opacity: 0.85 }),
      gill: soft(C.gill, { emissive: new THREE.Color("#ff8fab"), emissiveIntensity: 0.15 }),
      gillTip: soft(C.gillTip, { emissive: new THREE.Color("#ffb3c4"), emissiveIntensity: 0.15 }),
      eye: new THREE.MeshPhysicalMaterial({ color: C.eye, roughness: 0.15, clearcoat: 1 }),
      shine: new THREE.MeshBasicMaterial({ color: "#ffffff" }),
      cheek: new THREE.MeshBasicMaterial({ color: C.cheek, transparent: true, opacity: 0.45, depthWrite: false }),
      mouth: new THREE.MeshBasicMaterial({ color: C.mouth }),
    };
  }, []);

  const swim = mode === "swim";
  // In swim mode the model is scaled to fit the lane it swims in.
  const fit = swim ? Math.min(viewport.height / 2.9, 1) : 1;
  const range = swim ? Math.max(0, viewport.width / 2 - 1.5 * fit) : 0;

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const glow = Math.min(1, Math.max(0, (glowRef?.current ?? 0) + baseGlow));
    const happy = mood === "happy";
    const k = 1 - Math.exp(-dt * 4); // frame-rate independent easing

    if (root.current) {
      const bob = Math.sin(t * 1.3) * 0.07;
      const hop = happy ? Math.abs(Math.sin(t * 2.6)) * 0.22 * (0.5 + 0.5 * Math.sin(t * 0.7)) : 0;
      if (swim) {
        const speed = 0.16;
        root.current.position.x = Math.sin(t * speed) * range;
        root.current.position.y = bob * 0.6 + Math.sin(t * 1.9) * 0.05;
      } else {
        root.current.position.y = bob + hop;
        root.current.rotation.z = Math.sin(t * 0.9) * (happy ? 0.08 : 0.035);
      }
    }

    if (turn.current) {
      let ty = 0;
      let tx = 0;
      if (swim) {
        // face the way it's swimming, turned a little toward us so the face shows
        const dir = Math.cos(t * 0.16) >= 0 ? 1 : -1;
        ty = dir * (Math.PI / 2 - 0.55);
        tx = 0.05;
      } else {
        // a slow, curious look around, plus following the pointer when there is one
        ty = Math.sin(t * 0.35) * 0.3 + (pointerRef?.current?.x ?? 0) * 0.45;
        tx = Math.sin(t * 0.5 + 1) * 0.06 - (pointerRef?.current?.y ?? 0) * 0.22;
      }
      turn.current.rotation.y += (ty - turn.current.rotation.y) * (swim ? 1 - Math.exp(-dt * 2) : k);
      turn.current.rotation.x += (tx - turn.current.rotation.x) * k;
    }

    if (head.current && !swim) head.current.rotation.z = Math.sin(t * 0.8 + 1) * 0.04;

    // blink every few seconds; happy Lotl squints
    if (eyes.current) {
      if (t > nextBlink.current) nextBlink.current = t + 3.5 + Math.random() * 3;
      const closing = nextBlink.current - t < 0.14;
      const open = happy ? 0.45 : 1;
      const target = closing ? 0.08 : open;
      eyes.current.scale.y += (target - eyes.current.scale.y) * (closing ? 0.6 : 0.25);
    }

    gills.current.forEach((g, i) => {
      if (!g) return;
      const side = i < 3 ? -1 : 1;
      const n = i % 3;
      const sway = Math.sin(t * (happy ? 3.2 : 2.1) + n * 0.8 + (side > 0 ? 0.4 : 0)) * (0.12 + glow * 0.05);
      g.rotation.y = sway;
      g.rotation.z = GILL_TILTS[n] + Math.sin(t * 1.4 + n) * 0.05;
      const s = 1 + glow * 0.16;
      g.scale.set(s, s, s);
    });
    if (glowMats.current.gill) glowMats.current.gill.emissiveIntensity = 0.12 + glow * 1.1;
    if (glowMats.current.tip) glowMats.current.tip.emissiveIntensity = 0.12 + glow * 1.3;

    const tailSpeed = swim ? 5 : 2.6;
    tail.current.forEach((seg, i) => {
      if (seg) seg.rotation.y = Math.sin(t * tailSpeed - i * 0.75) * (swim ? 0.32 : 0.18);
    });
    arms.current.forEach((arm, i) => {
      if (!arm) return;
      const side = i === 0 ? -1 : 1;
      arm.rotation.z = side * (0.75 + Math.sin(t * (swim ? 4 : 1.6) + i) * (swim ? 0.35 : 0.12));
    });
    legs.current.forEach((leg, i) => {
      if (leg) leg.rotation.x = Math.sin(t * (swim ? 5 : 2) + i * Math.PI * 0.5) * (swim ? 0.6 : 0.25);
    });
  });

  return (
    <group ref={root} scale={fit}>
      <group ref={turn}>
        {/* body */}
        <group position={[0, -0.78, -0.3]}>
          <mesh material={mats.body} scale={[0.72, 0.6, 0.95]}>
            <sphereGeometry args={[1, 40, 28]} />
          </mesh>
          <mesh material={mats.belly} position={[0, -0.12, 0.42]} scale={[0.5, 0.4, 0.5]}>
            <sphereGeometry args={[1, 28, 20]} />
          </mesh>

          {/* legs: front pair, back pair */}
          {[
            // attach points sit just inside the body's surface, so limbs grow out of it
            [-0.5, -0.3, 0.42],
            [0.5, -0.3, 0.42],
            [-0.45, -0.3, -0.45],
            [0.45, -0.3, -0.45],
          ].map(([x, y, z], i) => (
            <group key={i} position={[x, y, z]} ref={(el) => { legs.current[i] = el; }}>
              <mesh material={mats.limb} position={[0, -0.07, 0.04]} scale={[0.18, 0.16, 0.26]}>
                <sphereGeometry args={[1, 18, 14]} />
              </mesh>
            </group>
          ))}

          {/* little arms on each side, anchored inside the body so they grow out of it */}
          {[-1, 1].map((side, i) => (
            <group key={side} position={[side * 0.6, 0.02, 0.3]}>
              <group ref={(el) => { arms.current[i] = el; }} rotation={[0, 0, side * 0.75]}>
                <mesh material={mats.limb} position={[0, -0.15, 0]} scale={[0.13, 0.24, 0.14]}>
                  <sphereGeometry args={[1, 18, 14]} />
                </mesh>
              </group>
            </group>
          ))}

          {/* tail: a chain of segments that swish in a wave, with a soft fin */}
          <group position={[0, -0.05, -0.85]}>
            <TailChain segments={4} mats={mats} refs={tail} />
          </group>
        </group>

        {/* head */}
        <group ref={head} position={[0, 0.28, 0]}>
          <mesh material={mats.body} scale={[1.22, 0.94, 1]}>
            <sphereGeometry args={[1, 48, 32]} />
          </mesh>

          {/* gills: three feathery fronds a side */}
          {[-1, 1].map((side) =>
            [0, 1, 2].map((n) => (
              <group key={`${side}${n}`} position={[side * 1.02, 0.42 - n * 0.36, -0.18]} scale={[side, 1, 1]}>
                <group ref={(el) => { gills.current[(side < 0 ? 0 : 3) + n] = el; }} rotation={[0, 0, GILL_TILTS[n]]}>
                  <mesh
                    material={mats.gill}
                    position={[0.34, 0, 0]}
                    rotation={[0, 0, -Math.PI / 2]}
                    ref={(m) => { if (m) glowMats.current.gill = m.material as THREE.MeshPhysicalMaterial; }}
                  >
                    <capsuleGeometry args={[0.075, 0.5, 4, 12]} />
                  </mesh>
                  {[0.16, 0.3, 0.44, 0.58, 0.7].map((x, j) => (
                    <mesh
                      key={j}
                      material={j > 2 ? mats.gillTip : mats.gill}
                      position={[x, j % 2 ? 0.09 : -0.09, 0]}
                      scale={[0.11, 0.07, 0.07]}
                    >
                      <sphereGeometry args={[1, 14, 10]} />
                    </mesh>
                  ))}
                  <mesh
                    material={mats.gillTip}
                    position={[0.8, 0, 0]}
                    scale={0.1}
                    ref={(m) => { if (m) glowMats.current.tip = m.material as THREE.MeshPhysicalMaterial; }}
                  >
                    <sphereGeometry args={[1, 14, 10]} />
                  </mesh>
                </group>
              </group>
            )),
          )}

          {/* face */}
          <group ref={eyes} position={[0, 0.12, 0]}>
            {[-1, 1].map((s) => (
              <group key={s} position={[s * 0.43, 0, 0.84]}>
                <mesh material={mats.eye} scale={0.13}>
                  <sphereGeometry args={[1, 20, 16]} />
                </mesh>
                <mesh material={mats.shine} position={[0.04, 0.05, 0.1]} scale={0.042}>
                  <sphereGeometry args={[1, 10, 8]} />
                </mesh>
              </group>
            ))}
          </group>
          {[-1, 1].map((s) => (
            <mesh key={s} material={mats.cheek} position={[s * 0.66, -0.06, 0.84]} rotation={[0, s * 0.6, 0]} scale={[0.16, 0.09, 0.04]}>
              <sphereGeometry args={[1, 18, 12]} />
            </mesh>
          ))}
          <mesh material={mats.mouth} position={[0, -0.08, 1.0]} rotation={[0.1, 0, Math.PI]}>
            <torusGeometry args={[mood === "happy" ? 0.14 : 0.11, 0.026, 8, 24, Math.PI]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function TailChain({
  segments,
  mats,
  refs,
}: {
  segments: number;
  mats: { body: THREE.Material; fin: THREE.Material };
  refs: React.RefObject<(THREE.Group | null)[]>;
}) {
  // Nested groups so each segment's swish adds to the one before: a real wave.
  const build = (i: number): React.ReactNode => {
    if (i >= segments) return null;
    const s = 1 - i * 0.2;
    return (
      <group ref={(el) => { refs.current[i] = el; }} position={[0, 0, i === 0 ? 0 : -0.42 * (s + 0.2)]}>
        <mesh material={mats.body} scale={[0.36 * s, 0.32 * s, 0.42 * s]} position={[0, 0, -0.2 * s]}>
          <sphereGeometry args={[1, 24, 16]} />
        </mesh>
        <mesh material={mats.fin} scale={[0.05, 0.36 * s + 0.08, 0.4 * s]} position={[0, 0.06, -0.24 * s]}>
          <sphereGeometry args={[1, 16, 12]} />
        </mesh>
        {build(i + 1)}
      </group>
    );
  };
  return <>{build(0)}</>;
}
