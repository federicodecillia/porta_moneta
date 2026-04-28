/* ───────────────────────────────────────────
   Config.gs — Costanti, schema sheet, enum
   ─────────────────────────────────────────── */

var APP = {

  SHEETS: {
    MEMBERS:         'members',
    ORDER_CYCLES:    'order_cycles',
    PRODUCTS:        'products',
    ORDERS:          'orders',
    LEDGER_ENTRIES:  'ledger_entries',
    AUDIT_LOG:       'audit_log',
    SUPPLIERS:       'suppliers',
    CATALOG_PRODUCTS:'catalog_products'
  },

  HEADERS: {
    members:        ['member_id','full_name','email','role','active','created_at','updated_at'],
    order_cycles:   ['cycle_id','title','pickup_date','order_open_at','order_close_at','status','access_level','notes','created_by','created_at','closed_at','supplier_id'],
    products:       ['product_id','cycle_id','name','variant','format','unit_price','supplier','notes','sort_order','active','supplier_id','category'],
    suppliers:      ['supplier_id','name','macro_category','contact_name','phone','email','address','notes','active','created_at'],
    catalog_products:['catalog_id','supplier_id','name','variant','format','unit_price','category','notes','sort_order','active','created_at'],
    orders:         ['order_line_id','cycle_id','member_id','product_id','quantity','unit_price_snapshot','line_total','updated_at'],
    ledger_entries: ['entry_id','member_id','entry_date','type','amount','cycle_id','note','created_by','created_at','updated_at','updated_by'],
    audit_log:      ['audit_id','user_email','action','entity_type','entity_id','payload_json','created_at']
  },

  CATEGORIES: [
    'Frutta','Verdura','Insalate','Alimentare a lunga conservazione',
    'Igiene casa e persona','Latticini','Carni','Uova','Bevande','Altro'
  ],

  ROLE: {
    ADMIN:  'admin',
    ATTIVO: 'attivo',
    SOCIO:  'socio',
    MEMBER: 'member'   // Legacy pre-v2 — equivale a ATTIVO
  },

  ACCESS_LEVEL: {
    ATTIVI: 'attivi',  // Solo admin + attivi
    ALL:    'all'      // Admin + attivi + soci
  },

  CYCLE_STATUS: {
    DRAFT:    'draft',
    OPEN:     'open',
    CLOSED:   'closed',
    ARCHIVED: 'archived'
  },

  LEDGER_TYPE: {
    TOPUP:        'topup',
    ORDER_CHARGE: 'order_charge',
    ADJUSTMENT:   'adjustment'
  },

  PROP_DATA_SPREADSHEET_ID: 'DATA_SPREADSHEET_ID'
};
