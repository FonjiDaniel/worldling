import type { ReactNode } from "react";

import { emailColors as c, emailFont, emailMonoFont, emailSize as s } from "./theme";

// Table-based primitives that render the same in Gmail, Outlook and Apple Mail, light or dark.

interface LayoutProps {
  preview: string;
  children: ReactNode;
  /** Present on non-security mail; adds the footer unsubscribe link. */
  unsubscribeUrl?: string;
}

export function EmailLayout({ preview, children, unsubscribeUrl }: LayoutProps) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="dark" />
        <meta name="supported-color-schemes" content="dark" />
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: c.void, fontFamily: emailFont }}>
        <div style={{ display: "none", maxHeight: 0, overflow: "hidden", opacity: 0 }}>
          {preview}
        </div>
        <table width="100%" cellPadding={0} cellSpacing={0} role="presentation" bgcolor={c.void}>
          <tbody>
            <tr>
              <td align="center" style={{ padding: `${s.gutter * 2}px ${s.gutter / 2}px` }}>
                <table
                  width="100%"
                  cellPadding={0}
                  cellSpacing={0}
                  role="presentation"
                  bgcolor={c.surface}
                  style={{
                    maxWidth: s.width,
                    backgroundColor: c.surface,
                    border: `1px solid ${c.line}`,
                    borderRadius: s.radius,
                  }}
                >
                  <tbody>
                    <tr>
                      <td style={{ padding: s.gutter * 1.5 }}>
                        <p
                          style={{
                            margin: `0 0 ${s.gutter}px`,
                            color: c.accent,
                            fontSize: s.small,
                            fontWeight: 700,
                            letterSpacing: 2,
                            textTransform: "uppercase",
                          }}
                        >
                          Worldling
                        </p>
                        {children}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <Footer unsubscribeUrl={unsubscribeUrl} />
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}

function Footer({ unsubscribeUrl }: { unsubscribeUrl: string | undefined }) {
  return (
    <p
      style={{
        maxWidth: s.width,
        margin: `${s.gutter}px auto 0`,
        color: c["text-muted"],
        fontSize: s.small,
        lineHeight: 1.5,
        textAlign: "center",
      }}
    >
      Worldling. Grow a world of your own.
      {unsubscribeUrl !== undefined && (
        <>
          <br />
          <a href={unsubscribeUrl} style={{ color: c.link }}>
            Unsubscribe from these emails
          </a>
        </>
      )}
    </p>
  );
}

export function Heading({ children }: { children: ReactNode }) {
  return (
    <h1
      style={{
        margin: `0 0 ${s.gutter / 2}px`,
        color: c.text,
        fontSize: s.heading,
        lineHeight: 1.25,
        fontWeight: 700,
      }}
    >
      {children}
    </h1>
  );
}

export function Text({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return (
    <p
      style={{
        margin: `0 0 ${s.gutter / 1.5}px`,
        color: muted ? c["text-muted"] : c.text,
        fontSize: muted ? s.small : s.text,
        lineHeight: 1.6,
      }}
    >
      {children}
    </p>
  );
}

export function Button({ href, children }: { href: string; children: ReactNode }) {
  return (
    <table
      cellPadding={0}
      cellSpacing={0}
      role="presentation"
      style={{ margin: `${s.gutter}px 0` }}
    >
      <tbody>
        <tr>
          <td style={{ borderRadius: s.radius, backgroundColor: c.primary }}>
            <a
              href={href}
              style={{
                display: "inline-block",
                padding: `${s.gutter / 2}px ${s.gutter}px`,
                color: c["on-primary"],
                fontSize: s.text,
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
        margin: `${s.gutter}px 0`,
        padding: `${s.gutter / 2}px ${s.gutter}px`,
        backgroundColor: c["surface-raised"],
        border: `1px solid ${c.line}`,
        borderRadius: s.radius,
        color: c.text,
        fontFamily: emailMonoFont,
        fontSize: s.code,
        fontWeight: 700,
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
        margin: `0 0 ${s.gutter / 2}px`,
        padding: `${s.gutter / 2}px ${s.gutter / 1.5}px`,
        borderLeft: `3px solid ${c.accent}`,
        backgroundColor: c["surface-raised"],
        color: c.text,
        fontSize: s.text,
        lineHeight: 1.5,
      }}
    >
      {children}
      <br />
      <span style={{ color: c["text-muted"], fontSize: s.small }}>From {from}</span>
    </p>
  );
}
