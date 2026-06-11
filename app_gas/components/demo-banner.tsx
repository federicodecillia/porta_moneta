import { t } from "@/lib/i18n";

export function DemoBanner() {
  if (process.env.DEMO_MODE !== "true") return null;
  return (
    <div className="border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-xs font-medium text-amber-900">
      {t.demo.banner}
    </div>
  );
}
