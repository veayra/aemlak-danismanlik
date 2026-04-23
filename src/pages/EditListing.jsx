import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'
import { CITIES } from '../lib/cities'

function toTitle(str) {
  if (!str) return ''
  return str.split(' ').map(w => w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : '').join(' ')
}

export default function EditListing() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ title:'', description:'', type:'ev', price:'', city:'', district:'' })
  const [priceDisplay, setPriceDisplay] = useState('')
  const [photos, setPhotos] = useState([])
  const [newPhotos, setNewPhotos] = useState([])
  const [newPreviews, setNewPreviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetch = async () => {
      const { data: listing } = await supabase.from('listings').select('*').eq('id', id).single()
      if (!listing) { navigate('/'); return }

      // Yetki kontrolü
      const isMaster = profile?.role === 'master_admin'
      const isOwner = listing.user_id === user.id
      if (!isMaster && !isOwner) { navigate('/'); return }

      setForm({
        title: listing.title || '',
        description: listing.description || '',
        type: listing.type || 'ev',
        price: listing.price || '',
        city: listing.city || '',
        district: listing.district || ''
      })
      if (listing.price) setPriceDisplay(Number(listing.price).toLocaleString('tr-TR'))

      const { data: ph } = await supabase.from('listing_photos').select('*').eq('listing_id', id)
      setPhotos(ph || [])
      setLoading(false)
    }
    fetch()
  }, [id])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handlePrice = (e) => {
    const raw = e.target.value.replace(/\D/g, '')
    setPriceDisplay(raw ? Number(raw).toLocaleString('tr-TR') : '')
    setForm(f => ({ ...f, price: raw }))
  }

  const handleNewPhotos = (e) => {
    const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/')).slice(0, 8 - photos.length)
    setNewPhotos(files)
    setNewPreviews(files.map(f => URL.createObjectURL(f)))
  }

  const removeExistingPhoto = async (photo) => {
    if (!confirm('Bu fotoğraf silinsin mi?')) return
    const path = photo.url.split('/listing-photos/')[1]
    if (path) await supabase.storage.from('listing-photos').remove([path])
    await supabase.from('listing_photos').delete().eq('id', photo.id)
    setPhotos(ps => ps.filter(p => p.id !== photo.id))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const { error: updateErr } = await supabase.from('listings').update({
      title: toTitle(form.title),
      description: form.description,
      type: form.type,
      price: form.price || null,
      city: form.city,
      district: toTitle(form.district)
    }).eq('id', id)

    if (updateErr) { setError('Hata: ' + updateErr.message); setSaving(false); return }

    // Yeni fotoğrafları yükle
    for (const photo of newPhotos) {
      const ext = photo.name.split('.').pop()
      const path = `${id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error: upErr } = await supabase.storage.from('listing-photos').upload(path, photo)
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from('listing-photos').getPublicUrl(path)
        await supabase.from('listing_photos').insert({ listing_id: id, url: publicUrl })
      }
    }

    navigate(`/ilan/${id}`)
  }

  if (loading) return <div style={{textAlign:'center',padding:80,color:'#aaa',background:'#f5f4f0',minHeight:'100vh'}}>Yükleniyor...</div>

  return (
    <>
      <style>{`
        .el { background:#f5f4f0; min-height:100vh; }
        .el-page { max-width:640px; margin:0 auto; padding:0 0 100px; }
        .el-hdr { display:flex; align-items:center; justify-content:space-between; padding:14px 16px; background:#fff; border-bottom:1px solid #ece9e4; margin-bottom:12px; }
        .el-back { display:flex; align-items:center; gap:6px; background:#f5f4f0; border:1px solid #e0ddd8; border-radius:9px; padding:8px 14px; cursor:pointer; font-size:14px; color:#555; font-weight:500; }
        .el-ht { font-size:16px; font-weight:700; color:#1a1a1a; }
        .el-sec { background:#fff; border-top:1px solid #ece9e4; border-bottom:1px solid #ece9e4; padding:16px; margin-bottom:10px; }
        .el-stitle { font-size:13px; font-weight:700; color:#1a1a1a; margin-bottom:14px; text-transform:uppercase; letter-spacing:0.5px; }
        .el-field { margin-bottom:16px; }
        .el-field:last-child { margin-bottom:0; }
        .el-lbl { display:block; font-size:11px; color:#888; margin-bottom:7px; font-weight:600; letter-spacing:0.4px; text-transform:uppercase; }
        .el-inp { width:100%; padding:13px 16px; background:#f9f8f6; border:1.5px solid #e8e5e0; border-radius:11px; font-size:15px; color:#1a1a1a; outline:none; font-family:inherit; box-sizing:border-box; }
        .el-inp:focus { border-color:#c8410a; background:#fff; }
        .el-tg { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; }
        .el-tb { display:flex; flex-direction:column; align-items:center; gap:6px; padding:14px 8px; background:#f9f8f6; border:1.5px solid #e8e5e0; border-radius:11px; cursor:pointer; color:#888; }
        .el-tb.on { background:#fef0ed; border-color:#c8410a; color:#c8410a; }
        .el-pw { position:relative; }
        .el-ps { position:absolute; right:14px; top:50%; transform:translateY(-50%); color:#bbb; font-size:16px; pointer-events:none; }
        .el-photos { display:flex; gap:8px; flex-wrap:wrap; margin-top:10px; }
        .el-photo { position:relative; }
        .el-photo img { width:80px; height:80px; object-fit:cover; border-radius:9px; display:block; border:1px solid #ece9e4; }
        .el-photo-rm { position:absolute; top:-6px; right:-6px; width:22px; height:22px; border-radius:50%; background:#c8410a; border:none; color:#fff; font-size:14px; cursor:pointer; display:flex; align-items:center; justify-content:center; }
        .el-upload { display:flex; flex-direction:column; align-items:center; gap:6px; border:2px dashed #e0ddd8; border-radius:12px; padding:18px; cursor:pointer; background:#fafaf9; width:100%; box-sizing:border-box; margin-top:10px; }
        .el-err { margin:0 16px 12px; background:#fef0ed; color:#c8410a; font-size:13px; padding:12px 15px; border-radius:11px; border:1px solid #fbd5c8; }
        .el-bar { position:fixed; bottom:62px; left:0; right:0; background:#fff; border-top:1px solid #ece9e4; padding:12px 16px; display:flex; gap:10px; z-index:50; }
        .el-cancel { flex:0 0 80px; padding:13px; border:1.5px solid #e0ddd8; border-radius:11px; background:#fff; cursor:pointer; font-size:14px; color:#888; }
        .el-save { flex:1; padding:13px; border:none; border-radius:11px; background:#c8410a; color:#fff; font-weight:700; cursor:pointer; font-size:15px; }
        @media(min-width:768px) {
          .el-page { max-width:900px; padding:32px 40px 80px; }
          .el-hdr { background:transparent; border:none; padding:0 0 20px; margin-bottom:0; }
          .el-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
          .el-sec { border-radius:14px; border:1px solid #ece9e4; margin-bottom:0; }
          .el-bar { position:static; border:none; padding:20px 0 0; background:transparent; justify-content:flex-end; }
          .el-cancel { flex:0 0 auto; }
          .el-save { flex:0 0 auto; padding:13px 32px; }
        }
      `}</style>

      <div className="el">
        <div className="el-page">
          <div className="el-hdr">
            <button onClick={() => navigate(`/ilan/${id}`)} className="el-back">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
              Geri
            </button>
            <div style={{textAlign:'center'}}>
              <div className="el-ht">İlanı Düzenle</div>
            </div>
            <div style={{width:70}}/>
          </div>

          <div className="el-grid">
            <div className="el-sec">
              <div className="el-stitle">İlan Bilgileri</div>

              <div className="el-field">
                <label className="el-lbl">İlan Tipi</label>
                <div className="el-tg">
                  {[['ev','🏠','Konut'],['isyeri','🏢','İş Yeri'],['arsa','🌱','Arsa']].map(([val,icon,lbl]) => (
                    <button key={val} type="button" onClick={() => setForm(f=>({...f,type:val}))}
                      className={`el-tb${form.type===val?' on':''}`}>
                      <span style={{fontSize:22}}>{icon}</span>
                      <span style={{fontSize:12,fontWeight:600}}>{lbl}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="el-field">
                <label className="el-lbl">İlan Başlığı</label>
                <input className="el-inp" value={form.title} onChange={set('title')} placeholder="Örn: 3+1 Satılık Daire" />
              </div>

              <div className="el-field">
                <label className="el-lbl">Açıklama</label>
                <textarea className="el-inp" style={{minHeight:100,resize:'vertical',lineHeight:1.6}}
                  value={form.description} onChange={set('description')} placeholder="Mülk hakkında detaylar..." />
              </div>
            </div>

            <div>
              <div className="el-sec" style={{marginBottom:10}}>
                <div className="el-stitle">Konum & Fiyat</div>

                <div className="el-field">
                  <label className="el-lbl">Şehir</label>
                  <select className="el-inp" value={form.city} onChange={set('city')}>
                    <option value="">Şehir seçin</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="el-field">
                  <label className="el-lbl">İlçe / Mahalle</label>
                  <input className="el-inp" value={form.district} onChange={set('district')} placeholder="Meram, Selçuklu..." />
                </div>

                <div className="el-field">
                  <label className="el-lbl">Fiyat</label>
                  <div className="el-pw">
                    <input className="el-inp" style={{paddingRight:36}} value={priceDisplay} onChange={handlePrice} placeholder="2.500.000" inputMode="numeric" />
                    <span className="el-ps">₺</span>
                  </div>
                </div>
              </div>

              <div className="el-sec">
                <div className="el-stitle">Fotoğraflar</div>
                <p style={{fontSize:12,color:'#bbb',marginBottom:10}}>Mevcut fotoğraflar — silmek için × tıklayın</p>

                {photos.length > 0 && (
                  <div className="el-photos">
                    {photos.map(p => (
                      <div key={p.id} className="el-photo">
                        <img src={p.url} alt="" />
                        <button onClick={() => removeExistingPhoto(p)} className="el-photo-rm">×</button>
                      </div>
                    ))}
                  </div>
                )}

                {photos.length < 8 && (
                  <>
                    <label className="el-upload">
                      <input type="file" accept="image/*" multiple onChange={handleNewPhotos} style={{display:'none'}} />
                      <svg width="24" height="24" fill="none" stroke="#ccc" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      <span style={{fontSize:13,color:'#bbb'}}>
                        {newPhotos.length > 0 ? `${newPhotos.length} yeni fotoğraf seçildi` : `Fotoğraf ekle (max ${8 - photos.length} adet)`}
                      </span>
                    </label>
                    {newPreviews.length > 0 && (
                      <div className="el-photos" style={{marginTop:8}}>
                        {newPreviews.map((p,i) => (
                          <div key={i} className="el-photo">
                            <img src={p} alt="" />
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {error && <div className="el-err">{error}</div>}

          <div className="el-bar">
            <button onClick={() => navigate(`/ilan/${id}`)} className="el-cancel">İptal</button>
            <button onClick={handleSave} className="el-save" disabled={saving}>
              {saving ? 'Kaydediliyor...' : '✓ Değişiklikleri Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
