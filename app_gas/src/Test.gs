/* ───────────────────────────────────────────
   Test.gs — Utilità e diagnostica
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
 * Aggiunge/aggiorna i soci fondamentali (admin + soci con email).
 * setupMembers()
 */
function setupMembers() {
  var members = [
    { full_name: 'Manuel Rizzo',      email: 'manuel.rizzo@portamoneta.org',      role: 'admin',  active: true },
    { full_name: 'Nadia Di Simine',   email: 'nadia.disimine@portamoneta.org',    role: 'admin',  active: true },
    { full_name: 'Maria Malacrino',   email: 'maria.malacrino@portamoneta.org',   role: 'admin',  active: true },
    { full_name: 'Maria Fois',        email: 'maria.fois@portamoneta.org',        role: 'attivo', active: true }
  ];

  Logger.log('═══ SETUP SOCI ═══');
  members.forEach(function(m) {
    var result = callApi('adminUpsertMember', m);
    Logger.log((result.ok ? '✓' : '✗') + ' ' + m.full_name + ' (' + m.role + ')' +
      (result.ok ? '' : ' — ' + result.error.message));
  });

  var all = callApi('adminGetMembers', {});
  if (all.ok) {
    Logger.log('──────────────────────────');
    all.result.forEach(function(m) {
      Logger.log('  ' + m.full_name + ' | ' + m.email + ' | ' + m.role);
    });
  }
}

/**
 * Crea tutti i fornitori e il catalogo prodotti di Fabio.
 * Eseguire una volta: setupSuppliersData()
 */
function setupSuppliersData() {
  Logger.log('═══ SETUP FORNITORI ═══');

  // ── Fabio (frutta e verdura settimanale) ──
  var fabioResult = callApi('adminUpsertSupplier', {
    name: 'Fabio', macro_category: 'Frutta e verdura',
    contact_name: 'Fabio', notes: 'Fornitore principale settimanale di frutta e verdura'
  });
  Logger.log((fabioResult.ok ? '✓' : '✗') + ' Fabio');
  if (!fabioResult.ok) { Logger.log('Errore: ' + fabioResult.error.message); return; }

  // Trova il supplier_id di Fabio
  var allSuppliers = readSheetObjects_(APP.SHEETS.SUPPLIERS);
  var fabio = allSuppliers[allSuppliers.length - 1]; // appena creato = ultimo

  var frutta   = ['Kiwi','Mela'];
  var verdura  = ['Aglio','Aglio serpentino','Barbabietola','Batata','Carota','Cavolfiore','Cavolo',
                  'Cipolla','Cipollotto','Finocchio','Ortica','Patata','Peperone','Porro',
                  'Ramolaccio','Rapa','Scalogno','Topinambur','Zucca'];
  var insalate = ['Bieta','Cicoria','Cima di rapa','Radicchio','Scarola','Spinacio',
                  'Valeriana','Vasetto di basilico viola'];

  var products = [];
  frutta.forEach(function(n)   { products.push({ name: n, category: 'Frutta' }); });
  verdura.forEach(function(n)  { products.push({ name: n, category: 'Verdura' }); });
  insalate.forEach(function(n) { products.push({ name: n, category: 'Insalate' }); });

  var ok = 0;
  products.forEach(function(p) {
    var r = callApi('adminUpsertCatalogProduct', { supplier_id: fabio.supplier_id, name: p.name, category: p.category });
    if (r.ok) ok++;
    else Logger.log('✗ ' + p.name + ': ' + r.error.message);
  });
  Logger.log('✓ Fabio: ' + ok + '/' + products.length + ' prodotti nel catalogo');

  // ── Altri fornitori (senza prodotti) ──
  var others = [
    { name: 'Latteria sociale del Fornacione', macro_category: 'Latticini',             contact_name: 'Chiara Riva' },
    { name: 'Girolomoni - Cooperativa Agricola', macro_category: 'Dispensa',            contact_name: 'Giuliana Miglierina' },
    { name: 'Molino Agostini',                 macro_category: 'Dispensa',              contact_name: 'Susanna Villa',    phone: '0734 938166', email: 'info@molinoagostini.it', address: 'Contrada San Pietro, 60 - Massignano (AP)' },
    { name: "Terra d'Arcoiris",                macro_category: 'Bevande e condimenti',  contact_name: 'Thomas Loesch',    email: 'info@terradarcoiris.com', address: 'Strada della Maglianella, 5 - Chianciano Terme (SI)' },
    { name: 'Hosteria di Villalba',            macro_category: 'Bevande e condimenti',  contact_name: 'Silvia' },
    { name: 'Le Galline Felici',               macro_category: 'Frutta e verdura',      contact_name: 'Eva Veroli',       notes: 'Consorzio Siciliano — Agrumi' },
    { name: 'Roncaglia Serabial',              macro_category: 'Frutta e verdura',      email: 'info@roncagliabio.com',   address: 'Str. Roncaglia 25, Bricherasio (TO)', notes: 'Mele' },
    { name: 'Azienda Agricola Rampelli',       macro_category: 'Frutta e verdura',      address: 'Spormaggiore, Val di Non (TN)', notes: 'Mele' },
    { name: 'Agrimi Bio',                      macro_category: 'Frutta e verdura',      address: 'Via per Castellazzo 16, Basiano (MI)', notes: 'Soc. Coop. Sociale' },
    { name: 'Cascina Biblioteca',              macro_category: 'Vari',                  contact_name: 'Maria Malacrinò' },
    { name: 'Agripiccola',                     macro_category: 'Carni',                 contact_name: 'Marilù di Mauro',  email: 'info@agripiccola.com', address: 'Strada Provinciale 94/16, Casletto (BG)', notes: 'Società agricola' },
    { name: 'Azienda Agricola Pian du Lares',  macro_category: 'Latticini',             contact_name: 'Matteo Spertini',  phone: '0332 558178', email: 'piandulares@gmail.com', address: 'Via Petrolo, 18 - Veddasca (VA)', notes: 'Formaggi vaccino e capra' },
    { name: 'Azienda Agricola Zaffaroni',      macro_category: 'Latticini',             contact_name: 'Silvia Ballabio',  address: 'Via A. Grandi 100, Mozzate (CO)', notes: 'Formaggi e carne' },
    { name: 'Cascina Nibai/Biblioteca',        macro_category: 'Uova' },
    { name: 'La Saponaria',                    macro_category: 'Igiene e casa' },
    { name: 'Officina Naturae',                macro_category: 'Igiene e casa' },
    { name: 'Teanatura',                       macro_category: 'Igiene e casa' }
  ];

  others.forEach(function(s) {
    var r = callApi('adminUpsertSupplier', s);
    Logger.log((r.ok ? '✓' : '✗') + ' ' + s.name);
  });

  Logger.log('✓ Setup fornitori completato. Totale: ' + (1 + others.length) + ' fornitori.');
}

/**
 * Riepilogo completo di tutti i dati nel foglio.
 * listAllData()
 */
function listAllData() {
  Logger.log('═══ RIEPILOGO DATI ═══');

  var cycles = readSheetObjects_(APP.SHEETS.ORDER_CYCLES);
  Logger.log('\n── Cicli (' + cycles.length + ') ──');
  cycles.forEach(function(c) {
    Logger.log('  ' + c.title + ' | ' + c.status + ' | ' + c.pickup_date + ' | ' + c.cycle_id);
  });

  var members = readSheetObjects_(APP.SHEETS.MEMBERS);
  Logger.log('\n── Soci (' + members.length + ') ──');
  members.forEach(function(m) {
    var bal = getMemberBalance_(m.member_id);
    Logger.log('  ' + m.full_name + ' | ' + (m.email || '—') + ' | ' + m.role + ' | attivo:' + m.active + ' | saldo:€' + bal);
  });

  var products = readSheetObjects_(APP.SHEETS.PRODUCTS);
  Logger.log('\n── Prodotti: ' + products.length + ' righe ──');

  var orders = readSheetObjects_(APP.SHEETS.ORDERS);
  Logger.log('── Ordini: ' + orders.length + ' righe ──');

  var ledger = readSheetObjects_(APP.SHEETS.LEDGER_ENTRIES);
  var types = {};
  ledger.forEach(function(e) { types[e.type] = (types[e.type] || 0) + 1; });
  Logger.log('── Movimenti: ' + ledger.length + ' | ' +
    Object.keys(types).map(function(t) { return t + ':' + types[t]; }).join(', '));
}
