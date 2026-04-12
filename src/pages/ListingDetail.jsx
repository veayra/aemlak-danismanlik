import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'
import { sendPushNotification } from '../lib/notifications'

const TYPE_LABEL = { ev:'Konut', isyeri:'İş Yeri', arsa:'Arsa' }
const TYPE_COLOR = { ev:'#c8410a', isyeri:'#1a5fb4', arsa:'#1a7a3f' }
const TYPE_BG = { ev:'#fef0ed', isyeri:'#e8f0fb', arsa:'#edf7f0' }

export default function ListingDetail() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [listing, setListing] = useState(null)
  const [owner, setOwner] = useState(null)
  const [photos, setPhotos] = useState([])
  const [activePhoto, setActivePhoto] = useState(0)
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(true)
  const touchStartX = useRef(null)

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('listings').select('*').eq('id', id).single()
      const { data: ph } = await supabase.from('listing_photos').select('*').eq('listing_id', id)
      setListing(data)
      setPhotos(ph || [])
      if (data?.user_id) {
        const { data: ownerData } = await supabase.from('profiles').select('full_name, company, onesignal_player_id').eq('id', data.user_id).single()
        setOwner(ownerData)
      }
      setLoading(false)
    }
    fetch()
  }, [id])

  const prev = () => setActivePhoto(i => i===0 ? photos.length-1 : i-1)
  const next = () => setActivePhoto(i => i===photos.length-1 ? 0 : i+1)
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev()
  }

  const handleMessage = async (e) => {
    e.preventDefault()
    await supabase.from('messages').insert({
      from_user_id: user.id,
      to_user_id: listing.user_id,
      listing_id: id,
      content: message
    })
    // Push bildirim gönder
    if (owner?.onesignal_player_id) {
      await sendPushNotification(
        owner.onesignal_player_id,
        'Yeni Mesaj — A Takımı',
        `${profile?.full_name}: "${listing?.title}" ilanı hakkında mesaj gönderdi.`
      )
    }
    setSent(true)
  }

  const handleDelete = async () => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    await supabase.from('listings').delete().eq('id', id)
    navigate('/')
  }

  if (loading) return <div style={{textAlign:'center',padding:80,color:'#aaa',background:'#f5f4f0',minHeight:'100vh'}}>Yükleniyor...</div>
  if (!listing) return <div style={{textAlign:'center',padding:80,color:'#aaa',background:'#f5f4f0',minHeight:'100vh'}}>İlan bulunamadı.</div>

  const isOwner = user.id === listing.user_id
  const isAdmin = profile?.role === 'group_admin' || profile?.role === 'master_admin'
  const isVideo = (url) => url && (url.endsWith('.mp4') || url.endsWith('.mov') || url.endsWith('.webm'))

  return (
    <div style={s.outer}>
      <div style={s.page}>
        <div style={s.photoSection} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <button onClick={() => navigate('/')} style={s.backBtn}>
            <svg width="18" height="18" fill="none" stroke="#1a1a1a" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          {photos.length > 0 ? (
            isVideo(photos[activePhoto].url)
              ? <video src={photos[activePhoto].url} style={s.mainImg} controls playsInline />
              : <img src={photos[activePhoto].url} alt="" style={s.mainImg} />
          ) : (
            <div style={s.noPhoto}>
              <svg width="48" height="48" fill="none" stroke="#ddd" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </div>
          )}
          {photos.length > 1 && (
            <>
              <button onClick={prev} style={{...s.arrowBtn, left:12}}>‹</button>
              <button onClick={next} style={{...s.arrowBtn, right:12}}>›</button>
              <div style={s.photoCount}>{activePhoto+1} / {photos.length}</div>
            </>
          )}
        </div>

        {photos.length > 1 && (
          <div style={s.dots}>
            {photos.map((_,i) => (
              <button key={i} onClick={() => setActivePhoto(i)}
                style={{...s.dot, background:i===activePhoto?'#c8410a':'#ddd', width:i===activePhoto?18:6}} />
            ))}
          </div>
        )}

        {photos.length > 1 && (
          <div style={s.thumbRow}>
            {photos.map((p,i) => (
              isVideo(p.url)
                ? <div key={p.id} onClick={() => setActivePhoto(i)} style={{...s.thumb, background:'#eee', display:'flex', alignItems:'center', justifyContent:'center', outline:i===activePhoto?'2px solid #c8410a':'2px solid transparent', outlineOffset:2, cursor:'pointer', borderRadius:8}}>
                    <svg width="18" height="18" fill="none" stroke="#aaa" strokeWidth="2" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                  </div>
                : <img key={p.id} src={p.url} alt="" onClick={() => setActivePhoto(i)}
                    style={{...s.thumb, outline:i===activePhoto?'2px solid #c8410a':'2px solid transparent'}} />
            ))}
          </div>
        )}

        <div style={s.content}>
          <div style={s.topRow}>
            <span style={{...s.badge, color:TYPE_COLOR[listing.type], background:TYPE_BG[listing.type]}}>
              {TYPE_LABEL[listing.type]}
            </span>
            <span style={s.dateText}>{new Date(listing.created_at).toLocaleDateString('tr-TR')}</span>
          </div>

          <h1 style={s.title}>{listing.title}</h1>

          {/* İlan sahibi */}
          {owner && (
            <div style={s.ownerRow}>
              <div style={s.ownerAvatar}>{(owner.full_name||'?')[0].toUpperCase()}</div>
              <div>
                <p style={s.ownerName}>{owner.full_name}</p>
                {owner.company && <p style={s.ownerCompany}>{owner.company}</p>}
              </div>
            </div>
          )}

          {listing.city && (
            <div style={s.locRow}>
              <svg width="13" height="13" fill="none" stroke="#aaa" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span style={s.loc}>{listing.city}{listing.district ? `, ${listing.district}` : ''}</span>
            </div>
          )}

          {listing.price && <p style={s.price}>{Number(listing.price).toLocaleString('tr-TR')}<span style={s.priceUnit}> ₺</span></p>}

          {listing.description && (
            <div style={s.descBox}>
              <p style={s.descLabel}>Açıklama</p>
              <p style={s.desc}>{listing.description}</p>
            </div>
          )}

          {!isOwner && (
            <div style={s.contactBox}>
              <p style={s.contactTitle}>Bilgi Al</p>
              <p style={s.contactNote}>Mesajınız ilan sahibine iletilir ve bildirim gönderilir.</p>
              {sent ? (
                <div style={s.sentBox}>✓ Mesajınız iletildi. Mesajlar sayfasından takip edebilirsiniz.</div>
              ) : (
                <form onSubmit={handleMessage}>
                  <textarea style={s.textarea} value={message} onChange={e=>setMessage(e.target.value)}
                    required placeholder="Merhaba, bu ilan hakkında bilgi almak istiyorum..." />
                  <button type="submit" style={s.sendBtn}>Mesaj Gönder</button>
                </form>
              )}
            </div>
          )}

          {(isOwner || isAdmin) && (
            <button onClick={handleDelete} style={s.deleteBtn}>İlanı Sil</button>
          )}
        </div>
      </div>
    </div>
  )
}

const s = {
  outer: { background:'#f5f4f0', minHeight:'100vh' },
  page: { maxWidth:780, margin:'0 auto', paddingBottom:80 },
  photoSection: { position:'relative', width:'100%', height:360, background:'#e8e5e0', overflow:'hidden', userSelect:'none' },
  backBtn: { position:'absolute', top:16, left:16, zIndex:10, width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.9)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.1)' },
  mainImg: { width:'100%', height:'100%', objectFit:'cover', display:'block' },
  noPhoto: { height:'100%', display:'flex', alignItems:'center', justifyContent:'center' },
  arrowBtn: { position:'absolute', top:'50%', transform:'translateY(-50%)', zIndex:10, width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,0.85)', border:'none', color:'#1a1a1a', fontSize:22, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' },
  photoCount: { position:'absolute', bottom:14, right:14, background:'rgba(0,0,0,0.5)', color:'#fff', fontSize:12, padding:'4px 10px', borderRadius:20 },
  dots: { display:'flex', justifyContent:'center', gap:5, padding:'10px 0 4px', background:'#f5f4f0' },
  dot: { height:6, borderRadius:3, border:'none', cursor:'pointer', transition:'all 0.2s', padding:0 },
  thumbRow: { display:'flex', gap:6, padding:'8px 16px', overflowX:'auto', background:'#f5f4f0' },
  thumb: { width:68, height:54, objectFit:'cover', borderRadius:8, cursor:'pointer', flexShrink:0, outlineOffset:2, display:'block' },
  content: { padding:'20px 20px' },
  topRow: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  badge: { fontSize:12, fontWeight:700, padding:'5px 12px', borderRadius:8 },
  dateText: { fontSize:12, color:'#bbb' },
  title: { fontSize:22, fontWeight:700, color:'#1a1a1a', marginBottom:12, lineHeight:1.35 },
  ownerRow: { display:'flex', alignItems:'center', gap:10, background:'#fff', border:'1px solid #ece9e4', borderRadius:12, padding:'10px 14px', marginBottom:14 },
  ownerAvatar: { width:36, height:36, borderRadius:'50%', background:'#fef0ed', color:'#c8410a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700, flexShrink:0 },
  ownerName: { fontSize:13, fontWeight:600, color:'#1a1a1a', marginBottom:1 },
  ownerCompany: { fontSize:11, color:'#aaa' },
  locRow: { display:'flex', alignItems:'center', gap:5, marginBottom:14 },
  loc: { fontSize:13, color:'#aaa' },
  price: { fontSize:30, fontWeight:700, color:'#1a1a1a', marginBottom:20 },
  priceUnit: { fontSize:18, color:'#aaa', fontWeight:400 },
  descBox: { background:'#fff', border:'1px solid #ece9e4', borderRadius:14, padding:18, marginBottom:16 },
  descLabel: { fontSize:11, color:'#bbb', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.8px', fontWeight:600 },
  desc: { fontSize:15, color:'#555', lineHeight:1.75 },
  contactBox: { background:'#fff', border:'1px solid #ece9e4', borderRadius:14, padding:18, marginBottom:12 },
  contactTitle: { fontSize:15, fontWeight:600, color:'#1a1a1a', marginBottom:4 },
  contactNote: { fontSize:12, color:'#aaa', marginBottom:14 },
  textarea: { width:'100%', height:90, padding:'12px 14px', background:'#f5f4f0', border:'1px solid #e0ddd8', borderRadius:12, fontSize:14, color:'#1a1a1a', resize:'none', fontFamily:'inherit', outline:'none', marginBottom:10, display:'block' },
  sendBtn: { width:'100%', padding:14, background:'#c8410a', color:'#fff', border:'none', borderRadius:12, fontWeight:600, cursor:'pointer', fontSize:15 },
  sentBox: { color:'#1a7a3f', fontSize:14, padding:14, background:'#edf7f0', borderRadius:10, border:'1px solid #c8ecd4' },
  deleteBtn: { width:'100%', padding:13, border:'1px solid #fbd5c8', borderRadius:12, background:'#fef0ed', color:'#c8410a', cursor:'pointer', fontSize:14 }
}
