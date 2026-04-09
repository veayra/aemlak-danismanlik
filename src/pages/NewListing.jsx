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
    const { data: listing, error: err } = await supabase.from('listings')
      .insert({ ...form, price: form.price || null, user_id: user.id }).select().single()
    if (err) { setError('Hata: ' + err.message); setLoading(false); return }
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
      <div style={s.topHeader}>
        <button onClick={() => navigate('/')} style={s.backBtn}>
          <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 style={s.title}>Yeni İlan</h1>
        <div style={{width:32}}/>
      </div>

      <form onSubmit={handleSubmit} style={s.form}>
        <div style={s.section}>
          <label style={s.label}>İlan Başlığı</label>
          <input style={s.input} value={form.title} onChange={set('title')} required placeholder="Örn: 3+1 Daire, Kadıköy" />
        </div>

        <div style={s.section}>
          <label style={s.label}>İlan Tipi</label>
          <div style={s.typeGrid}>
            {[['ev','🏠','Konut'],['isyeri','🏢','İş Yeri'],['arsa','🌱','Arsa']].map(([val,icon,lbl]) => (
              <button key={val} type="button" onClick={() => setForm(f=>({...f,type:val}))}
                style={form.type===val ? {...s.typeBtn, ...s.typeBtnActive} : s.typeBtn}>
                <span style={{fontSize:20}}>{icon}</span>
                <span style={{fontSize:12,fontWeight:500}}>{lbl}</span>
              </button>
            ))}
          </div>
        </div>

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

        <div style={s.section}>
          <label style={s.label}>Fiyat (₺)</label>
          <input style={s.input} type="number" value={form.price} onChange={set('price')} placeholder="2.500.000" />
        </div>

        <div style={s.section}>
          <label style={s.label}>Açıklama</label>
          <textarea style={{...s.input, height:100, resize:'vertical'}} value={form.description} onChange={set('description')} placeholder="Mülk hakkında detaylar..." />
        </div>

        <div style={s.section}>
          <label style={s.label}>Fotoğraflar</label>
          <label style={s.uploadArea}>
            <input type="file" accept="image/*" multiple onChange={handlePhotos} style={{display:'none'}} />
            <svg width="28" height="28" fill="none" stroke="#444" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <span style={{fontSize:13,color:'#555',marginTop:6}}>Fotoğraf ekle (max 8)</span>
          </label>
          {previews.length > 0 && (
            <div style={s.previews}>
              {previews.map((p,i) => <img key={i} src={p} alt="" style={s.preview} />)}
            </div>
          )}
        </div>

        {error && <div style={s.error}>{error}</div>}

        <button type="submit" style={s.submitBtn} disabled={loading}>
          {loading ? 'Yükleniyor...' : 'İlanı Yayınla'}
        </button>
      </form>
    </div>
  )
}

const s = {
  page: { maxWidth:680, margin:'0 auto', padding:'0 0 80px' },
  topHeader: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 16px', borderBottom:'1px solid #1a1a1a', marginBottom:8 },
  backBtn: { width:36, height:36, borderRadius:10, background:'#1c1c1c', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' },
  title: { fontSize:16, fontWeight:600, color:'#fff' },
  form: { padding:'0 16px' },
  section: { marginBottom:20 },
  row: { display:'flex', gap:12, marginBottom:20 },
  label: { display:'block', fontSize:11, color:'#555', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.8px', fontWeight:500 },
  input: { width:'100%', padding:'13px 16px', background:'#141414', border:'1px solid #222', borderRadius:12, fontSize:15, color:'#fff', outline:'none', fontFamily:'inherit' },
  typeGrid: { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 },
  typeBtn: { display:'flex', flexDirection:'column', alignItems:'center', gap:6, padding:'14px 8px', background:'#141414', border:'1px solid #222', borderRadius:12, cursor:'pointer', color:'#888' },
  typeBtnActive: { background:'#1a1020', border:'1px solid #ff3b5c', color:'#fff' },
  uploadArea: { display:'flex', flexDirection:'column', alignItems:'center', gap:4, border:'1px dashed #2a2a2a', borderRadius:12, padding:24, cursor:'pointer' },
  previews: { display:'flex', gap:8, marginTop:10, flexWrap:'wrap' },
  preview: { width:72, height:72, objectFit:'cover', borderRadius:9, border:'1px solid #222' },
  error: { background:'#2a0f0f', color:'#ff6b6b', fontSize:13, padding:'10px 14px', borderRadius:10, marginBottom:16 },
  submitBtn: { width:'100%', padding:16, background:'linear-gradient(135deg,#ff3b5c,#ff6b35)', color:'#fff', border:'none', borderRadius:14, fontSize:15, fontWeight:600, cursor:'pointer' }
}
