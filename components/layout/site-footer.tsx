import { Brand } from "@/components/layout/brand";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/75">
      <div className="mx-auto flex max-w-[90rem] flex-col gap-5 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
        <Brand />
        <div className="text-sm text-muted-foreground sm:text-right">
          <p>Independent Kaggle analytics. Preview data only.</p>
          <p className="mt-1">Not affiliated with Kaggle or Google.</p>
        </div>
      </div>
    </footer>
  );
}
