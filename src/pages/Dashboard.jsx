import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const TYPE_LABEL = { ev: 'Ev', isyeri: 'İş Yeri', arsa: 'Arsa' }
const TYPE_COLOR = { ev: '#dbeafe', isyeri: '#fef9c3', arsa: '#dcfce7' }
const TYPE_TEXT = { ev: '#1e40af', isyeri: '#854d0e', arsa: '#166534' }

export default function Dashboard() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('hepsi')

  useEffect(() => {
    fetchListings()
  }, [])

  const fetchListings = async () => {
    const { data } = await supabase
      .from('listings')
      .select('*, listing_photos(url)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    setListings(data || [])
    setLoading(false)
  }

  const filtered = filter === 'hepsi' ? listings : listings.filter(l => l.type === filter)

  if (loading) return <div style={styles.loading}>İlanlar yükleniyor...</div>

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Aktif İlanlar</h1>
          <p style={styles.sub}>{filtered.length} ilan listeleniyor</p>
        </div>
        <Link to="/ilan/yeni" style={styles.addBtn}>+ Yeni İlan</Link>
      </div>

      <div style={styles.filters}>
        {['hepsi','ev','isyeri','arsa'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={filter === f ? styles.filterActive : styles.filter}>
            {f === 'hepsi' ? 'Tümü' : TYPE_LABEL[f]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={styles.empty}>
          <p>Henüz ilan yok.</p>
          <Link to="/ilan/yeni" style={styles.addBtn}>İlk ilanı ekle</Link>
        </div>
      ) : (
        <div style={styles.grid}>
          {filtered.map(listing => (
            <Link key={listing.id} to={`/ilan/${listing.id}`} style={styles.card}>
              <div style={styles.imgWrap}>
                {listing.listing_photos?.[0] ? (
                  <img src={listing.listing_photos[0].url} alt={listing.title} style={styles.img} />
                ) : (
                  <div style={styles.noImg}>Fotoğraf yok</div>
                )}
                <span style={{ ...styles.badge, background: TYPE_COLOR[listing.type], color: TYPE_TEXT[listing.type] }}>
                  {TYPE_LABEL[listing.type]}
                </span>
              </div>
              <div style={styles.info}>
                <h3 style={styles.cardTitle}>{listing.title}</h3>
                <p style={styles.location}>{listing.city}{listing.district ? `, ${listing.district}` : ''}</p>
                {listing.price && (
                  <p style={styles.price}>{Number(listing.price).toLocaleString('tr-TR')} ₺</p>
                )}
                <p style={styles.desc}>{listing.description?.slice(0, 80)}{listing.description?.length > 80 ? '...' : ''}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  page: { maxWidth:1100, margin:'0 auto', padding:'28px 20px' },
  header: { display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20 },
  title: { fontSize:22, fontWeight:700, marginBottom:2 },
  sub: { fontSize:13, color:'#6b7280' },
  addBtn: { background:'#1d4ed8', color:'#fff', padding:'10px 20px', borderRadius:8, textDecoration:'none', fontSize:14, fontWeight:600, whiteSpace:'nowrap' },
  filters: { display:'flex', gap:8, marginBottom:24, flexWrap:'wrap' },
  filter: { padding:'7px 16px', border:'1px solid #d1d5db', borderRadius:20, background:'#fff', cursor:'pointer', fontSize:13, color:'#374151' },
  filterActive: { padding:'7px 16px', border:'1px solid #1d4ed8', borderRadius:20, background:'#1d4ed8', cursor:'pointer', fontSize:13, color:'#fff', fontWeight:600 },
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:20 },
  card: { background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden', textDecoration:'none', color:'inherit', display:'block', transition:'box-shadow 0.2s' },
  imgWrap: { position:'relative', height:200, background:'#f3f4f6' },
  img: { width:'100%', height:'100%', objectFit:'cover' },
  noImg: { height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#9ca3af', fontSize:13 },
  badge: { position:'absolute', top:10, left:10, padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:600 },
  info: { padding:16 },
  cardTitle: { fontSize:15, fontWeight:600, marginBottom:4 },
  location: { fontSize:13, color:'#6b7280', marginBottom:6 },
  price: { fontSize:16, fontWeight:700, color:'#1d4ed8', marginBottom:6 },
  desc: { fontSize:13, color:'#6b7280', lineHeight:1.5 },
  loading: { textAlign:'center', padding:60, color:'#6b7280' },
  empty: { textAlign:'center', padding:60, color:'#6b7280' }
}
