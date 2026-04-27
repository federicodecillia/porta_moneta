/* ───────────────────────────────────────────
   Test.gs — Diagnostica e test automatici
   Eseguire dall'editor Apps Script
   ─────────────────────────────────────────── */

/**
 * Verifica infrastruttura: spreadsheet, sheet, soci, saldo.
 * runSmokeTest()
 */
function runSmokeTest() {
  Logger.log('═══ SMOKE TEST ═══');
  var errors = [];

  var ss;
  try {
    ss = getDataSpreadsheet_();
    Logger.log('✓ Spreadsheet accessibile');
  } catch (e) {
    Logger.log('✗ Spreadsheet: ' + e.message);
    return { ok: false, errors: [e.message] };
  }

  Object.keys(APP.SHEETS).forEach(function(key) {
    var sh = ss.getSheetByName(APP.SHEETS[key]);
    if (sh) Logger.log('✓ Sheet: ' + APP.SHEETS[key]);
    else { Logger.log('✗ Sheet mancante: ' + APP.SHEETS[key]); errors.push('Sheet mancante: ' + APP.SHEETS[key]); }
  });

  var members = readSheetObjects_(APP.SHEETS.MEMBERS);
  if (members.length > 0) {
    Logger.log('✓ Soci: ' + members.length);
    var balance = getMemberBalance_(members[0].member_id);
    if (typeof balance !== 'number') { Logger.log('✗ Saldo non calcolabile'); errors.push('Saldo non è un numero'); }
    else Logger.log('✓ Saldo ' + members[0].full_name + ': €' + balance);
  } else {
    Logger.log('✗ Nessun socio trovato'); errors.push('Nessun socio');
  }

  var cycle = getOpenCycle_();
  Logger.log(cycle ? '✓ Ciclo aperto: "' + cycle.title + '"' : '○ Nessun ciclo aperto');

  Logger.log(errors.length === 0 ? '✓ Tutto OK' : '✗ ' + errors.length + ' errori');
  return { ok: errors.length === 0, errors: errors };
}

/**
 * Test end-to-end completo con utente dedicato "Test User".
 * Richiede: nessun ciclo aperto già esistente.
 * Crea dati di test (ciclo, prodotti, ordine, saldo) per Test User visibile solo agli admin.
 * runEndToEndTest()
 */
function runEndToEndTest() {
  Logger.log('═══ END-TO-END TEST ═══');
  var pass = 0, fail = 0;

  function check(label, condition, detail) {
    if (condition) {
      Logger.log('✓ ' + label);
      pass++;
    } else {
      Logger.log('✗ ' + label + (detail ? ' — ' + detail : ''));
      fail++;
    }
  }

  function abort(reason) {
    Logger.log('⚠ ABORT: ' + reason);
    Logger.log('PASS: ' + pass + ' | FAIL: ' + fail + ' (interrotto)');
  }

  // ── 1. Ensure Test User ──────────────────────────────────────────────
  var TEST_EMAIL = 'test@portamoneta.org';
  var r1 = callApi('adminUpsertMember', {
    full_name: 'Test User', email: TEST_EMAIL, role: APP.ROLE.ATTIVO, active: true
  });
  check('Upsert Test User', r1.ok, r1.ok ? null : (r1.error && r1.error.message));
  if (!r1.ok) { abort('adminUpsertMember fallito'); return; }

  var members = readSheetObjects_(APP.SHEETS.MEMBERS);
  var testUser = null;
  for (var i = 0; i < members.length; i++) {
    if (normalizeEmail_(members[i].email) === TEST_EMAIL) { testUser = members[i]; break; }
  }
  check('Test User trovato nel foglio', !!testUser);
  if (!testUser) { abort('Test User non trovato'); return; }

  // ── 2. Topup ─────────────────────────────────────────────────────────
  var balBefore = getMemberBalance_(testUser.member_id);
  var TOPUP_AMOUNT = 50;
  var r2 = callApi('adminRecordTopup', {
    member_id: testUser.member_id,
    amount: TOPUP_AMOUNT,
    notes: '[TEST] Ricarica automatica test'
  });
  check('Topup €' + TOPUP_AMOUNT + ' Test User', r2.ok, r2.ok ? null : (r2.error && r2.error.message));

  var balAfterTopup = getMemberBalance_(testUser.member_id);
  check('Saldo aumentato di €' + TOPUP_AMOUNT,
    Math.abs(balAfterTopup - (balBefore + TOPUP_AMOUNT)) < 0.01,
    'prima:€' + balBefore + ' dopo:€' + balAfterTopup + ' atteso:€' + (balBefore + TOPUP_AMOUNT));

  // ── 3. Verifica nessun ciclo aperto ──────────────────────────────────
  var existing = getOpenCycle_();
  if (existing) {
    abort('Esiste già un ciclo aperto: "' + existing.title + '". Chiudilo prima di eseguire il test completo.');
    Logger.log('PASS: ' + pass + ' | FAIL: ' + fail);
    return;
  }
  check('Nessun ciclo aperto (prerequisito)', true);

  // ── 4. Crea fornitore test ────────────────────────────────────────────
  var r4 = callApi('adminUpsertSupplier', {
    name: '[TEST] Fornitore Test',
    macro_category: 'Test',
    notes: 'Fornitore fittizio per test automatici'
  });
  check('Crea fornitore test', r4.ok, r4.ok ? null : (r4.error && r4.error.message));
  if (!r4.ok) { abort('adminUpsertSupplier fallito'); return; }

  var suppliers = readSheetObjects_(APP.SHEETS.SUPPLIERS);
  var testSupplier = null;
  for (var s = suppliers.length - 1; s >= 0; s--) {
    if (suppliers[s].name === '[TEST] Fornitore Test') { testSupplier = suppliers[s]; break; }
  }
  check('Fornitore test trovato', !!testSupplier);
  if (!testSupplier) { abort('Fornitore test non trovato'); return; }

  // ── 5. Crea ciclo test ────────────────────────────────────────────────
  var closeDate = new Date();
  closeDate.setDate(closeDate.getDate() + 1);
  var r5 = callApi('adminCreateCycle', {
    title: '[TEST] Ciclo automatico',
    order_close_at: closeDate.toISOString(),
    pickup_date: closeDate.toISOString().slice(0, 10),
    supplier_id: testSupplier.supplier_id,
    access_level: APP.ACCESS_LEVEL.ATTIVI
  });
  check('Crea ciclo test', r5.ok, r5.ok ? null : (r5.error && r5.error.message));
  if (!r5.ok) { abort('adminCreateCycle fallito'); return; }

  var testCycle = getOpenCycle_();
  check('Ciclo test è aperto', !!testCycle && testCycle.title === '[TEST] Ciclo automatico');
  if (!testCycle) { abort('Ciclo test non trovato come aperto'); return; }

  // ── 6. Aggiungi prodotti test al ciclo ───────────────────────────────
  var r6 = callApi('adminUpdateProducts', {
    cycle_id: testCycle.cycle_id,
    products: [
      { name: 'Mela Test', variant: 'Biologica', format: '1kg', unit_price: 3.00, category: 'Frutta' },
      { name: 'Patata Test', variant: '', format: '500g', unit_price: 2.00, category: 'Verdura' }
    ]
  });
  check('Carica prodotti test', r6.ok, r6.ok ? null : (r6.error && r6.error.message));

  var testProducts = getCycleProducts_(testCycle.cycle_id);
  check('Prodotti nel ciclo', testProducts.length === 2, 'trovati: ' + testProducts.length);
  if (testProducts.length === 0) { abort('Nessun prodotto nel ciclo test'); return; }

  // ── 7. Inserisci ordine per Test User (server-side, bypass session) ──
  var now = nowIso_();
  var orderLines = [];
  var orderTotal = 0;
  testProducts.forEach(function(p) {
    var qty = 2;
    var price = toNumber_(p.unit_price);
    var lineTotal = Math.round(qty * price * 100) / 100;
    orderTotal += lineTotal;
    orderLines.push({
      order_line_id:       generateId_('ord'),
      cycle_id:            testCycle.cycle_id,
      member_id:           testUser.member_id,
      product_id:          p.product_id,
      quantity:            qty,
      unit_price_snapshot: price,
      line_total:          lineTotal,
      updated_at:          now
    });
  });
  orderTotal = Math.round(orderTotal * 100) / 100;

  var allOrders = readSheetObjects_(APP.SHEETS.ORDERS);
  var filteredOrders = allOrders.filter(function(o) {
    return !(o.cycle_id === testCycle.cycle_id && o.member_id === testUser.member_id);
  });
  overwriteSheetObjects_(APP.SHEETS.ORDERS, APP.HEADERS.orders, filteredOrders.concat(orderLines));

  var savedLines = readSheetObjectsWhere_(APP.SHEETS.ORDERS, 'cycle_id', testCycle.cycle_id)
    .filter(function(o) { return o.member_id === testUser.member_id; });
  check('Ordine inserito (' + orderLines.length + ' righe, €' + orderTotal + ')',
    savedLines.length === orderLines.length, 'trovate: ' + savedLines.length);

  // ── 8. Chiudi ciclo e verifica addebiti ──────────────────────────────
  var r8 = callApi('adminCloseCycle', { cycle_id: testCycle.cycle_id });
  check('Chiusura ciclo', r8.ok, r8.ok ? null : (r8.error && r8.error.message));

  var balAfterClose = getMemberBalance_(testUser.member_id);
  var expectedBal = Math.round((balAfterTopup - orderTotal) * 100) / 100;
  check('Saldo Test User dopo chiusura (€' + expectedBal + ')',
    Math.abs(balAfterClose - expectedBal) < 0.01,
    'atteso:€' + expectedBal + ' trovato:€' + balAfterClose);

  // ── 9. Verifica warning saldo negativo (comportamento nuovo) ─────────
  // Crea un altro ciclo per testare il warning saldo
  var r9open = getOpenCycle_();
  if (!r9open) {
    var closeDate2 = new Date();
    closeDate2.setDate(closeDate2.getDate() + 2);
    var r9c = callApi('adminCreateCycle', {
      title: '[TEST] Ciclo warning saldo',
      order_close_at: closeDate2.toISOString(),
      pickup_date: closeDate2.toISOString().slice(0, 10),
      supplier_id: testSupplier.supplier_id,
      access_level: APP.ACCESS_LEVEL.ATTIVI
    });
    var warnCycle = getOpenCycle_();
    if (r9c.ok && warnCycle) {
      callApi('adminUpdateProducts', {
        cycle_id: warnCycle.cycle_id,
        products: [{ name: 'Prodotto Costoso Test', variant: '', format: '', unit_price: 999.00, category: 'Test' }]
      });
      var warnProducts = getCycleProducts_(warnCycle.cycle_id);
      if (warnProducts.length > 0) {
        // Inserisci ordine che porta saldo sotto zero (server-side)
        var bigLine = {
          order_line_id:       generateId_('ord'),
          cycle_id:            warnCycle.cycle_id,
          member_id:           testUser.member_id,
          product_id:          warnProducts[0].product_id,
          quantity:            1,
          unit_price_snapshot: 999.00,
          line_total:          999.00,
          updated_at:          nowIso_()
        };
        var allOrders2 = readSheetObjects_(APP.SHEETS.ORDERS);
        overwriteSheetObjects_(APP.SHEETS.ORDERS, APP.HEADERS.orders, allOrders2.concat([bigLine]));
        // Chiudi per verificare che l'addebito venga creato (saldo negativo permesso)
        var rClose2 = callApi('adminCloseCycle', { cycle_id: warnCycle.cycle_id });
        var finalBal = getMemberBalance_(testUser.member_id);
        check('Ordine con saldo negativo permesso (saldo finale: €' + finalBal + ')',
          rClose2.ok && finalBal < 0,
          'chiusura ok:' + rClose2.ok + ' saldo:€' + finalBal);
      } else {
        check('Setup ciclo warning (prodotto mancante)', false);
      }
    } else {
      check('Setup ciclo warning', false, r9c.ok ? 'ciclo non trovato' : (r9c.error && r9c.error.message));
    }
  } else {
    Logger.log('○ Skip test warning saldo: ciclo già aperto dopo chiusura (inatteso)');
  }

  // ── Report ───────────────────────────────────────────────────────────
  Logger.log('══════════════════════════════════════');
  Logger.log((fail === 0 ? '✅ TUTTI I TEST PASSATI' : '❌ TEST FALLITI: ' + fail) +
    ' — PASS: ' + pass + ' | FAIL: ' + fail);
  return { pass: pass, fail: fail };
}
