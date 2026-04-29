import { AppShell } from "@/components/app-shell";
import { FaqAccordion } from "@/components/ui/faq-accordion";
import { getUserRole, requireUserSession } from "@/lib/auth/session";

const STEPS = [
  {
    n: 1,
    title: "Controlla il saldo",
    body: "Nella Home vedi il tuo saldo e lo stato dell'ordine aperto.",
  },
  {
    n: 2,
    title: "Vai all'ordine",
    body: "Tocca il tab Ordine in basso e scegli i prodotti con i pulsanti + e −.",
  },
  {
    n: 3,
    title: "Conferma l'ordine",
    body: 'Premi “Conferma ordine” in basso. Puoi modificarlo finché l\'ordine è aperto.',
  },
  {
    n: 4,
    title: "Storico",
    body: "Nel tab Storico vedi i tuoi ordini passati e tutti i movimenti del saldo.",
  },
  {
    n: 5,
    title: "Ritira e ricarica",
    body: "Vieni a ritirare nel giorno indicato. Per ricaricare il saldo fai un bonifico — la tesoriera lo registra nell'app.",
  },
];

const FAQS = [
  {
    q: "Come è organizzata l'app?",
    a: "L'app è divisa in 4 tab: Home, Ordine, Storico, Guida. Il tab Admin è visibile solo agli amministratori.",
  },
  {
    q: "Chi gestisce prodotti e cicli?",
    a: "Gli amministratori creano i cicli d'ordine, caricano i prodotti dal catalogo dei fornitori, e chiudono i cicli.",
  },
  {
    q: "Quando posso ordinare?",
    a: "Quando c'è un ordine aperto puoi ordinare. La Home mostra i giorni e le ore rimanenti alla chiusura. Oltre quel termine non puoi più modificare l'ordine.",
  },
  {
    q: "Come funziona il saldo?",
    a: "Il saldo è il tuo credito presso l'associazione. Alla chiusura dell'ordine il costo viene addebitato automaticamente. Per ricaricare fai un bonifico sul conto dell'associazione: la tesoriera lo registra e il saldo si aggiorna.",
  },
  {
    q: "Posso modificare l'ordine dopo averlo confermato?",
    a: 'Sì, finché l\'ordine è aperto. Vai al tab Ordine, modifica le quantità e ri-premi "Conferma ordine". L\'ultimo salvataggio sostituisce il precedente.',
  },
  {
    q: "Cosa succede se il saldo è negativo?",
    a: "Puoi comunque ordinare, ma riceverai un avviso. Ricordati di effettuare un bonifico al più presto per coprire il debito.",
  },
  {
    q: "Come aggiungo l'app alla schermata Home?",
    a: 'Su iPhone (Safari): tocca l\'icona di condivisione → "Aggiungi a schermata Home". Su Android (Chrome): tocca i tre puntini → "Aggiungi a schermata Home".',
  },
];

export default async function GuidaPage() {
  const session = await requireUserSession();
  const role = getUserRole(session);

  return (
    <AppShell email={session.user.email} isAdmin={role === "admin"}>
      <h1 className="mb-5 text-[20px] font-black tracking-[-0.03em] text-pm-near-black">
        Come funziona
      </h1>

      {/* How-to steps */}
      <div className="mb-6 rounded-[18px] border border-pm-teal/20 bg-pm-teal-light p-[18px]">
        {STEPS.map((step, i) => (
          <div
            key={step.n}
            className={`flex gap-3 ${i < STEPS.length - 1 ? "mb-3" : ""}`}
          >
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-pm-teal font-mono text-[11px] font-bold text-white">
              {step.n}
            </div>
            <p className="mt-[3px] text-[14px] leading-[1.5] text-pm-near-black">
              <strong>{step.title}</strong>
              <br />
              {step.body}
            </p>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <h2 className="mb-[14px] text-[18px] font-extrabold tracking-[-0.02em] text-pm-near-black">
        Domande frequenti
      </h2>
      <FaqAccordion faqs={FAQS} />

      {/* Contact card */}
      <div className="mt-6 rounded-[18px] border border-pm-border bg-white p-6 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="mb-[10px] text-[32px]">📬</div>
        <div className="mb-[6px] text-[15px] font-bold text-pm-near-black">Hai altre domande?</div>
        <p className="mb-4 text-[13px] text-pm-gray">
          Scrivici o parla direttamente con la tesoriera al prossimo ritiro.
        </p>
        <a
          href="mailto:info@portamoneta.org"
          className="inline-flex items-center justify-center rounded-full bg-pm-orange px-[22px] py-[14px] text-sm font-bold text-white no-underline transition-[opacity,transform] duration-150 active:scale-[0.98]"
        >
          Contattaci
        </a>
      </div>
    </AppShell>
  );
}
