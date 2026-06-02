import React, { useState, useRef, useEffect } from 'react'
import { Bell, Package, CreditCard, Boxes, Truck, X } from 'lucide-react'
import { AC, sans, serif } from '../ui'
import { buildNotifications, NOTE_META } from '../lib/notifications'

const ICONS = { order: Package, review: CreditCard, stock: Boxes, shipment: Truck }

export default function NotificationBell({ data, goto }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const notes = buildNotifications(data)
  const count = notes.length

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} aria-label="Notifications"
        style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex' }}>
        <Bell size={20} color={AC.ink} strokeWidth={1.6} />
        {count > 0 && (
          <span style={{ position: 'absolute', top: 2, right: 2, minWidth: 17, height: 17, padding: '0 4px',
            background: '#d2452f', color: '#fff', fontSize: 10, fontWeight: 600, borderRadius: 999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: sans }}>
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', right: 0, top: 44, width: 340, maxHeight: 440, overflowY: 'auto',
          background: '#fff', border: `1px solid ${AC.line}`, borderRadius: 14, boxShadow: '0 20px 50px rgba(0,0,0,.16)', zIndex: 200 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: `1px solid ${AC.line}`, position: 'sticky', top: 0, background: '#fff' }}>
            <strong style={{ fontFamily: serif, fontSize: 16 }}>Notifications</strong>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><X size={18} color={AC.sub} /></button>
          </div>

          {count === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: AC.sub, fontSize: 13.5 }}>
              All caught up — nothing needs attention.
            </div>
          ) : (
            <div>
              {notes.map(n => {
                const Icon = ICONS[n.type] || Bell
                const meta = NOTE_META[n.type] || {}
                return (
                  <button key={n.id} onClick={() => { setOpen(false); goto?.(n.goto) }}
                    style={{ display: 'flex', gap: 12, width: '100%', textAlign: 'left', padding: '12px 16px',
                      border: 'none', borderBottom: `1px solid ${AC.line}`, background: 'transparent', cursor: 'pointer' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: (meta.color || AC.gold) + '1a',
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={16} color={meta.color || AC.gold} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: AC.ink }}>
                        {n.title}{n.urgent && <span style={{ color: '#d2452f', marginLeft: 6, fontSize: 11 }}>● urgent</span>}
                      </div>
                      <div style={{ fontSize: 12.5, color: AC.sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.detail}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
