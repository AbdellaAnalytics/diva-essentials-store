import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Pencil, Trash2, X, Upload, Link2, Star, Eye, EyeOff, FolderPlus, Save } from 'lucide-react'
import { AC, serif, sans, Panel, KpiCard, Btn, Badge, Table, SectionTitle } from '../ui'
import { fmtEGP } from '../lib/analytics'
import { supabase } from '../../lib/supabase'

const hasSupabase =
  import.meta.env.VITE_SUPABASE_URL &&
  !import.meta.env.VITE_SUPABASE_URL.includes('YOUR_PROJECT')

const slugify = s => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export default function Products({ data, reload }) {
  const { products, categories: dataCats } = data
  // local working copies (so the UI updates instantly; writes go to Supabase too)
  const [items, setItems] = useState(products)
  const [cats, setCats] = useState([])
  const [editing, setEditing] = useState(null)   // product object or 'new'
  const [showCats, setShowCats] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => { setItems(products) }, [products])

  // load categories (from data or Supabase)
  useEffect(() => {
    if (dataCats?.length) { setCats(dataCats); return }
    if (!hasSupabase) {
      const seen = new Map()
      products.forEach(p => { if (p.category_slug) seen.set(p.category_slug, { name: p.category_name, slug: p.category_slug }) })
      setCats([...seen.values()]); return
    }
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => data && setCats(data))
  }, [dataCats, products])

  const activeCount = items.filter(p => p.is_active !== false).length
  const totalStock = items.reduce((s, p) => s + (p.stock || 0), 0)

  const saveProduct = async (form) => {
    setBusy(true)
    const catId = cats.find(c => c.slug === form.category_slug)?.id
    const payload = {
      name: form.name, slug: form.slug || slugify(form.name),
      sku: form.sku, description: form.description, scent_notes: form.scent_notes,
      burn_time: form.burn_time, weight_grams: form.weight_grams ? Number(form.weight_grams) : null,
      volume_ml: form.volume_ml ? Number(form.volume_ml) : null,
      price: Number(form.price), compare_price: form.compare_price ? Number(form.compare_price) : null,
      stock: Number(form.stock || 0), images: form.images || [],
      is_active: form.is_active !== false, is_featured: !!form.is_featured,
      category_id: catId || null,
    }
    if (hasSupabase) {
      if (form.id && typeof form.id === 'number') {
        await supabase.from('products').update(payload).eq('id', form.id)
      } else {
        await supabase.from('products').insert(payload)
      }
      reload?.()
    } else {
      // demo mode: update local list
      setItems(prev => {
        const merged = { ...form, ...payload, category_name: cats.find(c => c.slug === form.category_slug)?.name }
        if (form.id) return prev.map(p => p.id === form.id ? merged : p)
        return [{ ...merged, id: Date.now() }, ...prev]
      })
    }
    setBusy(false); setEditing(null)
  }

  const deleteProduct = async (p) => {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return
    if (hasSupabase) { await supabase.from('products').delete().eq('id', p.id); reload?.() }
    else setItems(prev => prev.filter(x => x.id !== p.id))
  }

  const toggleField = async (p, field) => {
    const val = !(p[field] !== false && p[field])
    if (hasSupabase) { await supabase.from('products').update({ [field]: field === 'is_active' ? !(p.is_active !== false) : val }).eq('id', p.id); reload?.() }
    setItems(prev => prev.map(x => x.id === p.id ? { ...x, [field]: field === 'is_active' ? !(x.is_active !== false) : val } : x))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <SectionTitle eyebrow="Catalog" title="Products" />
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="ghost" onClick={() => setShowCats(true)}><FolderPlus size={15} /> Collections</Btn>
          <Btn variant="solid" onClick={() => setEditing('new')}><Plus size={15} /> Add Product</Btn>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 16, marginBottom: 24 }}>
        <KpiCard label="Total Products" value={items.length} accent={AC.ink} />
        <KpiCard label="Active" value={activeCount} accent={AC.green} />
        <KpiCard label="Collections" value={cats.length} accent={AC.gold} />
        <KpiCard label="Total Stock" value={totalStock} accent={AC.goldDeep} />
      </div>

      <Panel title="All Products">
        <Table
          empty="No products yet — add your first."
          columns={[
            { label: '', render: p => <Thumb p={p} /> },
            { label: 'Name', render: p => <div><strong>{p.name}</strong><div style={{ fontSize: 12, color: AC.sub }}>{p.sku || '—'}</div></div> },
            { label: 'Collection', render: p => p.category_name || '—' },
            { label: 'Price', align: 'right', render: p => fmtEGP(p.price) },
            { label: 'Stock', align: 'right', render: p => <span style={{ color: p.stock <= 0 ? AC.red : p.stock <= 10 ? AC.goldDeep : AC.ink }}>{p.stock ?? 0}</span> },
            { label: 'Featured', align: 'center', render: p => <button onClick={() => toggleField(p, 'is_featured')} style={iconBtn}><Star size={16} fill={p.is_featured ? AC.gold : 'none'} color={p.is_featured ? AC.gold : AC.sub} /></button> },
            { label: 'Active', align: 'center', render: p => <button onClick={() => toggleField(p, 'is_active')} style={iconBtn}>{p.is_active !== false ? <Eye size={16} color={AC.green} /> : <EyeOff size={16} color={AC.sub} />}</button> },
            {
              label: 'Actions', align: 'center', render: p => (
                <div style={{ display: 'inline-flex', gap: 6 }}>
                  <button onClick={() => setEditing(p)} style={iconBtn}><Pencil size={15} color={AC.ink} /></button>
                  <button onClick={() => deleteProduct(p)} style={iconBtn}><Trash2 size={15} color={AC.red} /></button>
                </div>
              )
            },
          ]}
          rows={items}
        />
      </Panel>

      {editing && (
        <ProductEditor
          product={editing === 'new' ? null : editing}
          cats={cats}
          busy={busy}
          onSave={saveProduct}
          onClose={() => setEditing(null)}
        />
      )}
      {showCats && (
        <CollectionsManager cats={cats} setCats={setCats} onClose={() => setShowCats(false)} reload={reload} />
      )}
    </div>
  )
}

const iconBtn = { background: 'transparent', border: 'none', cursor: 'pointer', padding: 5, display: 'inline-flex', borderRadius: 7 }

function Thumb({ p }) {
  const img = p.images?.[0]
  return (
    <div style={{ width: 42, height: 50, background: AC.bg, border: `1px solid ${AC.line}`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {img ? <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 20, opacity: .5 }}>🕯️</span>}
    </div>
  )
}

// ---------- Product editor modal ----------
function ProductEditor({ product, cats, onSave, onClose, busy }) {
  const [f, setF] = useState(() => product || {
    name: '', sku: '', description: '', scent_notes: '', burn_time: '', volume_ml: '', weight_grams: '',
    price: '', compare_price: '', stock: 0, images: [], category_slug: cats[0]?.slug || '',
    is_active: true, is_featured: false,
  })
  const [imgUrl, setImgUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }))

  // ensure category_slug is set from category_name when editing existing
  useEffect(() => {
    if (product && !product.category_slug && product.category_name) {
      const c = cats.find(c => c.name === product.category_name)
      if (c) set('category_slug', c.slug)
    }
  }, [])

  const addUrl = () => { if (imgUrl.trim()) { set('images', [...(f.images || []), imgUrl.trim()]); setImgUrl('') } }
  const removeImg = (i) => set('images', f.images.filter((_, idx) => idx !== i))

  const uploadFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    try {
      if (hasSupabase) {
        const path = `products/${Date.now()}-${file.name.replace(/[^a-z0-9.]+/gi, '-')}`
        const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true })
        if (error) throw error
        const { data } = supabase.storage.from('product-images').getPublicUrl(path)
        set('images', [...(f.images || []), data.publicUrl])
      } else {
        // demo mode: use a local object URL
        set('images', [...(f.images || []), URL.createObjectURL(file)])
      }
    } catch (err) {
      alert('Upload failed: ' + err.message + '\n\nTip: create a public Storage bucket named "product-images" in Supabase.')
    }
    setUploading(false)
  }

  const valid = f.name && f.price

  return (
    <Modal title={product ? 'Edit Product' : 'Add Product'} onClose={onClose} wide>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
        <Field label="Name *"><input style={inp} value={f.name} onChange={e => set('name', e.target.value)} /></Field>
        <Field label="SKU"><input style={inp} value={f.sku || ''} onChange={e => set('sku', e.target.value)} placeholder="DIVA-XX-100" /></Field>

        <Field label="Collection">
          <select style={inp} value={f.category_slug || ''} onChange={e => set('category_slug', e.target.value)}>
            <option value="">— none —</option>
            {cats.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Scent Notes"><input style={inp} value={f.scent_notes || ''} onChange={e => set('scent_notes', e.target.value)} placeholder="Rose · Vanilla · Musk" /></Field>

        <Field label="Price (EGP) *"><input type="number" style={inp} value={f.price} onChange={e => set('price', e.target.value)} /></Field>
        <Field label="Compare-at Price (EGP)"><input type="number" style={inp} value={f.compare_price || ''} onChange={e => set('compare_price', e.target.value)} placeholder="optional — shows discount" /></Field>

        <Field label="Stock"><input type="number" style={inp} value={f.stock} onChange={e => set('stock', e.target.value)} /></Field>
        <Field label="Burn Time"><input style={inp} value={f.burn_time || ''} onChange={e => set('burn_time', e.target.value)} placeholder="40+ hours" /></Field>

        <Field label="Volume (ml)"><input type="number" style={inp} value={f.volume_ml || ''} onChange={e => set('volume_ml', e.target.value)} /></Field>
        <Field label="Weight (g)"><input type="number" style={inp} value={f.weight_grams || ''} onChange={e => set('weight_grams', e.target.value)} /></Field>
      </div>

      <Field label="Description"><textarea rows={3} style={inp} value={f.description || ''} onChange={e => set('description', e.target.value)} /></Field>

      {/* Images */}
      <div style={{ marginBottom: 16 }}>
        <label style={lbl}>Images</label>
        <div style={{ background: AC.bg, border: `1px solid ${AC.line}`, borderRadius: 9, padding: '10px 13px', marginBottom: 12, fontSize: 12.5, color: AC.sub, lineHeight: 1.6 }}>
          <strong style={{ color: AC.ink }}>📐 Recommended image sizes</strong> — pick one and use it for <em>all</em> products so the shop looks consistent:
          <div style={{ display: 'flex', gap: 18, marginTop: 8, flexWrap: 'wrap' }}>
            <span><strong style={{ color: AC.goldDeep }}>Square 1:1</strong> — e.g. 1000×1000px. Clean, classic, best for the cart &amp; thumbnails.</span>
            <span><strong style={{ color: AC.goldDeep }}>Portrait 4:5</strong> — e.g. 1000×1250px. Taller, more premium/editorial feel.</span>
          </div>
          <div style={{ marginTop: 6 }}>Use JPG or PNG, under ~1MB each. The <strong style={{ color: AC.ink }}>first image</strong> is the main photo; the <strong style={{ color: AC.ink }}>second</strong> shows on hover in the shop.</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          {(f.images || []).map((src, i) => (
            <div key={i} style={{ position: 'relative', width: 64, height: 78, border: `1px solid ${AC.line}`, borderRadius: 7, overflow: 'hidden' }}>
              <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button onClick={() => removeImg(i)} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,.6)', border: 'none', borderRadius: 5, cursor: 'pointer', padding: 2, display: 'flex' }}><X size={12} color="#fff" /></button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ ...btnGhost, cursor: 'pointer' }}>
            <Upload size={14} /> {uploading ? 'Uploading…' : 'Upload'}
            <input type="file" accept="image/*" onChange={uploadFile} style={{ display: 'none' }} />
          </label>
          <div style={{ display: 'flex', gap: 6, flex: 1, minWidth: 200 }}>
            <input style={{ ...inp, marginBottom: 0 }} value={imgUrl} onChange={e => setImgUrl(e.target.value)} placeholder="…or paste image URL" />
            <button onClick={addUrl} style={btnGhost}><Link2 size={14} /> Add</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={f.is_active !== false} onChange={e => set('is_active', e.target.checked)} style={{ accentColor: AC.gold, width: 16, height: 16 }} /> Active (visible in store)
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={!!f.is_featured} onChange={e => set('is_featured', e.target.checked)} style={{ accentColor: AC.gold, width: 16, height: 16 }} /> Featured / Bestseller
        </label>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="solid" onClick={() => valid && onSave(f)} style={{ opacity: valid ? 1 : .5 }}><Save size={15} /> {busy ? 'Saving…' : 'Save Product'}</Btn>
      </div>
    </Modal>
  )
}

// ---------- Collections manager ----------
function CollectionsManager({ cats, setCats, onClose, reload }) {
  const [local, setLocal] = useState(cats)
  const [newName, setNewName] = useState('')
  const [uploading, setUploading] = useState('')

  const add = async () => {
    if (!newName.trim()) return
    const slug = slugify(newName)
    const row = { name: newName.trim(), slug, sort_order: local.length + 1 }
    if (hasSupabase) { const { data } = await supabase.from('categories').insert(row).select().single(); if (data) { setLocal([...local, data]); setCats([...local, data]) } }
    else { const r = { ...row, id: Date.now() }; setLocal([...local, r]); setCats([...local, r]) }
    setNewName('')
  }
  const rename = async (c, name) => {
    setLocal(local.map(x => x.slug === c.slug ? { ...x, name } : x))
  }
  const commitRename = async (c) => {
    const updated = local.find(x => x.slug === c.slug)
    if (hasSupabase) await supabase.from('categories').update({ name: updated.name }).eq('id', c.id)
    setCats(local)
  }
  const remove = async (c) => {
    if (!confirm(`Delete collection "${c.name}"? Products keep their data but lose this collection.`)) return
    if (hasSupabase) { await supabase.from('categories').delete().eq('id', c.id); reload?.() }
    const next = local.filter(x => x.slug !== c.slug)
    setLocal(next); setCats(next)
  }
  const uploadImage = async (c, file) => {
    if (!file) return
    setUploading(c.slug)
    try {
      let url
      if (hasSupabase) {
        const path = `collections/${c.slug}-${Date.now()}-${file.name.replace(/[^a-z0-9.]+/gi, '-')}`
        const { error } = await supabase.storage.from('site-media').upload(path, file, { upsert: true })
        if (error) throw error
        url = supabase.storage.from('site-media').getPublicUrl(path).data.publicUrl
        await supabase.from('categories').update({ image_url: url }).eq('id', c.id)
      } else {
        url = URL.createObjectURL(file)
      }
      const next = local.map(x => x.slug === c.slug ? { ...x, image_url: url } : x)
      setLocal(next); setCats(next)
    } catch (e) { alert('Upload failed: ' + e.message) }
    setUploading('')
  }

  return (
    <Modal title="Manage Collections" onClose={onClose}>
      <p style={{ fontSize: 12.5, color: AC.sub, marginBottom: 14, lineHeight: 1.5 }}>
        Upload a photo per collection to power the homepage "Shop by Collection" cards. Recommended: portrait 3:4, ~900×1200px.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
        {local.map(c => (
          <div key={c.slug} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ width: 46, height: 56, borderRadius: 8, overflow: 'hidden', border: `1px solid ${AC.line}`, background: AC.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {c.image_url ? <img src={c.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 18, opacity: .4 }}>🏷️</span>}
            </div>
            <input style={{ ...inp, marginBottom: 0, flex: 1 }} value={c.name} onChange={e => rename(c, e.target.value)} onBlur={() => commitRename(c)} />
            <label style={{ ...btnGhost, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <Upload size={13} /> {uploading === c.slug ? '…' : 'Image'}
              <input type="file" accept="image/*" onChange={e => uploadImage(c, e.target.files?.[0])} style={{ display: 'none' }} />
            </label>
            <button onClick={() => remove(c)} style={iconBtn}><Trash2 size={16} color={AC.red} /></button>
          </div>
        ))}
        {local.length === 0 && <p style={{ color: AC.sub, fontSize: 14 }}>No collections yet.</p>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input style={{ ...inp, marginBottom: 0 }} value={newName} onChange={e => setNewName(e.target.value)} placeholder="New collection name (e.g. 250ml Jar)" onKeyDown={e => e.key === 'Enter' && add()} />
        <Btn variant="solid" onClick={add}><Plus size={15} /> Add</Btn>
      </div>
    </Modal>
  )
}

// ---------- shared modal + form bits ----------
function Modal({ title, children, onClose, wide }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 300 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: wide ? 'min(760px,94vw)' : 'min(520px,94vw)', maxHeight: '90vh', overflowY: 'auto', background: AC.panel, borderRadius: 16, zIndex: 310, boxShadow: '0 30px 80px rgba(0,0,0,.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: `1px solid ${AC.line}`, position: 'sticky', top: 0, background: AC.panel }}>
          <h3 style={{ fontFamily: serif, fontSize: 22, fontWeight: 500, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={iconBtn}><X size={22} color={AC.ink} /></button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </>
  )
}

const inp = { width: '100%', padding: '11px 13px', border: `1px solid ${AC.line}`, borderRadius: 9, fontSize: 14.5, fontFamily: sans, color: AC.ink, background: AC.bg, marginBottom: 16, boxSizing: 'border-box' }
const lbl = { display: 'block', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: AC.sub, marginBottom: 7 }
const btnGhost = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 14px', border: `1px solid ${AC.line}`, borderRadius: 9, background: 'transparent', fontSize: 12.5, fontFamily: sans, cursor: 'pointer', color: AC.ink, whiteSpace: 'nowrap' }
function Field({ label, children }) { return <div style={{ marginBottom: 0 }}><label style={lbl}>{label}</label>{children}</div> }
