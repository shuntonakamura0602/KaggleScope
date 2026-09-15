import type { Kaggler } from "@/seed/kagglers";

export function SpecialtyBars({ kaggler }: { kaggler: Kaggler }) {
  return (
    <div className="space-y-5">
      {kaggler.specialties.map((specialty) => (
        <div key={specialty.name}>
          <div className="mb-2 flex items-center justify-between gap-4">
            <span className="font-medium">{specialty.name}</span>
            <span className="font-mono text-sm text-primary">
              {specialty.score.toFixed(1)}
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-secondary"
            role="meter"
            aria-label={`${specialty.name} score`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={specialty.score}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-chart-2"
              style={{ width: `${specialty.score}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
