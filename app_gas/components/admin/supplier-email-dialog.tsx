"use client";

import { useEffect, useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  adminGetSupplierEmailDefaults,
  adminSendSupplierEmail,
} from "@/lib/actions/admin";
import { toast } from "@/components/ui/toast";

// Replaces the generic confirm() for "📧 Fornitore". Loads defaults on
// open (To / From / CC / Subject) and lets the admin tweak each field
// before sending. The acting-admin CC + gas@portamoneta.org archive are
// pre-filled but can be edited or removed if a specific send needs a
// different audience.

export function SupplierEmailDialog({
  open,
  onOpenChange,
  cycleId,
  cycleTitle,
  onSent,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  cycleId: string;
  cycleTitle: string;
  onSent?: (recipient: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [sending, startSending] = useTransition();
  const [supplierName, setSupplierName] = useState<string>("");
  const [to, setTo] = useState("");
  const [from, setFrom] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    adminGetSupplierEmailDefaults(cycleId).then((r) => {
      setLoading(false);
      if ("error" in r) {
        toast.error(r.error);
        onOpenChange(false);
        return;
      }
      setSupplierName(r.supplierName);
      setTo(r.to);
      setFrom(r.from);
      setCc(r.cc.join(", "));
      setSubject(r.subject);
    });
  }, [open, cycleId, onOpenChange]);

  function handleSend() {
    const ccList = cc
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!to.trim()) {
      toast.error("Indirizzo destinatario obbligatorio");
      return;
    }
    if (!subject.trim()) {
      toast.error("Oggetto obbligatorio");
      return;
    }
    startSending(async () => {
      const r = await adminSendSupplierEmail(cycleId, {
        to: to.trim(),
        from: from.trim() || undefined,
        cc: ccList,
        subject: subject.trim(),
      });
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      toast.success(`Mail inviata a ${r.recipient}`);
      onSent?.(r.recipient);
      onOpenChange(false);
    });
  }

  const labelCls =
    "block text-[10px] font-semibold uppercase tracking-wide text-pm-gray";
  const inputCls =
    "w-full rounded-lg border border-pm-border bg-white px-2.5 py-1.5 text-[12px] font-mono text-pm-near-black focus:outline-none focus:ring-2 focus:ring-pm-orange/30 disabled:bg-pm-warm-white";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[150] bg-black/30 backdrop-blur-[4px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-[151] w-[92%] max-w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-pm-border bg-white p-5 shadow-[0_8px_32px_rgba(45,43,41,0.15)] data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:zoom-out-95"
        >
          <Dialog.Title className="mb-1 text-[15px] font-bold text-pm-near-black">
            Invia ordine{supplierName ? ` a ${supplierName}` : ""}
          </Dialog.Title>
          <p className="mb-4 text-[11px] text-pm-gray">
            Verifica i campi prima di inviare. Puoi modificarli per questa
            singola spedizione.
          </p>

          {loading ? (
            <div className="py-8 text-center text-[12px] text-pm-gray">
              Caricamento…
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Destinatario</label>
                <input
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  disabled={sending}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Mittente</label>
                <input
                  type="email"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  disabled={sending}
                  placeholder="default da MAIL_FROM"
                  className={inputCls}
                />
                <p className="mt-0.5 text-[10px] text-pm-gray-light">
                  Deve essere un indirizzo di un dominio verificato in Resend.
                </p>
              </div>
              <div>
                <label className={labelCls}>CC (separati da virgola)</label>
                <textarea
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  disabled={sending}
                  rows={2}
                  className={`${inputCls} resize-none`}
                />
              </div>
              <div>
                <label className={labelCls}>Oggetto</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={sending}
                  className={inputCls}
                />
              </div>
              <p className="text-[10px] text-pm-gray-light">
                Ciclo: <span className="font-mono">{cycleTitle}</span>
              </p>
            </div>
          )}

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={sending}
              className="flex-1 rounded-xl border border-pm-border bg-white py-2.5 text-[13px] font-bold text-pm-gray active:scale-95 disabled:opacity-50"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={loading || sending}
              autoFocus
              className="flex-1 rounded-xl bg-pm-near-black py-2.5 text-[13px] font-bold text-white shadow-lg active:scale-95 disabled:opacity-50"
            >
              {sending ? "Invio…" : "Invia ora"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
