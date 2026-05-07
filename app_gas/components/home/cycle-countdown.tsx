"use client";

import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";

type Props = {
  title: string;
  orderCloseAt: string;
  orderOpenAt: string;
  pickupDate: string | null;
  pickupEndTime: string | null;
  pickup2Date: string | null;
  pickup2EndTime: string | null;
};

function computeCountdown(closeAt: string, openAt: string, now: Date) {
  const close = new Date(closeAt);
  const open = new Date(openAt);
  const remaining = Math.max(0, close.getTime() - now.getTime());
  const totalMs = close.getTime() - open.getTime();
  const pct = totalMs > 0 ? Math.min(100, Math.max(0, Math.round(((now.getTime() - open.getTime()) / totalMs) * 100))) : 100;
  const days = Math.floor(remaining / 86_400_000);
  const hrs = Math.floor((remaining % 86_400_000) / 3_600_000);
  const mins = Math.floor((remaining % 3_600_000) / 60_000);
  const hoursLeft = Math.floor(remaining / 3_600_000);
  return { days, hrs, mins, hoursLeft, pct };
}

function formatPickupSlot(date: string, endTime: string | null): string {
  const d = new Date(date);
  const dateStr = d.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" });
  const hasStartTime = d.getHours() !== 0 || d.getMinutes() !== 0;
  if (!hasStartTime) return dateStr;
  const startStr = d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  return endTime ? `${dateStr} · ${startStr}–${endTime}` : `${dateStr} · ${startStr}`;
}

export function CycleCountdown({ title, orderCloseAt, orderOpenAt, pickupDate, pickupEndTime, pickup2Date, pickup2EndTime }: Props) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const { days, hrs, mins, hoursLeft, pct } = computeCountdown(
    orderCloseAt,
    orderOpenAt,
    now ?? new Date(orderCloseAt),
  );

  const danger = hoursLeft <= 12;

  return (
    <div className="mb-[14px] rounded-[18px] border border-pm-border bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-[18px]">
      <div className="mb-[14px] flex items-start justify-between">
        <div>
          <div className="text-[16px] font-extrabold tracking-[-0.02em] text-pm-near-black leading-snug">
            {title}
          </div>
          <div className="mt-[3px] space-y-[2px]">
            <div className="font-mono text-[10px] text-pm-gray">
              Chiude: {formatDateTime(orderCloseAt)}
            </div>
            {pickupDate && (
              <div className="font-mono text-[10px] text-pm-gray">
                {pickup2Date ? "Ritiro 1: " : "Ritiro: "}
                {formatPickupSlot(pickupDate, pickupEndTime)}
              </div>
            )}
            {pickup2Date && (
              <div className="font-mono text-[10px] text-pm-gray">
                Ritiro 2: {formatPickupSlot(pickup2Date, pickup2EndTime)}
              </div>
            )}
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-pm-teal/20 bg-pm-teal-light px-2.5 py-0.5 font-mono text-[10px] font-semibold text-pm-teal">
          <span className="h-1.5 w-1.5 rounded-full bg-pm-teal opacity-75" />
          Aperto
        </span>
      </div>

      <div className="mb-[14px] flex gap-2">
        {[
          { num: days, unit: "Giorni" },
          { num: hrs, unit: "Ore" },
          { num: mins, unit: "Min" },
        ].map(({ num, unit }) => (
          <div
            key={unit}
            className="min-w-[62px] rounded-[10px] bg-black/[0.06] px-[14px] py-[9px] text-center"
          >
            <div className="font-mono text-[22px] font-semibold leading-none text-pm-near-black">
              {num}
            </div>
            <div className="mt-[3px] font-mono text-[9px] uppercase tracking-[0.08em] text-pm-gray-light">
              {unit}
            </div>
          </div>
        ))}
      </div>

      <div className="h-[3px] overflow-hidden rounded-full bg-black/[0.07]">
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${danger ? "bg-pm-red" : "bg-pm-teal"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-[5px] font-mono text-[10px] text-pm-gray-light">
        {hoursLeft > 0 ? `${hoursLeft} ore rimanenti` : "Chiusura imminente"}
      </div>

      <div className="mt-3">
        <Link
          href="/ordine"
          className="inline-flex w-full items-center justify-center rounded-full bg-pm-orange px-[22px] py-[14px] text-sm font-bold text-white transition-[opacity,transform] duration-150 active:scale-[0.98]"
        >
          Vai all&apos;ordine →
        </Link>
      </div>
    </div>
  );
}
