import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-[90rem] px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
      <div className="flex items-center gap-5">
        <Skeleton className="size-20 rounded-full" />
        <div className="space-y-3">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-11 w-64" />
        </div>
      </div>
      <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-36 rounded-xl" />
        ))}
      </div>
      <Skeleton className="mt-6 h-[30rem] rounded-xl" />
    </main>
  );
}
