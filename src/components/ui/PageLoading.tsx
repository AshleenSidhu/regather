import { Axolotl } from "@/components/axolotl/Axolotl";

export function PageLoading({ label = "Just a moment…" }: { label?: string }) {
  return (
    <div className="grid flex-1 place-items-center py-24 text-center" role="status" aria-live="polite">
      <div>
        <Axolotl className="mx-auto h-24 w-auto" bubbles />
        <p className="mt-2 text-on-sky/80">{label}</p>
      </div>
    </div>
  );
}
