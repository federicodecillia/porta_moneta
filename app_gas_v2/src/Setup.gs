/* ───────────────────────────────────────────
   Setup.gs — Inizializzazione datastore
   ─────────────────────────────────────────── */

// Aggiunge sheet mancanti e colonne mancanti (backward-compat)
function setupMissingSheets() {
  var ss = getDataSpreadsheet_();
  var createdSheets = [];
  var addedCols = [];

  Object.keys(APP.HEADERS).forEach(function(name) {
    var expected = APP.HEADERS[name];
    var sh = ss.getSheetByName(name);
    if (!sh) {
      getOrCreateSheet_(ss, name, expected);
      createdSheets.push(name);
      Logger.log('✓ Sheet creato: ' + name);
      return;
    }
    var lastCol = sh.getLastColumn();
    var current = lastCol > 0 ? sh.getRange(1, 1, 1, lastCol).getValues()[0].map(String) : [];
    var missing = expected.filter(function(h) { return current.indexOf(h) === -1; });
    if (missing.length) {
      sh.getRange(1, lastCol + 1, 1, missing.length).setValues([missing]);
      addedCols.push(name + ': ' + missing.join(', '));
      Logger.log('✓ Colonne aggiunte a ' + name + ': ' + missing.join(', '));
    }
  });

  if (!createdSheets.length && !addedCols.length) {
    Logger.log('○ Schema già aggiornato');
  }
  // Invalida tutte le cache perché abbiamo cambiato struttura
  Object.keys(APP.HEADERS).forEach(function(name) { invalidateCache_(name); });
}

function setupDataStore() {
  var ss = SpreadsheetApp.create('Porta Moneta GAS — Dati');

  // Crea tutti gli sheet con headers
  var sheetNames = Object.keys(APP.HEADERS);
  sheetNames.forEach(function(name) {
    getOrCreateSheet_(ss, name, APP.HEADERS[name]);
  });

  // Rimuovi lo sheet di default
  var defaultSheet = ss.getSheetByName('Foglio1') || ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }

  // Salva l'ID
  var id = ss.getId();
  setDataSpreadsheetId(id);

  return { spreadsheet_id: id, url: ss.getUrl() };
}

