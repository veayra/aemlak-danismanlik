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
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Yeni İlan Ekle</h1>
        <form onSubmit={handleSubmit}>
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>İlan Başlığı *</label>
              <input style={styles.input} value={form.title} onChange={set('title')} required placeholder="3+1 Daire, Bağcılar" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>İlan Tipi *</label>
              <select style={styles.input} value={form.type} onChange={set('type')}>
                <option value="ev">Ev</option>
                <option value="isyeri">İş Yeri</option>
                <option value="arsa">Arsa</option>
              </select>
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Şehir</label>
              <input style={styles.input} value={form.city} onChange={set('city')} placeholder="İstanbul" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>İlçe</label>
              <input style={styles.input} value={form.district} onChange={set('district')} placeholder="Kadıköy" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Fiyat (₺)</label>
              <input style={styles.input} type="number" value={form.price} onChange={set('price')} placeholder="2500000" />
            </div>
          </div>

          <div style={{ marginBottom:20 }}>
            <label style={styles.label}>Açıklama</label>
            <textarea style={{ ...styles.input, height:100, resize:'vertical' }}
              value={form.description} onChange={set('description')}
              placeholder="Mülk hakkında detaylı bilgi..." />
          </div>

          <div style={{ marginBottom:24 }}>
            <label style={styles.label}>Fotoğraflar (max 8)</label>
            <label style={styles.uploadArea}>
              <input type="file" accept="image/*" multiple onChange={handlePhotos} style={{ display:'none' }} />
              <span style={styles.uploadText}>Fotoğraf seç veya sürükle</span>
            </label>
            {previews.length > 0 && (
              <div style={styles.previews}>
                {previews.map((p, i) => (
                  <img key={i} src={p} alt="" style={styles.preview} />
                ))}
              </div>
            )}
          </div>

          {error && <p style={styles.error}>{error}</p>}
          <div style={styles.actions}>
            <button type="button" onClick={() => navigate('/')} style={styles.cancelBtn}>İptal</button>
            <button type="submit" style={styles.submitBtn} disabled={loading}>
              {loading ? 'Yükleniyor...' : 'İlanı Yayınla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const styles = {
  page: { maxWidth:800, margin:'0 auto', padding:'28px 20px' },
  card: { background:'#fff', border:'1px solid #e5e7eb', borderRadius:16, padding:32 },
  title: { fontSize:20, fontWeight:700, marginBottom:24 },
  row: { display:'flex', gap:16, marginBottom:20, flexWrap:'wrap' },
  field: { flex:1, minWidth:160 },
  label: { display:'block', fontSize:13, fontWeight:500, marginBottom:6, color:'#374151' },
  input: { width:'100%', padding:'10px 14px', border:'1px solid #d1d5db', borderRadius:8, fontSize:14, outline:'none', fontFamily:'inherit' },
  uploadArea: { display:'block', border:'2px dashed #d1d5db', borderRadius:8, padding:24, textAlign:'center', cursor:'pointer' },
  uploadText: { fontSize:14, color:'#6b7280' },
  previews: { display:'flex', gap:8, marginTop:12, flexWrap:'wrap' },
  preview: { width:80, height:80, objectFit:'cover', borderRadius:6, border:'1px solid #e5e7eb' },
  error: { color:'#ef4444', fontSize:13, marginBottom:12 },
  actions: { display:'flex', gap:12, justifyContent:'flex-end' },
  cancelBtn: { padding:'11px 24px', border:'1px solid #d1d5db', borderRadius:8, background:'#fff', cursor:'pointer', fontSize:14 },
  submitBtn: { padding:'11px 28px', border:'none', borderRadius:8, background:'#1d4ed8', color:'#fff', fontWeight:600, cursor:'pointer', fontSize:14 }
}
