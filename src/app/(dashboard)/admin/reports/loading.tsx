import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="rounded-md border bg-muted/30 px-4 py-3 flex gap-4">
        <Skeleton className="h-9 w-52" />
        <Skeleton className="h-9 w-44" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-md border px-4 py-3">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="mt-1 h-3 w-44" />
          </div>
        ))}
      </div>
    </div>
  );
}
