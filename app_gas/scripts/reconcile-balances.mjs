#!/usr/bin/env node
/**
 * One-off balance reconciliation
 * ==============================
 *
 * We are switching from the legacy Excel "CASSA" sheet to the in-app ledger.
 * Until now `ledger_entries` held only test data, so the goal is:
 *
 *   - Wipe every row from `ledger_entries`.
 *   - Insert one seed `adjustment` per known member with the closing balance
 *     copied verbatim from the "TOTALE" row of the CASSA sheet.
 *   - Members whose surname does not appear in the sheet are left without
 *     any ledger entry (balance = 0).
 *
 * Usage (from the `app_gas/` directory):
 *   node --env-file=.env.local scripts/reconcile-balances.mjs            # dry-run
 *   node --env-file=.env.local scripts/reconcile-balances.mjs --apply    # actually mutate
 *
 * Source spreadsheet: "FRUTTA E VERDURA 2025-2026.xlsx" — sheet "CASSA",
 * row "TOTALE" (last row) as of 2026-05-17.
 */

import { neon } from "@neondatabase/serverless";

// Surname (or distinctive token) from the CASSA sheet header → balance in EUR.
// The lookup is case-insensitive, accent-insensitive, and substring-based
// against `members.full_name`, so e.g. "Malacrinò" matches "Maria Malacrino".
const TARGET_BALANCES = [
  { match: "Di Mauro",         amount:   2.00 },
  { match: "Malacrino",        amount:  -5.55 }, // sheet header: "Malacrinò"
  { match: "Miglierina",       amount: -57.20 },
  { match: "Gianquinto",       amount:   6.50 },
  { match: "Di Simine",        amount: -42.10 },
  { match: "Favalli",          amount: -12.05 },
  { match: "Riva",             amount: -19.50 }, // sheet header: "Riva Cafora" → Chiara Riva
  { match: "Eva",              amount: -10.20 },
  { match: "Nazareno",         amount:   3.90 },
  { match: "Maria Fois",       amount:  16.10 },
  { match: "Ballabio",         amount:   2.20 },
  { match: "Cucchiara",        amount:   0.00 },
  { match: "Cadelano",         amount:   0.00 },
  { match: "Rossin",           amount:  -8.95 }, // sheet header: "Rossin - Ravelli"
  { match: "Porta Moneta",     amount: -18.50 }, // association cash float account
];

const SKIP_PATTERNS = []; // none — every DB member is either seeded or zeroed.

// Drops accents/diacritics: "Malacrinò" → "Malacrino".
function fold(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// ── helpers ─────────────────────────────────────────────────────────────────

function genId(prefix) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

function fmt(n) {
  const sign = n < 0 ? "-" : " ";
  return sign + "€" + Math.abs(n).toFixed(2).padStart(6, " ");
}

// ── main ────────────────────────────────────────────────────────────────────

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("Missing DATABASE_URL — run with `node --env-file=.env.local`.");
    process.exit(1);
  }
  const apply = process.argv.includes("--apply");
  const sql = neon(dbUrl);

  // 1. Pull every member with their current balance.
  const rows = await sql`
    select
      m.member_id,
      m.full_name,
      m.email,
      m.active,
      coalesce((select sum(amount) from ledger_entries where member_id = m.member_id), 0)::float8 as balance
    from members m
    order by m.full_name
  `;

  // 2. Plan: match each member to a target row, or to "zero".
  const planned = [];
  const unmatchedTargets = new Set(TARGET_BALANCES.map((t) => t.match));

  for (const m of rows) {
    if (SKIP_PATTERNS.some((re) => re.test(m.full_name))) {
      planned.push({ ...m, target: null, action: "skip" });
      continue;
    }
    const folded = fold(m.full_name);
    const target = TARGET_BALANCES.find((t) => folded.includes(fold(t.match)));
    if (target) {
      unmatchedTargets.delete(target.match);
      planned.push({
        ...m,
        target: target.amount,
        action: target.amount === 0 ? "zero" : "seed",
      });
    } else {
      planned.push({ ...m, target: 0, action: "zero" });
    }
  }

  // 3. Print plan.
  console.log(`\nMode: ${apply ? "APPLY (will mutate DB)" : "DRY-RUN"}\n`);
  console.log("Member                              Current      Target    Action");
  console.log("─".repeat(76));
  for (const p of planned) {
    const name = p.full_name.slice(0, 34).padEnd(34, " ");
    const cur = fmt(p.balance);
    const tgt = p.target === null ? "       —" : fmt(p.target);
    console.log(`${name}  ${cur}   ${tgt}   ${p.action}`);
  }
  if (unmatchedTargets.size > 0) {
    console.log("\n⚠️  Excel rows with no matching DB member:");
    for (const u of unmatchedTargets) console.log("    - " + u);
  }
  console.log();

  if (!apply) {
    console.log("Dry-run only. Re-run with --apply to commit changes.");
    return;
  }

  // 4. Apply: wipe ledger, insert seeds, log audit.
  console.log("Applying changes…");
  const now = new Date();

  // Single delete then bulk insert. neon-http does not support transactions,
  // so we accept the small window of inconsistency — the script is run
  // manually, off-hours, with no other writers.
  const deleted = await sql`delete from ledger_entries returning entry_id`;
  console.log(`  deleted ${deleted.length} ledger entries`);

  const toInsert = planned.filter((p) => p.action === "seed");
  for (const p of toInsert) {
    await sql`
      insert into ledger_entries
        (entry_id, member_id, entry_date, type, amount, cycle_id, note, created_by, created_at)
      values
        (${genId("led")}, ${p.member_id}, ${now}, 'adjustment',
         ${p.target.toFixed(2)}, null,
         ${"Saldo iniziale (riportato dal foglio CASSA 2025-2026)"},
         'system:reconcile-balances', ${now})
    `;
  }
  console.log(`  inserted ${toInsert.length} seed entries`);

  await sql`
    insert into audit_log (audit_id, user_email, action, entity_type, entity_id, payload_json, created_at)
    values (${crypto.randomUUID()}, 'system:reconcile-balances', 'reconcile_balances',
            'ledger', null,
            ${JSON.stringify({
              deletedEntries: deleted.length,
              seededMembers: toInsert.length,
              source: "CASSA sheet, 2025-2026, row TOTALE",
            })},
            ${now})
  `;

  // 5. Verify.
  console.log("\nVerification:");
  const after = await sql`
    select
      m.member_id,
      m.full_name,
      coalesce((select sum(amount) from ledger_entries where member_id = m.member_id), 0)::float8 as balance
    from members m
    order by m.full_name
  `;
  let mismatches = 0;
  for (const a of after) {
    const p = planned.find((x) => x.member_id === a.member_id);
    if (!p || p.action === "skip") continue;
    const expected = p.target ?? 0;
    if (Math.abs(a.balance - expected) > 0.005) {
      console.log(`  ✗ ${a.full_name}: expected ${fmt(expected)}, got ${fmt(a.balance)}`);
      mismatches++;
    }
  }
  if (mismatches === 0) {
    console.log(`  ✓ All ${planned.filter((p) => p.action !== "skip").length} balances match the spreadsheet.`);
  } else {
    console.log(`\n${mismatches} mismatch(es). Please review.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
