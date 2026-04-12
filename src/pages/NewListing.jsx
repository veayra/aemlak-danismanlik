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
    <>
      <style>{`
        .nl-outer { background: #f5f4f0; min-height: 100vh; }
        .nl-page { max-width: 640px; margin: 0 auto; padding: 0 0 100px; }

        .nl-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: #fff; border-bottom: 1px solid #ece9e4; margin-bottom: 12px; }
        .nl-back { display: flex; align-items: center; gap: 6px; background: #f5f4f0; border: 1px solid #e0ddd8; border-radius: 9px; padding: 8px 14px; cursor: pointer; font-size: 14px; color: #555; font-weight: 500; }
        .nl-htitle { font-size: 16px; font-weight: 700; color: #1a1a1a; }
        .nl-hsub { font-size: 11px; color: #bbb; margin-top: 1px; }

        .nl-expire { display: flex; align-items: flex-start; gap: 8px; background: #fffbf0; border: 1px solid #fde8b0; border-radius: 12px; padding: 12px 15px; margin: 0 16px 16px; font-size: 13px; color: #d4800a; line-height: 1.5; }

        .nl-section { background: #fff; border-top: 1px solid #ece9e4; border-bottom: 1px solid #ece9e4; padding: 16px; margin-bottom: 10px; }
        .nl-section-title { font-size: 13px; font-weight: 700; color: #1a1a1a; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.5px; }

        .nl-field { margin-bottom: 16px; }
        .nl-field:last-child { margin-bottom: 0; }
        .nl-label { display: block; font-size: 11px; color: #888; margin-bottom: 7px; font-weight: 600; letter-spacing: 0.4px; text-transform: uppercase; }
        .nl-hint { font-size: 11px; color: #ccc; margin-top: 4px; }
        .nl-input { width: 100%; padding: 13px 16px; background: #f9f8f6; border: 1.5px solid #e8e5e0; border-radius: 11px; font-size: 15px; color: #1a1a1a; outline: none; font-family: inherit; box-sizing: border-box; }
        .nl-input:focus { border-color: #c8410a; background: #fff; }
        select.nl-input { appearance: auto; }

        .nl-type-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
        .nl-type-btn { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 14px 8px; background: #f9f8f6; border: 1.5px solid #e8e5e0; border-radius: 11px; cursor: pointer; color: #888; }
        .nl-type-btn.active { background: #fef0ed; border-color: #c8410a; color: #c8410a; }
        .nl-type-icon { font-size: 22px; }
        .nl-type-lbl { font-size: 12px; font-weight: 600; }

        .nl-price-wrap { position: relative; }
        .nl-price-sfx { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); color: #bbb; font-size: 16px; pointer-events: none; }

        .nl-upload { display: flex; flex-direction: column; align-items: center; gap: 6px; border: 2px dashed #e0ddd8; border-radius: 12px; padding: 20px 16px; cursor: pointer; background: #fafaf9; width: 100%; box-sizing: border-box; }
        .nl-upload-txt { font-size: 13px; color: #bbb; font-weight: 500; }
        .nl-upload-sub { font-size: 11px; color: #ddd; }
        .nl-previews { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
        .nl-prev-wrap { position: relative; }
        .nl-prev-img { width: 80px; height: 80px; object-fit: cover; border-radius: 9px; display: block; border: 1px solid #ece9e4; }
        .nl-prev-rm { position: absolute; top: -6px; right: -6px; width: 22px; height: 22px; border-radius: 50%; background: #c8410a; border: none; color: #fff; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; }

        .nl-error { margin: 0 16px 12px; background: #fef0ed; color: #c8410a; font-size: 13px; padding: 12px 15px; border-radius: 11px; border: 1px solid #fbd5c8; }

        .nl-submit-bar { position: fixed; bottom: 62px; left: 0; right: 0; background: #fff; border-top: 1px solid #ece9e4; padding: 12px 16px; display: flex; gap: 10px; z-index: 50; }
        .nl-cancel { flex: 0 0 80px; padding: 13px; border: 1.5px solid #e0ddd8; border-radius: 11px; background: #fff; cursor: pointer; font-size: 14px; color: #888; font-weight: 500; }
        .nl-submit { flex: 1; padding: 13px; border: none; border-radius: 11px; background: #c8410a; color: #fff; font-weight: 700; cursor: pointer; font-size: 15px; box-shadow: 0 2px 8px rgba(200,65,10,0.3); }

        /* PC: 2 kolon */
        @media(min-width: 768px) {
          .nl-page { max-width: 1100px; padding: 32px 40px 80px; }
          .nl-header { background: transparent; border: none; padding: 0 0 20px 0; margin-bottom: 0; }
          .nl-expire { margin: 0 0 20px; }
          .nl-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .nl-section { border-radius: 14px; border: 1px solid #ece9e4; margin-bottom: 0; }
          .nl-submit-bar { position: static; border: none; padding: 20px 0 0; background: transparent; justify-content: flex-end; }
          .nl-cancel { flex: 0 0 auto; }
          .nl-submit { flex: 0 0 auto; padding: 13px 32px; }
        }
      `}</style>

      <div className="nl-outer">
        <div className="nl-page">
          <div className="nl-header">
            <button onClick={() => navigate('/')} className="nl-back">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
              Geri
            </button>
            <div style={{textAlign:'center'}}>
              <div className="nl-htitle">Yeni İlan Ekle</div>
              <div className="nl-hsub">Bilgileri doldurun ve yayınlayın</div>
            </div>
            <div style={{width:80}}/>
          </div>

          <div className="nl-expire">
            <svg width="15" height="15" fill="none" stroke="#d4800a" strokeWidth="2" viewBox="0 0 24 24" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>İlanınız <strong>{expireDate}</strong> tarihine kadar ({EXPIRE_DAYS} gün) yayında kalır. Süre sonunda otomatik silinir.</span>
          </div>

          <div className="nl-form-grid">
            {/* Sol / İlan bilgileri */}
            <div className="nl-section">
              <div className="nl-section-title">İlan Bilgileri</div>

              <div className="nl-field">
                <label className="nl-label">İlan Tipi</label>
                <div className="nl-type-grid">
                  {[['ev','🏠','Konut'],['isyeri','🏢','İş Yeri'],['arsa','🌱','Arsa']].map(([val,icon,lbl]) => (
                    <button key={val} type="button" onClick={() => setForm(f=>({...f,type:val}))}
                      className={`nl-type-btn${form.type===val?' active':''}`}>
                      <span className="nl-type-icon">{icon}</span>
                      <span className="nl-type-lbl">{lbl}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="nl-field">
                <label className="nl-label">İlan Başlığı *</label>
                <input className="nl-input" value={form.title} onChange={handleTitle} onBlur={handleTitleBlur} required placeholder="Örn: 3+1 Satılık Daire" />
                <p className="nl-hint">Büyük/küçük harf otomatik düzenlenir</p>
              </div>

              <div className="nl-field">
                <label className="nl-label">Açıklama</label>
                <textarea className="nl-input" style={{minHeight:100,resize:'vertical',lineHeight:1.6}}
                  value={form.description} onChange={set('description')}
                  placeholder="Mülk hakkında detaylar, özellikler, ulaşım..." />
              </div>
            </div>

            {/* Sağ — konum, fiyat, medya */}
            <div>
              <div className="nl-section" style={{marginBottom:10}}>
                <div className="nl-section-title">Konum & Fiyat</div>

                <div className="nl-field">
                  <label className="nl-label">Şehir</label>
                  <select className="nl-input" value={form.city} onChange={set('city')}>
                    <option value="">Şehir seçin</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="nl-field">
                  <label className="nl-label">İlçe / Mahalle / Köy</label>
                  <input className="nl-input" value={districtInput} onChange={handleDistrict} onBlur={handleDistrictBlur} placeholder="Meram, Selçuklu..." />
                </div>

                <div className="nl-field">
                  <label className="nl-label">Fiyat</label>
                  <div className="nl-price-wrap">
                    <input className="nl-input" style={{paddingRight:36}} value={priceDisplay} onChange={handlePrice} placeholder="2.500.000" inputMode="numeric" />
                    <span className="nl-price-sfx">₺</span>
                  </div>
                </div>
              </div>

              <div className="nl-section">
                <div className="nl-section-title">Fotoğraf & Video</div>

                <div className="nl-field">
                  <label className="nl-label">Fotoğraflar (max 8)</label>
                  <p className="nl-hint" style={{marginBottom:8}}>Cep telefonu fotoğrafları desteklenir</p>
                  <label className="nl-upload">
                    <input type="file" accept="image/*" multiple onChange={handlePhotos} style={{display:'none'}} />
                    <svg width="28" height="28" fill="none" stroke="#ccc" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    <span className="nl-upload-txt">{photos.length > 0 ? `${photos.length} fotoğraf seçildi` : 'Fotoğraf seç veya sürükle bırak'}</span>
                    <span className="nl-upload-sub">JPG, PNG, HEIC</span>
                  </label>
                  {previews.length > 0 && (
                    <div className="nl-previews">
                      {previews.map((p,i) => (
                        <div key={i} className="nl-prev-wrap">
                          <img src={p} alt="" className="nl-prev-img" />
                          <button type="button" onClick={() => removePhoto(i)} className="nl-prev-rm">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="nl-field">
                  <label className="nl-label">Video (opsiyonel, max 2)</label>
                  <label className="nl-upload">
                    <input type="file" accept="video/*" multiple onChange={handleVideos} style={{display:'none'}} />
                    <svg width="26" height="26" fill="none" stroke="#ccc" strokeWidth="1.5" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                    <span className="nl-upload-txt">{videos.length > 0 ? `${videos.length} video seçildi` : 'Video ekle (opsiyonel)'}</span>
                    <span className="nl-upload-sub">MP4, MOV</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {error && <div className="nl-error">{error}</div>}

          <div className="nl-submit-bar">
            <button type="button" onClick={() => navigate('/')} className="nl-cancel">İptal</button>
            <button onClick={handleSubmit} className="nl-submit" disabled={loading}>
              {loading ? 'Yükleniyor...' : '✓ İlanı Yayınla'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
