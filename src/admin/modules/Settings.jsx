import React, { useState, useEffect } from 'react'
import { Save, Upload, Plus, Trash2, Image as ImageIcon, Film, Plug, Megaphone, FileText, Check, Truck, LayoutGrid, Share2, Users, X } from 'lucide-react'
import { AC, serif, sans, Panel, Btn, SectionTitle } from '../ui'
import { supabase } from '../../lib/supabase'
import { saveSettings, DEFAULT_SETTINGS } from '../../lib/useSettings'
import { listAdmins, upsertAdmin, deleteAdmin, OWNER_EMAIL, isOwnerEmail, PERMISSION_SECTIONS } from '../lib/permissions'

const hasSupabase =
  import.meta.env.VITE_SUPABASE_URL &&
  !import.meta.env.VITE_SUPABASE_URL.includes('YOUR_PROJECT')

const PROVIDERS = [
  { id: 'meta_pixel', name: 'Meta Pixel + Conversions API', fields: [
      { key: 'pixel_id', label: 'Pixel ID', secret: false, ph: 'e.g. 1367489998718107' },
      { key: 'capi_token', label: 'Conversions API Token', secret: true, ph: 'EAAG… (kept server-side)' },
  ] },
  { id: 'tiktok_pixel', name: 'TikTok Pixel', fields: [
      { key: 'pixel_id', label: 'Pixel ID', secret: false, ph: 'e.g. C9XXXXXXXXXXXX' },
  ] },
  { id: 'google_analytics', name: 'Google Analytics (GA4)', fields: [
      { key: 'measurement_id', label: 'Measurement ID', secret: false, ph: 'e.g. G-XXXXXXXXXX' },
  ] },
  { id: 'bosta', name: 'Bosta Shipping', fields: [
      { key: 'api_key', label: 'API Key', secret: true, ph: 'Bosta API key (kept server-side)' },
  ] },
  { id: 'paymob', name: 'Paymob (Card + Wallets)', fields: [
      { key: 'integration_card', label: 'Card Integration ID', secret: false, ph: 'e.g. 4536271' },
      { key: 'integration_wallet', label: 'Wallet Integration ID', secret: false, ph: 'e.g. 4536272' },
      { key: 'iframe_id', label: 'iFrame ID', secret: false, ph: 'e.g. 845123' },
      { key: 'api_key', label: 'API Key', secret: true, ph: 'long key — also set as Edge secret' },
      { key: 'hmac', label: 'HMAC Secret', secret: true, ph: 'for callback verification — Edge secret' },
  ] },
  { id: 'whatsapp', name: 'WhatsApp Business API', fields: [
      { key: 'phone_number_id', label: 'Phone Number ID', secret: false, ph: 'e.g. 1029384756' },
      { key: 'access_token', label: 'Access Token', secret: true, ph: 'kept server-side' },
  ] },
]

export default function Settings({ data, reload }) {
  const [tab, setTab] = useState('integrations')
  const tabs = [
    { id: 'integrations', label: 'Integrations', icon: Plug },
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'managers', label: 'Managers', icon: Users },
    { id: 'hero', label: 'Hero Section', icon: Megaphone },
    { id: 'homepage', label: 'Homepage', icon: LayoutGrid },
    { id: 'social', label: 'Social', icon: Share2 },
    { id: 'pages', label: 'Pages', icon: FileText },
  ]
  return (
    <div>
      <SectionTitle eyebrow="Configuration" title="Settings" />
      <div style={{ display: 'flex', gap: 8, margin: '18px 0 24px', flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 9,
            border: `1px solid ${tab === t.id ? AC.ink : AC.line}`, background: tab === t.id ? AC.ink : 'transparent',
            color: tab === t.id ? '#fff' : AC.ink, fontFamily: sans, fontSize: 13.5, cursor: 'pointer',
          }}><t.icon size={15} /> {t.label}</button>
        ))}
      </div>
      {tab === 'integrations' && <Integrations />}
      {tab === 'shipping' && <ShippingEditor settings={data} />}
      {tab === 'managers' && <ManagersEditor />}
      {tab === 'hero' && <HeroEditor settings={data} />}
      {tab === 'homepage' && <HomepageEditor settings={data} />}
      {tab === 'social' && <SocialEditor settings={data} />}
      {tab === 'pages' && <PagesEditor settings={data} />}
    </div>
  )
}

// ---------------- Integrations ----------------
function Integrations() {
  const [rows, setRows] = useState({})
  const [saved, setSaved] = useState('')

  useEffect(() => {
    if (!hasSupabase) {
      const init = {}; PROVIDERS.forEach(p => init[p.id] = { enabled: false, public_config: {}, secret_config: {} })
      setRows(init); return
    }
    supabase.from('integrations').select('*').then(({ data }) => {
      const map = {}
      ;(data || []).forEach(r => map[r.provider] = { enabled: r.enabled, public_config: r.public_config || {}, secret_config: r.secret_config || {} })
      PROVIDERS.forEach(p => { if (!map[p.id]) map[p.id] = { enabled: false, public_config: {}, secret_config: {} } })
      setRows(map)
    })
  }, [])

  const setField = (pid, key, val, secret) => setRows(prev => ({
    ...prev,
    [pid]: { ...prev[pid], [secret ? 'secret_config' : 'public_config']: { ...prev[pid][secret ? 'secret_config' : 'public_config'], [key]: val } },
  }))
  const setEnabled = (pid, en) => setRows(prev => ({ ...prev, [pid]: { ...prev[pid], enabled: en } }))

  const save = async (pid) => {
    const r = rows[pid]
    const kindOf = (id) =>
      id.includes('pixel') || id === 'google_analytics' ? 'pixel'
      : id === 'bosta' ? 'shipping'
      : id === 'paymob' ? 'payment'
      : 'other'
    if (hasSupabase) {
      await supabase.from('integrations').upsert({
        provider: pid, kind: kindOf(pid),
        enabled: r.enabled, public_config: r.public_config, secret_config: r.secret_config, updated_at: new Date().toISOString(),
      }, { onConflict: 'provider' })
    }
    setSaved(pid); setTimeout(() => setSaved(''), 1800)
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <p style={{ color: AC.sub, fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>
        Paste your keys below and save. Public IDs (Pixel IDs, Measurement ID) are used in the browser; secret tokens are stored securely and used only server-side. Wiring the events to fire comes next — saving here gets your credentials in place.
      </p>
      {PROVIDERS.map(p => {
        const r = rows[p.id] || { enabled: false, public_config: {}, secret_config: {} }
        return (
          <Panel key={p.id} title={p.name} action={
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: AC.sub }}>
              <input type="checkbox" checked={!!r.enabled} onChange={e => setEnabled(p.id, e.target.checked)} style={{ accentColor: AC.gold, width: 16, height: 16 }} /> Enabled
            </label>
          }>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14 }}>
              {p.fields.map(f => (
                <div key={f.key}>
                  <label style={lbl}>{f.label} {f.secret && <span style={{ color: AC.gold }}>· secret</span>}</label>
                  <input
                    style={inp}
                    type={f.secret ? 'password' : 'text'}
                    value={(f.secret ? r.secret_config : r.public_config)[f.key] || ''}
                    onChange={e => setField(p.id, f.key, e.target.value, f.secret)}
                    placeholder={f.ph}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <Btn variant="solid" onClick={() => save(p.id)}>
                {saved === p.id ? <><Check size={15} /> Saved</> : <><Save size={15} /> Save</>}
              </Btn>
            </div>
          </Panel>
        )
      })}
    </div>
  )
}

// ---------------- Hero editor ----------------
function HeroEditor({ settings }) {
  const [hero, setHero] = useState(() => ({ ...DEFAULT_SETTINGS.hero, ...(settings?.hero || {}) }))
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const set = (k, v) => setHero(h => ({ ...h, [k]: v }))

  const upload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    try {
      if (hasSupabase) {
        const path = `hero/${Date.now()}-${file.name.replace(/[^a-z0-9.]+/gi, '-')}`
        const { error } = await supabase.storage.from('site-media').upload(path, file, { upsert: true })
        if (error) throw error
        const { data } = supabase.storage.from('site-media').getPublicUrl(path)
        set('media_url', data.publicUrl)
        set('media_type', file.type.startsWith('video') ? 'video' : 'image')
      } else {
        set('media_url', URL.createObjectURL(file))
        set('media_type', file.type.startsWith('video') ? 'video' : 'image')
      }
    } catch (err) { alert('Upload failed: ' + err.message) }
    setUploading(false)
  }

  const setBtn = (i, k, v) => set('buttons', hero.buttons.map((b, idx) => idx === i ? { ...b, [k]: v } : b))
  const addBtn = () => set('buttons', [...(hero.buttons || []), { label: 'New Button', href: '/shop', style: 'ghost' }])
  const delBtn = (i) => set('buttons', hero.buttons.filter((_, idx) => idx !== i))

  const save = async () => { await saveSettings({ hero }); setSaved(true); setTimeout(() => setSaved(false), 1800) }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Panel title="Background Media">
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ width: 220, aspectRatio: '16/10', background: AC.bg, border: `1px solid ${AC.line}`, borderRadius: 10, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {hero.media_url ? (
              hero.media_type === 'video'
                ? <video src={hero.media_url} muted loop autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <img src={hero.media_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : <span style={{ color: AC.sub, fontSize: 13 }}>No media</span>}
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <p style={{ fontSize: 13, color: AC.sub, lineHeight: 1.6, marginTop: 0 }}>
              <strong style={{ color: AC.ink }}>Image:</strong> wide 16:9, ~1920×1080px, JPG/PNG. &nbsp;
              <strong style={{ color: AC.ink }}>Video:</strong> MP4, muted, short loop (5–15s), kept small (&lt;8MB) so it loads fast. Autoplays muted &amp; loops.
            </p>
            <label style={{ ...btnGhost, cursor: 'pointer' }}>
              <Upload size={14} /> {uploading ? 'Uploading…' : 'Upload image or video'}
              <input type="file" accept="image/*,video/*" onChange={upload} style={{ display: 'none' }} />
            </label>
            <div style={{ marginTop: 14 }}>
              <label style={lbl}>Dark overlay ({Math.round((hero.overlay ?? .4) * 100)}%)</label>
              <input type="range" min="0" max="0.8" step="0.05" value={hero.overlay ?? .4} onChange={e => set('overlay', Number(e.target.value))} style={{ width: '100%', accentColor: AC.gold }} />
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Hero Text">
        <div style={{ display: 'grid', gap: 12 }}>
          <div><label style={lbl}>Eyebrow (small text above title)</label><input style={inp} value={hero.eyebrow || ''} onChange={e => set('eyebrow', e.target.value)} /></div>
          <div><label style={lbl}>Title</label><input style={inp} value={hero.title || ''} onChange={e => set('title', e.target.value)} /></div>
          <div><label style={lbl}>Subtitle</label><textarea rows={2} style={inp} value={hero.subtitle || ''} onChange={e => set('subtitle', e.target.value)} /></div>
        </div>
      </Panel>

      <Panel title="Call-to-Action Buttons" action={<Btn variant="ghost" onClick={addBtn}><Plus size={14} /> Add Button</Btn>}>
        <div style={{ display: 'grid', gap: 12 }}>
          {(hero.buttons || []).map((b, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 130px 40px', gap: 8, alignItems: 'end' }}>
              <div><label style={lbl}>Label</label><input style={inp} value={b.label} onChange={e => setBtn(i, 'label', e.target.value)} /></div>
              <div><label style={lbl}>Link</label><input style={inp} value={b.href} onChange={e => setBtn(i, 'href', e.target.value)} placeholder="/shop" /></div>
              <div><label style={lbl}>Style</label>
                <select style={inp} value={b.style} onChange={e => setBtn(i, 'style', e.target.value)}>
                  <option value="solid">Solid (gold)</option>
                  <option value="ghost">Outline</option>
                </select>
              </div>
              <button onClick={() => delBtn(i)} style={{ ...iconBtn, marginBottom: 16 }}><Trash2 size={16} color={AC.red} /></button>
            </div>
          ))}
          {(!hero.buttons || hero.buttons.length === 0) && <p style={{ color: AC.sub, fontSize: 13 }}>No buttons. Add one above.</p>}
        </div>
      </Panel>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Btn variant="solid" onClick={save}>{saved ? <><Check size={15} /> Saved</> : <><Save size={15} /> Save Hero</>}</Btn>
      </div>
    </div>
  )
}

// ---------------- Shipping editor ----------------
function ShippingEditor({ settings }) {
  const [flat, setFlat] = useState(settings?.shipping_flat ?? 60)
  const [threshold, setThreshold] = useState(settings?.free_shipping_threshold ?? 2000)
  const [minOrder, setMinOrder] = useState(settings?.min_order ?? 0)
  const [cities, setCities] = useState(settings?.shipping_cities || [])
  const [saved, setSaved] = useState(false)

  const addCity = () => setCities([...cities, { city: '', price: '' }])
  const setCity = (i, k, v) => setCities(cities.map((c, idx) => idx === i ? { ...c, [k]: v } : c))
  const delCity = (i) => setCities(cities.filter((_, idx) => idx !== i))

  const save = async () => {
    const clean = cities.filter(c => (c.city || '').trim()).map(c => ({ city: c.city.trim(), price: Number(c.price) || 0 }))
    await saveSettings({
      shipping_flat: Number(flat) || 0,
      free_shipping_threshold: Number(threshold) || 0,
      min_order: Number(minOrder) || 0,
      shipping_cities: clean,
    })
    setCities(clean); setSaved(true); setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Panel title="Rates & Thresholds">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
          <div>
            <label style={lbl}>Default shipping rate (EGP)</label>
            <input type="number" style={inp} value={flat} onChange={e => setFlat(e.target.value)} />
            <p style={hint}>Used for any city without a specific rate below.</p>
          </div>
          <div>
            <label style={lbl}>Free shipping over (EGP)</label>
            <input type="number" style={inp} value={threshold} onChange={e => setThreshold(e.target.value)} />
            <p style={hint}>Set 0 to disable free shipping.</p>
          </div>
          <div>
            <label style={lbl}>Minimum order (EGP)</label>
            <input type="number" style={inp} value={minOrder} onChange={e => setMinOrder(e.target.value)} />
            <p style={hint}>Set 0 for no minimum. Blocks checkout below this.</p>
          </div>
        </div>
      </Panel>

      <Panel title="Per-City Rates" action={<Btn variant="ghost" onClick={addCity}><Plus size={14} /> Add City</Btn>}>
        <div style={{ display: 'grid', gap: 10 }}>
          {cities.map((c, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 160px 40px', gap: 8, alignItems: 'center' }}>
              <input style={inp} value={c.city} onChange={e => setCity(i, 'city', e.target.value)} placeholder="City / Governorate (e.g. Cairo)" />
              <input type="number" style={inp} value={c.price} onChange={e => setCity(i, 'price', e.target.value)} placeholder="Price EGP" />
              <button onClick={() => delCity(i)} style={iconBtn}><Trash2 size={16} color={AC.red} /></button>
            </div>
          ))}
          {cities.length === 0 && <p style={{ color: AC.sub, fontSize: 13 }}>No city rates yet — the default rate applies everywhere. Add cities to override.</p>}
        </div>
        <p style={hint}>City must match what customers type at checkout (case-insensitive). Keep names simple, e.g. "Cairo", "Giza", "Alexandria".</p>
      </Panel>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Btn variant="solid" onClick={save}>{saved ? <><Check size={15} /> Saved</> : <><Save size={15} /> Save Shipping</>}</Btn>
      </div>
    </div>
  )
}

// ---------------- Homepage sections editor ----------------
function HomepageEditor({ settings }) {
  const s0 = settings || {}
  const [promo, setPromo] = useState(() => ({ ...(s0.promo || {}) }))
  const [features, setFeatures] = useState(() => ({ items: [], ...(s0.features || {}) }))
  const [story, setStory] = useState(() => ({ ...(s0.brand_story || {}) }))
  const [collections, setCollections] = useState(() => ({ ...(s0.collections_section || {}) }))
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState('')

  const uploadFor = async (file, setter, key) => {
    if (!file) return
    setUploading(key)
    try {
      if (hasSupabase) {
        const path = `home/${key}-${Date.now()}-${file.name.replace(/[^a-z0-9.]+/gi, '-')}`
        const { error } = await supabase.storage.from('site-media').upload(path, file, { upsert: true })
        if (error) throw error
        const { data } = supabase.storage.from('site-media').getPublicUrl(path)
        setter(s => ({ ...s, image_url: data.publicUrl }))
      } else {
        setter(s => ({ ...s, image_url: URL.createObjectURL(file) }))
      }
    } catch (e) { alert('Upload failed: ' + e.message) }
    setUploading('')
  }

  const save = async () => {
    await saveSettings({ promo, features, brand_story: story, collections_section: collections })
    setSaved(true); setTimeout(() => setSaved(false), 1800)
  }

  const setFeature = (i, k, v) => setFeatures(s => ({ ...s, items: (s.items || []).map((f, idx) => idx === i ? { ...f, [k]: v } : f) }))
  const addFeature = () => setFeatures(s => ({ ...s, items: [...(s.items || []), { icon: 'sparkles', title: '', text: '' }] }))
  const delFeature = (i) => setFeatures(s => ({ ...s, items: (s.items || []).filter((_, idx) => idx !== i) }))

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <p style={{ color: AC.sub, fontSize: 13.5, margin: 0 }}>Control every homepage section — toggle on/off, upload images, edit text. Changes show on your store after saving.</p>

      {/* Promo banner */}
      <Panel title="Promo Banner" action={<Toggle on={promo.enabled !== false} onChange={v => setPromo(s => ({ ...s, enabled: v }))} />}>
        <MediaRow url={promo.image_url} uploading={uploading === 'promo'} onUpload={f => uploadFor(f, setPromo, 'promo')} onRemove={() => setPromo(s => ({ ...s, image_url: '' }))} hint="Wide banner 16:5, ~1920×600px. JPG/PNG under ~1MB. · بانر عريض ١٩٢٠×٦٠٠" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <Field label="Eyebrow"><input style={inp} value={promo.eyebrow || ''} onChange={e => setPromo(s => ({ ...s, eyebrow: e.target.value }))} /></Field>
          <Field label="Title"><input style={inp} value={promo.title || ''} onChange={e => setPromo(s => ({ ...s, title: e.target.value }))} /></Field>
          <Field label="Subtitle"><input style={inp} value={promo.subtitle || ''} onChange={e => setPromo(s => ({ ...s, subtitle: e.target.value }))} /></Field>
          <Field label="Button Label"><input style={inp} value={promo.button_label || ''} onChange={e => setPromo(s => ({ ...s, button_label: e.target.value }))} /></Field>
          <Field label="Button Link"><input style={inp} value={promo.button_href || ''} onChange={e => setPromo(s => ({ ...s, button_href: e.target.value }))} placeholder="/shop" /></Field>
        </div>
      </Panel>

      {/* Features */}
      <Panel title="Features Bar" action={<Toggle on={features.enabled !== false} onChange={v => setFeatures(s => ({ ...s, enabled: v }))} />}>
        <p style={{ ...hint, marginBottom: 12 }}>Icons: truck, leaf, shield, heart, award, clock, returns, sparkles</p>
        <div style={{ display: 'grid', gap: 10 }}>
          {(features.items || []).map((f, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1.4fr 40px', gap: 8, alignItems: 'center' }}>
              <input style={inp} value={f.icon} onChange={e => setFeature(i, 'icon', e.target.value)} placeholder="icon" />
              <input style={inp} value={f.title} onChange={e => setFeature(i, 'title', e.target.value)} placeholder="Title" />
              <input style={inp} value={f.text} onChange={e => setFeature(i, 'text', e.target.value)} placeholder="Text" />
              <button onClick={() => delFeature(i)} style={iconBtn}><Trash2 size={16} color={AC.red} /></button>
            </div>
          ))}
        </div>
        <Btn variant="ghost" onClick={addFeature} style={{ marginTop: 10 }}><Plus size={14} /> Add Feature</Btn>
      </Panel>

      {/* Collections */}
      <Panel title="Collections Section" action={<Toggle on={collections.enabled !== false} onChange={v => setCollections(s => ({ ...s, enabled: v }))} />}>
        <Field label="Section Title"><input style={inp} value={collections.title || ''} onChange={e => setCollections(s => ({ ...s, title: e.target.value }))} /></Field>
        <p style={hint}>Tip: upload a photo per collection in the <strong>Products → Collections</strong> area to make these cards shine. Without photos they show an elegant gradient.</p>
      </Panel>

      {/* Brand story */}
      <Panel title="Brand Story" action={<Toggle on={story.enabled !== false} onChange={v => setStory(s => ({ ...s, enabled: v }))} />}>
        <MediaRow url={story.image_url} uploading={uploading === 'story'} onUpload={f => uploadFor(f, setStory, 'story')} hint="Portrait image, ~1000×1250px" />
        <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
          <Field label="Eyebrow"><input style={inp} value={story.eyebrow || ''} onChange={e => setStory(s => ({ ...s, eyebrow: e.target.value }))} /></Field>
          <Field label="Title"><input style={inp} value={story.title || ''} onChange={e => setStory(s => ({ ...s, title: e.target.value }))} /></Field>
          <Field label="Text"><textarea rows={3} style={inp} value={story.text || ''} onChange={e => setStory(s => ({ ...s, text: e.target.value }))} /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Button Label"><input style={inp} value={story.button_label || ''} onChange={e => setStory(s => ({ ...s, button_label: e.target.value }))} /></Field>
            <Field label="Button Link"><input style={inp} value={story.button_href || ''} onChange={e => setStory(s => ({ ...s, button_href: e.target.value }))} placeholder="/about" /></Field>
          </div>
        </div>
      </Panel>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Btn variant="solid" onClick={save}>{saved ? <><Check size={15} /> Saved</> : <><Save size={15} /> Save Homepage</>}</Btn>
      </div>
    </div>
  )
}

// ---------------- Social editor ----------------
function SocialEditor({ settings }) {
  const [social, setSocial] = useState(() => ({ ...(settings?.social || {}) }))
  const [saved, setSaved] = useState(false)
  const set = (k, v) => setSocial(s => ({ ...s, [k]: v }))
  const save = async () => { await saveSettings({ social }); setSaved(true); setTimeout(() => setSaved(false), 1800) }

  const fields = [
    { key: 'instagram', label: 'Instagram URL', ph: 'https://instagram.com/yourstore' },
    { key: 'facebook', label: 'Facebook URL', ph: 'https://facebook.com/yourstore' },
    { key: 'tiktok', label: 'TikTok URL', ph: 'https://tiktok.com/@yourstore' },
    { key: 'whatsapp', label: 'WhatsApp Number', ph: '+201XXXXXXXXX' },
  ]
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Panel title="Social Media Links">
        <p style={{ ...hint, marginBottom: 14 }}>Add your links — only the ones you fill in will appear in the footer. Leave blank to hide an icon.</p>
        <div style={{ display: 'grid', gap: 12 }}>
          {fields.map(f => (
            <Field key={f.key} label={f.label}>
              <input style={inp} value={social[f.key] || ''} onChange={e => set(f.key, e.target.value)} placeholder={f.ph} />
            </Field>
          ))}
        </div>
      </Panel>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Btn variant="solid" onClick={save}>{saved ? <><Check size={15} /> Saved</> : <><Save size={15} /> Save Social</>}</Btn>
      </div>
    </div>
  )
}

// small helpers
function Toggle({ on, onChange }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: AC.sub }}>
      <input type="checkbox" checked={on} onChange={e => onChange(e.target.checked)} style={{ accentColor: AC.gold, width: 16, height: 16 }} /> Show
    </label>
  )
}
function MediaRow({ url, onUpload, onRemove, uploading, hint: h }) {
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{ position: 'relative', width: 120, height: 72, borderRadius: 9, overflow: 'hidden', border: `1px solid ${AC.line}`, background: AC.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {url ? <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={20} color={AC.sub} />}
        {url && onRemove && <button onClick={onRemove} title="Remove image" style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(0,0,0,.6)', border: 'none', borderRadius: 5, cursor: 'pointer', padding: 2, display: 'flex' }}><X size={12} color="#fff" /></button>}
      </div>
      <div style={{ flex: 1 }}>
        <label style={{ ...btnGhost, cursor: 'pointer' }}>
          <Upload size={14} /> {uploading ? 'Uploading…' : 'Upload image'}
          <input type="file" accept="image/*" onChange={e => onUpload(e.target.files?.[0])} style={{ display: 'none' }} />
        </label>
        {h && <div style={{ background: AC.bg, border: `1px solid ${AC.line}`, borderRadius: 8, padding: '8px 11px', marginTop: 8, fontSize: 12, color: AC.sub, lineHeight: 1.5 }}>📐 {h}</div>}
      </div>
    </div>
  )
}

// ---------------- Managers / permissions editor ----------------
function ManagersEditor() {
  const [session, setSession] = useState(null)
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [perms, setPerms] = useState(new Set())
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (hasSupabase) supabase.auth.getSession().then(({ data }) => setSession(data.session))
  }, [])
  const load = async () => { setLoading(true); setAdmins(await listAdmins()); setLoading(false) }
  useEffect(() => { load() }, [])

  const myEmail = (session?.user?.email || '').toLowerCase()
  const isOwner = isOwnerEmail(myEmail)

  const togglePerm = (id) => setPerms(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })

  const addManager = async () => {
    if (!email.trim()) return
    if (isOwnerEmail(email.trim())) { alert('This email is already a super-admin.'); return }
    const res = await upsertAdmin({ email, permissions: [...perms], active: true })
    if (!res.ok) { alert('Could not save: ' + (res.error?.message || 'error')); return }
    setEmail(''); setPerms(new Set()); setSaved(true); setTimeout(() => setSaved(false), 1500); load()
  }
  const editPerms = async (a, id) => {
    const next = new Set(a.permissions || []); next.has(id) ? next.delete(id) : next.add(id)
    await upsertAdmin({ email: a.email, permissions: [...next], active: a.active }); load()
  }
  const toggleActive = async (a) => { await upsertAdmin({ email: a.email, permissions: a.permissions, active: !(a.active !== false) }); load() }
  const removeManager = async (a) => { if (confirm(`Remove ${a.email}?`)) { await deleteAdmin(a.email); load() } }

  if (!isOwner) {
    return (
      <Panel title="Managers">
        <p style={{ color: AC.sub, fontSize: 14 }}>Only the store owner can manage admin accounts and permissions.</p>
      </Panel>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Panel title="Add a Manager">
        <p style={{ ...hint, marginBottom: 14 }}>Enter the manager's email (they sign in with their own account), then tick the sections they can access. The owner always has full access.</p>
        <Field label="Manager Email"><input style={inp} value={email} onChange={e => setEmail(e.target.value)} placeholder="manager@email.com" /></Field>
        <div style={{ margin: '14px 0 6px', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: AC.sub }}>Permissions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 8 }}>
          {PERMISSION_SECTIONS.map(s => (
            <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', border: `1px solid ${perms.has(s.id) ? AC.ink : AC.line}`, borderRadius: 9, cursor: 'pointer', fontSize: 13.5, background: perms.has(s.id) ? AC.bg : 'transparent' }}>
              <input type="checkbox" checked={perms.has(s.id)} onChange={() => togglePerm(s.id)} style={{ accentColor: AC.gold }} /> {s.label}
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
          <Btn variant="solid" onClick={addManager}>{saved ? <><Check size={15} /> Added</> : <><Plus size={15} /> Add Manager</>}</Btn>
        </div>
      </Panel>

      <Panel title="Current Managers">
        {loading ? <p style={{ color: AC.sub }}>Loading…</p> : admins.length === 0 ? (
          <p style={{ color: AC.sub, fontSize: 14 }}>No managers yet. Add one above.</p>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {admins.map(a => (
              <div key={a.email} style={{ border: `1px solid ${AC.line}`, borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: AC.gold + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', color: AC.goldDeep, fontWeight: 600, fontSize: 13 }}>{a.email[0]?.toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.email}</div>
                    <div style={{ fontSize: 12, color: a.active !== false ? AC.green : AC.sub }}>{a.active !== false ? 'Active' : 'Disabled'}</div>
                  </div>
                  <button onClick={() => toggleActive(a)} style={{ ...btnGhost, fontSize: 12 }}>{a.active !== false ? 'Disable' : 'Enable'}</button>
                  <button onClick={() => removeManager(a)} style={iconBtn}><Trash2 size={16} color={AC.red} /></button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 6 }}>
                  {PERMISSION_SECTIONS.map(s => {
                    const on = (a.permissions || []).includes(s.id)
                    return (
                      <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, cursor: 'pointer', color: on ? AC.ink : AC.sub }}>
                        <input type="checkbox" checked={on} onChange={() => editPerms(a, s.id)} style={{ accentColor: AC.gold }} /> {s.label}
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}

// ---------------- Pages editor ----------------
function PagesEditor({ settings }) {
  const [about, setAbout] = useState(settings?.about_html || '')
  const [returns, setReturns] = useState(settings?.returns_html || '')
  const [privacy, setPrivacy] = useState(settings?.privacy_html || '')
  const [terms, setTerms] = useState(settings?.terms_html || '')
  const [email, setEmail] = useState(settings?.contact_email || 'info@divaessentialsgroup.com')
  const [phone, setPhone] = useState(settings?.contact_phone || '')
  const [location, setLocation] = useState(settings?.contact_location || 'Cairo, Egypt')
  const [saved, setSaved] = useState(false)
  const save = async () => {
    const res = await saveSettings({
      about_html: about, returns_html: returns, privacy_html: privacy, terms_html: terms,
      contact_email: email, contact_phone: phone, contact_location: location,
    })
    if (!res.ok) {
      alert('Save failed: ' + (res.error?.message || JSON.stringify(res.error) || 'unknown error'))
      return
    }
    setSaved(true); setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Panel title="Contact Details">
        <p style={{ ...hint, marginBottom: 14 }}>These appear in your website footer. Leave a field blank to hide it.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
          <Field label="Email"><input style={inp} value={email} onChange={e => setEmail(e.target.value)} placeholder="info@divaessentialsgroup.com" /></Field>
          <Field label="Phone (optional)"><input style={inp} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+20 1XX XXX XXXX" /></Field>
          <Field label="Location"><input style={inp} value={location} onChange={e => setLocation(e.target.value)} placeholder="Cairo, Egypt" /></Field>
        </div>
      </Panel>

      <p style={{ color: AC.sub, fontSize: 13.5, lineHeight: 1.6, margin: '4px 0 0' }}>
        For the pages below: leave blank to use the built-in professional default text. To customize, write your own — basic HTML works (use &lt;h2&gt; for headings, &lt;p&gt; for paragraphs).
      </p>
      <Panel title="About Page">
        <textarea rows={7} style={{ ...inp, fontFamily: 'monospace', fontSize: 13 }} value={about} onChange={e => setAbout(e.target.value)} placeholder="<p>Your story…</p>  (leave blank for default)" />
      </Panel>
      <Panel title="Returns & Replacement Page">
        <textarea rows={7} style={{ ...inp, fontFamily: 'monospace', fontSize: 13 }} value={returns} onChange={e => setReturns(e.target.value)} placeholder="<p>Your policy…</p>  (leave blank for default)" />
      </Panel>
      <Panel title="Privacy Policy Page">
        <textarea rows={7} style={{ ...inp, fontFamily: 'monospace', fontSize: 13 }} value={privacy} onChange={e => setPrivacy(e.target.value)} placeholder="<p>Your privacy policy…</p>  (leave blank for default)" />
      </Panel>
      <Panel title="Terms & Conditions Page">
        <textarea rows={7} style={{ ...inp, fontFamily: 'monospace', fontSize: 13 }} value={terms} onChange={e => setTerms(e.target.value)} placeholder="<p>Your terms…</p>  (leave blank for default)" />
      </Panel>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Btn variant="solid" onClick={save}>{saved ? <><Check size={15} /> Saved</> : <><Save size={15} /> Save Pages</>}</Btn>
      </div>
    </div>
  )
}

const inp = { width: '100%', padding: '11px 13px', border: `1px solid ${AC.line}`, borderRadius: 9, fontSize: 14, fontFamily: sans, color: AC.ink, background: AC.bg, boxSizing: 'border-box' }
const lbl = { display: 'block', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: AC.sub, marginBottom: 6 }
const hint = { fontSize: 12, color: AC.sub, marginTop: 6, marginBottom: 0, lineHeight: 1.5 }
const btnGhost = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 14px', border: `1px solid ${AC.line}`, borderRadius: 9, background: 'transparent', fontSize: 13, fontFamily: sans, cursor: 'pointer', color: AC.ink }
const iconBtn = { background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, display: 'inline-flex' }
function Field({ label, children }) { return <div><label style={lbl}>{label}</label>{children}</div> }
