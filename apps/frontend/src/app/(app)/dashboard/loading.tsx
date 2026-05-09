import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 pb-32">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-2/3" />
      </div>

      <Skeleton className="h-28 w-full rounded-xl" />

      <div className="space-y-3">
        <Skeleton className="h-3 w-40" />
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>

      <div className="space-y-3">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-[660px] w-full rounded-xl" />
      </div>
    </div>
  );
}
