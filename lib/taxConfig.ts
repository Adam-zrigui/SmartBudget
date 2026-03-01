/**
 * German tax configuration for 2024/2025
 * All rates, brackets, and constants are externalized here for easy updates
 */

export const TAX_CONFIG = {
  year: 2025,
  
  // Income tax brackets (annual)
  incomeTax: {
    basicAllowance: 12096, // Grundfreibetrag
    brackets: [
      { maxIncome: 60000, maxTax: 8622.72, model: 'quadratic' },
      { minIncome: 60000, maxIncome: 70000, model: 'linear' },
      { minIncome: 70000, marginalRate: 0.30 },
    ],
  },

  // Solidarity surcharge (Soli)
  solidarity: {
    rate: 0.055, // 5.5%
    threshold: 19950, // only if income tax exceeds this
  },

  // Church tax (varies by state)
  churchTax: {
    rates: {
      BW: 8,
      BY: 8,
      BE: 0,
      BB: 0,
      HB: 8,
      HH: 8,
      HE: 8,
      MV: 0,
      NI: 8,
      NW: 8,
      RP: 8,
      SL: 0,
      SN: 8,
      ST: 0,
      SH: 8,
      TH: 0,
    },
    default: 8,
  },

  // Social insurance contributions (employee portion)
  socialInsurance: {
    healthInsurance: 0.1033, // ~10.3% (varies by insurance)
    pensionInsurance: 0.093, // ~9.3%
    unemploymentInsurance: 0.013, // ~1.3%
    careInsurance: {
      withoutChildren: 0.0265, // ~2.65%
      withChildren: 0.015, // ~1.5% (reduced if children)
    },
  },

  // Tax classes info (multipliers adjust computed income tax to approximate
  // differences between classes for quick simulation; these are approximate
  // factors used in the app, not legal substitutes for official tax tables)
  taxClasses: [
    { id: 1, label: 'I - Ledig/Lediger', multiplier: 1.0 },
    { id: 2, label: 'II - Alleinerziehend', multiplier: 0.95 },
    { id: 3, label: 'III - Verheiratet/Verpartnert (höheres Einkommen)', multiplier: 0.7 },
    { id: 4, label: 'IV - Verheiratet/Verpartnert (gleiches Einkommen)', multiplier: 1.0 },
    { id: 5, label: 'V - Verheiratet/Verpartnert (niedrigeres Einkommen)', multiplier: 1.25 },
    { id: 6, label: 'VI - Mehrfachbeschäftigung', multiplier: 1.35 },
  ],

  // German states
  states: [
    { id: 'BW', label: 'Baden-Württemberg' },
    { id: 'BY', label: 'Bayern' },
    { id: 'BE', label: 'Berlin' },
    { id: 'BB', label: 'Brandenburg' },
    { id: 'HB', label: 'Bremen' },
    { id: 'HH', label: 'Hamburg' },
    { id: 'HE', label: 'Hessen' },
    { id: 'MV', label: 'Mecklenburg-Vorpommern' },
    { id: 'NI', label: 'Niedersachsen' },
    { id: 'NW', label: 'Nordrhein-Westfalen' },
    { id: 'RP', label: 'Rheinland-Pfalz' },
    { id: 'SL', label: 'Saarland' },
    { id: 'SN', label: 'Sachsen' },
    { id: 'ST', label: 'Sachsen-Anhalt' },
    { id: 'SH', label: 'Schleswig-Holstein' },
    { id: 'TH', label: 'Thüringen' },
  ],
  // Optional state-level percentage tax (example values). This is an optional
  // per-state percentage applied to the computed income tax to allow
  // experimenting with state-specific levies (not standard German federal tax).
  stateTax: {
    rates: {
      BW: 0.5,
      BY: 0.5,
      BE: 0.0,
      BB: 0.0,
      HB: 0.5,
      HH: 0.5,
      HE: 0.5,
      MV: 0.0,
      NI: 0.5,
      NW: 0.5,
      RP: 0.5,
      SL: 0.0,
      SN: 0.5,
      ST: 0.0,
      SH: 0.5,
      TH: 0.0,
    },
    default: 0.0,
  },
};

/**
 * Reference URLs for tax rates (would connect to API in real implementation)
 */
export const TAX_SOURCES = {
  officialRates: 'https://www.bzst.bund.de/DE/Fachthemen/Steuern/Einkommensteuer/Tarifbestimmungen/tarifbestimmungen.html',
  socialContributions: 'https://www.sozialversicherung.de/de/Navigation/Uebersicht/uebersicht_node.html',
  churchTaxRates: 'https://www.kirchensteuer.de',
};
