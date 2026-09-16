import Link from "next/link";
import { SearchX } from "lucide-react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-[90rem] place-items-center px-4 py-16 sm:px-6 lg:px-10">
      <Empty className="w-full max-w-2xl border border-border bg-card/45">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchX aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>Kaggler not found</EmptyTitle>
          <EmptyDescription>
            This profile is not included in the current KaggleScope dataset.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link
            href="/rankings/overall"
            className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 font-medium text-primary-foreground hover:bg-primary/90"
          >
            Browse overall ranking
          </Link>
        </EmptyContent>
      </Empty>
    </main>
  );
}
