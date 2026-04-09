import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'

const TYPE_LABEL = { ev:'Konut', isyeri:'İş Yeri', arsa:'Arsa' }
const TYPE_COLOR = { ev:'#ff3b5c', isyeri:'#2196f3', arsa:'#00c853' }
const TYPE_BG = { ev:'rgba(255,59,92,0.15)', isyeri:'rgba(33,150,243,0.15)', arsa:'rgba(0,200,83,0.15)' }

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
    <div style={s.outer}>
      <div style={s.page}>
        <div style={s.header}>
          <p style={s.greeting}>Merhaba, {profile?.full_name?.split(' ')[0]} 👋</p>
          <h1 style={s.headerTitle}>İlanlar</h1>
        </div>

        <div style={s.searchWrap}>
          <svg style={s.searchIcon} width="15" height="15" fill="none" stroke="#555" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input style={s.searchInput} placeholder="Şehir, ilçe veya başlık ara..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div style={s.filterWrap}>
          {['hepsi','ev','isyeri','arsa'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{...s.filter, ...(filter===f ? {background: f==='hepsi'?'#ff3b5c':TYPE_COLOR[f], color:'#fff', borderColor:'transparent'} : {})}}>
              {f === 'hepsi' ? 'Tümü' : TYPE_LABEL[f]}
            </button>
          ))}
        </div>

        <p style={s.count}>{filtered.length} ilan</p>

        {loading ? (
          <div style={s.list}>{[1,2,3].map(i => <div key={i} style={s.skeleton}/>)}</div>
        ) : filtered.length === 0 ? (
          <div style={s.empty}>
            <p style={{fontSize:36,marginBottom:8}}>🏠</p>
            <p style={{color:'#444',fontSize:14}}>Henüz ilan yok.</p>
          </div>
        ) : (
          <div style={s.list}>
            {filtered.map(l => (
              <Link key={l.id} to={`/ilan/${l.id}`} style={s.card}>
                <div style={s.imgBox}>
                  {l.listing_photos?.[0]
                    ? <img src={l.listing_photos[0].url} alt="" style={s.img} />
                    : <div style={s.noImg}>
                        <svg width="24" height="24" fill="none" stroke="#333" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      </div>
                  }
                </div>
                <div style={s.info}>
                  <div style={s.badgeRow}>
                    <span style={{...s.badge, color:TYPE_COLOR[l.type], background:TYPE_BG[l.type]}}>
                      {TYPE_LABEL[l.type]}
                    </span>
                    <span style={s.dateSmall}>{new Date(l.created_at).toLocaleDateString('tr-TR')}</span>
                  </div>
                  <p style={s.cardTitle}>{l.title}</p>
                  {l.city && <p style={s.loc}>📍 {l.city}{l.district ? `, ${l.district}` : ''}</p>}
                  {l.price
                    ? <p style={s.price}>{Number(l.price).toLocaleString('tr-TR')} ₺</p>
                    : <p style={s.noPrice}>Fiyat belirtilmemiş</p>
                  }
                </div>
                <svg width="14" height="14" fill="none" stroke="#333" strokeWidth="2.5" viewBox="0 0 24 24" style={{flexShrink:0}}><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  outer: { background:'#0a0a0a', minHeight:'100vh' },
  page: { maxWidth:780, margin:'0 auto', padding:'28px 24px 80px' },
  header: { marginBottom:20 },
  greeting: { fontSize:12, color:'#555', marginBottom:2 },
  headerTitle: { fontSize:24, fontWeight:700, color:'#fff' },
  searchWrap: { position:'relative', marginBottom:12 },
  searchIcon: { position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' },
  searchInput: { width:'100%', padding:'12px 16px 12px 38px', background:'#141414', border:'1px solid #1f1f1f', borderRadius:12, fontSize:14, color:'#fff', outline:'none' },
  filterWrap: { display:'flex', gap:8, marginBottom:16, overflowX:'auto', paddingBottom:2 },
  filter: { padding:'8px 18px', border:'1px solid #222', borderRadius:20, background:'transparent', cursor:'pointer', fontSize:13, color:'#666', whiteSpace:'nowrap', flexShrink:0 },
  count: { fontSize:12, color:'#444', marginBottom:12 },
  list: { display:'flex', flexDirection:'column', gap:8 },
  card: { display:'flex', alignItems:'center', gap:14, background:'#141414', border:'1px solid #1c1c1c', borderRadius:14, padding:14, textDecoration:'none', color:'inherit' },
  imgBox: { width:100, height:80, borderRadius:10, overflow:'hidden', background:'#1c1c1c', flexShrink:0 },
  img: { width:'100%', height:'100%', objectFit:'cover', display:'block' },
  noImg: { width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' },
  info: { flex:1, minWidth:0 },
  badgeRow: { display:'flex', alignItems:'center', gap:8, marginBottom:6 },
  badge: { fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:6 },
  dateSmall: { fontSize:11, color:'#444' },
  cardTitle: { fontSize:14, fontWeight:600, color:'#f0f0f0', marginBottom:4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  loc: { fontSize:12, color:'#555', marginBottom:4 },
  price: { fontSize:16, fontWeight:700, color:'#fff' },
  noPrice: { fontSize:12, color:'#444' },
  skeleton: { height:108, background:'#141414', borderRadius:14, border:'1px solid #1c1c1c' },
  empty: { textAlign:'center', padding:'60px 0' }
}
