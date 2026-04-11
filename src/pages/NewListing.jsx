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
    setPhotos(files); setPreviews(files.map(f => URL.createObjectURL(f)))
  }
  const handleVideos = (e) => setVideos(Array.from(e.target.files).filter(f => f.type.startsWith('video/')).slice(0, 2))
  const removePhoto = (i) => { setPhotos(p=>p.filter((_,idx)=>idx!==i)); setPreviews(p=>p.filter((_,idx)=>idx!==i)) }

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    const finalForm = { ...form, title:toTitle(form.title), district:toTitle(form.district), price:priceRaw||null, user_id:user.id }
    const { data:listing, error:err } = await supabase.from('listings').insert(finalForm).select().single()
    if (err) { setError('Hata: '+err.message); setLoading(false); return }
    for (const photo of photos) {
      const ext = photo.name.split('.').pop()
      const path = `${listing.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error:upErr } = await supabase.storage.from('listing-photos').upload(path, photo)
      if (!upErr) {
        const { data:{publicUrl} } = supabase.storage.from('listing-photos').getPublicUrl(path)
        await supabase.from('listing_photos').insert({ listing_id:listing.id, url:publicUrl })
      }
    }
    for (const video of videos) {
      const ext = video.name.split('.').pop()
      const path = `${listing.id}/video_${Date.now()}.${ext}`
      const { error:upErr } = await supabase.storage.from('listing-photos').upload(path, video)
      if (!upErr) {
        const { data:{publicUrl} } = supabase.storage.from('listing-photos').getPublicUrl(path)
        await supabase.from('listing_photos').insert({ listing_id:listing.id, url:publicUrl })
      }
    }
    navigate('/')
  }

  const expireDate = new Date(Date.now() + EXPIRE_DAYS*24*60*60*1000).toLocaleDateString('tr-TR')

  return (
    <div style={s.outer}>
      <div style={s.page}>
        {/* Header */}
        <div style={s.header}>
          <button onClick={() => navigate('/')} style={s.backBtn}>
            <svg width="18" height="18" fill="none" stroke="#555" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
            Geri
          </button>
          <div>
            <h1 style={s.pageTitle}>Yeni İlan Ekle</h1>
            <p style={s.pageSub}>Bilgileri doldurun ve ilanı yayınlayın</p>
          </div>
        </div>

        <div style={s.expireInfo}>
          <svg width="15" height="15" fill="none" stroke="#d4800a" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>İlanınız <strong>{expireDate}</strong> tarihine kadar ({EXPIRE_DAYS} gün) yayında kalır. Süre sonunda otomatik kaldırılır.</span>
        </div>

        <div style={s.formGrid}>
          {/* Sol kolon */}
          <div style={s.col}>
            <div style={s.card}>
              <h3 style={s.cardTitle}>İlan Bilgileri</h3>

              <div style={s.field}>
                <label style={s.label}>İlan Tipi</label>
                <div style={s.typeGrid}>
                  {[['ev','🏠','Konut'],['isyeri','🏢','İş Yeri'],['arsa','🌱','Arsa']].map(([val,icon,lbl]) => (
                    <button key={val} type="button" onClick={() => setForm(f=>({...f,type:val}))}
                      style={form.type===val ? {...s.typeBtn,...s.typeBtnA} : s.typeBtn}>
                      <span style={{fontSize:24}}>{icon}</span>
                      <span style={{fontSize:13,fontWeight:600}}>{lbl}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>İlan Başlığı *</label>
                <input style={s.input} value={form.title} onChange={handleTitle} onBlur={handleTitleBlur} required placeholder="Örn: 3+1 Satılık Daire" />
                <p style={s.hint}>Büyük/küçük harf otomatik düzenlenir</p>
              </div>

              <div style={s.field}>
                <label style={s.label}>Açıklama</label>
                <textarea style={{...s.input, minHeight:120, resize:'vertical', lineHeight:1.6}} value={form.description} onChange={set('description')} placeholder="Mülk hakkında detaylar, özellikler, ulaşım bilgisi..." />
              </div>
            </div>
          </div>

          {/* Sağ kolon */}
          <div style={s.col}>
            <div style={s.card}>
              <h3 style={s.cardTitle}>Konum & Fiyat</h3>

              <div style={s.field}>
                <label style={s.label}>Şehir</label>
                <select style={s.input} value={form.city} onChange={set('city')}>
                  <option value="">Şehir seçin</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div style={s.field}>
                <label style={s.label}>İlçe / Mahalle / Köy</label>
                <input style={s.input} value={districtInput} onChange={handleDistrict} onBlur={handleDistrictBlur} placeholder="Kadıköy, Sarayönü..." />
              </div>

              <div style={s.field}>
                <label style={s.label}>Fiyat (₺)</label>
                <div style={{position:'relative'}}>
                  <input style={{...s.input, paddingRight:40}} value={priceDisplay} onChange={handlePrice} placeholder="2.500.000" inputMode="numeric" />
                  <span style={{position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', color:'#ccc', fontSize:16, pointerEvents:'none'}}>₺</span>
                </div>
              </div>
            </div>

            <div style={{...s.card, marginTop:16}}>
              <h3 style={s.cardTitle}>Fotoğraf & Video</h3>
              <p style={s.hint}>Cep telefonu fotoğrafları desteklenir — max 8 fotoğraf, 2 video</p>

              <div style={s.field}>
                <label style={s.uploadArea}>
                  <input type="file" accept="image/*" multiple onChange={handlePhotos} style={{display:'none'}} />
                  <svg width="28" height="28" fill="none" stroke="#ccc" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  <span style={{fontSize:14, color:'#bbb', marginTop:8, fontWeight:500}}>{photos.length > 0 ? `${photos.length} fotoğraf seçildi` : 'Fotoğraf seç veya sürükle bırak'}</span>
                  <span style={{fontSize:12, color:'#ddd'}}>JPG, PNG, HEIC</span>
                </label>
                {previews.length > 0 && (
                  <div style={{display:'flex', gap:8, marginTop:12, flexWrap:'wrap'}}>
                    {previews.map((p,i) => (
                      <div key={i} style={{position:'relative'}}>
                        <img src={p} alt="" style={{width:80, height:80, objectFit:'cover', borderRadius:10, display:'block', border:'1px solid #ece9e4'}} />
                        <button type="button" onClick={() => removePhoto(i)} style={{position:'absolute', top:-6, right:-6, width:22, height:22, borderRadius:'50%', background:'#c8410a', border:'none', color:'#fff', fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={s.field}>
                <label style={s.uploadArea}>
                  <input type="file" accept="video/*" multiple onChange={handleVideos} style={{display:'none'}} />
                  <svg width="24" height="24" fill="none" stroke="#ccc" strokeWidth="1.5" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                  <span style={{fontSize:14, color:'#bbb', marginTop:8, fontWeight:500}}>{videos.length > 0 ? `${videos.length} video seçildi` : 'Video ekle (opsiyonel)'}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {error && <div style={s.error}>{error}</div>}

        <div style={s.submitRow}>
          <button type="button" onClick={() => navigate('/')} style={s.cancelBtn}>İptal</button>
          <button onClick={handleSubmit} style={s.submitBtn} disabled={loading}>
            {loading ? 'Yükleniyor...' : '✓ İlanı Yayınla'}
          </button>
        </div>
      </div>
    </div>
  )
}

const s = {
  outer: { background:'#f5f4f0', minHeight:'100vh' },
  page: { maxWidth:1100, margin:'0 auto', padding:'32px 40px 80px' },
  header: { display:'flex', alignItems:'center', gap:20, marginBottom:24 },
  backBtn: { display:'flex', alignItems:'center', gap:6, background:'#fff', border:'1px solid #e0ddd8', borderRadius:10, padding:'9px 16px', cursor:'pointer', fontSize:14, color:'#555', fontWeight:500, flexShrink:0 },
  pageTitle: { fontSize:22, fontWeight:700, color:'#1a1a1a', marginBottom:2 },
  pageSub: { fontSize:13, color:'#bbb' },
  expireInfo: { display:'flex', alignItems:'flex-start', gap:10, background:'#fffbf0', border:'1px solid #fde8b0', borderRadius:12, padding:'14px 18px', marginBottom:24, fontSize:14, color:'#d4800a', lineHeight:1.5 },
  formGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 },
  col: { display:'flex', flexDirection:'column' },
  card: { background:'#fff', border:'1px solid #ece9e4', borderRadius:14, padding:'24px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)', flex:1 },
  cardTitle: { fontSize:15, fontWeight:700, color:'#1a1a1a', marginBottom:20, paddingBottom:14, borderBottom:'1px solid #f5f4f0' },
  field: { marginBottom:18 },
  label: { display:'block', fontSize:12, color:'#888', marginBottom:8, fontWeight:600, letterSpacing:'0.3px' },
  hint: { fontSize:11, color:'#ccc', marginTop:5 },
  input: { width:'100%', padding:'12px 16px', background:'#f9f8f6', border:'1.5px solid #e8e5e0', borderRadius:10, fontSize:15, color:'#1a1a1a', outline:'none', fontFamily:'inherit' },
  typeGrid: { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 },
  typeBtn: { display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:'16px 8px', background:'#f9f8f6', border:'1.5px solid #e8e5e0', borderRadius:12, cursor:'pointer', color:'#888' },
  typeBtnA: { background:'#fef0ed', border:'2px solid #c8410a', color:'#c8410a' },
  uploadArea: { display:'flex', flexDirection:'column', alignItems:'center', gap:2, border:'2px dashed #e0ddd8', borderRadius:12, padding:'24px 16px', cursor:'pointer', background:'#fafaf9' },
  error: { background:'#fef0ed', color:'#c8410a', fontSize:14, padding:'14px 18px', borderRadius:12, marginBottom:20, border:'1px solid #fbd5c8' },
  submitRow: { display:'flex', justifyContent:'flex-end', gap:12 },
  cancelBtn: { padding:'12px 24px', border:'1.5px solid #e0ddd8', borderRadius:10, background:'#fff', cursor:'pointer', fontSize:14, color:'#888', fontWeight:500 },
  submitBtn: { padding:'12px 32px', border:'none', borderRadius:10, background:'#c8410a', color:'#fff', fontWeight:600, cursor:'pointer', fontSize:15, boxShadow:'0 2px 8px rgba(200,65,10,0.25)' }
}
