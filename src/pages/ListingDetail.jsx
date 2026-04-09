import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'

const TYPE_LABEL = { ev:'Konut', isyeri:'İş Yeri', arsa:'Arsa' }
const TYPE_COLOR = { ev:'#ff3b5c', isyeri:'#2196f3', arsa:'#00c853' }

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
      setListing(data); setPhotos(ph || []); setLoading(false)
    }
    fetch()
  }, [id])

  const handleMessage = async (e) => {
    e.preventDefault()
    await supabase.from('messages').insert({ from_user_id: user.id, listing_id: id, content: message })
    setSent(true)
  }

  const handleDelete = async () => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    await supabase.from('listings').delete().eq('id', id)
    navigate('/')
  }

  if (loading) return <div style={{textAlign:'center',padding:80,color:'#555'}}>Yükleniyor...</div>
  if (!listing) return <div style={{textAlign:'center',padding:80,color:'#555'}}>İlan bulunamadı.</div>

  const isOwner = user.id === listing.user_id

  return (
    <div style={s.page}>
      {/* Back button overlay on photo */}
      <div style={s.photoWrap}>
        <button onClick={() => navigate('/')} style={s.backBtn}>
          <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        {photos[activePhoto]
          ? <img src={photos[activePhoto].url} alt="" style={s.mainImg} />
          : <div style={s.noPhoto}><svg width="40" height="40" fill="none" stroke="#333" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>
        }
        {photos.length > 1 && (
          <div style={s.photoCount}>{activePhoto+1}/{photos.length}</div>
        )}
      </div>

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div style={s.thumbs}>
          {photos.map((p,i) => (
            <img key={p.id} src={p.url} alt="" onClick={() => setActivePhoto(i)}
              style={{...s.thumb, border: i===activePhoto ? '2px solid #ff3b5c' : '2px solid transparent'}} />
          ))}
        </div>
      )}

      <div style={s.content}>
        <div style={s.topRow}>
          <span style={{...s.badge, color: TYPE_COLOR[listing.type], background: TYPE_COLOR[listing.type]+'22'}}>{TYPE_LABEL[listing.type]}</span>
          <span style={s.dateText}>{new Date(listing.created_at).toLocaleDateString('tr-TR')}</span>
        </div>
        <h1 style={s.title}>{listing.title}</h1>
        {listing.city && (
          <div style={s.locRow}>
            <svg width="13" height="13" fill="none" stroke="#555" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span style={s.loc}>{listing.city}{listing.district ? `, ${listing.district}` : ''}</span>
          </div>
        )}
        {listing.price && <p style={s.price}>{Number(listing.price).toLocaleString('tr-TR')} <span style={s.priceUnit}>₺</span></p>}
        {listing.description && (
          <div style={s.descBox}>
            <p style={s.descTitle}>Açıklama</p>
            <p style={s.desc}>{listing.description}</p>
          </div>
        )}

        <div style={s.contactBox}>
          <p style={s.contactTitle}>İlan Hakkında Bilgi Al</p>
          <p style={s.contactNote}>Mesajınız yönetici aracılığıyla iletilecektir.</p>
          {sent ? (
            <div style={s.sentBox}>
              <span style={{fontSize:18}}>✓</span>
              <span>Mesajınız iletildi, en kısa sürede dönüş yapılacak.</span>
            </div>
          ) : (
            <form onSubmit={handleMessage}>
              <textarea style={s.textarea} value={message} onChange={e=>setMessage(e.target.value)} required
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
  )
}

const s = {
  page: { maxWidth:680, margin:'0 auto', paddingBottom:80 },
  photoWrap: { position:'relative', height:280, background:'#141414' },
  backBtn: { position:'absolute', top:16, left:16, zIndex:10, width:36, height:36, borderRadius:10, background:'rgba(0,0,0,0.6)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', backdropFilter:'blur(4px)' },
  mainImg: { width:'100%', height:'100%', objectFit:'cover' },
  noPhoto: { height:'100%', display:'flex', alignItems:'center', justifyContent:'center' },
  photoCount: { position:'absolute', bottom:12, right:12, background:'rgba(0,0,0,0.6)', color:'#fff', fontSize:12, padding:'4px 10px', borderRadius:20, backdropFilter:'blur(4px)' },
  thumbs: { display:'flex', gap:6, padding:'10px 16px', overflowX:'auto' },
  thumb: { width:60, height:48, objectFit:'cover', borderRadius:8, cursor:'pointer', flexShrink:0 },
  content: { padding:'16px 16px' },
  topRow: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 },
  badge: { fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:8, letterSpacing:'0.3px' },
  dateText: { fontSize:11, color:'#444' },
  title: { fontSize:20, fontWeight:700, color:'#fff', marginBottom:8, lineHeight:1.3 },
  locRow: { display:'flex', alignItems:'center', gap:5, marginBottom:12 },
  loc: { fontSize:13, color:'#555' },
  price: { fontSize:26, fontWeight:700, color:'#fff', marginBottom:16 },
  priceUnit: { fontSize:16, color:'#666', fontWeight:400 },
  descBox: { background:'#141414', border:'1px solid #1f1f1f', borderRadius:14, padding:16, marginBottom:16 },
  descTitle: { fontSize:11, color:'#555', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.8px', fontWeight:500 },
  desc: { fontSize:14, color:'#888', lineHeight:1.7 },
  contactBox: { background:'#141414', border:'1px solid #1f1f1f', borderRadius:14, padding:16, marginBottom:12 },
  contactTitle: { fontSize:14, fontWeight:600, color:'#fff', marginBottom:4 },
  contactNote: { fontSize:12, color:'#555', marginBottom:14 },
  textarea: { width:'100%', height:88, padding:'12px 14px', background:'#1c1c1c', border:'1px solid #2a2a2a', borderRadius:12, fontSize:14, color:'#fff', resize:'none', fontFamily:'inherit', marginBottom:10, outline:'none' },
  sendBtn: { width:'100%', padding:14, background:'linear-gradient(135deg,#ff3b5c,#ff6b35)', color:'#fff', border:'none', borderRadius:12, fontWeight:600, cursor:'pointer', fontSize:14 },
  sentBox: { display:'flex', alignItems:'center', gap:10, color:'#00c853', fontSize:13, padding:12, background:'#0a1f0a', borderRadius:10 },
  deleteBtn: { width:'100%', padding:12, border:'1px solid #2a1515', borderRadius:12, background:'#1a0f0f', color:'#ff4444', cursor:'pointer', fontSize:14 }
}
