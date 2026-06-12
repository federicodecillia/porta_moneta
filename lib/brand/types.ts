export type BrandTheme = {
  /** maps to --orange (primary CTA color) */
  primary?: string;
  /** maps to --orange-l */
  primaryLight?: string;
  /** maps to --teal (accent) */
  accent?: string;
  /** maps to --teal-l */
  accentLight?: string;
  /** maps to --background and --warm-wh */
  background?: string;
  /** maps to --frame (page frame behind the card) */
  frame?: string;
};

export type BrandConfig = {
  appName: string;
  shortName: string;
  description: string;
  /** legal/organization name used in email signatures */
  orgName: string;
  locale: "it" | "en";
  /** ISO 4217, e.g. "EUR" */
  currency: string;
  /** absolute URL or path under public/ */
  logoUrl: string;
  supportEmail: string;
  techEmail: string;
  /** CC address on supplier order emails; null = no CC */
  archiveCcEmail: string | null;
  /**
   * Show the app name next to the logo in the header.
   * true for square icon logos (wegrocery default); false when the logo is a
   * wordmark that already contains the name.
   */
  headerShowName: boolean;
  theme: BrandTheme;
};
