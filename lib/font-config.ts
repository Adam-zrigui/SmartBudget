/**
 * Local/system font configuration to avoid runtime dependency on Google Fonts.
 */

export const primaryFont = {
  variable: '--font-geist',
  style: {
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
};

export const monoFont = {
  variable: '--font-geist-mono',
  style: {
    fontFamily: "'Consolas', 'Courier New', ui-monospace, monospace",
  },
};

export const fontConfig = {
  primary: {
    name: 'System Sans',
    variable: '--font-geist',
    stack: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  mono: {
    name: 'System Mono',
    variable: '--font-geist-mono',
    stack: "'Consolas', 'Courier New', ui-monospace, monospace",
  },
};
