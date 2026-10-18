// Pixel layout for email from the 06 email header and footer (docs/brand/06-applications).
// Pixels, because rem and clamp() are unreliable in Outlook and Gmail. Colors and fonts come
// from emailTheme.ts, which is generated from the same brand tokens as src/styles/tokens.css.
export const emailLayout = {
  width: 600,
  mobileWidth: 360,
  padding: 32,
  mobilePadding: 24,
  logoWidth: 182,
  mobileLogoWidth: 160,
  logoHeight: 49,
  heading: 35,
  mobileHeading: 34,
  greeting: 18,
  text: 16,
  note: 15,
  signOff: 18,
  signOffNote: 14,
  footerLink: 13,
  buttonHeight: 48,
  code: 32,
  gap: 24,
} as const;

/** The logo PNG (2x of logoWidth) served by the app, so the URL is absolute. */
export function logoUrl(siteUrl: string): string {
  return `${siteUrl.replace(/\/$/, "")}/brand/email/worldling-horizontal-on-dark@2x.png`;
}

export function preferencesUrl(siteUrl: string): string {
  return `${siteUrl.replace(/\/$/, "")}/settings`;
}
