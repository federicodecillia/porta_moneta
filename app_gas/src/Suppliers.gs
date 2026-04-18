/* ───────────────────────────────────────────
   Suppliers.gs — Fornitori e catalogo prodotti
   ─────────────────────────────────────────── */

function adminGetSuppliers(payload) {
  requireAdmin_(payload);
  var suppliers = readSheetObjects_(APP.SHEETS.SUPPLIERS);
  return suppliers.sort(function(a, b) {
    var ac = a.macro_category || '', bc = b.macro_category || '';
    return ac.localeCompare(bc) || (a.name || '').localeCompare(b.name || '');
  });
}

function adminUpsertSupplier(payload) {
  var admin = requireAdmin_(payload);
  assert_(payload.name, 'Nome fornitore obbligatorio.');

  var suppliers = readSheetObjects_(APP.SHEETS.SUPPLIERS);
  var idx = -1;
  for (var i = 0; i < suppliers.length; i++) {
    if (suppliers[i].supplier_id === payload.supplier_id) { idx = i; break; }
  }

  var now = nowIso_();
  if (idx !== -1) {
    var s = suppliers[idx];
    s.name          = payload.name;
    s.macro_category = payload.macro_category !== undefined ? payload.macro_category : s.macro_category;
    s.contact_name  = payload.contact_name  !== undefined ? payload.contact_name  : s.contact_name;
    s.phone         = payload.phone         !== undefined ? payload.phone         : s.phone;
    s.email         = payload.email         !== undefined ? payload.email         : s.email;
    s.address       = payload.address       !== undefined ? payload.address       : s.address;
    s.notes         = payload.notes         !== undefined ? payload.notes         : s.notes;
    s.active        = payload.active        !== undefined ? payload.active        : s.active;
  } else {
    suppliers.push({
      supplier_id:   generateId_('sup'),
      name:          payload.name,
      macro_category:payload.macro_category  || '',
      contact_name:  payload.contact_name    || '',
      phone:         payload.phone           || '',
      email:         payload.email           || '',
      address:       payload.address         || '',
      notes:         payload.notes           || '',
      active:        payload.active !== undefined ? payload.active : true,
      created_at:    now
    });
  }

  overwriteSheetObjects_(APP.SHEETS.SUPPLIERS, APP.HEADERS.suppliers, suppliers);
  logAudit_(admin.email, idx !== -1 ? 'update_supplier' : 'create_supplier', 'supplier',
    payload.name, payload);
  return { success: true };
}

function adminGetCatalog(payload) {
  requireAdmin_(payload);
  assert_(payload.supplier_id, 'supplier_id obbligatorio.');
  var catOrder = ['Frutta', 'Verdura', 'Insalate'];
  return readSheetObjects_(APP.SHEETS.CATALOG_PRODUCTS)
    .filter(function(p) {
      return p.supplier_id === payload.supplier_id && String(p.active) !== 'false';
    })
    .sort(function(a, b) {
      var ai = catOrder.indexOf(a.category); if (ai === -1) ai = 99;
      var bi = catOrder.indexOf(b.category); if (bi === -1) bi = 99;
      return ai !== bi ? ai - bi : (a.name || '').localeCompare(b.name || '');
    });
}

function adminUpsertCatalogProduct(payload) {
  var admin = requireAdmin_(payload);
  assert_(payload.supplier_id, 'supplier_id obbligatorio.');
  assert_(payload.name, 'Nome prodotto obbligatorio.');

  var products = readSheetObjects_(APP.SHEETS.CATALOG_PRODUCTS);
  var idx = -1;
  for (var i = 0; i < products.length; i++) {
    if (products[i].catalog_id === payload.catalog_id) { idx = i; break; }
  }

  var now = nowIso_();
  if (idx !== -1) {
    var p = products[idx];
    p.name       = payload.name;
    p.variant    = payload.variant    !== undefined ? payload.variant    : p.variant;
    p.format     = payload.format     !== undefined ? payload.format     : p.format;
    p.unit_price = payload.unit_price !== undefined ? payload.unit_price : p.unit_price;
    p.category   = payload.category   !== undefined ? payload.category   : p.category;
    p.notes      = payload.notes      !== undefined ? payload.notes      : p.notes;
    p.active     = payload.active     !== undefined ? payload.active     : p.active;
  } else {
    products.push({
      catalog_id:  generateId_('cat'),
      supplier_id: payload.supplier_id,
      name:        payload.name,
      variant:     payload.variant   || '',
      format:      payload.format    || '',
      unit_price:  payload.unit_price || 0,
      category:    payload.category  || '',
      notes:       payload.notes     || '',
      sort_order:  products.filter(function(x) { return x.supplier_id === payload.supplier_id; }).length + 1,
      active:      true,
      created_at:  now
    });
  }

  overwriteSheetObjects_(APP.SHEETS.CATALOG_PRODUCTS, APP.HEADERS.catalog_products, products);
  return { success: true };
}

// Helper: copia il catalogo del fornitore nello sheet products del ciclo.
// Non lancia se il catalogo è vuoto — restituisce count=0.
function _copyCatalogToCycle_(cycleId, supplierId, adminEmail) {
  var catOrder = ['Frutta', 'Verdura', 'Insalate'];
  var catalog = readSheetObjects_(APP.SHEETS.CATALOG_PRODUCTS)
    .filter(function(p) {
      return p.supplier_id === supplierId && String(p.active) !== 'false';
    })
    .sort(function(a, b) {
      var ai = catOrder.indexOf(a.category); if (ai === -1) ai = 99;
      var bi = catOrder.indexOf(b.category); if (bi === -1) bi = 99;
      return ai !== bi ? ai - bi : (a.name || '').localeCompare(b.name || '');
    });

  var allProducts = readSheetObjects_(APP.SHEETS.PRODUCTS);
  var otherCycles = allProducts.filter(function(p) { return p.cycle_id !== cycleId; });

  var newProducts = catalog.map(function(cp, i) {
    return {
      product_id:  generateId_('prd'),
      cycle_id:    cycleId,
      name:        cp.name,
      variant:     cp.variant     || '',
      format:      cp.format      || '',
      unit_price:  toNumber_(cp.unit_price),
      supplier:    '',
      notes:       cp.notes       || '',
      sort_order:  i + 1,
      active:      true,
      supplier_id: cp.supplier_id,
      category:    cp.category    || ''
    };
  });

  overwriteSheetObjects_(APP.SHEETS.PRODUCTS, APP.HEADERS.products, otherCycles.concat(newProducts));
  logAudit_(adminEmail, 'load_catalog', 'cycle', cycleId,
    { supplier_id: supplierId, count: newProducts.length });
  return newProducts.length;
}

function adminLoadCatalogIntoCycle(payload) {
  var admin = requireAdmin_(payload);
  assert_(payload.supplier_id, 'supplier_id obbligatorio.');
  assert_(payload.cycle_id, 'cycle_id obbligatorio.');

  var cycles = readSheetObjects_(APP.SHEETS.ORDER_CYCLES);
  var cycle = null;
  for (var i = 0; i < cycles.length; i++) {
    if (cycles[i].cycle_id === payload.cycle_id) { cycle = cycles[i]; break; }
  }
  assert_(cycle, 'Ordine non trovato.');
  assert_(cycle.status === APP.CYCLE_STATUS.OPEN, 'Il ciclo non è aperto.');

  var count = _copyCatalogToCycle_(payload.cycle_id, payload.supplier_id, admin.email);
  assert_(count > 0, 'Nessun prodotto nel catalogo di questo fornitore.');
  return { count: count };
}

// Catalogo globale (tutti i fornitori), con join supplier_name e lista categorie disponibili
function adminGetAllCatalog(payload) {
  requireAdmin_(payload);
  var suppliers = readSheetObjects_(APP.SHEETS.SUPPLIERS);
  var supMap = {};
  suppliers.forEach(function(s) { supMap[s.supplier_id] = s; });

  var catalog = readSheetObjects_(APP.SHEETS.CATALOG_PRODUCTS)
    .filter(function(p) { return String(p.active) !== 'false'; })
    .map(function(p) {
      var s = supMap[p.supplier_id] || {};
      return {
        catalog_id:     p.catalog_id,
        supplier_id:    p.supplier_id,
        supplier_name:  s.name || '—',
        supplier_macro: s.macro_category || '',
        name:           p.name,
        variant:        p.variant || '',
        format:         p.format || '',
        unit_price:     toNumber_(p.unit_price),
        category:       p.category || 'Altro',
        notes:          p.notes || ''
      };
    });

  var catSet = {};
  APP.CATEGORIES.forEach(function(c) { catSet[c] = true; });
  catalog.forEach(function(p) { if (p.category) catSet[p.category] = true; });
  var categories = Object.keys(catSet).sort(function(a, b) {
    var ai = APP.CATEGORIES.indexOf(a), bi = APP.CATEGORIES.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });

  catalog.sort(function(a, b) {
    var ai = categories.indexOf(a.category), bi = categories.indexOf(b.category);
    if (ai !== bi) return ai - bi;
    return (a.supplier_name || '').localeCompare(b.supplier_name || '') ||
           (a.name || '').localeCompare(b.name || '');
  });

  return { catalog: catalog, categories: categories };
}

function adminDeleteSupplier(payload) {
  var admin = requireAdmin_(payload);
  assert_(payload.supplier_id, 'supplier_id obbligatorio.');

  var cycles = readSheetObjects_(APP.SHEETS.ORDER_CYCLES);
  var referenced = cycles.filter(function(c) { return c.supplier_id === payload.supplier_id; });
  assert_(
    referenced.length === 0,
    'Impossibile eliminare: il fornitore è associato a ' + referenced.length + ' ordine/i. Disattivalo invece.'
  );

  var suppliers = readSheetObjects_(APP.SHEETS.SUPPLIERS);
  var filtered = suppliers.filter(function(s) { return s.supplier_id !== payload.supplier_id; });
  assert_(filtered.length < suppliers.length, 'Fornitore non trovato.');

  // Rimuove anche i prodotti dal catalogo
  var catalog = readSheetObjects_(APP.SHEETS.CATALOG_PRODUCTS);
  var catFiltered = catalog.filter(function(p) { return p.supplier_id !== payload.supplier_id; });

  overwriteSheetObjects_(APP.SHEETS.SUPPLIERS, APP.HEADERS.suppliers, filtered);
  overwriteSheetObjects_(APP.SHEETS.CATALOG_PRODUCTS, APP.HEADERS.catalog_products, catFiltered);
  logAudit_(admin.email, 'delete_supplier', 'supplier', payload.supplier_id,
    { removed_catalog_products: catalog.length - catFiltered.length });
  return { success: true };
}

function adminDeleteCatalogProduct(payload) {
  var admin = requireAdmin_(payload);
  assert_(payload.catalog_id, 'catalog_id obbligatorio.');

  var products = readSheetObjects_(APP.SHEETS.CATALOG_PRODUCTS);
  var filtered = products.filter(function(p) { return p.catalog_id !== payload.catalog_id; });
  assert_(filtered.length < products.length, 'Prodotto non trovato.');

  overwriteSheetObjects_(APP.SHEETS.CATALOG_PRODUCTS, APP.HEADERS.catalog_products, filtered);
  logAudit_(admin.email, 'delete_catalog_product', 'catalog', payload.catalog_id, {});
  return { success: true };
}

function adminBulkReplaceSupplierCatalog(payload) {
  var admin = requireAdmin_(payload);
  assert_(payload.supplier_id, 'supplier_id obbligatorio.');
  assert_(Array.isArray(payload.products), 'products deve essere un array.');

  var existing = readSheetObjects_(APP.SHEETS.CATALOG_PRODUCTS);
  var others = existing.filter(function(p) { return p.supplier_id !== payload.supplier_id; });

  var now = nowIso_();
  var newRows = payload.products.map(function(p, i) {
    assert_(p.name, 'Nome prodotto obbligatorio (riga ' + (i + 1) + ').');
    return {
      catalog_id:  generateId_('cat'),
      supplier_id: payload.supplier_id,
      name:        p.name,
      variant:     p.variant || '',
      format:      p.format || '',
      unit_price:  toNumber_(p.unit_price),
      category:    p.category || 'Altro',
      notes:       p.notes || '',
      sort_order:  i + 1,
      active:      true,
      created_at:  now
    };
  });

  overwriteSheetObjects_(APP.SHEETS.CATALOG_PRODUCTS, APP.HEADERS.catalog_products, others.concat(newRows));
  logAudit_(admin.email, 'bulk_replace_catalog', 'supplier', payload.supplier_id,
    { count: newRows.length });
  return { count: newRows.length };
}

// Chiave di match tra catalog_products e products (stessa combinazione nome/varietà/formato)
function _productKey_(p) {
  return [
    String(p.name || '').trim().toLowerCase(),
    String(p.variant || '').trim().toLowerCase(),
    String(p.format || '').trim().toLowerCase()
  ].join('|');
}

// Ritorna il catalogo del fornitore del ciclo + quali catalog_id sono attualmente nel ciclo
function adminGetCycleCatalogSelection(payload) {
  requireAdmin_(payload);
  assert_(payload.cycle_id, 'cycle_id obbligatorio.');

  var cycles = readSheetObjects_(APP.SHEETS.ORDER_CYCLES);
  var cycle = null;
  for (var i = 0; i < cycles.length; i++) {
    if (cycles[i].cycle_id === payload.cycle_id) { cycle = cycles[i]; break; }
  }
  assert_(cycle, 'Ordine non trovato.');
  assert_(cycle.supplier_id, 'Ordine senza fornitore associato.');

  var catalog = readSheetObjects_(APP.SHEETS.CATALOG_PRODUCTS)
    .filter(function(p) {
      return p.supplier_id === cycle.supplier_id && String(p.active) !== 'false';
    })
    .map(function(p) {
      return {
        catalog_id: p.catalog_id,
        name:       p.name,
        variant:    p.variant || '',
        format:     p.format || '',
        unit_price: toNumber_(p.unit_price),
        category:   p.category || 'Altro',
        notes:      p.notes || ''
      };
    });

  var cycleProducts = readSheetObjectsWhere_(APP.SHEETS.PRODUCTS, 'cycle_id', payload.cycle_id)
    .filter(function(p) { return String(p.active) !== 'false'; });
  var loadedKeys = {};
  cycleProducts.forEach(function(p) { loadedKeys[_productKey_(p)] = true; });

  var selectedCatalogIds = catalog
    .filter(function(cp) { return loadedKeys[_productKey_(cp)]; })
    .map(function(cp) { return cp.catalog_id; });

  var catOrder = APP.CATEGORIES;
  catalog.sort(function(a, b) {
    var ai = catOrder.indexOf(a.category); if (ai === -1) ai = 99;
    var bi = catOrder.indexOf(b.category); if (bi === -1) bi = 99;
    return ai !== bi ? ai - bi : (a.name || '').localeCompare(b.name || '');
  });

  return {
    cycle_id:             cycle.cycle_id,
    supplier_id:          cycle.supplier_id,
    catalog:              catalog,
    selected_catalog_ids: selectedCatalogIds
  };
}

// Imposta quali catalog_products sono presenti nel ciclo.
// Preserva i product_id esistenti dove il match (name|variant|format) coincide,
// così gli ordini già inseriti dai soci non diventano orfani.
function adminSetCycleCatalogSelection(payload) {
  var admin = requireAdmin_(payload);
  assert_(payload.cycle_id, 'cycle_id obbligatorio.');
  assert_(Array.isArray(payload.catalog_ids), 'catalog_ids deve essere un array.');

  var cycles = readSheetObjects_(APP.SHEETS.ORDER_CYCLES);
  var cycle = null;
  for (var i = 0; i < cycles.length; i++) {
    if (cycles[i].cycle_id === payload.cycle_id) { cycle = cycles[i]; break; }
  }
  assert_(cycle, 'Ordine non trovato.');
  assert_(cycle.status === APP.CYCLE_STATUS.OPEN, 'Ordine non modificabile: non è aperto.');
  assert_(cycle.supplier_id, 'Ordine senza fornitore associato.');

  var catalogForSupplier = readSheetObjects_(APP.SHEETS.CATALOG_PRODUCTS)
    .filter(function(p) {
      return p.supplier_id === cycle.supplier_id && String(p.active) !== 'false';
    });
  var catalogById = {};
  catalogForSupplier.forEach(function(cp) { catalogById[cp.catalog_id] = cp; });

  var selected = payload.catalog_ids
    .map(function(id) { return catalogById[id]; })
    .filter(function(cp) { return !!cp; });

  var allProducts = readSheetObjects_(APP.SHEETS.PRODUCTS);
  var otherCycles = allProducts.filter(function(p) { return p.cycle_id !== payload.cycle_id; });
  var cycleProducts = allProducts.filter(function(p) { return p.cycle_id === payload.cycle_id; });

  var existingByKey = {};
  cycleProducts.forEach(function(p) { existingByKey[_productKey_(p)] = p; });

  var catOrder = ['Frutta', 'Verdura', 'Insalate'];
  selected.sort(function(a, b) {
    var ai = catOrder.indexOf(a.category); if (ai === -1) ai = 99;
    var bi = catOrder.indexOf(b.category); if (bi === -1) bi = 99;
    return ai !== bi ? ai - bi : (a.name || '').localeCompare(b.name || '');
  });

  var newProducts = selected.map(function(cp, i) {
    var key = _productKey_(cp);
    var existing = existingByKey[key];
    return {
      product_id:  existing ? existing.product_id : generateId_('prd'),
      cycle_id:    payload.cycle_id,
      name:        cp.name,
      variant:     cp.variant || '',
      format:      cp.format || '',
      unit_price:  toNumber_(cp.unit_price),
      supplier:    '',
      notes:       cp.notes || '',
      sort_order:  i + 1,
      active:      true,
      supplier_id: cp.supplier_id,
      category:    cp.category || ''
    };
  });

  overwriteSheetObjects_(APP.SHEETS.PRODUCTS, APP.HEADERS.products, otherCycles.concat(newProducts));
  logAudit_(admin.email, 'set_cycle_products', 'cycle', payload.cycle_id,
    { count: newProducts.length });
  return { count: newProducts.length };
}
