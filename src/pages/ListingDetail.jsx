import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'

const TYPE_LABEL = { ev: 'Ev', isyeri: 'İş Yeri', arsa: 'Arsa' }

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

  if (loading) return <div style={styles.loading}>Yükleniyor...</div>
  if (!listing) return <div style={styles.loading}>İlan bulunamadı.</div>

  const isOwner = user.id === listing.user_id

  return (
    <div style={styles.page}>
      <button onClick={() => navigate('/')} style={styles.back}>← Geri</button>
      <div style={styles.layout}>
        <div style={styles.left}>
          <div style={styles.mainPhoto}>
            {photos[activePhoto] ? (
              <img src={photos[activePhoto].url} alt="" style={styles.mainImg} />
            ) : (
              <div style={styles.noPhoto}>Fotoğraf yok</div>
            )}
          </div>
          {photos.length > 1 && (
            <div style={styles.thumbs}>
              {photos.map((p, i) => (
                <img key={p.id} src={p.url} alt="" onClick={() => setActivePhoto(i)}
                  style={{ ...styles.thumb, border: i === activePhoto ? '2px solid #1d4ed8' : '2px solid transparent' }} />
              ))}
            </div>
          )}
        </div>

        <div style={styles.right}>
          <div style={styles.typeBadge}>{TYPE_LABEL[listing.type]}</div>
          <h1 style={styles.title}>{listing.title}</h1>
          {listing.city && <p style={styles.location}>{listing.city}{listing.district ? `, ${listing.district}` : ''}</p>}
          {listing.price && <p style={styles.price}>{Number(listing.price).toLocaleString('tr-TR')} ₺</p>}
          {listing.description && <p style={styles.desc}>{listing.description}</p>}

          <div style={styles.contactBox}>
            <p style={styles.contactNote}>Bu ilan hakkında bilgi almak için yöneticiye mesaj gönderin.</p>
            {sent ? (
              <p style={styles.sentMsg}>Mesajınız iletildi. En kısa sürede dönüş yapılacak.</p>
            ) : (
              <form onSubmit={handleMessage}>
                <textarea style={styles.textarea} value={message} onChange={e => setMessage(e.target.value)}
                  required placeholder="Merhaba, bu ilan hakkında bilgi almak istiyorum..." />
                <button type="submit" style={styles.sendBtn}>Mesaj Gönder</button>
              </form>
            )}
          </div>

          {(isOwner || profile?.is_admin) && (
            <div style={styles.ownerActions}>
              <button onClick={handleDelete} style={styles.deleteBtn}>İlanı Sil</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: { maxWidth:1100, margin:'0 auto', padding:'24px 20px' },
  back: { background:'none', border:'none', cursor:'pointer', fontSize:14, color:'#6b7280', marginBottom:20, padding:0 },
  layout: { display:'grid', gridTemplateColumns:'1fr 380px', gap:32, alignItems:'start' },
  left: {},
  mainPhoto: { background:'#f3f4f6', borderRadius:12, overflow:'hidden', height:400 },
  mainImg: { width:'100%', height:'100%', objectFit:'cover' },
  noPhoto: { height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#9ca3af' },
  thumbs: { display:'flex', gap:8, marginTop:10, flexWrap:'wrap' },
  thumb: { width:72, height:72, objectFit:'cover', borderRadius:6, cursor:'pointer' },
  right: {},
  typeBadge: { display:'inline-block', background:'#dbeafe', color:'#1e40af', fontSize:12, fontWeight:600, padding:'4px 12px', borderRadius:20, marginBottom:12 },
  title: { fontSize:22, fontWeight:700, marginBottom:8 },
  location: { color:'#6b7280', fontSize:14, marginBottom:8 },
  price: { fontSize:24, fontWeight:700, color:'#1d4ed8', marginBottom:16 },
  desc: { fontSize:14, color:'#374151', lineHeight:1.7, marginBottom:24, background:'#f9fafb', padding:16, borderRadius:8 },
  contactBox: { background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:20, marginBottom:16 },
  contactNote: { fontSize:13, color:'#6b7280', marginBottom:12 },
  textarea: { width:'100%', height:90, padding:'10px 14px', border:'1px solid #d1d5db', borderRadius:8, fontSize:13, resize:'vertical', fontFamily:'inherit', marginBottom:10 },
  sendBtn: { width:'100%', padding:'11px', background:'#1d4ed8', color:'#fff', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:14 },
  sentMsg: { color:'#065f46', fontSize:14, fontWeight:500, padding:12, background:'#d1fae5', borderRadius:8 },
  ownerActions: { marginTop:8 },
  deleteBtn: { width:'100%', padding:10, border:'1px solid #fca5a5', borderRadius:8, background:'#fff5f5', color:'#ef4444', cursor:'pointer', fontSize:13 },
  loading: { textAlign:'center', padding:60, color:'#6b7280' }
}
