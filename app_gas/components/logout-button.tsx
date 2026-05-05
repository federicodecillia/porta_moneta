"use client";

import { Button } from "@/components/ui/button";
import { confirm } from "@/components/ui/confirm-dialog";

type Props = {
  action: () => Promise<void>;
};

export function LogoutButton({ action }: Props) {
  async function handleClick() {
    const ok = await confirm({
      title: "Uscire?",
      message: "Verrai disconnesso da Porta Moneta.",
      confirmLabel: "Esci",
      cancelLabel: "Annulla",
    });
    if (ok) await action();
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleClick}>
      Logout
    </Button>
  );
}
