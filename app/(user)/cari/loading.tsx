import { DaftarSkeleton } from "@/components/cari/HasilPencarian";
import { Skeleton } from "@/components/ui/Skeleton";

// Shown while the first page of results is being rendered on the server.
// Same header height and card boxes as the real page, so nothing shifts.
export default function MemuatCari() {
  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,720px)_minmax(0,1fr)]">
      <div>
        <div className="sticky top-0 z-30 border-b border-biru-100 bg-putih lg:top-16">
          <div className="flex h-14 items-center gap-2 px-4">
            <Skeleton className="size-10 rounded-full lg:hidden" />
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="flex gap-2 px-4 pb-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-full" />
            ))}
          </div>
          <div className="flex items-center justify-between px-4 pb-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="px-4 py-4">
          <DaftarSkeleton />
        </div>
      </div>
      <aside className="hidden bg-biru-100 lg:block lg:sticky lg:top-16 lg:h-[calc(100dvh-4rem)]" aria-hidden="true" />
    </div>
  );
}
