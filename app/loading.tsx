export default function Loading() {
  // Mirror AppShell's wrapper exactly (same max-widths, frame padding and
  // card chrome) so the streamed page doesn't shift when it replaces this.
  return (
    <div className="min-h-screen bg-brand-frame sm:p-6">
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-brand-warm-white sm:min-h-[calc(100vh-3rem)] sm:overflow-hidden sm:rounded-xl sm:border sm:border-brand-border sm:shadow-sm md:max-w-[640px] lg:max-w-[960px]">
        <div className="border-b border-brand-border px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="h-[26px] w-28 animate-pulse rounded-md bg-black/[0.05]" />
            <div className="h-[26px] w-20 animate-pulse rounded-full bg-black/[0.04]" />
          </div>
          <div className="mt-3 h-3 w-40 animate-pulse rounded bg-black/[0.04]" />
        </div>
        <div className="flex-1 px-5 py-4 pb-[calc(var(--spacing-nav-h)+1rem)]">
          <div className="space-y-[14px]">
            <div className="h-[140px] animate-pulse rounded-[18px] bg-black/[0.05]" />
            <div className="h-[100px] animate-pulse rounded-[18px] bg-black/[0.04]" />
            <div className="h-[80px] animate-pulse rounded-[18px] bg-black/[0.03]" />
          </div>
        </div>
      </div>
    </div>
  );
}
