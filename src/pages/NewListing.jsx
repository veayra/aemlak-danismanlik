import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'
import { CITIES } from '../lib/cities'

const EXPIRE_DAYS = 90

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
    setPriceRaw(raw); setPriceDisplay(raw ? Number(raw).toLocaleString('tr-TR') : ''); setForm(f => ({ ...f, price: raw }))
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
    <>
      <style>{`
        .nl { background:#f5f4f0; min-height:100vh; }
        .nl-page { max-width:640px; margin:0 auto; padding:0 0 100px; }
        .nl-hdr { display:flex; align-items:center; justify-content:space-between; padding:14px 16px; background:#fff; border-bottom:1px solid #ece9e4; margin-bottom:12px; }
        .nl-back { display:flex; align-items:center; gap:6px; background:#f5f4f0; border:1px solid #e0ddd8; border-radius:9px; padding:8px 14px; cursor:pointer; font-size:14px; color:#555; font-weight:500; }
        .nl-ht { font-size:16px; font-weight:700; color:#1a1a1a; }
        .nl-hs { font-size:11px; color:#bbb; margin-top:1px; }
        .nl-exp { display:flex; align-items:flex-start; gap:8px; background:#fffbf0; border:1px solid #fde8b0; border-radius:12px; padding:12px 15px; margin:0 16px 16px; font-size:13px; color:#d4800a; line-height:1.5; }
        .nl-sec { background:#fff; border-top:1px solid #ece9e4; border-bottom:1px solid #ece9e4; padding:16px; margin-bottom:10px; }
        .nl-stitle { font-size:13px; font-weight:700; color:#1a1a1a; margin-bottom:14px; text-transform:uppercase; letter-spacing:0.5px; }
        .nl-field { margin-bottom:16px; }
        .nl-field:last-child { margin-bottom:0; }
        .nl-lbl { display:block; font-size:11px; color:#888; margin-bottom:7px; font-weight:600; letter-spacing:0.4px; text-transform:uppercase; }
        .nl-hint { font-size:11px; color:#ccc; margin-top:4px; }
        .nl-inp { width:100%; padding:13px 16px; background:#f9f8f6; border:1.5px solid #e8e5e0; border-radius:11px; font-size:15px; color:#1a1a1a; outline:none; font-family:inherit; box-sizing:border-box; }
        .nl-inp:focus { border-color:#c8410a; background:#fff; }
        select.nl-inp { appearance:auto; }
        .nl-tg { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; }
        .nl-tb { display:flex; flex-direction:column; align-items:center; gap:6px; padding:14px 8px; background:#f9f8f6; border:1.5px solid #e8e5e0; border-radius:11px; cursor:pointer; color:#888; }
        .nl-tb.on { background:#fef0ed; border-color:#c8410a; color:#c8410a; }
        .nl-pw { position:relative; }
        .nl-ps { position:absolute; right:14px; top:50%; transform:translateY(-50%); color:#bbb; font-size:16px; pointer-events:none; }
        .nl-up { display:flex; flex-direction:column; align-items:center; gap:6px; border:2px dashed #e0ddd8; border-radius:12px; padding:20px 16px; cursor:pointer; background:#fafaf9; width:100%; box-sizing:border-box; }
        .nl-prevs { display:flex; gap:8px; margin-top:10px; flex-wrap:wrap; }
        .nl-pw2 { position:relative; }
        .nl-pi { width:80px; height:80px; object-fit:cover; border-radius:9px; display:block; border:1px solid #ece9e4; }
        .nl-rm { position:absolute; top:-6px; right:-6px; width:22px; height:22px; border-radius:50%; background:#c8410a; border:none; color:#fff; font-size:14px; cursor:pointer; display:flex; align-items:center; justify-content:center; }
        .nl-err { margin:0 16px 12px; background:#fef0ed; color:#c8410a; font-size:13px; padding:12px 15px; border-radius:11px; border:1px solid #fbd5c8; }
        .nl-bar { position:fixed; bottom:62px; left:0; right:0; background:#fff; border-top:1px solid #ece9e4; padding:12px 16px; display:flex; gap:10px; z-index:50; }
        .nl-cancel { flex:0 0 80px; padding:13px; border:1.5px solid #e0ddd8; border-radius:11px; background:#fff; cursor:pointer; font-size:14px; color:#888; font-weight:500; }
        .nl-submit { flex:1; padding:13px; border:none; border-radius:11px; background:#c8410a; color:#fff; font-weight:700; cursor:pointer; font-size:15px; }
        @media(min-width:768px) {
          .nl-page { max-width:1100px; padding:32px 40px 80px; }
          .nl-hdr { background:transparent; border:none; padding:0 0 20px; margin-bottom:0; }
          .nl-exp { margin:0 0 20px; }
          .nl-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
          .nl-sec { border-radius:14px; border:1px solid #ece9e4; margin-bottom:0; }
          .nl-bar { position:static; border:none; padding:20px 0 0; background:transparent; justify-content:flex-end; }
          .nl-cancel { flex:0 0 auto; }
          .nl-submit { flex:0 0 auto; padding:13px 32px; }
        }
      `}</style>

      <div className="nl">
        <div className="nl-page">
          <div className="nl-hdr">
            <button onClick={() => navigate('/')} className="nl-back">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
              Geri
            </button>
            <div style={{textAlign:'center'}}>
              <div className="nl-ht">Yeni İlan Ekle</div>
              <div className="nl-hs">Bilgileri doldurun ve yayınlayın</div>
            </div>
            <div style={{width:80}}/>
          </div>

          <div className="nl-exp">
            <svg width="15" height="15" fill="none" stroke="#d4800a" strokeWidth="2" viewBox="0 0 24 24" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>İlanınız <strong>{expireDate}</strong> tarihine kadar ({EXPIRE_DAYS} gün) yayında kalır. Süre sonunda otomatik silinir.</span>
          </div>

          <div className="nl-grid">
            <div className="nl-sec">
              <div className="nl-stitle">İlan Bilgileri</div>
              <div className="nl-field">
                <label className="nl-lbl">İlan Tipi</label>
                <div className="nl-tg">
                  {[['ev','🏠','Konut'],['isyeri','🏢','İş Yeri'],['arsa','🌱','Arsa']].map(([val,icon,lbl]) => (
                    <button key={val} type="button" onClick={() => setForm(f=>({...f,type:val}))} className={`nl-tb${form.type===val?' on':''}`}>
                      <span style={{fontSize:22}}>{icon}</span><span style={{fontSize:12,fontWeight:600}}>{lbl}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="nl-field">
                <label className="nl-lbl">İlan Başlığı *</label>
                <input className="nl-inp" value={form.title} onChange={handleTitle} onBlur={handleTitleBlur} required placeholder="Örn: 3+1 Satılık Daire" />
                <p className="nl-hint">Büyük/küçük harf otomatik düzenlenir</p>
              </div>
              <div className="nl-field">
                <label className="nl-lbl">Açıklama</label>
                <textarea className="nl-inp" style={{minHeight:100,resize:'vertical',lineHeight:1.6}} value={form.description} onChange={set('description')} placeholder="Mülk hakkında detaylar..." />
              </div>
            </div>

            <div>
              <div className="nl-sec" style={{marginBottom:10}}>
                <div className="nl-stitle">Konum & Fiyat</div>
                <div className="nl-field">
                  <label className="nl-lbl">Şehir</label>
                  <select className="nl-inp" value={form.city} onChange={set('city')}>
                    <option value="">Şehir seçin</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="nl-field">
                  <label className="nl-lbl">İlçe / Mahalle / Köy</label>
                  <input className="nl-inp" value={districtInput} onChange={handleDistrict} onBlur={handleDistrictBlur} placeholder="Meram, Selçuklu..." />
                </div>
                <div className="nl-field">
                  <label className="nl-lbl">Fiyat</label>
                  <div className="nl-pw">
                    <input className="nl-inp" style={{paddingRight:36}} value={priceDisplay} onChange={handlePrice} placeholder="2.500.000" inputMode="numeric" />
                    <span className="nl-ps">₺</span>
                  </div>
                </div>
              </div>
              <div className="nl-sec">
                <div className="nl-stitle">Fotoğraf & Video</div>
                <div className="nl-field">
                  <label className="nl-lbl">Fotoğraflar (max 8)</label>
                  <label className="nl-up">
                    <input type="file" accept="image/*" multiple onChange={handlePhotos} style={{display:'none'}} />
                    <svg width="28" height="28" fill="none" stroke="#ccc" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    <span style={{fontSize:13,color:'#bbb',fontWeight:500}}>{photos.length>0?`${photos.length} fotoğraf seçildi`:'Fotoğraf seç veya sürükle'}</span>
                    <span style={{fontSize:11,color:'#ddd'}}>JPG, PNG, HEIC</span>
                  </label>
                  {previews.length>0 && (
                    <div className="nl-prevs">
                      {previews.map((p,i)=>(
                        <div key={i} className="nl-pw2">
                          <img src={p} alt="" className="nl-pi" />
                          <button type="button" onClick={()=>removePhoto(i)} className="nl-rm">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="nl-field">
                  <label className="nl-lbl">Video (opsiyonel, max 2)</label>
                  <label className="nl-up">
                    <input type="file" accept="video/*" multiple onChange={handleVideos} style={{display:'none'}} />
                    <svg width="26" height="26" fill="none" stroke="#ccc" strokeWidth="1.5" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                    <span style={{fontSize:13,color:'#bbb',fontWeight:500}}>{videos.length>0?`${videos.length} video seçildi`:'Video ekle (opsiyonel)'}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {error && <div className="nl-err">{error}</div>}
          <div className="nl-bar">
            <button type="button" onClick={()=>navigate('/')} className="nl-cancel">İptal</button>
            <button onClick={handleSubmit} className="nl-submit" disabled={loading}>{loading?'Yükleniyor...':'✓ İlanı Yayınla'}</button>
          </div>
        </div>
      </div>
    </>
  )
}
