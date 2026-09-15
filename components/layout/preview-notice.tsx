import { Info } from "lucide-react";

export function PreviewNotice() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-chart-2/20 bg-chart-2/5 px-4 py-3 text-sm text-muted-foreground">
      <Info
        className="mt-0.5 size-4 shrink-0 text-chart-2"
        aria-hidden="true"
      />
      <p>
        This page uses fictional preview data to validate the interface. Scores
        are not official Kaggle metrics.
      </p>
    </div>
  );
}
