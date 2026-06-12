"use client";

import { brand } from "@/lib/brand";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { confirm } from "@/components/ui/confirm-dialog";

type Props = {
  action: () => Promise<void>;
};

export function LogoutButton({ action }: Props) {
  async function handleClick() {
    const ok = await confirm({
      title: t.logout.confirmTitle,
      message: t.logout.confirmMessage(brand.appName),
      confirmLabel: t.logout.confirmButton,
      cancelLabel: t.common.cancel,
    });
    if (ok) await action();
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleClick}>
      Logout
    </Button>
  );
}
