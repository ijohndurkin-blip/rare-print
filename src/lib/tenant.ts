/**
 * White-label configuration.
 *
 * Everything that identifies the print company lives here, so the studio can be
 * re-skinned for another printer by editing this file or setting the matching
 * NEXT_PUBLIC_* environment variables (no code changes needed).
 */

// NEXT_PUBLIC_* values must be read with literal `process.env.X` access so
// Next.js can inline them into the browser bundle.
const env = (value: string | undefined, fallback: string) =>
  value && value.trim() !== "" ? value : fallback;

export const tenant = {
  /** Company name shown in the header, emails and order confirmations. */
  name: env(process.env.NEXT_PUBLIC_BRAND_NAME, "go cre8"),
  /** Short line under the logo. */
  tagline: env(process.env.NEXT_PUBLIC_BRAND_TAGLINE, "Creative printers & sign makers"),
  /** Optional logo URL (PNG/SVG). When empty a text logo is rendered. */
  logoUrl: env(process.env.NEXT_PUBLIC_BRAND_LOGO_URL, ""),
  /** Main website of the print company (used for "back to site" links). */
  website: env(process.env.NEXT_PUBLIC_BRAND_WEBSITE, "https://www.gocre8.co.uk"),
  phone: env(process.env.NEXT_PUBLIC_BRAND_PHONE, "0151 345 1814"),
  email: env(process.env.NEXT_PUBLIC_BRAND_EMAIL, "info@gocre8.co.uk"),
  address: env(process.env.NEXT_PUBLIC_BRAND_ADDRESS,
    "1 Mann Street, Cains Brewery Village, Liverpool, L8 5AF",
  ),
  city: env(process.env.NEXT_PUBLIC_BRAND_CITY, "Liverpool"),
  currency: env(process.env.NEXT_PUBLIC_CURRENCY_SYMBOL, "£"),
  /** Theme colours. Primary drives buttons/links, accent is used for highlights. */
  colors: {
    primary: env(process.env.NEXT_PUBLIC_BRAND_PRIMARY, "#e11d74"),
    primaryDark: env(process.env.NEXT_PUBLIC_BRAND_PRIMARY_DARK, "#b0145a"),
    accent: env(process.env.NEXT_PUBLIC_BRAND_ACCENT, "#0ea5e9"),
    ink: env(process.env.NEXT_PUBLIC_BRAND_INK, "#0f172a"),
  },
  /** Whether prices are shown as estimates on the order screen. */
  showPrices: env(process.env.NEXT_PUBLIC_SHOW_PRICES, "true") === "true",
  /** Platform name shown in the small "powered by" footer line. */
  platformName: "RarePrint Studio",
};

export type Tenant = typeof tenant;
