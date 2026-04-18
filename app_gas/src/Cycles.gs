/* ───────────────────────────────────────────
   Cycles.gs — Gestione cicli d'ordine
   ─────────────────────────────────────────── */

function getOpenCycle_() {
  var cycles = readSheetObjects_(APP.SHEETS.ORDER_CYCLES);
  for (var i = 0; i < cycles.length; i++) {
    if (cycles[i].status === APP.CYCLE_STATUS.OPEN) {
      return cycles[i];
    }
  }
  return null;
}

function getOpenCycle(payload) {
  requireSession_(payload);
  return getOpenCycle_();
}

function adminGetRecentCycles(payload) {
  requireAdmin_(payload);
  var cycles = readSheetObjects_(APP.SHEETS.ORDER_CYCLES);
  cycles.sort(function(a, b) {
    return String(b.created_at).localeCompare(String(a.created_at));
  });
  return cycles.slice(0, 10);
}

function adminCreateCycle(payload) {
  var admin = requireAdmin_(payload);
  assert_(payload.title, 'Titolo obbligatorio.');
  assert_(payload.order_close_at, 'Data chiusura ordine obbligatoria.');
  assert_(payload.supplier_id, 'Fornitore obbligatorio.');

  var existing = getOpenCycle_();
  assert_(!existing, 'Esiste già un ordine aperto: "' + (existing && existing.title) + '". Chiudilo prima di crearne uno nuovo.');

  var accessLevel = payload.access_level || APP.ACCESS_LEVEL.ATTIVI;
  assert_(
    accessLevel === APP.ACCESS_LEVEL.ATTIVI || accessLevel === APP.ACCESS_LEVEL.ALL,
    'Valore access_level non valido.'
  );

  // Verifica che il fornitore esista e sia attivo
  var suppliers = readSheetObjects_(APP.SHEETS.SUPPLIERS);
  var supplier = null;
  for (var j = 0; j < suppliers.length; j++) {
    if (suppliers[j].supplier_id === payload.supplier_id) { supplier = suppliers[j]; break; }
  }
  assert_(supplier, 'Fornitore non trovato.');
  assert_(String(supplier.active) !== 'false', 'Fornitore non attivo.');

  var now = nowIso_();
  var cycle = {
    cycle_id:       generateId_('cyc'),
    title:          payload.title,
    pickup_date:    payload.pickup_date || '',
    order_open_at:  payload.order_open_at || now,
    order_close_at: payload.order_close_at,
    status:         APP.CYCLE_STATUS.OPEN,
    access_level:   accessLevel,
    notes:          payload.notes || '',
    created_by:     admin.email,
    created_at:     now,
    closed_at:      '',
    supplier_id:    payload.supplier_id
  };

  appendSheetObject_(APP.SHEETS.ORDER_CYCLES, APP.HEADERS.order_cycles, cycle);
  logAudit_(admin.email, 'create_cycle', 'cycle', cycle.cycle_id, payload);

  // Carica automaticamente i prodotti dal catalogo del fornitore
  var productsLoaded = 0;
  try {
    productsLoaded = _copyCatalogToCycle_(cycle.cycle_id, payload.supplier_id, admin.email);
  } catch (e) {
    productsLoaded = 0;
  }
  cycle.products_loaded = productsLoaded;
  return cycle;
}

// Lista tutti gli ordini con nome fornitore joinato
function adminGetCycles(payload) {
  requireAdmin_(payload);
  var suppliers = readSheetObjects_(APP.SHEETS.SUPPLIERS);
  var supMap = {};
  suppliers.forEach(function(s) { supMap[s.supplier_id] = s.name; });

  var cycles = readSheetObjects_(APP.SHEETS.ORDER_CYCLES).map(function(c) {
    return {
      cycle_id:       c.cycle_id,
      title:          c.title,
      pickup_date:    c.pickup_date || '',
      order_open_at:  c.order_open_at || '',
      order_close_at: c.order_close_at || '',
      status:         c.status,
      access_level:   c.access_level || APP.ACCESS_LEVEL.ATTIVI,
      notes:          c.notes || '',
      supplier_id:    c.supplier_id || '',
      supplier_name:  c.supplier_id ? (supMap[c.supplier_id] || '—') : '—',
      created_at:     c.created_at,
      closed_at:      c.closed_at || ''
    };
  });

  cycles.sort(function(a, b) {
    var ad = a.pickup_date || a.created_at;
    var bd = b.pickup_date || b.created_at;
    return String(bd).localeCompare(String(ad));
  });
  return cycles;
}

// Modifica un ordine esistente. Ordini chiusi NON sono modificabili.
function adminUpdateCycle(payload) {
  var admin = requireAdmin_(payload);
  assert_(payload.cycle_id, 'cycle_id obbligatorio.');

  var cycles = readSheetObjects_(APP.SHEETS.ORDER_CYCLES);
  var idx = -1;
  for (var i = 0; i < cycles.length; i++) {
    if (cycles[i].cycle_id === payload.cycle_id) { idx = i; break; }
  }
  assert_(idx !== -1, 'Ordine non trovato.');

  var cycle = cycles[idx];
  assert_(cycle.status !== APP.CYCLE_STATUS.CLOSED && cycle.status !== APP.CYCLE_STATUS.ARCHIVED,
    'Ordini chiusi non possono essere modificati. Correggi eventuali errori in Cassa.');

  if (payload.title !== undefined)          cycle.title = payload.title;
  if (payload.pickup_date !== undefined)    cycle.pickup_date = payload.pickup_date;
  if (payload.order_close_at !== undefined) cycle.order_close_at = payload.order_close_at;
  if (payload.notes !== undefined)          cycle.notes = payload.notes;

  if (payload.access_level !== undefined) {
    assert_(
      payload.access_level === APP.ACCESS_LEVEL.ATTIVI || payload.access_level === APP.ACCESS_LEVEL.ALL,
      'Valore access_level non valido.'
    );
    cycle.access_level = payload.access_level;
  }

  if (payload.supplier_id !== undefined && payload.supplier_id !== cycle.supplier_id) {
    assert_(payload.supplier_id, 'Fornitore obbligatorio.');
    var suppliers = readSheetObjects_(APP.SHEETS.SUPPLIERS);
    var found = false;
    for (var k = 0; k < suppliers.length; k++) {
      if (suppliers[k].supplier_id === payload.supplier_id) { found = true; break; }
    }
    assert_(found, 'Fornitore non trovato.');
    cycle.supplier_id = payload.supplier_id;
  }

  cycles[idx] = cycle;
  overwriteSheetObjects_(APP.SHEETS.ORDER_CYCLES, APP.HEADERS.order_cycles, cycles);
  logAudit_(admin.email, 'update_cycle', 'cycle', payload.cycle_id, payload);
  return { success: true };
}

function adminCloseCycle(payload) {
  var admin = requireAdmin_(payload);
  assert_(payload.cycle_id, 'cycle_id obbligatorio.');

  var cycles = readSheetObjects_(APP.SHEETS.ORDER_CYCLES);
  var cycle = null;
  for (var i = 0; i < cycles.length; i++) {
    if (cycles[i].cycle_id === payload.cycle_id) {
      cycle = cycles[i];
      assert_(cycle.status === APP.CYCLE_STATUS.OPEN,
        'Solo un ciclo aperto può essere chiuso. Stato attuale: ' + cycle.status);
      cycles[i].status = APP.CYCLE_STATUS.CLOSED;
      cycles[i].closed_at = nowIso_();
      break;
    }
  }
  assert_(cycle, 'Ciclo non trovato: ' + payload.cycle_id);

  overwriteSheetObjects_(APP.SHEETS.ORDER_CYCLES, APP.HEADERS.order_cycles, cycles);

  // Genera addebiti
  var chargesGenerated = generateOrderCharges_(payload.cycle_id, admin.email);

  logAudit_(admin.email, 'close_cycle', 'cycle', payload.cycle_id,
    { charges_generated: chargesGenerated });

  return { closed: true, charges_generated: chargesGenerated };
}
