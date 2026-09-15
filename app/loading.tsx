import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-[90rem] px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="space-y-5">
          <Skeleton className="h-8 w-64 rounded-full" />
          <Skeleton className="h-16 w-full max-w-xl" />
          <Skeleton className="h-7 w-full max-w-2xl" />
          <Skeleton className="h-16 w-full max-w-2xl rounded-2xl" />
        </div>
        <Skeleton className="h-[30rem] rounded-xl" />
      </div>
    </main>
  );
}
