import Link from "next/link";
import { brand } from "@/lib/brand";
import { AppShell } from "@/components/app-shell";
import { FaqAccordion } from "@/components/ui/faq-accordion";
import { getUserRole, requireUserSession } from "@/lib/auth/session";
import { loadChangelog, splitInlineBold } from "@/lib/changelog";

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
  {
    n: 6,
    title: "Notifiche",
    body: "Quando un ciclo viene chiuso o un bonifico viene registrato, vedrai un pallino rosso sulla campanella in alto. Toccala per leggere le notifiche.",
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
  {
    q: "Cosa succede se il mio saldo è insufficiente?",
    a: "L'app ti permette di ordinare anche se il saldo è basso o negativo (entro certi limiti), per non impedirti di fare la spesa. Tuttavia, è fondamentale ricaricare prontamente per mantenere l'associazione in salute e permettere il pagamento dei fornitori.",
  },
  {
    q: "Chi sono i fornitori?",
    a: "Collaboriamo con produttori locali e biologici. Ogni ciclo d'ordine può coinvolgere uno o più fornitori diversi (es. frutta/verdura, uova, formaggi). Puoi vedere i dettagli dei prodotti nel tab Ordine.",
  },
  {
    q: "Come funzionano le notifiche?",
    a: "L'app ti avvisa automaticamente quando un ciclo viene chiuso (con l'importo addebitato) e quando un bonifico viene registrato dalla tesoriera. La campanella in alto nell'app mostra il numero di notifiche non lette. Toccala per vederle tutte e marcarle come lette.",
  },
];

export default async function GuidaPage() {
  const session = await requireUserSession();
  const role = getUserRole(session);

  // Pull the most recent released version (skip the [Unreleased] block) for
  // the teaser. The full history lives on /changelog. Italian is the default
  // for the in-app surface; users can switch language on the dedicated page.
  const versions = await loadChangelog("it");
  const latest = versions.find((v) => v.date !== null) ?? null;

  return (
    <AppShell email={session.user.email} isAdmin={role === "admin"} memberId={session.user.memberId!}>
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

      {/* Novità — teaser della release più recente con link al changelog */}
      {latest && (
        <section className="mb-6 overflow-hidden rounded-[18px] border border-pm-orange-mid bg-pm-orange-light">
          <div className="flex items-baseline justify-between gap-2 border-b border-pm-orange-mid/40 px-[18px] py-3">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.13em] text-pm-orange">
                Novità · v{latest.version}
              </div>
              <h2 className="mt-0.5 text-[15px] font-black tracking-[-0.01em] text-pm-near-black">
                Cosa è cambiato
              </h2>
            </div>
            {latest.date && (
              <span className="font-mono text-[10px] text-pm-gray">{latest.date}</span>
            )}
          </div>
          <div className="space-y-3 px-[18px] py-4">
            {latest.sections.slice(0, 2).map((s) => (
              <div key={s.heading}>
                <div className="mb-1 font-mono text-[10px] font-bold uppercase tracking-wide text-pm-orange">
                  {s.heading}
                </div>
                <ul className="space-y-1.5">
                  {s.items.slice(0, 4).map((item, idx) => (
                    <li key={idx} className="text-[13px] leading-[1.45] text-pm-near-black">
                      {splitInlineBold(item.text).map((p, i) =>
                        p.bold ? (
                          <strong key={i} className="font-bold">
                            {p.value}
                          </strong>
                        ) : (
                          <span key={i}>{p.value}</span>
                        ),
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-pm-orange-mid/40 px-[18px] py-3 text-center">
            <Link
              href="/changelog"
              className="inline-flex items-center gap-1 text-[12px] font-bold text-pm-orange hover:underline"
            >
              Vedi tutte le novità →
            </Link>
          </div>
        </section>
      )}

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
          Scrivici o parla con la tesoriera al ritiro. Per problemi tecnici contatta il team IT di {brand.appName}.
        </p>
        <div className="flex flex-col gap-3">
          <a
            href={`mailto:${brand.supportEmail}`}
            className="inline-flex items-center justify-center rounded-full bg-pm-orange px-[22px] py-[12px] text-sm font-bold text-white no-underline transition-transform active:scale-95"
          >
            {brand.supportEmail}
          </a>
          <a
            href={`mailto:${brand.techEmail}`}
            className="inline-flex items-center justify-center rounded-full bg-pm-near-black px-[22px] py-[12px] text-sm font-bold text-white no-underline transition-transform active:scale-95"
          >
            {brand.techEmail}
          </a>
        </div>
      </div>
    </AppShell>
  );
}
