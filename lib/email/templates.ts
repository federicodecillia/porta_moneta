import { brand } from "@/lib/brand";
import { t } from "@/lib/i18n";
import { formatMoney, formatDateTime } from "@/lib/i18n/format";

type SupplierEmailInput = {
  cycleTitle: string;
  pickupDate: Date | null;
  grandTotal: number;
  productCount: number;
  memberCount: number;
};

const formatPickup = (d: Date): string =>
  formatDateTime(d, {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

export function supplierOrderEmail(input: SupplierEmailInput): {
  subject: string;
  text: string;
} {
  const { cycleTitle, pickupDate, grandTotal, productCount, memberCount } = input;
  const subject = t.email.supplierOrderSubject(brand.appName, cycleTitle);
  const pickupStr = pickupDate ? formatPickup(pickupDate) : null;
  const grandTotalStr = formatMoney(grandTotal);
  const text = t.email.supplierOrderBody({
    appName: brand.appName,
    orgName: brand.orgName,
    cycleTitle,
    pickupDate: pickupStr,
    grandTotal: grandTotalStr,
    productCount,
    memberCount,
  });
  return { subject, text };
}
