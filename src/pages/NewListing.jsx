import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'

export default function NewListing() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ title:'', description:'', type:'ev', price:'', city:'', district:'' })
  const [photos, setPhotos] = useState([])
  const [previews, setPreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files).slice(0, 8)
    setPhotos(files)
    setPreviews(files.map(f => URL.createObjectURL(f)))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data: listing, error: listingErr } = await supabase
      .from('listings')
      .insert({ ...form, price: form.price || null, user_id: user.id })
      .select().single()
    if (listingErr) { setError('İlan eklenemedi: ' + listingErr.message); setLoading(false); return }
    for (const photo of photos) {
      const ext = photo.name.split('.').pop()
      const path = `${listing.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('listing-photos').upload(path, photo)
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from('listing-photos').getPublicUrl(path)
        await supabase.from('listing_photos').insert({ listing_id: listing.id, url: publicUrl })
      }
    }
    navigate('/')
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>Yeni İlan Ekle</h1>
        <form onSubmit={handleSubmit}>
          <div style={s.grid2}>
            <div style={s.field}>
              <label style={s.label}>İlan Başlığı *</label>
              <input style={s.input} value={form.title} onChange={set('title')} required placeholder="3+1 Daire, Kadıköy" />
            </div>
            <div style={s.field}>
              <label style={s.label}>İlan Tipi *</label>
              <select style={s.input} value={form.type} onChange={set('type')}>
                <option value="ev">Konut</option>
                <option value="isyeri">İş Yeri</option>
                <option value="arsa">Arsa</option>
              </select>
            </div>
          </div>
          <div style={s.grid3}>
            <div style={s.field}>
              <label style={s.label}>Şehir</label>
              <input style={s.input} value={form.city} onChange={set('city')} placeholder="İstanbul" />
            </div>
            <div style={s.field}>
              <label style={s.label}>İlçe</label>
              <input style={s.input} value={form.district} onChange={set('district')} placeholder="Kadıköy" />
            </div>
            <div style={s.field}>
              <label style={s.label}>Fiyat (₺)</label>
              <input style={s.input} type="number" value={form.price} onChange={set('price')} placeholder="2.500.000" />
            </div>
          </div>
          <div style={s.field}>
            <label style={s.label}>Açıklama</label>
            <textarea style={{...s.input, height:100, resize:'vertical'}} value={form.description} onChange={set('description')} placeholder="Mülk hakkında detaylar..." />
          </div>
          <div style={s.field}>
            <label style={s.label}>Fotoğraflar (max 8)</label>
            <label style={s.uploadArea}>
              <input type="file" accept="image/*" multiple onChange={handlePhotos} style={{display:'none'}} />
              <span style={s.uploadIcon}>⊕</span>
              <span style={s.uploadText}>Fotoğraf seç veya sürükle bırak</span>
            </label>
            {previews.length > 0 && (
              <div style={s.previews}>
                {previews.map((p, i) => <img key={i} src={p} alt="" style={s.preview} />)}
              </div>
            )}
          </div>
          {error && <p style={s.error}>{error}</p>}
          <div style={s.actions}>
            <button type="button" onClick={() => navigate('/')} style={s.cancelBtn}>İptal</button>
            <button type="submit" style={s.submitBtn} disabled={loading}>
              {loading ? 'Yükleniyor...' : 'İlanı Yayınla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const s = {
  page: { maxWidth:780, margin:'0 auto', padding:'28px 20px' },
  card: { background:'#161616', border:'1px solid #222', borderRadius:14, padding:32 },
  title: { fontFamily:"'DM Serif Display',serif", fontSize:20, fontWeight:400, color:'#f0f0ee', marginBottom:24 },
  grid2: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 },
  grid3: { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:16 },
  field: { marginBottom:16 },
  label: { display:'block', fontSize:11, color:'#666', marginBottom:6, letterSpacing:'0.5px', textTransform:'uppercase' },
  input: { width:'100%', padding:'10px 14px', background:'#1f1f1f', border:'1px solid #2a2a2a', borderRadius:8, fontSize:14, color:'#f0f0ee', outline:'none', fontFamily:'inherit' },
  uploadArea: { display:'flex', flexDirection:'column', alignItems:'center', gap:6, border:'1px dashed #2a2a2a', borderRadius:9, padding:24, cursor:'pointer' },
  uploadIcon: { fontSize:24, color:'#444' },
  uploadText: { fontSize:13, color:'#555' },
  previews: { display:'flex', gap:8, marginTop:10, flexWrap:'wrap' },
  preview: { width:76, height:76, objectFit:'cover', borderRadius:7, border:'1px solid #2a2a2a' },
  error: { color:'#e74c3c', fontSize:13, marginBottom:12 },
  actions: { display:'flex', gap:12, justifyContent:'flex-end', marginTop:8 },
  cancelBtn: { padding:'10px 22px', border:'1px solid #2a2a2a', borderRadius:8, background:'transparent', cursor:'pointer', fontSize:14, color:'#888' },
  submitBtn: { padding:'10px 28px', border:'none', borderRadius:8, background:'#c8a96e', color:'#0f0f0f', fontWeight:600, cursor:'pointer', fontSize:14 }
}
