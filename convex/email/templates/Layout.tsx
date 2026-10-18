import type { CSSProperties, ReactNode } from "react";

import { emailLayout as l, logoUrl, preferencesUrl } from "./emailLayout";
import {
  emailColors as c,
  emailFonts as f,
  emailRadius as r,
  emailWeights as w,
} from "./emailTheme";

// Table-based primitives after the 06 email layouts: Void throughout, logo and headline in the
// header, Line dividers, Sunrise pill action, sign-off and links in the footer. Every cell sets
// its own background so clients that recolor mail in dark or light mode keep the contrast.

const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600..700&family=Geist:wght@400..700&display=swap";

// Mobile layout (360px): narrower padding, smaller logo and headline. Inline styles stay the
// desktop values for clients that ignore <style>.
const MOBILE_CSS = `@media only screen and (max-width: ${l.width}px) {
.wl-pad { padding-left: ${l.mobilePadding}px !important; padding-right: ${l.mobilePadding}px !important; }
.wl-logo { width: ${l.mobileLogoWidth}px !important; height: auto !important; }
.wl-heading { font-size: ${l.mobileHeading}px !important; }
}`;

interface LayoutProps {
  preview: string;
  /** The header headline, set in the display font. */
  heading: ReactNode;
  siteUrl: string;
  children: ReactNode;
  /** Present on non-security mail; adds the footer unsubscribe link. */
  unsubscribeUrl?: string;
}

export function EmailLayout({ preview, heading, siteUrl, children, unsubscribeUrl }: LayoutProps) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="dark" />
        <meta name="supported-color-schemes" content="dark" />
        <link rel="stylesheet" href={FONT_LINK} />
        <style>{MOBILE_CSS}</style>
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: c.void, fontFamily: f.sans }}>
        <div style={{ display: "none", maxHeight: 0, overflow: "hidden", opacity: 0 }}>
          {preview}
        </div>
        <table width="100%" cellPadding={0} cellSpacing={0} role="presentation" bgcolor={c.void}>
          <tbody>
            <tr>
              <td align="center" style={{ backgroundColor: c.void }}>
                <table
                  width="100%"
                  cellPadding={0}
                  cellSpacing={0}
                  role="presentation"
                  bgcolor={c.void}
                  style={{ maxWidth: l.width, backgroundColor: c.void }}
                >
                  <tbody>
                    <Header siteUrl={siteUrl} heading={heading} />
                    <Row style={{ paddingTop: l.gap + 11, paddingBottom: l.gap + 16 }}>
                      {children}
                    </Row>
                    <Footer siteUrl={siteUrl} unsubscribeUrl={unsubscribeUrl} />
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}

function Row({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <tr>
      <td
        className="wl-pad"
        style={{
          backgroundColor: c.void,
          paddingLeft: l.padding,
          paddingRight: l.padding,
          ...style,
        }}
      >
        {children}
      </td>
    </tr>
  );
}

function Divider() {
  return <div style={{ height: 1, lineHeight: "1px", fontSize: 1, backgroundColor: c.line }} />;
}

function Header({ siteUrl, heading }: { siteUrl: string; heading: ReactNode }) {
  return (
    <Row style={{ paddingTop: 22 }}>
      <img
        className="wl-logo"
        src={logoUrl(siteUrl)}
        width={l.logoWidth}
        height={l.logoHeight}
        alt="Worldling"
        style={{ display: "block", border: 0, marginLeft: -5, width: l.logoWidth, height: "auto" }}
      />
      <h1
        className="wl-heading"
        style={{
          margin: `${l.gap + 16}px 0 ${l.gap + 4}px`,
          color: c.text,
          fontFamily: f.display,
          fontSize: l.heading,
          fontWeight: w.display,
          lineHeight: 1.15,
          letterSpacing: "-0.025em",
        }}
      >
        {heading}
      </h1>
      <Divider />
    </Row>
  );
}

function Footer({ siteUrl, unsubscribeUrl }: { siteUrl: string; unsubscribeUrl?: string }) {
  const link = {
    color: c.link,
    fontSize: l.footerLink,
    fontWeight: w.medium,
    textDecoration: "underline",
  } as const;
  return (
    <Row style={{ paddingBottom: l.padding }}>
      <Divider />
      <p
        style={{
          margin: `${l.gap + 2}px 0 6px`,
          color: c.text,
          fontSize: l.signOff,
          fontWeight: w.medium,
        }}
      >
        Visit everyone else&apos;s.
      </p>
      <p style={{ margin: `0 0 ${l.gap + 8}px`, color: c["text-muted"], fontSize: l.signOffNote }}>
        A little kindness travels far.
      </p>
      <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
        <tbody>
          <tr>
            <td align="left">
              <a href={preferencesUrl(siteUrl)} style={link}>
                Email preferences
              </a>
            </td>
            {unsubscribeUrl !== undefined && (
              <td align="right">
                <a href={unsubscribeUrl} style={link}>
                  Unsubscribe
                </a>
              </td>
            )}
          </tr>
        </tbody>
      </table>
    </Row>
  );
}

export function Greeting({ children }: { children: ReactNode }) {
  return (
    <p
      style={{ margin: `0 0 ${l.gap / 2}px`, color: c.text, fontSize: l.greeting, fontWeight: 600 }}
    >
      {children}
    </p>
  );
}

export function Text({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return (
    <p
      style={{
        margin: `0 0 ${l.gap / 1.5}px`,
        color: muted ? c["text-muted"] : c.text,
        fontSize: muted ? l.note : l.text,
        lineHeight: 1.6,
      }}
    >
      {children}
    </p>
  );
}

/** Sunrise pill with a Void label. A table cell, so Outlook keeps the shape and the fill. */
export function Button({ href, children }: { href: string; children: ReactNode }) {
  return (
    <table
      cellPadding={0}
      cellSpacing={0}
      role="presentation"
      style={{ margin: `27px 0 ${l.gap}px` }}
    >
      <tbody>
        <tr>
          <td
            style={{
              borderRadius: l.buttonHeight / 2,
              backgroundColor: c.warm,
              height: l.buttonHeight,
            }}
          >
            <a
              href={href}
              style={{
                display: "inline-block",
                padding: `0 ${l.gap + 4}px`,
                lineHeight: `${l.buttonHeight}px`,
                color: c["on-warm"],
                fontSize: l.text,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              {children}
            </a>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export function Code({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        margin: `${l.gap}px 0`,
        padding: `${l.gap / 2}px ${l.gap}px`,
        backgroundColor: c.surface,
        border: `1px solid ${c["control-line"]}`,
        borderRadius: r.md,
        color: c.text,
        fontFamily: f.mono,
        fontSize: l.code,
        fontWeight: 600,
        letterSpacing: 6,
        textAlign: "center",
      }}
    >
      {children}
    </p>
  );
}

export function Quote({ from, children }: { from: string; children: ReactNode }) {
  return (
    <p
      style={{
        margin: `0 0 ${l.gap / 2}px`,
        padding: `${l.gap / 2}px ${l.gap / 1.5}px`,
        borderLeft: `3px solid ${c.accent}`,
        backgroundColor: c.surface,
        color: c.text,
        fontSize: l.text,
        lineHeight: 1.5,
      }}
    >
      {children}
      <br />
      <span style={{ color: c["text-muted"], fontSize: l.signOffNote }}>From {from}</span>
    </p>
  );
}
