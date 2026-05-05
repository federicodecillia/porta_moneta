import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center p-6 text-center"
      style={{ background: "var(--frame)" }}
    >
      <div className="w-full max-w-[320px] rounded-[18px] border border-[rgba(88,89,91,0.1)] bg-white p-6 shadow-sm">
        <p className="font-mono text-[40px] font-bold text-[#adadad]">404</p>
        <p className="mt-1 text-[15px] font-semibold text-[#2d2b29]">Pagina non trovata</p>
        <Link
          href="/"
          className="mt-4 block w-full rounded-xl bg-[#f5a623] py-2.5 text-[13px] font-bold text-white"
        >
          Torna alla Home
        </Link>
      </div>
    </div>
  );
}
