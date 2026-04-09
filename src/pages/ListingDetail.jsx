import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'

const TYPE_LABEL = { ev:'Konut', isyeri:'İş Yeri', arsa:'Arsa' }

export default function ListingDetail() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [listing, setListing] = useState(null)
  const [photos, setPhotos] = useState([])
  const [activePhoto, setActivePhoto] = useState(0)
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('listings').select('*').eq('id', id).single()
      const { data: ph } = await supabase.from('listing_photos').select('*').eq('listing_id', id)
      setListing(data)
      setPhotos(ph || [])
      setLoading(false)
    }
    fetch()
  }, [id])

  const handleMessage = async (e) => {
    e.preventDefault()
    await supabase.from('messages').insert({ from_user_id: user.id, listing_id: id, content: message })
    setSent(true)
  }

  const handleDelete = async () => {
    if (!confirm('Bu ilanı silmek istediğinize emin misiniz?')) return
    await supabase.from('listings').delete().eq('id', id)
    navigate('/')
  }

  if (loading) return <div style={s.loading}>Yükleniyor...</div>
  if (!listing) return <div style={s.loading}>İlan bulunamadı.</div>

  const isOwner = user.id === listing.user_id

  return (
    <div style={s.page}>
      <button onClick={() => navigate('/')} style={s.back}>← Geri</button>
      <div style={s.layout}>
        <div style={s.left}>
          <div style={s.mainPhoto}>
            {photos[activePhoto]
              ? <img src={photos[activePhoto].url} alt="" style={s.mainImg} />
              : <div style={s.noPhoto}>Fotoğraf yok</div>
            }
          </div>
          {photos.length > 1 && (
            <div style={s.thumbs}>
              {photos.map((p, i) => (
                <img key={p.id} src={p.url} alt="" onClick={() => setActivePhoto(i)}
                  style={{...s.thumb, border: i === activePhoto ? '2px solid #c8a96e' : '2px solid transparent'}} />
              ))}
            </div>
          )}
        </div>

        <div style={s.right}>
          <span style={s.badge}>{TYPE_LABEL[listing.type]}</span>
          <h1 style={s.title}>{listing.title}</h1>
          {listing.city && <p style={s.loc}>📍 {listing.city}{listing.district ? `, ${listing.district}` : ''}</p>}
          {listing.price && <p style={s.price}>{Number(listing.price).toLocaleString('tr-TR')} <span style={s.priceUnit}>₺</span></p>}
          {listing.description && <p style={s.desc}>{listing.description}</p>}

          <div style={s.contactBox}>
            <p style={s.contactTitle}>İlan Hakkında Bilgi Al</p>
            <p style={s.contactNote}>Yönetici üzerinden iletişime geçilecektir.</p>
            {sent ? (
              <div style={s.sentBox}>✓ Mesajınız iletildi, en kısa sürede dönüş yapılacak.</div>
            ) : (
              <form onSubmit={handleMessage}>
                <textarea style={s.textarea} value={message} onChange={e => setMessage(e.target.value)} required
                  placeholder="Merhaba, bu ilan hakkında bilgi almak istiyorum..." />
                <button type="submit" style={s.sendBtn}>Mesaj Gönder</button>
              </form>
            )}
          </div>

          {(isOwner || profile?.is_admin) && (
            <button onClick={handleDelete} style={s.deleteBtn}>İlanı Sil</button>
          )}
        </div>
      </div>
    </div>
  )
}

const s = {
  page: { maxWidth:1100, margin:'0 auto', padding:'24px 20px' },
  back: { background:'none', border:'none', cursor:'pointer', fontSize:13, color:'#666', marginBottom:20, padding:0 },
  layout: { display:'grid', gridTemplateColumns:'1fr 360px', gap:28, alignItems:'start' },
  left: {},
  mainPhoto: { background:'#161616', borderRadius:12, overflow:'hidden', height:420, border:'1px solid #222' },
  mainImg: { width:'100%', height:'100%', objectFit:'cover' },
  noPhoto: { height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#333' },
  thumbs: { display:'flex', gap:8, marginTop:8, flexWrap:'wrap' },
  thumb: { width:72, height:56, objectFit:'cover', borderRadius:6, cursor:'pointer' },
  right: {},
  badge: { display:'inline-block', background:'#1f1a0e', color:'#c8a96e', fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:6, marginBottom:12, letterSpacing:'0.3px' },
  title: { fontFamily:"'DM Serif Display',serif", fontSize:24, fontWeight:400, color:'#f0f0ee', marginBottom:10, lineHeight:1.3 },
  loc: { fontSize:13, color:'#666', marginBottom:10 },
  price: { fontSize:28, fontWeight:600, color:'#f0f0ee', marginBottom:16 },
  priceUnit: { fontSize:18, color:'#888' },
  desc: { fontSize:14, color:'#777', lineHeight:1.7, marginBottom:20, background:'#161616', padding:16, borderRadius:9, border:'1px solid #1f1f1f' },
  contactBox: { background:'#161616', border:'1px solid #222', borderRadius:12, padding:20, marginBottom:12 },
  contactTitle: { fontSize:14, fontWeight:500, color:'#f0f0ee', marginBottom:4 },
  contactNote: { fontSize:12, color:'#555', marginBottom:14 },
  textarea: { width:'100%', height:88, padding:'10px 14px', background:'#1f1f1f', border:'1px solid #2a2a2a', borderRadius:8, fontSize:13, color:'#f0f0ee', resize:'vertical', fontFamily:'inherit', marginBottom:10, outline:'none' },
  sendBtn: { width:'100%', padding:12, background:'#c8a96e', color:'#0f0f0f', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:14 },
  sentBox: { color:'#2ecc71', fontSize:13, padding:12, background:'#0a1f0a', borderRadius:8 },
  deleteBtn: { width:'100%', padding:10, border:'1px solid #2a1515', borderRadius:8, background:'#1a0f0f', color:'#e74c3c', cursor:'pointer', fontSize:13 },
  loading: { textAlign:'center', padding:80, color:'#555' }
}
