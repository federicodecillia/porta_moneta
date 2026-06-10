export function DemoBanner() {
  if (process.env.DEMO_MODE !== "true") return null;
  return (
    <div className="border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-xs font-medium text-amber-900">
      🧪 Ambiente demo: dati fittizi, reset automatico ogni notte.
    </div>
  );
}
