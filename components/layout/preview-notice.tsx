import { Info } from "lucide-react";
import type { DataStatus } from "@/lib/data/kagglers";

export function PreviewNotice({ source, updatedAt }: DataStatus) {
  const isPreview = source === "preview";
  return (
    <div className="flex items-start gap-3 rounded-xl border border-chart-2/20 bg-chart-2/5 px-4 py-3 text-sm text-muted-foreground">
      <Info
        className="mt-0.5 size-4 shrink-0 text-chart-2"
        aria-hidden="true"
      />
      <p>
        {isPreview
          ? "DATABASE_URL is not configured, so this page uses fictional preview data. Scores are not official Kaggle metrics."
          : `Showing processed Meta Kaggle data${updatedAt ? ` calculated ${new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(updatedAt)}` : ""}. KaggleScope scores are unofficial.`}
      </p>
    </div>
  );
}
