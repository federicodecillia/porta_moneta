/* ───────────────────────────────────────────
   Ledger.gs — Contabilità soci
   ─────────────────────────────────────────── */

function getMemberBalance_(memberId) {
  var entries = readSheetObjectsWhere_(APP.SHEETS.LEDGER_ENTRIES, 'member_id', memberId);
  var sum = 0;
  entries.forEach(function(e) { sum += toNumber_(e.amount); });
  return Math.round(sum * 100) / 100;
}

function getMyLedger(payload) {
  var member = requireSession_(payload);
  var entries = readSheetObjectsWhere_(APP.SHEETS.LEDGER_ENTRIES, 'member_id', member.member_id);
  entries.sort(function(a, b) {
    return String(b.created_at).localeCompare(String(a.created_at));
  });
  return entries.slice(0, 25).map(function(e) {
    return {
      entry_date: e.entry_date,
      type:       e.type,
      amount:     toNumber_(e.amount),
      note:       e.note,
      cycle_id:   e.cycle_id
    };
  });
}

function generateOrderCharges_(cycleId, adminEmail) {
  // Controlla che non ci siano già addebiti per questo ciclo
  var existing = readSheetObjectsWhere_(APP.SHEETS.LEDGER_ENTRIES, 'cycle_id', cycleId)
    .filter(function(e) { return e.type === APP.LEDGER_TYPE.ORDER_CHARGE; });
  if (existing.length > 0) return 0; // idempotente

  var orders = readSheetObjectsWhere_(APP.SHEETS.ORDERS, 'cycle_id', cycleId);

  // Raggruppa totale per member
  var memberTotals = {};
  orders.forEach(function(o) {
    var mid = o.member_id;
    if (!memberTotals[mid]) memberTotals[mid] = 0;
    memberTotals[mid] += toNumber_(o.line_total);
  });

  var now = nowIso_();
  var entries = [];

  for (var mid in memberTotals) {
    var total = memberTotals[mid];
    if (total <= 0) continue;

    entries.push({
      entry_id:   generateId_('led'),
      member_id:  mid,
      entry_date: now.substring(0, 10),
      type:       APP.LEDGER_TYPE.ORDER_CHARGE,
      amount:     -Math.round(total * 100) / 100,
      cycle_id:   cycleId,
      note:       'Addebito ordine',
      created_by: adminEmail,
      created_at: now
    });
  }

  if (entries.length) {
    appendSheetObjects_(APP.SHEETS.LEDGER_ENTRIES, APP.HEADERS.ledger_entries, entries);
  }

  return entries.length;
}

function adminRecordTopup(payload) {
  var admin = requireAdmin_(payload);
  assert_(payload.member_id, 'member_id obbligatorio.');
  assert_(payload.amount, 'Importo obbligatorio.');

  var amount = toNumber_(payload.amount);
  assert_(amount > 0, 'L\'importo deve essere positivo.');

  // Verifica che il socio esista
  var members = readSheetObjects_(APP.SHEETS.MEMBERS);
  var found = false;
  for (var i = 0; i < members.length; i++) {
    if (members[i].member_id === payload.member_id) { found = true; break; }
  }
  assert_(found, 'Socio non trovato.');

  var now = nowIso_();
  var entry = {
    entry_id:   generateId_('led'),
    member_id:  payload.member_id,
    entry_date: payload.entry_date || now.substring(0, 10),
    type:       APP.LEDGER_TYPE.TOPUP,
    amount:     amount,
    cycle_id:   '',
    note:       payload.note || 'Bonifico',
    created_by: admin.email,
    created_at: now
  };

  appendSheetObject_(APP.SHEETS.LEDGER_ENTRIES, APP.HEADERS.ledger_entries, entry);
  logAudit_(admin.email, 'record_topup', 'ledger', entry.entry_id, payload);
  return { entry_id: entry.entry_id, new_balance: getMemberBalance_(payload.member_id) };
}

function adminGetBalances(payload) {
  requireAdmin_(payload);
  var members = readSheetObjects_(APP.SHEETS.MEMBERS)
    .filter(function(m) { return String(m.active) !== 'false'; });
  var ledger = readSheetObjects_(APP.SHEETS.LEDGER_ENTRIES);

  var balances = {};
  ledger.forEach(function(e) {
    if (!balances[e.member_id]) balances[e.member_id] = 0;
    balances[e.member_id] += toNumber_(e.amount);
  });

  return members.map(function(m) {
    return {
      member_id: m.member_id,
      full_name: m.full_name,
      email:     m.email,
      balance:   Math.round((balances[m.member_id] || 0) * 100) / 100
    };
  }).sort(function(a, b) { return a.full_name.localeCompare(b.full_name); });
}

// Storico ledger completo di un socio, con nome ciclo joinato
function adminGetMemberLedger(payload) {
  requireAdmin_(payload);
  assert_(payload.member_id, 'member_id obbligatorio.');

  var cycles = readSheetObjects_(APP.SHEETS.ORDER_CYCLES);
  var cycMap = {};
  cycles.forEach(function(c) { cycMap[c.cycle_id] = c.title; });

  var entries = readSheetObjectsWhere_(APP.SHEETS.LEDGER_ENTRIES, 'member_id', payload.member_id);
  entries.sort(function(a, b) {
    return String(b.entry_date || b.created_at).localeCompare(String(a.entry_date || a.created_at));
  });

  return entries.map(function(e) {
    return {
      entry_id:    e.entry_id,
      entry_date:  e.entry_date,
      type:        e.type,
      amount:      toNumber_(e.amount),
      cycle_id:    e.cycle_id || '',
      cycle_title: e.cycle_id ? (cycMap[e.cycle_id] || '—') : '',
      note:        e.note || '',
      created_at:  e.created_at,
      updated_at:  e.updated_at || '',
      updated_by:  e.updated_by || ''
    };
  });
}

function adminUpdateLedgerEntry(payload) {
  var admin = requireAdmin_(payload);
  assert_(payload.entry_id, 'entry_id obbligatorio.');

  var entries = readSheetObjects_(APP.SHEETS.LEDGER_ENTRIES);
  var idx = -1;
  for (var i = 0; i < entries.length; i++) {
    if (entries[i].entry_id === payload.entry_id) { idx = i; break; }
  }
  assert_(idx !== -1, 'Movimento non trovato.');

  var e = entries[idx];
  var oldValues = { amount: e.amount, note: e.note, entry_date: e.entry_date };

  if (payload.amount !== undefined) {
    var amt = toNumber_(payload.amount);
    // Topup e adjustment: importo qualsiasi. Order_charge: di solito negativo ma lasciamo libero
    e.amount = amt;
  }
  if (payload.note !== undefined)       e.note = payload.note;
  if (payload.entry_date !== undefined) e.entry_date = payload.entry_date;

  e.updated_at = nowIso_();
  e.updated_by = admin.email;
  entries[idx] = e;

  overwriteSheetObjects_(APP.SHEETS.LEDGER_ENTRIES, APP.HEADERS.ledger_entries, entries);
  logAudit_(admin.email, 'update_ledger', 'ledger', payload.entry_id,
    { old: oldValues, new: payload });
  return { success: true, new_balance: getMemberBalance_(e.member_id) };
}

function adminDeleteLedgerEntry(payload) {
  var admin = requireAdmin_(payload);
  assert_(payload.entry_id, 'entry_id obbligatorio.');

  var entries = readSheetObjects_(APP.SHEETS.LEDGER_ENTRIES);
  var deleted = null;
  var filtered = entries.filter(function(e) {
    if (e.entry_id === payload.entry_id) { deleted = e; return false; }
    return true;
  });
  assert_(deleted, 'Movimento non trovato.');

  overwriteSheetObjects_(APP.SHEETS.LEDGER_ENTRIES, APP.HEADERS.ledger_entries, filtered);
  logAudit_(admin.email, 'delete_ledger', 'ledger', payload.entry_id, deleted);
  return { success: true, new_balance: getMemberBalance_(deleted.member_id) };
}
