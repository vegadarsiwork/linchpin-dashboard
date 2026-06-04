// Plain-React email template (no @react-email dependency required).
// Resend renders this with renderToStaticMarkup, so inline styles are mandatory.

import * as React from 'react'

export interface StudioNotificationEmailProps {
  title: string
  body?: string | null
  ctaLink?: string | null
  ctaLabel?: string
}

const PURPLE = '#7C3AED'
const PURPLE_DARK = '#6D28D9'
const BG = '#fafafa'
const TEXT = '#18181b'
const MUTED = '#71717a'
const BORDER = '#e4e4e7'

const wrap: React.CSSProperties = {
  margin: 0,
  padding: '32px 16px',
  background: BG,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  color: TEXT,
  WebkitFontSmoothing: 'antialiased',
}

const card: React.CSSProperties = {
  maxWidth: 560,
  margin: '0 auto',
  background: '#ffffff',
  border: `1px solid ${BORDER}`,
  borderRadius: 14,
  overflow: 'hidden',
}

const header: React.CSSProperties = {
  padding: '20px 28px',
  borderBottom: `1px solid ${BORDER}`,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
}

const logoChip: React.CSSProperties = {
  display: 'inline-block',
  width: 28,
  height: 28,
  borderRadius: 8,
  background: PURPLE,
  color: '#ffffff',
  fontWeight: 700,
  fontSize: 14,
  lineHeight: '28px',
  textAlign: 'center',
  verticalAlign: 'middle',
}

const wordmark: React.CSSProperties = {
  marginLeft: 8,
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: '-0.01em',
  color: TEXT,
  verticalAlign: 'middle',
}

const titleStyle: React.CSSProperties = {
  margin: '0 0 12px',
  fontSize: 22,
  lineHeight: 1.25,
  fontWeight: 700,
  letterSpacing: '-0.01em',
  color: TEXT,
}

const bodyStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 15,
  lineHeight: 1.6,
  color: '#3f3f46',
  whiteSpace: 'pre-wrap',
}

const buttonStyle: React.CSSProperties = {
  display: 'inline-block',
  marginTop: 24,
  padding: '11px 22px',
  background: PURPLE,
  color: '#ffffff',
  fontSize: 14,
  fontWeight: 600,
  textDecoration: 'none',
  borderRadius: 10,
  border: `1px solid ${PURPLE_DARK}`,
}

const footerStyle: React.CSSProperties = {
  padding: '18px 28px',
  borderTop: `1px solid ${BORDER}`,
  fontSize: 12,
  color: MUTED,
  textAlign: 'center',
}

export function StudioNotificationEmail({
  title,
  body,
  ctaLink,
  ctaLabel = 'View in Studio',
}: StudioNotificationEmailProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width" />
        <title>{title}</title>
      </head>
      <body style={wrap}>
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          style={{ borderCollapse: 'collapse' }}
        >
          <tbody>
            <tr>
              <td align="center">
                <div style={card}>
                  <div style={header}>
                    <span style={logoChip}>L</span>
                    <span style={wordmark}>Linchpin Studio</span>
                  </div>

                  <div style={{ padding: '28px' }}>
                    <h1 style={titleStyle}>{title}</h1>
                    {body && <p style={bodyStyle}>{body}</p>}
                    {ctaLink && (
                      <a href={ctaLink} style={buttonStyle}>
                        {ctaLabel}
                      </a>
                    )}
                  </div>

                  <div style={footerStyle}>
                    You&apos;re receiving this because you&apos;re a Linchpin
                    Studio client.
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  )
}

export default StudioNotificationEmail
