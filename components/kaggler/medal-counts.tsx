import { Medal } from "lucide-react";
import type { Kaggler } from "@/seed/kagglers";

export function MedalCounts({ medals }: { medals: Kaggler["medals"] }) {
  return (
    <div
      className="flex items-center gap-3 font-mono text-sm"
      aria-label={`${medals.gold} gold, ${medals.silver} silver, ${medals.bronze} bronze medals`}
    >
      <span className="flex items-center gap-1 text-medal-gold">
        <Medal className="size-3.5" aria-hidden="true" /> {medals.gold}
      </span>
      <span className="flex items-center gap-1 text-medal-silver">
        <Medal className="size-3.5" aria-hidden="true" /> {medals.silver}
      </span>
      <span className="flex items-center gap-1 text-medal-bronze">
        <Medal className="size-3.5" aria-hidden="true" /> {medals.bronze}
      </span>
    </div>
  );
}
