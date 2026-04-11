import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'
import { CITIES } from '../lib/cities'

const EXPIRE_DAYS = 60

function toTitle(str) {
  if (!str) return ''
  return str.split(' ').map(w => w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : '').join(' ')
}

export default function NewListing() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ title:'', description:'', type:'ev', price:'', city:'', district:'' })
  const [priceDisplay, setPriceDisplay] = useState('')
  const [priceRaw, setPriceRaw] = useState('')
  const [districtInput, setDistrictInput] = useState('')
  const [photos, setPhotos] = useState([])
  const [videos, setVideos] = useState([])
  const [previews, setPreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleTitle = (e) => setForm(f => ({ ...f, title: e.target.value }))
  const handleTitleBlur = () => setForm(f => ({ ...f, title: toTitle(f.title) }))
  const handleDistrict = (e) => { setDistrictInput(e.target.value); setForm(f => ({ ...f, district: e.target.value })) }
  const handleDistrictBlur = () => { const t = toTitle(districtInput); setDistrictInput(t); setForm(f => ({ ...f, district: t })) }

  const handlePrice = (e) => {
    const raw = e.target.value.replace(/\D/g, '')
    setPriceRaw(raw)
    setPriceDisplay(raw ? Number(raw).toLocaleString('tr-TR') : '')
    setForm(f => ({ ...f, price: raw }))
  }

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/')).slice(0, 8)
    setPhotos(files)
    setPreviews(files.map(f => URL.createObjectURL(f)))
  }

  const handleVideos = (e) => {
    const files = Array.from(e.target.files).filter(f => f.type.startsWith('video/')).slice(0, 2)
    setVideos(files)
  }

  const removePhoto = (i) => {
    setPhotos(p => p.filter((_,idx) => idx!==i))
    setPreviews(p => p.filter((_,idx) => idx!==i))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const finalForm = { ...form, title: toTitle(form.title), district: toTitle(form.district), price: priceRaw || null, user_id: user.id }
    const { data: listing, error: err } = await supabase.from('listings').insert(finalForm).select().single()
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
    for (const video of videos) {
      const ext = video.name.split('.').pop()
      const path = `${listing.id}/video_${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('listing-photos').upload(path, video)
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from('listing-photos').getPublicUrl(path)
        await supabase.from('listing_photos').insert({ listing_id: listing.id, url: publicUrl })
      }
    }
    navigate('/')
  }

  const expireDate = new Date(Date.now() + EXPIRE_DAYS * 24*60*60*1000).toLocaleDateString('tr-TR')

  return (
    <div style={s.outer}>
      <div style={s.page}>
        <div style={s.topHeader}>
          <button onClick={() => navigate('/')} style={s.backBtn}>
            <svg width="18" height="18" fill="none" stroke="#1a1a1a" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h1 style={s.title}>Yeni İlan Ekle</h1>
          <div style={{width:36}}/>
        </div>

        <div style={s.expireInfo}>
          <svg width="14" height="14" fill="none" stroke="#d4800a" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>İlanınız <strong>{expireDate}</strong> tarihine kadar ({EXPIRE_DAYS} gün) yayında kalır.</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={s.section}>
            <label style={s.label}>İlan Tipi</label>
            <div style={s.typeGrid}>
              {[['ev','🏠','Konut'],['isyeri','🏢','İş Yeri'],['arsa','🌱','Arsa']].map(([val,icon,lbl]) => (
                <button key={val} type="button" onClick={() => setForm(f=>({...f,type:val}))}
                  style={form.type===val ? {...s.typeBtn,...s.typeBtnActive} : s.typeBtn}>
                  <span style={{fontSize:24}}>{icon}</span>
                  <span style={{fontSize:13,fontWeight:600}}>{lbl}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={s.section}>
            <label style={s.label}>İlan Başlığı *</label>
            <input style={s.input} value={form.title} onChange={handleTitle} onBlur={handleTitleBlur} required placeholder="Örn: 3+1 Satılık Daire" />
            <p style={s.hint}>Büyük/küçük harf otomatik düzenlenir</p>
          </div>

          <div style={s.section}>
            <label style={s.label}>Şehir</label>
            <select style={s.input} value={form.city} onChange={set('city')}>
              <option value="">Şehir seçin</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={s.section}>
            <label style={s.label}>İlçe / Mahalle / Köy</label>
            <input style={s.input} value={districtInput} onChange={handleDistrict} onBlur={handleDistrictBlur} placeholder="Kadıköy, Sarayönü..." />
          </div>

          <div style={s.section}>
            <label style={s.label}>Fiyat</label>
            <div style={s.priceWrap}>
              <input style={{...s.input, paddingRight:36}} value={priceDisplay} onChange={handlePrice} placeholder="2.500.000" inputMode="numeric" />
              <span style={s.priceSuffix}>₺</span>
            </div>
          </div>

          <div style={s.section}>
            <label style={s.label}>Açıklama</label>
            <textarea style={s.textarea} value={form.description} onChange={set('description')} placeholder="Mülk hakkında detaylar, özellikler, ulaşım..." />
          </div>

          <div style={s.section}>
            <label style={s.label}>Fotoğraflar (max 8)</label>
            <p style={s.hint}>Cep telefonu fotoğrafları desteklenir</p>
            <label style={s.uploadArea}>
              <input type="file" accept="image/*" multiple onChange={handlePhotos} style={{display:'none'}} />
              <svg width="28" height="28" fill="none" stroke="#bbb" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <span style={{fontSize:13,color:'#aaa',marginTop:6}}>{photos.length > 0 ? `${photos.length} fotoğraf seçildi` : 'Fotoğraf seç veya sürükle bırak'}</span>
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

          <div style={s.section}>
            <label style={s.label}>Video (opsiyonel, max 2)</label>
            <label style={s.uploadArea}>
              <input type="file" accept="video/*" multiple onChange={handleVideos} style={{display:'none'}} />
              <svg width="28" height="28" fill="none" stroke="#bbb" strokeWidth="1.5" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
              <span style={{fontSize:13,color:'#aaa',marginTop:6}}>{videos.length > 0 ? `${videos.length} video seçildi` : 'Video seç (opsiyonel)'}</span>
            </label>
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
  outer: { background:'#f5f4f0', minHeight:'100vh' },
  page: { maxWidth:680, margin:'0 auto', padding:'0 0 80px' },
  topHeader: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', background:'#fff', borderBottom:'1px solid #ece9e4', marginBottom:8 },
  backBtn: { width:36, height:36, borderRadius:10, background:'#f5f4f0', border:'1px solid #e0ddd8', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 },
  title: { fontSize:16, fontWeight:700, color:'#1a1a1a' },
  expireInfo: { display:'flex', alignItems:'flex-start', gap:8, background:'#fffbf0', border:'1px solid #fde8b0', borderRadius:12, padding:'12px 16px', margin:'0 20px 16px', fontSize:13, color:'#d4800a', lineHeight:1.5 },
  section: { marginBottom:20, padding:'0 20px' },
  label: { display:'block', fontSize:11, color:'#888', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.8px', fontWeight:700 },
  hint: { fontSize:11, color:'#bbb', marginTop:5 },
  input: { width:'100%', padding:'13px 16px', background:'#fff', border:'1px solid #e0ddd8', borderRadius:12, fontSize:15, color:'#1a1a1a', outline:'none', fontFamily:'inherit', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' },
  typeGrid: { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 },
  typeBtn: { display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:'18px 8px', background:'#fff', border:'1px solid #e0ddd8', borderRadius:12, cursor:'pointer', color:'#888', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' },
  typeBtnActive: { background:'#fef0ed', border:'2px solid #c8410a', color:'#c8410a' },
  priceWrap: { position:'relative' },
  priceSuffix: { position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', color:'#bbb', fontSize:16, pointerEvents:'none' },
  textarea: { width:'100%', padding:'13px 16px', background:'#fff', border:'1px solid #e0ddd8', borderRadius:12, fontSize:15, color:'#1a1a1a', resize:'vertical', fontFamily:'inherit', outline:'none', minHeight:110, lineHeight:1.6, boxShadow:'0 1px 3px rgba(0,0,0,0.04)' },
  uploadArea: { display:'flex', flexDirection:'column', alignItems:'center', gap:4, border:'2px dashed #e0ddd8', borderRadius:12, padding:'24px 16px', cursor:'pointer', marginTop:8, background:'#fff' },
  previews: { display:'flex', gap:8, marginTop:10, flexWrap:'wrap' },
  previewWrap: { position:'relative' },
  preview: { width:90, height:90, objectFit:'cover', borderRadius:10, display:'block', border:'1px solid #e0ddd8' },
  removeBtn: { position:'absolute', top:-6, right:-6, width:22, height:22, borderRadius:'50%', background:'#c8410a', border:'none', color:'#fff', fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' },
  error: { margin:'0 20px 16px', background:'#fef0ed', color:'#c8410a', fontSize:13, padding:'10px 14px', borderRadius:10, border:'1px solid #fbd5c8' },
  submitBtn: { display:'block', width:'calc(100% - 40px)', margin:'0 20px', padding:15, background:'#c8410a', color:'#fff', border:'none', borderRadius:14, fontSize:15, fontWeight:600, cursor:'pointer' }
}
