import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'

const TYPE_LABEL = { ev:'Konut', isyeri:'İş Yeri', arsa:'Arsa' }
const TYPE_COLOR = { ev:'#ff3b5c', isyeri:'#2196f3', arsa:'#00c853' }
const TYPE_BG = { ev:'#2a0f14', isyeri:'#0f1a2a', arsa:'#0a2015' }

export default function Dashboard() {
  const { profile } = useAuth()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('hepsi')
  const [search, setSearch] = useState('')

  useEffect(() => { fetchListings() }, [])

  const fetchListings = async () => {
    const { data } = await supabase
      .from('listings').select('*, listing_photos(url)')
      .eq('is_active', true).order('created_at', { ascending: false })
    setListings(data || [])
    setLoading(false)
  }

  const filtered = listings
    .filter(l => filter === 'hepsi' || l.type === filter)
    .filter(l => !search || l.title?.toLowerCase().includes(search.toLowerCase()) || l.city?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <p style={s.greeting}>Merhaba, {profile?.full_name?.split(' ')[0]} 👋</p>
          <h1 style={s.headerTitle}>Aktif İlanlar</h1>
        </div>
      </div>

      {/* Search */}
      <div style={s.searchWrap}>
        <svg style={s.searchIcon} width="16" height="16" fill="none" stroke="#555" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input style={s.searchInput} placeholder="Şehir, ilçe veya başlık ara..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Filters */}
      <div style={s.filters}>
        {['hepsi','ev','isyeri','arsa'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={filter===f ? {...s.filter, background: f==='hepsi' ? '#ff3b5c' : TYPE_COLOR[f], color:'#fff', border:'none'} : s.filter}>
            {f === 'hepsi' ? 'Tümü' : TYPE_LABEL[f]}
          </button>
        ))}
      </div>

      {/* Count */}
      <p style={s.count}>{filtered.length} ilan listeleniyor</p>

      {/* List */}
      {loading ? (
        <div style={s.loading}>
          {[1,2,3].map(i => <div key={i} style={s.skeleton}/>)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={s.empty}>
          <p style={{fontSize:32, marginBottom:8}}>🏠</p>
          <p style={{color:'#555', fontSize:14}}>Henüz ilan bulunmuyor.</p>
        </div>
      ) : (
        <div style={s.list}>
          {filtered.map(l => (
            <Link key={l.id} to={`/ilan/${l.id}`} style={s.card}>
              <div style={s.imgWrap}>
                {l.listing_photos?.[0]
                  ? <img src={l.listing_photos[0].url} alt="" style={s.img} />
                  : <div style={s.noImg}>
                      <svg width="28" height="28" fill="none" stroke="#333" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    </div>
                }
                <span style={{...s.typeBadge, background: TYPE_BG[l.type], color: TYPE_COLOR[l.type]}}>
                  {TYPE_LABEL[l.type]}
                </span>
              </div>
              <div style={s.info}>
                <h3 style={s.cardTitle}>{l.title}</h3>
                {l.city && (
                  <div style={s.locRow}>
                    <svg width="11" height="11" fill="none" stroke="#555" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <span style={s.loc}>{l.city}{l.district ? `, ${l.district}` : ''}</span>
                  </div>
                )}
                <div style={s.dateRow}>
                  <svg width="11" height="11" fill="none" stroke="#444" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <span style={s.date}>{new Date(l.created_at).toLocaleDateString('tr-TR')}</span>
                </div>
                {l.price && (
                  <p style={s.price}>{Number(l.price).toLocaleString('tr-TR')} <span style={s.priceUnit}>₺</span></p>
                )}
              </div>
              <svg width="16" height="16" fill="none" stroke="#333" strokeWidth="2" viewBox="0 0 24 24" style={{flexShrink:0}}><polyline points="9 18 15 12 9 6"/></svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

const s = {
  page: { maxWidth:680, margin:'0 auto', padding:'20px 16px 80px' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 },
  greeting: { fontSize:12, color:'#555', marginBottom:2 },
  headerTitle: { fontSize:22, fontWeight:700, color:'#fff' },
  searchWrap: { position:'relative', marginBottom:14 },
  searchIcon: { position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' },
  searchInput: { width:'100%', padding:'12px 16px 12px 40px', background:'#141414', border:'1px solid #222', borderRadius:12, fontSize:14, color:'#fff', outline:'none' },
  filters: { display:'flex', gap:8, marginBottom:16, overflowX:'auto', paddingBottom:4 },
  filter: { padding:'7px 16px', border:'1px solid #2a2a2a', borderRadius:20, background:'transparent', cursor:'pointer', fontSize:13, color:'#777', whiteSpace:'nowrap', flexShrink:0 },
  count: { fontSize:12, color:'#444', marginBottom:12 },
  list: { display:'flex', flexDirection:'column', gap:10 },
  card: { display:'flex', alignItems:'center', gap:14, background:'#141414', border:'1px solid #1f1f1f', borderRadius:14, padding:12, textDecoration:'none', color:'inherit' },
  imgWrap: { width:88, height:72, borderRadius:10, overflow:'hidden', background:'#1c1c1c', flexShrink:0, position:'relative' },
  img: { width:'100%', height:'100%', objectFit:'cover' },
  noImg: { width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' },
  typeBadge: { position:'absolute', top:5, left:5, fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:5, letterSpacing:'0.3px' },
  info: { flex:1, minWidth:0 },
  cardTitle: { fontSize:13, fontWeight:600, color:'#f0f0f0', marginBottom:5, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  locRow: { display:'flex', alignItems:'center', gap:4, marginBottom:3 },
  loc: { fontSize:11, color:'#555' },
  dateRow: { display:'flex', alignItems:'center', gap:4, marginBottom:5 },
  date: { fontSize:11, color:'#444' },
  price: { fontSize:15, fontWeight:700, color:'#fff' },
  priceUnit: { fontSize:12, color:'#666', fontWeight:400 },
  loading: { display:'flex', flexDirection:'column', gap:10 },
  skeleton: { height:96, background:'#141414', borderRadius:14, border:'1px solid #1f1f1f' },
  empty: { textAlign:'center', padding:'60px 0' }
}
