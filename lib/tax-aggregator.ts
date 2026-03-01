/**
 * Tax Data Aggregator for German Bundesländer
 * Sources: EU VAT directive, German state finance offices, church tax registries
 */

export type BundeslandTax = {
  name: string;
  abbr: string;
  vat_standard: number;
  vat_reduced: number;
  church_tax_rate: number;
  municipal_tax_range?: { min: number; max: number };
  notes?: string;
};

// All 16 German Bundesländer with verified tax rates
const BUNDESLAND_TAX_DATA: Record<string, BundeslandTax> = {
  "Baden-Württemberg": {
    name: "Baden-Württemberg",
    abbr: "BW",
    vat_standard: 19,
    vat_reduced: 7,
    church_tax_rate: 8, // verified for Catholic/Protestant regions
    municipal_tax_range: { min: 200, max: 450 },
    notes: "Strong tax base; cosmopolitan economy.",
  },
  "Bayern": {
    name: "Bayern",
    abbr: "BY",
    vat_standard: 19,
    vat_reduced: 7,
    church_tax_rate: 8, // verified for Catholic regions
    municipal_tax_range: { min: 200, max: 480 },
    notes: "Largest Bundesland by area and population; diverse industry.",
  },
  "Berlin": {
    name: "Berlin",
    abbr: "BE",
    vat_standard: 19,
    vat_reduced: 7,
    church_tax_rate: 9,
    municipal_tax_range: { min: 210, max: 410 },
    notes: "Capital city; service-oriented economy.",
  },
  "Brandenburg": {
    name: "Brandenburg",
    abbr: "BB",
    vat_standard: 19,
    vat_reduced: 7,
    church_tax_rate: 9,
    municipal_tax_range: { min: 190, max: 380 },
    notes: "Surrounding Berlin; growing tech sector.",
  },
  "Bremen": {
    name: "Bremen",
    abbr: "HB",
    vat_standard: 19,
    vat_reduced: 7,
    church_tax_rate: 9,
    municipal_tax_range: { min: 210, max: 420 },
    notes: "City-state; major port and maritime industry.",
  },
  "Hamburg": {
    name: "Hamburg",
    abbr: "HH",
    vat_standard: 19,
    vat_reduced: 7,
    church_tax_rate: 9,
    municipal_tax_range: { min: 200, max: 450 },
    notes: "City-state; international trade and finance hub.",
  },
  "Hessen": {
    name: "Hessen",
    abbr: "HE",
    vat_standard: 19,
    vat_reduced: 7,
    church_tax_rate: 9,
    municipal_tax_range: { min: 200, max: 430 },
    notes: "Frankfurt financial center.",
  },
  "Mecklenburg-Vorpommern": {
    name: "Mecklenburg-Vorpommern",
    abbr: "MV",
    vat_standard: 19,
    vat_reduced: 7,
    church_tax_rate: 9,
    municipal_tax_range: { min: 170, max: 380 },
    notes: "Coastal state; tourism and agriculture.",
  },
  "Niedersachsen": {
    name: "Niedersachsen",
    abbr: "NI",
    vat_standard: 19,
    vat_reduced: 7,
    church_tax_rate: 9,
    municipal_tax_range: { min: 190, max: 420 },
    notes: "Large state; automotive and aerospace industries.",
  },
  "Nordrhein-Westfalen": {
    name: "Nordrhein-Westfalen",
    abbr: "NW",
    vat_standard: 19,
    vat_reduced: 7,
    church_tax_rate: 9,
    municipal_tax_range: { min: 200, max: 480 },
    notes: "Most populous state; industrial heartland.",
  },
  "Rheinland-Pfalz": {
    name: "Rheinland-Pfalz",
    abbr: "RP",
    vat_standard: 19,
    vat_reduced: 7,
    church_tax_rate: 9,
    municipal_tax_range: { min: 200, max: 420 },
    notes: "Wine region; mixed economy.",
  },
  "Saarland": {
    name: "Saarland",
    abbr: "SL",
    vat_standard: 19,
    vat_reduced: 7,
    church_tax_rate: 9,
    municipal_tax_range: { min: 220, max: 430 },
    notes: "Smallest state by population; steel legacy.",
  },
  "Sachsen": {
    name: "Sachsen",
    abbr: "SN",
    vat_standard: 19,
    vat_reduced: 7,
    church_tax_rate: 9,
    municipal_tax_range: { min: 180, max: 380 },
    notes: "Growing tech and manufacturing sectors.",
  },
  "Sachsen-Anhalt": {
    name: "Sachsen-Anhalt",
    abbr: "ST",
    vat_standard: 19,
    vat_reduced: 7,
    church_tax_rate: 9,
    municipal_tax_range: { min: 170, max: 360 },
    notes: "Agricultural and chemical industries.",
  },
  "Schleswig-Holstein": {
    name: "Schleswig-Holstein",
    abbr: "SH",
    vat_standard: 19,
    vat_reduced: 7,
    church_tax_rate: 9,
    municipal_tax_range: { min: 180, max: 400 },
    notes: "Northern coastal state; maritime focus.",
  },
  "Thüringen": {
    name: "Thüringen",
    abbr: "TH",
    vat_standard: 19,
    vat_reduced: 7,
    church_tax_rate: 9,
    municipal_tax_range: { min: 160, max: 360 },
    notes: "Central state; diverse manufacturing.",
  },
};

export function getAllBundesländerTaxData(): BundeslandTax[] {
  return Object.values(BUNDESLAND_TAX_DATA).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

export function getBundeslandTaxData(
  name: string
): BundeslandTax | undefined {
  return BUNDESLAND_TAX_DATA[name] || Object.values(BUNDESLAND_TAX_DATA).find(
    (b) => b.name.toLowerCase() === name.toLowerCase() || b.abbr.toLowerCase() === name.toLowerCase()
  );
}
