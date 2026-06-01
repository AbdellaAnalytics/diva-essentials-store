import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

export const AC = {
  bg: '#f4f1ea', panel: '#ffffff', sidebar: '#15120d', ink: '#1c1812', sub: '#8a8173',
  line: '#e7e0d2', gold: '#c8a04a', goldDeep: '#a47e2c', flame: '#e8642a',
  green: '#5f8d5a', red: '#c2603f', blue: '#5a7d97',
}
export const serif = "'Fraunces', Georgia, serif"
export const sans = "'Jost', system-ui, sans-serif"

// Chart palette
export const CHART_COLORS = ['#c8a04a', '#15120d', '#a47e2c', '#8a8173', '#5f8d5a', '#5a7d97', '#e8642a', '#d9bd8c']

export function Panel({ title, action, children, style }) {
  return (
    <div style={{ background: AC.panel, border: `1px solid ${AC.line}`, borderRadius: 14, padding: 22, ...style }}>
      {(title || action) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          {title && <h3 style={{ fontFamily: serif, fontSize: 18, fontWeight: 500, color: AC.ink, margin: 0 }}>{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

export function KpiCard({ label, value, delta, sub, accent }) {
  const up = delta != null && delta >= 0
  return (
    <div style={{ background: AC.panel, border: `1px solid ${AC.line}`, borderRadius: 14, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: accent || AC.gold }} />
      <div style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: AC.sub, marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: serif, fontSize: 27, fontWeight: 500, color: AC.ink, lineHeight: 1 }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, minHeight: 18 }}>
        {delta != null && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, color: up ? AC.green : AC.red, fontWeight: 500 }}>
            {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {sub && <span style={{ fontSize: 12, color: AC.sub }}>{sub}</span>}
      </div>
    </div>
  )
}

export function Btn({ children, onClick, variant = 'solid', size = 'md', style }) {
  const pad = size === 'sm' ? '7px 14px' : '10px 18px'
  const v = variant === 'solid'
    ? { background: AC.ink, color: '#fff' }
    : variant === 'gold'
    ? { background: AC.gold, color: AC.ink }
    : { background: 'transparent', color: AC.ink, border: `1px solid ${AC.line}` }
  return (
    <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: pad, borderRadius: 9, fontSize: 12.5, fontWeight: 500, fontFamily: sans, letterSpacing: '.03em', border: 'none', cursor: 'pointer', ...v, ...style }}>
      {children}
    </button>
  )
}

export function Badge({ children, tone = 'neutral' }) {
  const tones = {
    neutral: { bg: '#efe9dc', fg: AC.sub }, ok: { bg: '#e4efdf', fg: AC.green },
    warn: { bg: '#fbecd6', fg: AC.goldDeep }, danger: { bg: '#f6e0d8', fg: AC.red },
    info: { bg: '#dfe9ef', fg: AC.blue },
  }
  const t = tones[tone] || tones.neutral
  return <span style={{ background: t.bg, color: t.fg, fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 999, letterSpacing: '.03em', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{children}</span>
}

export function Table({ columns, rows, empty = 'No data' }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th key={i} style={{ textAlign: c.align || 'left', padding: '10px 12px', borderBottom: `1px solid ${AC.line}`, fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: AC.sub, fontWeight: 500, whiteSpace: 'nowrap' }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={columns.length} style={{ padding: 28, textAlign: 'center', color: AC.sub }}>{empty}</td></tr>}
          {rows.map((r, ri) => (
            <tr key={ri} style={{ borderBottom: `1px solid ${AC.line}` }}>
              {columns.map((c, ci) => (
                <td key={ci} style={{ textAlign: c.align || 'left', padding: '11px 12px', color: AC.ink, whiteSpace: c.wrap ? 'normal' : 'nowrap' }}>
                  {c.render ? c.render(r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function SectionTitle({ eyebrow, title }) {
  return (
    <div style={{ marginBottom: 4 }}>
      {eyebrow && <div style={{ fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: AC.goldDeep }}>{eyebrow}</div>}
      <h1 style={{ fontFamily: serif, fontSize: 30, fontWeight: 500, color: AC.ink, margin: '6px 0 0' }}>{title}</h1>
    </div>
  )
}
