import React, { useEffect, useState, useRef } from 'react'
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
  const touchStartX = useRef(null)
  const touchEndX = useRef(null)

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('listings').select('*').eq('id', id).single()
      const { data: ph } = await supabase.from('listing_photos').select('*').eq('listing_id', id)
      setListing(data); setPhotos(ph || []); setLoading(false)
    }
    fetch()
  }, [id])

  const prev = () => setActivePhoto(i => i === 0 ? photos.length-1 : i-1)
  const next = () => setActivePhoto(i => i === photos.length-1 ? 0 : i+1)

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX.current
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev()
  }

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

  if (loading) return <div style={{textAlign:'center',padding:80,color:'#555',background:'#0a0a0a',minHeight:'100vh'}}>Yükleniyor...</div>
  if (!listing) return <div style={{textAlign:'center',padding:80,color:'#555',background:'#0a0a0a',minHeight:'100vh'}}>İlan bulunamadı.</div>

  const isOwner = user.id === listing.user_id
  const expiresAt = new Date(new Date(listing.created_at).getTime() + 60*24*60*60*1000)
  const daysLeft = Math.max(0, Math.ceil((expiresAt - new Date()) / (1000*60*60*24)))

  return (
    <div style={s.outer}>
      <div style={s.page}>
        {/* Fotoğraf slider */}
        <div style={s.photoSection} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <button onClick={() => navigate('/')} style={s.backBtn}>
            <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
          </button>

          {photos.length > 0 ? (
            <>
              <img src={photos[activePhoto].url} alt="" style={s.mainImg} />
              {photos.length > 1 && (
                <>
                  <button onClick={prev} style={{...s.arrowBtn, left:12}}>‹</button>
                  <button onClick={next} style={{...s.arrowBtn, right:12}}>›</button>
                  <div style={s.photoCount}>{activePhoto+1} / {photos.length}</div>
                </>
              )}
            </>
          ) : (
            <div style={s.noPhoto}>
              <svg width="48" height="48" fill="none" stroke="#2a2a2a" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </div>
          )}
        </div>

        {/* Dot göstergesi */}
        {photos.length > 1 && (
          <div style={s.dots}>
            {photos.map((_,i) => (
              <button key={i} onClick={() => setActivePhoto(i)}
                style={{...s.dot, background: i===activePhoto ? '#ff3b5c' : '#333', width: i===activePhoto ? 18 : 6}} />
            ))}
          </div>
        )}

        {/* Thumb'lar */}
        {photos.length > 1 && (
          <div style={s.thumbRow}>
            {photos.map((p,i) => (
              <img key={p.id} src={p.url} alt="" onClick={() => setActivePhoto(i)}
                style={{...s.thumb, outline: i===activePhoto ? '2px solid #ff3b5c' : '2px solid transparent'}} />
            ))}
          </div>
        )}

        <div style={s.content}>
          <div style={s.topRow}>
            <span style={{...s.badge, color:TYPE_COLOR[listing.type], background:TYPE_COLOR[listing.type]+'22'}}>
              {TYPE_LABEL[listing.type]}
            </span>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              {daysLeft <= 14 && daysLeft > 0 && <span style={s.expireWarn}>{daysLeft} gün kaldı</span>}
              <span style={s.dateText}>{new Date(listing.created_at).toLocaleDateString('tr-TR')}</span>
            </div>
          </div>

          <h1 style={s.title}>{listing.title}</h1>

          {listing.city && (
            <div style={s.locRow}>
              <svg width="13" height="13" fill="none" stroke="#555" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span style={s.loc}>{listing.city}{listing.district ? `, ${listing.district}` : ''}</span>
            </div>
          )}

          {listing.price && (
            <p style={s.price}>{Number(listing.price).toLocaleString('tr-TR')}<span style={s.priceUnit}> ₺</span></p>
          )}

          {listing.description && (
            <div style={s.descBox}>
              <p style={s.descLabel}>Açıklama</p>
              <p style={s.desc}>{listing.description}</p>
            </div>
          )}

          <div style={s.contactBox}>
            <p style={s.contactTitle}>Bilgi Al</p>
            <p style={s.contactNote}>Mesajınız yönetici aracılığıyla iletilir.</p>
            {sent ? (
              <div style={s.sentBox}>✓ Mesajınız iletildi, en kısa sürede dönüş yapılacak.</div>
            ) : (
              <form onSubmit={handleMessage}>
                <textarea style={s.textarea} value={message} onChange={e=>setMessage(e.target.value)}
                  required placeholder="Merhaba, bu ilan hakkında bilgi almak istiyorum..." />
                <button type="submit" style={s.sendBtn}>Mesaj Gönder</button>
              </form>
            )}
          </div>

          {(isOwner || profile?.is_admin) && (
            <button onClick={handleDelete} style={s.deleteBtn}>İlanı Sil</button>
          )}
        </div>
      </div>

      {/* WhatsApp butonu */}
      <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" style={s.waBtn} title="WhatsApp ile iletişim">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>
    </div>
  )
}

const s = {
  outer: { background:'#0a0a0a', minHeight:'100vh', position:'relative' },
  page: { maxWidth:780, margin:'0 auto', paddingBottom:80 },
  photoSection: { position:'relative', width:'100%', height:380, background:'#141414', overflow:'hidden', userSelect:'none' },
  backBtn: { position:'absolute', top:16, left:16, zIndex:10, width:38, height:38, borderRadius:10, background:'rgba(0,0,0,0.65)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' },
  mainImg: { width:'100%', height:'100%', objectFit:'cover', display:'block' },
  noPhoto: { height:'100%', display:'flex', alignItems:'center', justifyContent:'center' },
  arrowBtn: { position:'absolute', top:'50%', transform:'translateY(-50%)', zIndex:10, width:36, height:36, borderRadius:'50%', background:'rgba(0,0,0,0.55)', border:'none', color:'#fff', fontSize:22, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 },
  photoCount: { position:'absolute', bottom:14, right:14, background:'rgba(0,0,0,0.65)', color:'#fff', fontSize:12, padding:'5px 12px', borderRadius:20 },
  dots: { display:'flex', justifyContent:'center', gap:5, padding:'10px 0 4px' },
  dot: { height:6, borderRadius:3, border:'none', cursor:'pointer', transition:'all 0.2s', padding:0 },
  thumbRow: { display:'flex', gap:6, padding:'8px 20px', overflowX:'auto', background:'#0a0a0a' },
  thumb: { width:68, height:54, objectFit:'cover', borderRadius:8, cursor:'pointer', flexShrink:0, outlineOffset:2, display:'block' },
  content: { padding:'20px 20px' },
  topRow: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  badge: { fontSize:12, fontWeight:700, padding:'5px 12px', borderRadius:8 },
  expireWarn: { fontSize:11, color:'#ff9500', background:'rgba(255,149,0,0.15)', padding:'3px 8px', borderRadius:6, fontWeight:600 },
  dateText: { fontSize:12, color:'#444' },
  title: { fontSize:22, fontWeight:700, color:'#fff', marginBottom:10, lineHeight:1.35 },
  locRow: { display:'flex', alignItems:'center', gap:5, marginBottom:14 },
  loc: { fontSize:13, color:'#555' },
  price: { fontSize:30, fontWeight:700, color:'#fff', marginBottom:20 },
  priceUnit: { fontSize:18, color:'#555', fontWeight:400 },
  descBox: { background:'#141414', border:'1px solid #1f1f1f', borderRadius:14, padding:18, marginBottom:16 },
  descLabel: { fontSize:11, color:'#666', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.8px', fontWeight:600 },
  desc: { fontSize:15, color:'#bbb', lineHeight:1.75 },
  contactBox: { background:'#141414', border:'1px solid #1f1f1f', borderRadius:14, padding:18, marginBottom:12 },
  contactTitle: { fontSize:15, fontWeight:600, color:'#fff', marginBottom:4 },
  contactNote: { fontSize:12, color:'#555', marginBottom:14 },
  textarea: { width:'100%', height:90, padding:'12px 14px', background:'#1c1c1c', border:'1px solid #2a2a2a', borderRadius:12, fontSize:14, color:'#fff', resize:'none', fontFamily:'inherit', outline:'none', marginBottom:10, display:'block' },
  sendBtn: { width:'100%', padding:14, background:'#ff3b5c', color:'#fff', border:'none', borderRadius:12, fontWeight:600, cursor:'pointer', fontSize:15 },
  sentBox: { color:'#00c853', fontSize:14, padding:14, background:'#0a1f0a', borderRadius:10 },
  deleteBtn: { width:'100%', padding:13, border:'1px solid #2a1515', borderRadius:12, background:'#1a0f0f', color:'#ff4444', cursor:'pointer', fontSize:14 },
  waBtn: { position:'fixed', bottom:80, right:20, width:52, height:52, borderRadius:'50%', background:'#25d366', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(37,211,102,0.4)', zIndex:200, textDecoration:'none' }
}
