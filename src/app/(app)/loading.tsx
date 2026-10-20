export default function Loading() {
  return (
    <div role="status" className="flex min-h-[60vh] items-center justify-center gap-3 text-sm text-zinc-400">
      <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none" />
      Loading your space…
    </div>
  );
}
