import { cn } from "@/lib/utils";
import { TD, TR } from "@/components/ui/table";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted/70", className)} />;
}

export function SkeletonTableRow({ columns = 5 }: { columns?: number }) {
  const widths = ["w-40", "w-24", "w-20", "w-28", "w-16", "w-32"];
  return (
    <TR>
      {Array.from({ length: columns }).map((_, i) => (
        <TD key={i}>
          <Skeleton className={cn("h-4", widths[i % widths.length])} />
        </TD>
      ))}
    </TR>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center gap-4 p-5">
        <Skeleton className="size-11 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  );
}
