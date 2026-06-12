// Curated emoji catalog for the product/category picker. Italian keywords so
// admins can search using the same words they would write in the product name.
// We intentionally do not ship the full Unicode emoji list — this is groceries,
// not a chat app, and a focused subset keeps the picker fast and predictable.

export type EmojiEntry = {
  char: string;
  /** Primary label shown under the emoji in the grid (optional). */
  name: string;
  /** Italian keywords used by the text search. */
  keywords: string[];
};

export const EMOJI_CATALOG: ReadonlyArray<EmojiEntry> = [
  // ── Frutta ────────────────────────────────────────────────────────────────
  { char: "🍎", name: "mela",       keywords: ["mela", "mele", "rossa", "frutta"] },
  { char: "🍏", name: "mela verde", keywords: ["mela", "verde", "frutta"] },
  { char: "🍐", name: "pera",       keywords: ["pera", "pere", "frutta"] },
  { char: "🍊", name: "arancia",    keywords: ["arancia", "arance", "agrumi", "mandarino", "clementina"] },
  { char: "🍋", name: "limone",     keywords: ["limone", "limoni", "cedro", "agrumi"] },
  { char: "🍌", name: "banana",     keywords: ["banana", "banane"] },
  { char: "🍉", name: "anguria",    keywords: ["anguria", "cocomero", "frutta"] },
  { char: "🍈", name: "melone",     keywords: ["melone", "meloni", "fico", "fichi"] },
  { char: "🍇", name: "uva",        keywords: ["uva", "grappolo", "vino"] },
  { char: "🍓", name: "fragola",    keywords: ["fragola", "fragole", "frutti", "bosco"] },
  { char: "🫐", name: "mirtilli",   keywords: ["mirtillo", "mirtilli", "ribes", "lampone", "more", "frutti", "bosco"] },
  { char: "🍒", name: "ciliegie",   keywords: ["ciliegia", "ciliegie", "amarena"] },
  { char: "🍑", name: "pesca",      keywords: ["pesca", "pesche", "susina", "prugna", "albicocca"] },
  { char: "🥭", name: "mango",      keywords: ["mango", "esotico", "tropicale"] },
  { char: "🍍", name: "ananas",     keywords: ["ananas", "esotico", "tropicale"] },
  { char: "🥥", name: "cocco",      keywords: ["cocco", "noce", "tropicale"] },
  { char: "🥝", name: "kiwi",       keywords: ["kiwi", "frutta"] },
  { char: "🌰", name: "castagna",   keywords: ["castagna", "castagne", "marrone"] },
  { char: "🫒", name: "olive",      keywords: ["oliva", "olive", "verdi", "nere"] },
  { char: "❤️", name: "melograno",  keywords: ["melograno", "melagrana", "frutta"] },

  // ── Verdura ───────────────────────────────────────────────────────────────
  { char: "🍅", name: "pomodoro",   keywords: ["pomodoro", "pomodori", "tomato", "ciliegino", "datterino", "sugo", "passata"] },
  { char: "🥑", name: "avocado",    keywords: ["avocado", "guacamole"] },
  { char: "🍆", name: "melanzana",  keywords: ["melanzana", "melanzane"] },
  { char: "🥔", name: "patata",     keywords: ["patata", "patate", "patatine", "topinambur"] },
  { char: "🥕", name: "carota",     keywords: ["carota", "carote"] },
  { char: "🌽", name: "mais",       keywords: ["mais", "granoturco", "pannocchia"] },
  { char: "🌶️", name: "peperoncino", keywords: ["peperoncino", "peperoncini", "piccante"] },
  { char: "🫑", name: "peperone",   keywords: ["peperone", "peperoni", "verde", "rosso", "giallo"] },
  { char: "🥒", name: "cetriolo",   keywords: ["cetriolo", "cetrioli", "zucchina", "zucchine"] },
  { char: "🎃", name: "zucca",      keywords: ["zucca", "zucche", "halloween"] },
  { char: "🥬", name: "insalata",   keywords: ["insalata", "lattuga", "radicchio", "spinaci", "sedano", "finocchio", "erbette", "cicoria", "scarola", "indivia", "rucola", "valeriana"] },
  { char: "🥦", name: "broccolo",   keywords: ["broccolo", "broccoli", "cavolo", "verza", "cavolfiore", "cavolini", "rapa", "bietola", "barbabietola"] },
  { char: "🧄", name: "aglio",      keywords: ["aglio", "spicchio"] },
  { char: "🧅", name: "cipolla",    keywords: ["cipolla", "cipolle", "cipollotto", "porro", "porri", "scalogno"] },
  { char: "🍄", name: "fungo",      keywords: ["fungo", "funghi", "porcino", "porcini", "champignon", "shiitake"] },
  { char: "🌿", name: "erbe",       keywords: ["carciofo", "carciofi", "asparagi", "asparago", "basilico", "prezzemolo", "menta", "rosmarino", "salvia", "timo", "origano", "aromatiche", "erbe"] },
  { char: "🫘", name: "fagioli",    keywords: ["fagiolo", "fagioli", "fagiolino", "fagiolini", "fava", "fave", "lenticchia", "lenticchie", "pisello", "piselli", "cece", "ceci", "legumi", "soia"] },
  { char: "🌱", name: "germogli",   keywords: ["germoglio", "germogli", "alfa", "alfalfa", "soia"] },
  { char: "🥗", name: "insalatiera", keywords: ["insalata", "mista", "verdure", "miste"] },

  // ── Cereali, pane, pasta ──────────────────────────────────────────────────
  { char: "🍞", name: "pane",       keywords: ["pane", "panini", "focaccia", "grano", "farro", "orzo", "avena", "riso", "cereale", "cereali"] },
  { char: "🥖", name: "baguette",   keywords: ["baguette", "filone", "pane", "francese"] },
  { char: "🥐", name: "croissant",  keywords: ["croissant", "cornetto", "brioche"] },
  { char: "🥨", name: "pretzel",    keywords: ["pretzel", "salatino"] },
  { char: "🍝", name: "pasta",      keywords: ["pasta", "spaghetti", "penne", "rigatoni", "linguine", "tagliatelle", "fusilli"] },
  { char: "🍚", name: "riso",       keywords: ["riso", "risotto", "carnaroli", "arborio"] },
  { char: "🍕", name: "pizza",      keywords: ["pizza", "pizzeria"] },
  { char: "🧇", name: "waffle",     keywords: ["waffle", "cialda"] },

  // ── Prodotti animali ──────────────────────────────────────────────────────
  { char: "🥚", name: "uova",       keywords: ["uovo", "uova", "albume", "tuorlo"] },
  { char: "🥛", name: "latte",      keywords: ["latte", "yogurt", "kefir", "panna"] },
  { char: "🧀", name: "formaggio",  keywords: ["formaggio", "ricotta", "mozzarella", "pecorino", "parmigiano", "grana", "stracchino", "gorgonzola", "caciotta"] },
  { char: "🧈", name: "burro",      keywords: ["burro", "panna", "crema"] },
  { char: "🍯", name: "miele",      keywords: ["miele", "ape", "millefiori", "acacia", "castagno"] },
  { char: "🍗", name: "pollo",      keywords: ["pollo", "gallina", "tacchino", "anatra", "coscia", "petto"] },
  { char: "🥩", name: "carne",      keywords: ["carne", "manzo", "vitello", "maiale", "agnello", "bistecca", "fettina", "salume", "salsiccia", "salsicce"] },
  { char: "🥓", name: "pancetta",   keywords: ["pancetta", "bacon", "guanciale", "lardo"] },
  { char: "🐟", name: "pesce",      keywords: ["pesce", "salmone", "tonno", "merluzzo", "orata", "branzino", "sgombro", "alici", "sardine"] },
  { char: "🦐", name: "gamberi",    keywords: ["gambero", "gamberi", "scampi", "crostacei"] },
  { char: "🦑", name: "calamaro",   keywords: ["calamaro", "calamari", "totano", "seppia", "molluschi"] },

  // ── Condimenti, sale, spezie ──────────────────────────────────────────────
  { char: "🫙", name: "barattolo",  keywords: ["olio", "aceto", "salsa", "conserva", "marmellata", "barattolo"] },
  { char: "🧂", name: "sale",       keywords: ["sale", "pepe", "spezia", "spezie"] },
  { char: "🥫", name: "scatola",    keywords: ["scatola", "conserva", "passata", "polpa", "concentrato", "legumi", "in scatola"] },

  // ── Dolci, snack ──────────────────────────────────────────────────────────
  { char: "🍫", name: "cioccolato", keywords: ["cioccolato", "cacao", "tavoletta", "fondente"] },
  { char: "🍪", name: "biscotti",   keywords: ["biscotto", "biscotti", "cookie", "frollini"] },
  { char: "🍰", name: "torta",      keywords: ["torta", "fetta", "dolce"] },
  { char: "🧁", name: "muffin",     keywords: ["muffin", "cupcake", "dolce"] },
  { char: "🍩", name: "ciambella",  keywords: ["ciambella", "donut"] },
  { char: "🍮", name: "budino",     keywords: ["budino", "creme caramel", "flan", "dessert"] },
  { char: "🍦", name: "gelato",     keywords: ["gelato", "soft", "ice cream"] },

  // ── Bevande ───────────────────────────────────────────────────────────────
  { char: "🍷", name: "vino",       keywords: ["vino", "rosso", "bianco", "rosato", "calice"] },
  { char: "🍺", name: "birra",      keywords: ["birra", "boccale", "ale", "lager"] },
  { char: "🍶", name: "sake",       keywords: ["sake", "bottiglia"] },
  { char: "🥤", name: "bibita",     keywords: ["bibita", "bicchiere", "drink", "succo"] },
  { char: "🧃", name: "succo",      keywords: ["succo", "spremuta", "bevanda", "frutta"] },
  { char: "☕", name: "caffè",      keywords: ["caffè", "caffe", "espresso", "moka", "tazzina"] },
  { char: "🍵", name: "tè",         keywords: ["tè", "te", "tisana", "infuso"] },
  { char: "🧉", name: "mate",       keywords: ["mate", "infuso", "tisana"] },
  { char: "💧", name: "acqua",      keywords: ["acqua", "naturale", "frizzante", "minerale"] },

  // ── Cucina, packaging, varie ──────────────────────────────────────────────
  { char: "🍱", name: "bento",      keywords: ["bento", "scatola", "pranzo"] },
  { char: "🍲", name: "zuppa",      keywords: ["zuppa", "minestra", "brodo", "stufato"] },
  { char: "🥣", name: "ciotola",    keywords: ["ciotola", "muesli", "porridge", "cereali"] },
  { char: "🛒", name: "carrello",   keywords: ["carrello", "spesa", "generico", "altro", "varie", "misto"] },
  { char: "📦", name: "scatola",    keywords: ["scatola", "pacco", "imballaggio", "imballo"] },
  { char: "🌾", name: "spiga",      keywords: ["grano", "spiga", "farina", "cereali"] },
  { char: "🥜", name: "noci",       keywords: ["noce", "noci", "arachidi", "nocciole", "mandorle", "anacardi", "pinoli", "frutta", "secca"] },
];

/**
 * Folds a string to lowercase, accent-stripped, whitespace-normalized form.
 * "Cetriòlo" → "cetriolo", so search matches regardless of how the admin types
 * accents.
 */
export function foldForSearch(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Returns entries matching `query` against the emoji's name or any keyword.
 * Empty query returns the full catalog.
 */
export function searchEmoji(query: string): ReadonlyArray<EmojiEntry> {
  const q = foldForSearch(query);
  if (!q) return EMOJI_CATALOG;
  return EMOJI_CATALOG.filter((e) => {
    if (foldForSearch(e.name).includes(q)) return true;
    return e.keywords.some((k) => foldForSearch(k).includes(q));
  });
}
