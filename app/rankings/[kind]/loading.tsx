import { Skeleton } from "@/components/ui/skeleton";

export default function RankingLoading() {
  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-[90rem] px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-6 w-full max-w-2xl" />
      </div>
      <Skeleton className="mt-10 h-[36rem] w-full rounded-xl" />
    </main>
  );
}
