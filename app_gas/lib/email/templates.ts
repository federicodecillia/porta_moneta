type SupplierEmailInput = {
  cycleTitle: string;
  pickupDate: Date | null;
  grandTotal: number;
  itemCount: number;
};

const formatPickup = (d: Date): string =>
  d.toLocaleString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatEur = (n: number): string => n.toFixed(2).replace(".", ",");

export function supplierOrderEmail(input: SupplierEmailInput): {
  subject: string;
  text: string;
} {
  const { cycleTitle, pickupDate, grandTotal, itemCount } = input;
  const subject = `Ordine GAS Porta Moneta — ${cycleTitle}`;
  const pickupLine = pickupDate
    ? `Data ritiro prevista: ${formatPickup(pickupDate)}.`
    : "Data ritiro: da concordare.";
  const text = `Buongiorno,

in allegato il riepilogo dell'ordine del GAS Porta Moneta per il ciclo "${cycleTitle}".

Totale: ${formatEur(grandTotal)} euro su ${itemCount} ${itemCount === 1 ? "prodotto" : "prodotti"}.
${pickupLine}

Grazie,
APS Porta Moneta — GAS frutta e verdura
`;
  return { subject, text };
}
