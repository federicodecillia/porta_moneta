# Closed-Cycle Edits, Per-Member Quantity Adjustments, and Supplier Email

**Date**: 2026-05-18
**Status**: Approved
**Scope**: `app_gas/`

## Goal

Tre funzionalità collegate, tutte attive sui **cicli chiusi**, per gestire il fatto che la realtà del ritiro/consegna spesso differisce dall'ordine fatto in via preventiva:

1. **Edit ciclo chiuso** — modificare alcune proprietà del ciclo (titolo, note, date di ritiro, spese di spedizione) anche dopo la chiusura, con ricalcolo automatico del ledger quando cambia la spedizione.
2. **Rettifica quantità ricevuta** — per ciascun socio e prodotto, l'admin può registrare la quantità effettivamente ricevuta (es. 800 g invece di 1 kg ordinato) e il costo effettivo viene ricalcolato e aggiornato nel saldo del socio.
3. **Invio mail al fornitore con CSV allegato** — nuovo bottone che invia al fornitore del ciclo un'email con il CSV aggregato dell'ordine in allegato.

Tutte le rettifiche generano una **notifica `order_adjusted`** al socio interessato e una entry in `audit_log`.

## Non-goals

- Cancellare voci di ordine post-closure (impostare `actualQuantity = 0` ottiene lo stesso effetto).
- Limiti temporali per la rettifica (non c'è cutoff di "ciclo troppo vecchio per essere modificato").
- Template HTML per la mail al fornitore — partiamo con testo semplice.
- Anteprima del contenuto CSV nel modale di conferma (mostriamo nome file e numero righe).
- Reinvio automatico della mail se il fornitore email cambia.

---

## Architecture overview

```
Admin clicca "Modifica ciclo" su un ciclo CHIUSO
  → EditCycleForm (con banner di warning)
  → editCycle Server Action
      → se cambiano i campi shipping: recompute shipping_charge per ogni socio
      → notifiche order_adjusted ai soci toccati
      → audit_log

Admin clicca su una riga prodotto in ClosedCycleDetails
  → input inline (actualQuantity, actualLineTotal)
  → adminUpdateOrderActuals Server Action
      → UPDATE orders.actualQuantity/actualLineTotal
      → recompute order_charge totale del socio
      → UPDATE su ledger_entries (order_charge esistente)
      → notifica order_adjusted al socio
      → audit_log

Admin clicca "Invia ordine al fornitore"
  → ConfirmDialog (destinatario, oggetto, body preview)
  → adminSendSupplierEmail Server Action
      → genera CSV aggregato per prodotto (server-side)
      → Resend API: to=supplier.email, cc=session.user.email
      → audit_log
```

---

## Feature 1 — Edit ciclo chiuso

### UI

`EditCycleForm` in `components/admin/ciclo-forms.tsx:267` viene mostrato anche per cicli con `status='closed'`. Quando si apre su un ciclo chiuso compare un **banner di avviso** in cima al form:

> ⚠️ Stai modificando un ciclo già chiuso. Le modifiche alle spese di spedizione ricalcoleranno gli addebiti dei soci e invieranno una notifica di rettifica.

Tutti i campi attualmente nel form rimangono modificabili: `title`, `notes`, `pickupDate`, `pickupEndTime`, `pickup2Date`, `pickup2EndTime`, `shippingMode`, `shippingCostPerMember`, `shippingTotal`.

Campi **non** modificabili post-closure: `supplierId`, `accessLevel`, `orderOpenAt`, `orderCloseAt`, `status`.

### Backend

`editCycle` in `lib/actions/admin.ts:411` viene esteso:

1. Carica il ciclo. Se `status === 'closed'` e l'admin sta modificando un campo shipping (`shippingMode`, `shippingCostPerMember`, o `shippingTotal`):
   - Carica tutti gli ordini del ciclo aggregati per socio: `SELECT memberId, SUM(coalesce(actualLineTotal, lineTotal)) AS orderTotal FROM orders WHERE cycleId=$1 GROUP BY memberId`.
   - Costruisce un "cycle patch" virtuale che applica le nuove impostazioni shipping e chiama `computeShippingShares(toInsert, patchedCycle)`.
   - Per ogni socio con un cambiamento di share:
     - UPDATE su `ledger_entries` di tipo `shipping_charge` e `cycleId` del ciclo: nuovo `amount = -share`, `updatedAt = now`, `updatedBy = session.user.email`, `note` aggiornata.
     - Inserisce una `notifications` di tipo `order_adjusted` con title/body in italiano.
   - Inserisce entry in `audit_log` con `action='cycle_shipping_recomputed'` e payload contenente `{ cycleId, oldShipping, newShipping, affectedMembers: [...] }`.
2. Se cambiano solo campi non-shipping (titolo, note, date ritiro): UPDATE su `order_cycles`, audit_log `cycle_updated`, nessun side effect.

**Edge case**: se prima della modifica c'era una `shipping_charge` ma con la nuova modalità (es. passaggio a `shippingTotal=0`) la share diventa 0:
- Aggiorniamo l'entry esistente a `amount=0` invece di cancellarla — più auditabile, mantiene il riferimento storico, ed è coerente con la decisione "aggiorno la entry esistente".

**Edge case**: cicli chiusi che non hanno mai avuto `shipping_charge` (perché chiusi prima dell'introduzione della feature shipping):
- Se la nuova share è > 0, INSERIAMO una nuova `ledger_entries` di tipo `shipping_charge`. Audit_log lo riporta come azione su soci specifici.

### Notifica

Tipo `order_adjusted`. Esempio body:
> Le spese di spedizione del ciclo "<titolo>" sono state aggiornate. Il tuo addebito spedizione è passato da X,XX € a Y,YY €.

`href` punta a `/storico`.

---

## Feature 2 — Rettifica quantità effettivamente ricevuta

### Schema (migration 0004)

```sql
ALTER TABLE orders
  ADD COLUMN actual_quantity numeric(10,3),
  ADD COLUMN actual_line_total numeric(10,2);
```

Semantica:
- Entrambi `NULL` di default → significa "come ordinato", quindi tutti i calcoli usano `quantity` e `lineTotal`.
- Quando l'admin imposta `actualQuantity`, il sistema **propone** `actualLineTotal = actualQuantity × unitPriceSnapshot` arrotondato a 2 decimali, ma l'admin può sovrascriverlo (es. per uno sconto del fornitore).
- `actualLineTotal` può essere `0` (socio non ha ricevuto nulla) ma non negativo.
- Per coerenza, se `actualQuantity = quantity` (e nessuna modifica al totale), salviamo comunque i valori — facilita gli audit.

`actualQuantity` è `numeric(10,3)` per supportare valori frazionari (kg, etti) — la `quantity` originale resta `integer` perché l'ordine è sempre fatto in "unità intere" del prodotto.

### UI

Nel modale `components/admin/closed-cycle-details.tsx`, ogni riga prodotto della sezione per-socio diventa cliccabile per l'admin. Click → la riga si trasforma in modalità edit con:

- Input numerico **quantità effettiva** (default = `actualQuantity ?? quantity`, step 0.1, min 0)
- Input numerico **totale effettivo** (default = `actualLineTotal ?? (actualQuantity × unitPrice)`, step 0.01, min 0)
- Bottoni **Salva** e **Annulla**

Modifica live: quando l'admin cambia *quantità effettiva*, il *totale effettivo* si auto-aggiorna a `qty × unitPriceSnapshot`. L'admin può poi sovrascriverlo manualmente — un flag locale `manualOverride` evita che successivi cambi di qty resettino il totale già toccato.

Visualizzazione (non in edit):
- Se `actualQuantity` è NULL o uguale a `quantity` E `actualLineTotal` è NULL o uguale a `lineTotal`: mostra come oggi.
- Altrimenti mostra entrambi i valori, l'originale barrato a sinistra del nuovo. Es.: `~~1 kg~~ 0,8 kg · ~~€2,00~~ €1,60` con un piccolo badge "rettificato".

Totale per socio in alto al gruppo: usa `SUM(coalesce(actualLineTotal, lineTotal))`.

### Backend

Nuova Server Action in `lib/actions/admin.ts`:

```ts
adminUpdateOrderActuals(
  orderLineId: string,
  actualQuantity: string | null,  // string per evitare problemi di precisione
  actualLineTotal: string | null
): Promise<{ ok: true } | { error: string }>
```

Logica:
1. `requireAdmin()`.
2. Carica `orders` + `orderCycles` joinati per validare `status === 'closed'`. Se aperto, rifiuta con errore.
3. Valida input: `actualQuantity >= 0`, `actualLineTotal >= 0`. Entrambi NULL → reset (torna a "come ordinato").
4. UPDATE su `orders` con i due nuovi valori + `updatedAt = now`.
5. Calcola nuovo `orderTotal` del socio:
   ```sql
   SELECT SUM(coalesce(actual_line_total, line_total)) AS total
   FROM orders WHERE cycle_id=$1 AND member_id=$2
   ```
6. UPDATE su `ledger_entries` di tipo `order_charge` per (memberId, cycleId): nuovo `amount = -orderTotal`, `updatedAt = now`, `updatedBy = session.user.email`, `note` aggiornata es. *"Addebito ordine rettificato"*.
7. Inserisce `notifications` `order_adjusted` per il socio. Body:
   > Il tuo ordine del ciclo "<titolo>" è stato rettificato: <prodotto> da X a Y, addebito totale aggiornato a Z €.
   
   (Single-product summary nel body, basato sulla riga toccata.)
8. `audit_log` con `action='order_line_actual_updated'`, payload `{ orderLineId, oldActualQty, newActualQty, oldActualTotal, newActualTotal, newOrderCharge }`.
9. `revalidatePath('/admin')` + `revalidatePath('/')` + `revalidatePath('/storico')`.

### Edge cases

- **Tutti gli `actualLineTotal` di un socio = 0**: l'`order_charge` diventa 0. Non cancelliamo la entry, manteniamo amount=0 (coerente con feature 1).
- **Socio non riceve niente**: l'admin imposta `actualQuantity=0` su tutte le righe. Le `shipping_charge` restano invariate (perché lui aveva comunque ordinato e occupato una share di spedizione) — se l'admin vuole rimborsare anche quella, usa il modulo `cassa` esistente.
- **Concorrenza**: due admin che modificano lo stesso `orderLineId` in parallelo — last-write-wins è accettabile (caso raro, audit_log conserva entrambe le tracce).

---

## Feature 3 — Invio mail al fornitore con CSV

### Dipendenze e config

- Nuovo pacchetto npm: `resend` (lo SDK ufficiale).
- Env vars (da aggiungere a Vercel + `.env.local`):
  - `RESEND_API_KEY` — chiave API Resend
  - `MAIL_FROM` — indirizzo mittente verificato (es. `gas@portamoneta.org`)
- Setup dominio: `portamoneta.org` va verificato in Resend (record DNS SPF/DKIM via Squarespace forwarding o A record diretti). Documentato in `SETUP.md` come step di onboarding admin.

### Generazione CSV server-side

Nuovo modulo `lib/csv/supplier-export.ts`:

```ts
async function buildSupplierAggregateCsv(cycleId: string): Promise<{
  filename: string;
  content: string;
  rowCount: number;
}>
```

Query: `orders` JOIN `products` filtrato per `cycleId`, raggruppato per `productId`. SUM su `coalesce(actualQuantity, quantity)` e `coalesce(actualLineTotal, lineTotal)`.

Colonne CSV (separatore `;`, BOM UTF-8 per Excel Italia):
```
Prodotto;Variante;Formato;Unità;Prezzo unitario €;Quantità totale;Totale €
Carote;Bio;Sacco 1kg;kg;2,00;15,5;31,00
...
TOTALE;;;;;;<grand_total>
```

Nome file: `ordine_<slug-titolo-ciclo>_<YYYY-MM-DD>.csv`.

### Wrapper Resend

Nuovo modulo `lib/email/resend.ts`:

```ts
type Attachment = { filename: string; content: string };

async function sendMail(opts: {
  to: string;
  cc?: string;
  subject: string;
  text: string;
  attachments?: Attachment[];
}): Promise<{ ok: true } | { error: string }>
```

Wrapper sottile sopra `Resend(apiKey).emails.send(...)`. Gestisce errori e li ritorna come `{ error: string }` invece di throw.

### Template body

In `lib/email/templates.ts`:

```ts
function supplierOrderEmailBody(opts: {
  cycleTitle: string;
  pickupDate: Date | null;
  grandTotal: number;
  itemCount: number;
}): { subject: string; text: string }
```

Esempio body:
```
Buongiorno,

in allegato il riepilogo dell'ordine del GAS Porta Moneta per il ciclo "<titolo>".

Totale: <grand_total> € su <item_count> prodotti.
Data ritiro prevista: <pickup_date>.

Grazie,
APS Porta Moneta — GAS frutta/verdura
```

Subject: `Ordine GAS Porta Moneta — <titolo ciclo>`.

### Server Action

In `lib/actions/admin.ts`:

```ts
adminSendSupplierEmail(cycleId: string): Promise<
  | { ok: true; recipient: string }
  | { error: string }
>
```

Logica:
1. `requireAdmin()`, carica session per `cc = session.user.email`.
2. Carica ciclo + supplier joinati. Valida:
   - `cycle.status === 'closed'` (errore se aperto)
   - `cycle.supplierId !== null`
   - `supplier.email !== null && !== ''`
3. Chiama `buildSupplierAggregateCsv(cycleId)`. Se `rowCount === 0`, errore "Nessun ordine nel ciclo".
4. Chiama `supplierOrderEmailBody(...)` per subject/text.
5. Chiama `sendMail({ to: supplier.email, cc: session.user.email, ... })`.
6. Se ok: `audit_log` con `action='supplier_email_sent'`, payload `{ cycleId, supplierId, recipient, filename, rowCount, cc }`. Ritorna `{ ok: true, recipient }`.
7. Se errore Resend: log + ritorna l'errore senza audit_log (non è successo nulla).

### UI

Nuovo bottone nella card del ciclo chiuso, nello stesso gruppo del bottone "Esporta CSV" esistente:

- Label: **📧 Invia ordine al fornitore**
- Disabled (+ tooltip *«Fornitore senza email»* o *«Ciclo senza fornitore»*) se mancano i prerequisiti.
- Click → apre `ConfirmDialog`:
  - Title: *Invia ordine a `<nome fornitore>`?*
  - Body: 3 righe:
    1. **A**: `<email fornitore>`
    2. **CC**: `<email admin>` (la tua)
    3. **Oggetto**: `<subject computato>`
  - Bottone primario "Invia ora", bottone secondario "Annulla".
- Durante l'invio: spinner sul bottone.
- Toast success: *«Mail inviata a `<email fornitore>`»*.
- Toast error: messaggio errore esatto da Resend.

Posizione: in `ciclo-forms.tsx` accanto al `<ClosedCycleDetails ...>` esistente per i cicli con `status === 'closed'`. Il bottone si vede solo per admin (la pagina admin è già protetta).

---

## File toccati

### Nuovi
- `app_gas/drizzle/0004_actual_quantities.sql` — migration
- `app_gas/lib/email/resend.ts` — wrapper Resend
- `app_gas/lib/email/templates.ts` — body/subject mail fornitore
- `app_gas/lib/csv/supplier-export.ts` — generatore CSV aggregato

### Modificati
- `app_gas/lib/db/schema.ts` — aggiungere `actualQuantity`, `actualLineTotal` su `orders`
- `app_gas/lib/db/queries.ts` — dettagli ordini includono i nuovi campi
- `app_gas/lib/actions/admin.ts` — `editCycle` esteso, nuove action `adminUpdateOrderActuals`, `adminSendSupplierEmail`
- `app_gas/lib/actions/admin-cycles.ts` — se l'invio mail finisce qui per coerenza con `adminGetCycleOrderDetails`
- `app_gas/components/admin/closed-cycle-details.tsx` — inline edit qty + costo
- `app_gas/components/admin/ciclo-forms.tsx` — banner warning post-closure nel form, bottone "Invia al fornitore" nel rendering ciclo
- `app_gas/package.json` — `resend` dependency
- `app_gas/.env.local.example` (se esiste) o `SETUP.md` — `RESEND_API_KEY`, `MAIL_FROM`

---

## Database migrations

### `drizzle/0004_actual_quantities.sql`

```sql
ALTER TABLE "orders"
  ADD COLUMN "actual_quantity" numeric(10, 3),
  ADD COLUMN "actual_line_total" numeric(10, 2);
```

Nessun backfill necessario — colonne nullable, NULL = "come ordinato".

---

## Testing strategy

Il progetto non ha test automatizzati attualmente. Validazione manuale per ogni feature:

**Feature 1**:
- Aprire un ciclo chiuso esistente, cambiare `shippingTotal` da X a Y → verificare che le `ledger_entries` shipping siano aggiornate, saldi soci corretti, notifiche emesse.
- Cambiare titolo/note/date → verificare nessun side effect sul ledger.

**Feature 2**:
- Su un ordine chiuso, ridurre `actualQuantity` di una riga → verificare addebito socio ridotto, notifica.
- Annullare la rettifica (svuotare i campi) → verificare ritorno al valore originale.
- Impostare `actualQuantity = 0` su tutte le righe di un socio → addebito = 0.

**Feature 3**:
- Click "Invia al fornitore" su ciclo con email valida → mail arriva, admin in CC, CSV ben formato in Excel.
- Click su ciclo senza fornitore → bottone disabled.
- Click su ciclo con fornitore senza email → bottone disabled con tooltip.
- Simulare errore Resend (API key invalida in dev) → toast errore visibile.
