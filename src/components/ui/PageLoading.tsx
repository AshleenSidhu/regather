import { Lotl } from "@/components/lotl/Lotl";

export function PageLoading({ label = "Just a moment…" }: { label?: string }) {
  return (
    <div className="grid flex-1 place-items-center py-24 text-center" role="status" aria-live="polite">
      <div>
        <Lotl className="mx-auto h-24 w-auto" bubbles title="" />
        <p className="mt-2 text-on-sky-soft">{label}</p>
      </div>
    </div>
  );
}
