"use client";

import { useState, useTransition } from "react";
import { toast } from "@/components/ui/toast";
import { adminDeleteMember, adminUpsertMember, type UpsertMemberInput } from "@/lib/actions/admin";
import { getRoleLabel } from "@/lib/utils";

type Member = {
  memberId: string;
  fullName: string;
  email: string;
  aliasEmail: string | null;
  role: string;
  active: boolean;
};

export function SociForm({ member, onClose }: { member?: Member; onClose?: () => void }) {
  const [isPending, startTransition] = useTransition();
  const isEdit = !!member;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: UpsertMemberInput = {
      memberId: member?.memberId,
      fullName: fd.get("fullName") as string,
      email: fd.get("email") as string,
      aliasEmail: (fd.get("aliasEmail") as string) || undefined,
      role: fd.get("role") as string,
      active: fd.get("active") === "true",
    };
    startTransition(async () => {
      try {
        await adminUpsertMember(data);
        toast.success(isEdit ? "Socio aggiornato" : "Socio aggiunto");
        onClose?.();
        if (!isEdit) (e.target as HTMLFormElement).reset();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Errore");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-brand-border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13px] font-bold text-brand-near-black">
          {isEdit ? `Modifica: ${member.fullName}` : "Aggiungi socio"}
        </p>
        {isEdit && onClose && (
          <button type="button" onClick={onClose} className="text-[11px] text-brand-gray">
            ✕ Annulla
          </button>
        )}
      </div>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-brand-gray">
            Nome *
          </label>
          <input
            name="fullName"
            required
            defaultValue={member?.fullName}
            className="w-full rounded-lg border border-brand-border px-3 py-2 text-[13px] text-brand-near-black focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-brand-gray">
            Email *
          </label>
          <input
            name="email"
            type="email"
            required
            defaultValue={member?.email}
            className="w-full rounded-lg border border-brand-border px-3 py-2 text-[13px] text-brand-near-black focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-brand-gray">
            Email secondaria
            <span className="ml-1 font-normal normal-case text-brand-gray-light">(alias login)</span>
          </label>
          <input
            name="aliasEmail"
            type="email"
            defaultValue={member?.aliasEmail ?? ""}
            placeholder="es. nome@gmail.com"
            className="w-full rounded-lg border border-brand-border px-3 py-2 text-[13px] text-brand-near-black focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-brand-gray">
              Ruolo
            </label>
            <select
              name="role"
              defaultValue={member?.role ?? "socio"}
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-[13px] text-brand-near-black focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
            >
              <option value="admin">Admin</option>
              <option value="attivo">Socio</option>
              <option value="socio">Utente</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-brand-gray">
              Stato
            </label>
            <select
              name="active"
              defaultValue={String(member?.active ?? true)}
              className="w-full rounded-lg border border-brand-border px-3 py-2 text-[13px] text-brand-near-black focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
            >
              <option value="true">Attivo</option>
              <option value="false">Inattivo</option>
            </select>
          </div>
        </div>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="mt-4 w-full rounded-xl bg-brand-orange py-2 text-[13px] font-bold text-white disabled:opacity-60"
      >
        {isPending ? "Salvataggio…" : isEdit ? "Aggiorna" : "Aggiungi socio"}
      </button>
    </form>
  );
}

// ── Member list ───────────────────────────────────────────────────────────────

export function SociList({ members }: { members: Member[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [deletingId, startDeleteTransition] = useTransition();

  const query = filter.toLowerCase().trim();
  const visible = query
    ? members.filter(
        (m) =>
          m.fullName.toLowerCase().includes(query) || m.email.toLowerCase().includes(query),
      )
    : members;

  const admins = visible.filter((m) => m.role === "admin");
  const soci = visible.filter((m) => m.role === "attivo");
  const utenti = visible.filter((m) => m.role === "socio");

  function handleDelete(m: Member) {
    if (
      !window.confirm(
        `Eliminare "${m.fullName}"?\n\nOperazione irreversibile. Se ha ordini o movimenti verrà mostrato un errore.`,
      )
    )
      return;
    startDeleteTransition(async () => {
      const result = await adminDeleteMember(m.memberId);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`${m.fullName} eliminato`);
      }
    });
  }

  function renderGroup(label: string, list: Member[], roleColor: string) {
    if (list.length === 0) return null;
    return (
      <div className="mb-4">
        <p className="mb-1 px-1 font-mono text-[10px] uppercase tracking-wider text-brand-gray-light">
          {label} ({list.length})
        </p>
        <div className="divide-y divide-brand-border rounded-xl border border-brand-border bg-white shadow-sm">
          {list.map((m) =>
            editingId === m.memberId ? (
              <div key={m.memberId} className="p-4">
                <SociForm member={m} onClose={() => setEditingId(null)} />
              </div>
            ) : (
              <div key={m.memberId} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-brand-near-black">{m.fullName}</span>
                    {!m.active && (
                      <span className="rounded-full bg-brand-red-light px-1.5 py-0.5 text-[9px] font-bold text-brand-red">
                        inattivo
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[10px] text-brand-gray-light">
                    {m.email}
                    {m.aliasEmail && (
                      <span className="ml-1 text-brand-teal">· {m.aliasEmail}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${roleColor}`}>
                    {getRoleLabel(m.role)}
                  </span>
                  <button
                    onClick={() => setEditingId(m.memberId)}
                    className="rounded-full border border-brand-border px-2.5 py-1 text-[10px] font-semibold text-brand-gray"
                  >
                    Modifica
                  </button>
                  <button
                    onClick={() => handleDelete(m)}
                    disabled={deletingId}
                    className="rounded-full border border-brand-red/30 px-2.5 py-1 text-[10px] font-semibold text-brand-red disabled:opacity-40"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <input
          type="search"
          placeholder="Cerca per nome o email…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full rounded-xl border border-brand-border bg-white px-4 py-2.5 text-[13px] text-brand-near-black placeholder:text-brand-gray-light focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
        />
      </div>
      {renderGroup("Admin", admins, "bg-brand-orange-light text-brand-orange")}
      {renderGroup("Soci", soci, "bg-brand-teal-light text-brand-teal")}
      {renderGroup("Utenti", utenti, "bg-black/[0.05] text-brand-gray")}
      {visible.length === 0 && (
        <div className="py-6 text-center text-[12px] text-brand-gray">Nessun risultato</div>
      )}
    </div>
  );
}
