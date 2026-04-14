/* ───────────────────────────────────────────
   Test.gs — Utility e test per Porta Moneta GAS
   Eseguire dall'editor Apps Script
   ─────────────────────────────────────────── */

/**
 * Verifica che l'infrastruttura sia sana: spreadsheet, sheets, soci.
 * Eseguire dall'editor: runSmokeTest()
 */
function runSmokeTest() {
  Logger.log('═══ SMOKE TEST ═══');
  var errors = [];

  // 1. Spreadsheet accessibile
  try {
    var ss = getDataSpreadsheet_();
    Logger.log('✓ Spreadsheet accessibile');
  } catch (e) {
    Logger.log('✗ Spreadsheet: ' + e.message);
    errors.push(e.message);
    return { ok: false, errors: errors };
  }

  // 2. Tutti gli sheet esistono
  var sheetKeys = Object.keys(APP.SHEETS);
  sheetKeys.forEach(function(key) {
    var sh = ss.getSheetByName(APP.SHEETS[key]);
    if (sh) {
      Logger.log('✓ Sheet: ' + APP.SHEETS[key]);
    } else {
      Logger.log('✗ Sheet mancante: ' + APP.SHEETS[key]);
      errors.push('Sheet mancante: ' + APP.SHEETS[key]);
    }
  });

  // 3. Almeno un socio esiste
  var members = readSheetObjects_(APP.SHEETS.MEMBERS);
  if (members.length > 0) {
    Logger.log('✓ Soci: ' + members.length);
    members.forEach(function(m) {
      Logger.log('  ' + m.full_name + ' | ' + m.email + ' | ' + m.role);
    });
  } else {
    Logger.log('✗ Nessun socio trovato');
    errors.push('Nessun socio');
  }

  // 4. Saldo calcolabile
  if (members.length > 0) {
    var balance = getMemberBalance_(members[0].member_id);
    if (typeof balance === 'number') {
      Logger.log('✓ Saldo ' + members[0].full_name + ': €' + balance);
    } else {
      Logger.log('✗ Saldo non calcolabile');
      errors.push('Saldo non è un numero');
    }
  }

  // 5. Ciclo aperto?
  var cycle = getOpenCycle_();
  Logger.log(cycle ? '✓ Ciclo aperto: "' + cycle.title + '"' : '○ Nessun ciclo aperto');

  Logger.log('──────────────────────────');
  Logger.log(errors.length === 0 ? '✓ Tutto OK' : '✗ ' + errors.length + ' errori');
  return { ok: errors.length === 0, errors: errors };
}

/**
 * Test end-to-end: crea ciclo, prodotti, ordine, chiudi, verifica addebiti.
 * Eseguire dall'editor: runEndToEndTest()
 */
function runEndToEndTest() {
  Logger.log('═══ TEST END-TO-END ═══');

  // 1. Crea ciclo
  Logger.log('1. Creazione ciclo...');
  var cycleResult = callApi('adminCreateCycle', {
    title: 'Test E2E ' + new Date().toLocaleString('it-IT'),
    order_close_at: new Date(Date.now() + 86400000).toISOString(),
    pickup_date: new Date(Date.now() + 172800000).toISOString().substring(0, 10)
  });
  Logger.log('   Ciclo: ' + (cycleResult.ok ? 'OK' : JSON.stringify(cycleResult.error)));
  if (!cycleResult.ok) return cycleResult;
  var cycleId = cycleResult.result.cycle_id;

  // 2. Carica prodotti
  Logger.log('2. Caricamento prodotti...');
  var prodResult = callApi('adminUpdateProducts', {
    cycle_id: cycleId,
    products: [
      { name: 'Carota', variant: '', format: '500 g', unit_price: 1.75 },
      { name: 'Patata', variant: 'pasta gialla', format: '1 kg', unit_price: 2.30 },
      { name: 'Cavolo', variant: 'verza', format: '1 kg', unit_price: 3.50 },
      { name: 'Cipolla', variant: 'dorata', format: '500 g', unit_price: 1.75 },
      { name: 'Spinacio', variant: '', format: '500 g', unit_price: 3.00 }
    ]
  });
  Logger.log('   Prodotti: ' + (prodResult.ok ? prodResult.result.count + ' caricati' : prodResult.error));

  // 3. Dashboard
  Logger.log('3. Dashboard member...');
  var dash = callApi('getMemberDashboard', {});
  Logger.log('   Saldo: ' + (dash.ok ? dash.result.balance + '€' : dash.error));
  Logger.log('   Prodotti disponibili: ' + (dash.ok ? dash.result.products.length : '?'));

  // 4. Ordine
  Logger.log('4. Salvataggio ordine...');
  var products = dash.result.products;
  var orderResult = callApi('saveMyOrder', {
    cycle_id: cycleId,
    lines: [
      { product_id: products[0].product_id, quantity: 2 },
      { product_id: products[1].product_id, quantity: 1 },
      { product_id: products[2].product_id, quantity: 1 }
    ]
  });
  Logger.log('   Ordine: ' + (orderResult.ok ? 'OK, totale €' + orderResult.result.order_total : orderResult.error));

  // 5. Verifica dashboard
  Logger.log('5. Verifica dashboard...');
  var dash2 = callApi('getMemberDashboard', {});
  Logger.log('   Righe ordine: ' + (dash2.ok ? dash2.result.my_lines.length : '?'));
  Logger.log('   Totale ordine: €' + (dash2.ok ? dash2.result.order_total : '?'));

  // 6. Riepilogo admin
  Logger.log('6. Riepilogo ciclo admin...');
  var summary = callApi('adminGetCycleSummary', { cycle_id: cycleId });
  if (summary.ok) {
    Logger.log('   Soci: ' + summary.result.order_count + ', Totale: €' + summary.result.grand_total);
    summary.result.by_product.forEach(function(p) {
      Logger.log('   - ' + p.name + ': ' + p.total_qty + ' pz, €' + p.total_amount);
    });
  }

  // 7. Chiudi ciclo
  Logger.log('7. Chiusura ciclo...');
  var closeResult = callApi('adminCloseCycle', { cycle_id: cycleId });
  Logger.log('   Chiusura: ' + (closeResult.ok ? 'OK, ' + closeResult.result.charges_generated + ' addebiti' : closeResult.error));

  // 8. Saldo post-chiusura
  Logger.log('8. Saldo post-chiusura...');
  var dash3 = callApi('getMemberDashboard', {});
  Logger.log('   Saldo: €' + (dash3.ok ? dash3.result.balance : '?'));
  Logger.log('   (Atteso: €-9.30)');

  // 9. Storico e movimenti
  Logger.log('9. Storico e movimenti...');
  var history = callApi('getMyOrderHistory', {});
  Logger.log('   Ordini in storico: ' + (history.ok ? history.result.length : '?'));
  var ledger = callApi('getMyLedger', {});
  if (ledger.ok) {
    ledger.result.forEach(function(e) {
      Logger.log('   ' + e.type + ': €' + e.amount + ' — ' + e.note);
    });
  }

  Logger.log('═══ TEST COMPLETATO ═══');
  return { ok: true, cycle_id: cycleId };
}

/**
 * Aggiunge/aggiorna i soci dell'associazione.
 * Eseguire dall'editor: setupMembers()
 */
function setupMembers() {
  var members = [
    { full_name: 'Manuel Rizzo',      email: 'manuel.rizzo@portamoneta.org',      role: 'admin',  active: true },
    { full_name: 'Nadia Di Simine',   email: 'nadia.disimine@portamoneta.org',    role: 'admin',  active: true },
    { full_name: 'Maria Malacrino',   email: 'maria.malacrino@portamoneta.org',   role: 'admin',  active: true },
    { full_name: 'Maria Fois',        email: 'maria.fois@portamoneta.org',        role: 'member', active: true }
  ];

  Logger.log('═══ SETUP SOCI ═══');
  members.forEach(function(m) {
    var result = callApi('adminUpsertMember', m);
    Logger.log((result.ok ? '✓' : '✗') + ' ' + m.full_name + ' (' + m.role + ') — ' + m.email +
      (result.ok ? '' : ' — ' + result.error.message));
  });

  Logger.log('──────────────────────────');
  Logger.log('Elenco completo soci:');
  var all = callApi('adminGetMembers', {});
  if (all.ok) {
    all.result.forEach(function(m) {
      Logger.log('  ' + m.full_name + ' | ' + m.email + ' | ' + m.role + ' | attivo: ' + m.active);
    });
  }
}

/**
 * Crea un ciclo ordine aperto con 18 prodotti realistici.
 * Eseguire dall'editor: createDemoCycle()
 */
function createDemoCycle() {
  Logger.log('═══ CREAZIONE CICLO DEMO ═══');

  // Chiudi eventuali cicli aperti
  var openCycle = getOpenCycle_();
  if (openCycle) {
    Logger.log('Ciclo aperto trovato: "' + openCycle.title + '". Lo chiudo...');
    callApi('adminCloseCycle', { cycle_id: openCycle.cycle_id });
    Logger.log('  Chiuso.');
  }

  var close = new Date(Date.now() + 5 * 86400000);
  var pickup = new Date(Date.now() + 7 * 86400000);
  var result = callApi('adminCreateCycle', {
    title: 'Ordine settimana ' + pickup.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' }),
    order_close_at: close.toISOString(),
    pickup_date: pickup.toISOString().substring(0, 10),
    notes: 'Ritiro ore 10-12 presso sede'
  });

  if (!result.ok) {
    Logger.log('ERRORE: ' + result.error.message);
    return;
  }

  var cycleId = result.result.cycle_id;

  var products = [
    { name: 'Arance',    variant: 'Tarocco',            format: '1 kg',    unit_price: 2.80, supplier: 'Az. Ferrara', notes: '' },
    { name: 'Mele',      variant: 'Fuji',               format: '1 kg',    unit_price: 3.20, supplier: 'Az. Ferrara', notes: '' },
    { name: 'Pere',      variant: 'Abate',              format: '1 kg',    unit_price: 3.50, supplier: 'Az. Ferrara', notes: '' },
    { name: 'Banane',    variant: '',                    format: '1 kg',    unit_price: 2.40, supplier: 'Coop Equo',   notes: 'commercio equo' },
    { name: 'Limoni',    variant: 'Femminello',          format: '500 g',   unit_price: 1.60, supplier: 'Az. Ferrara', notes: 'non trattati' },
    { name: 'Kiwi',      variant: '',                    format: '1 kg',    unit_price: 3.80, supplier: 'Az. Ferrara', notes: '' },
    { name: 'Carote',    variant: '',                    format: '1 kg',    unit_price: 1.90, supplier: 'Az. Miglio',  notes: '' },
    { name: 'Zucchine',  variant: '',                    format: '1 kg',    unit_price: 3.00, supplier: 'Az. Miglio',  notes: '' },
    { name: 'Patate',    variant: 'pasta gialla',        format: '2 kg',    unit_price: 3.60, supplier: 'Az. Miglio',  notes: '' },
    { name: 'Cipolle',   variant: 'dorate',              format: '1 kg',    unit_price: 1.80, supplier: 'Az. Miglio',  notes: '' },
    { name: 'Pomodori',  variant: 'ciliegino',           format: '500 g',   unit_price: 2.50, supplier: 'Az. Ferrara', notes: '' },
    { name: 'Insalata',  variant: 'lattuga',             format: '1 cespo', unit_price: 1.50, supplier: 'Az. Miglio',  notes: '' },
    { name: 'Spinaci',   variant: '',                    format: '500 g',   unit_price: 2.80, supplier: 'Az. Miglio',  notes: '' },
    { name: 'Finocchi',  variant: '',                    format: '1 kg',    unit_price: 2.60, supplier: 'Az. Miglio',  notes: '' },
    { name: 'Cavolo',    variant: 'verza',               format: '1 pz',    unit_price: 2.20, supplier: 'Az. Miglio',  notes: '' },
    { name: 'Uova',      variant: 'bio allevam. terra',  format: '6 pz',    unit_price: 3.60, supplier: 'Fattoria Rosa', notes: 'freschissime' },
    { name: 'Miele',     variant: 'millefiori',          format: '500 g',   unit_price: 8.50, supplier: 'Apicoltura Landi', notes: '' },
    { name: 'Pane',      variant: 'integrale',           format: '1 kg',    unit_price: 4.20, supplier: 'Forno Antico', notes: 'lievito madre' }
  ];

  var prodResult = callApi('adminUpdateProducts', { cycle_id: cycleId, products: products });
  Logger.log('Prodotti caricati: ' + (prodResult.ok ? prodResult.result.count : prodResult.error.message));

  Logger.log('');
  Logger.log('═══ CICLO DEMO PRONTO ═══');
  Logger.log('Titolo: ' + result.result.title);
  Logger.log('Chiusura: ' + close.toLocaleDateString('it-IT'));
  Logger.log('Ritiro: ' + pickup.toLocaleDateString('it-IT'));
  Logger.log('Prodotti: ' + products.length);
  Logger.log('Apri l\'app nel browser per vedere il listino.');
}
