"use client";

import { Axolotl } from "@/components/axolotl/Axolotl";
import { Lotl3D } from "@/components/lotl3d/Lotl3D";

/** Lotl swimming back and forth in the pond: 3D when it can, the SVG swimmer otherwise. */
export function PondSwimmer() {
  return (
    <Lotl3D
      mode="swim"
      title=""
      className="absolute inset-x-0 bottom-0 h-[62%]"
      fallback={
        <div className="swim-lane absolute inset-x-0 bottom-1 h-[74%]" style={{ "--swim": "34s", "--w": "96px" } as React.CSSProperties}>
          <div className="swimmer bottom-0 w-24">
            <div>
              <Axolotl bubbles title="" />
            </div>
          </div>
        </div>
      }
    />
  );
}
