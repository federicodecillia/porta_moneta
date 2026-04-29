export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col" style={{ background: "var(--warm-wh)", minHeight: "100dvh" }}>
      <div className="flex-1 overflow-y-auto p-4 pb-[calc(82px+16px)]">
        <div className="space-y-[14px]">
          <div className="h-[140px] animate-pulse rounded-[18px] bg-black/[0.05]" />
          <div className="h-[100px] animate-pulse rounded-[18px] bg-black/[0.04]" />
          <div className="h-[80px] animate-pulse rounded-[18px] bg-black/[0.03]" />
        </div>
      </div>
    </div>
  );
}
