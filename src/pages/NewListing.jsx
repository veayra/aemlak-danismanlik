import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'

function formatPrice(val) {
  const num = val.replace(/\D/g, '')
  if (!num) return ''
  return Number(num).toLocaleString('tr-TR')
}

export default function NewListing() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ title:'', description:'', type:'ev', price:'', city:'', district:'' })
  const [priceDisplay, setPriceDisplay] = useState('')
  const [photos, setPhotos] = useState([])
  const [previews, setPreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handlePrice = (e) => {
    const raw = e.target.value.replace(/\D/g, '')
    setPriceDisplay(raw ? Number(raw).toLocaleString('tr-TR') : '')
    setForm(f => ({ ...f, price: raw }))
  }

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files).slice(0, 8)
    setPhotos(files)
    setPreviews(files.map(f => URL.createObjectURL(f)))
  }

  const removePhoto = (i) => {
    setPhotos(p => p.filter((_,idx) => idx!==i))
    setPreviews(p => p.filter((_,idx) => idx!==i))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data: listing, error: err } = await supabase.from('listings')
      .insert({ ...form, price: form.price || null, user_id: user.id }).select().single()
    if (err) { setError('Hata: ' + err.message); setLoading(false); return }
    for (const photo of photos) {
      const ext = photo.name.split('.').pop()
      const path = `${listing.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error: upErr } = await supabase.storage.from('listing-photos').upload(path, photo)
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from('listing-photos').getPublicUrl(path)
        await supabase.from('listing_photos').insert({ listing_id: listing.id, url: publicUrl })
      }
    }
    navigate('/')
  }

  return (
    <div style={s.outer}>
      <div style={s.page}>
        <div style={s.topHeader}>
          <button onClick={() => navigate('/')} style={s.backBtn}>
            <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h1 style={s.title}>Yeni İlan</h1>
          <div style={{width:36}}/>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Tip seçimi */}
          <div style={s.section}>
            <label style={s.label}>İlan Tipi</label>
            <div style={s.typeGrid}>
              {[['ev','🏠','Konut'],['isyeri','🏢','İş Yeri'],['arsa','🌱','Arsa']].map(([val,icon,lbl]) => (
                <button key={val} type="button" onClick={() => setForm(f=>({...f,type:val}))}
                  style={form.type===val ? {...s.typeBtn,...s.typeBtnActive} : s.typeBtn}>
                  <span style={{fontSize:22}}>{icon}</span>
                  <span style={{fontSize:13,fontWeight:500}}>{lbl}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Başlık */}
          <div style={s.section}>
            <label style={s.label}>İlan Başlığı *</label>
            <input style={s.input} value={form.title} onChange={set('title')} required placeholder="Örn: 3+1 Satılık Daire, Kadıköy" />
          </div>

          {/* Şehir / İlçe */}
          <div style={s.row}>
            <div style={{flex:1}}>
              <label style={s.label}>Şehir</label>
              <input style={s.input} value={form.city} onChange={set('city')} placeholder="İstanbul" />
            </div>
            <div style={{flex:1}}>
              <label style={s.label}>İlçe</label>
              <input style={s.input} value={form.district} onChange={set('district')} placeholder="Kadıköy" />
            </div>
          </div>

          {/* Fiyat */}
          <div style={s.section}>
            <label style={s.label}>Fiyat</label>
            <div style={s.priceWrap}>
              <input style={{...s.input, paddingRight:36}} value={priceDisplay} onChange={handlePrice}
                placeholder="2.500.000" inputMode="numeric" />
              <span style={s.priceSuffix}>₺</span>
            </div>
            {priceDisplay && (
              <p style={s.priceHint}>{priceDisplay} ₺</p>
            )}
          </div>

          {/* Açıklama */}
          <div style={s.section}>
            <label style={s.label}>Açıklama</label>
            <textarea style={s.textarea} value={form.description} onChange={set('description')}
              placeholder="Mülk hakkında detaylar, özellikler, ulaşım..." />
          </div>

          {/* Fotoğraflar */}
          <div style={s.section}>
            <label style={s.label}>Fotoğraflar (max 8)</label>
            <label style={s.uploadArea}>
              <input type="file" accept="image/*" multiple onChange={handlePhotos} style={{display:'none'}} />
              <svg width="28" height="28" fill="none" stroke="#444" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <span style={{fontSize:13,color:'#555',marginTop:6}}>Fotoğraf seç veya sürükle bırak</span>
              <span style={{fontSize:11,color:'#333',marginTop:2}}>{photos.length > 0 ? `${photos.length} fotoğraf seçildi` : 'JPG, PNG — max 8 adet'}</span>
            </label>
            {previews.length > 0 && (
              <div style={s.previews}>
                {previews.map((p,i) => (
                  <div key={i} style={s.previewWrap}>
                    <img src={p} alt="" style={s.preview} />
                    <button type="button" onClick={() => removePhoto(i)} style={s.removeBtn}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <div style={s.error}>{error}</div>}

          <button type="submit" style={s.submitBtn} disabled={loading}>
            {loading ? 'Yükleniyor...' : 'İlanı Yayınla'}
          </button>
        </form>
      </div>
    </div>
  )
}

const s = {
  outer: { background:'#0a0a0a', minHeight:'100vh' },
  page: { maxWidth:640, margin:'0 auto', padding:'0 0 80px' },
  topHeader: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px 12px', borderBottom:'1px solid #1a1a1a', marginBottom:4 },
  backBtn: { width:36, height:36, borderRadius:10, background:'#1c1c1c', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 },
  title: { fontSize:16, fontWeight:600, color:'#fff' },
  section: { marginBottom:20, padding:'0 20px' },
  row: { display:'flex', gap:12, marginBottom:20, padding:'0 20px' },
  label: { display:'block', fontSize:11, color:'#666', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.8px', fontWeight:600 },
  input: { width:'100%', padding:'13px 16px', background:'#141414', border:'1px solid #222', borderRadius:12, fontSize:15, color:'#fff', outline:'none', fontFamily:'inherit' },
  typeGrid: { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 },
  typeBtn: { display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:'16px 8px', background:'#141414', border:'1px solid #222', borderRadius:12, cursor:'pointer', color:'#666' },
  typeBtnActive: { background:'#1a0f14', border:'1px solid #ff3b5c', color:'#fff' },
  priceWrap: { position:'relative' },
  priceSuffix: { position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', color:'#555', fontSize:16, pointerEvents:'none' },
  priceHint: { fontSize:12, color:'#555', marginTop:6 },
  textarea: { width:'100%', padding:'13px 16px', background:'#141414', border:'1px solid #222', borderRadius:12, fontSize:15, color:'#ccc', resize:'vertical', fontFamily:'inherit', outline:'none', minHeight:110, lineHeight:1.6 },
  uploadArea: { display:'flex', flexDirection:'column', alignItems:'center', gap:4, border:'1px dashed #2a2a2a', borderRadius:12, padding:'24px 16px', cursor:'pointer' },
  previews: { display:'flex', gap:8, marginTop:10, flexWrap:'wrap' },
  previewWrap: { position:'relative' },
  preview: { width:80, height:80, objectFit:'cover', borderRadius:9, display:'block' },
  removeBtn: { position:'absolute', top:-6, right:-6, width:20, height:20, borderRadius:'50%', background:'#ff3b5c', border:'none', color:'#fff', fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 },
  error: { margin:'0 20px 16px', background:'#2a0f0f', color:'#ff6b6b', fontSize:13, padding:'10px 14px', borderRadius:10 },
  submitBtn: { display:'block', width:'calc(100% - 40px)', margin:'0 20px', padding:15, background:'#ff3b5c', color:'#fff', border:'none', borderRadius:14, fontSize:15, fontWeight:600, cursor:'pointer' }
}
