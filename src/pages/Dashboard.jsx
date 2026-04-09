import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const TYPE_LABEL = { ev:'Konut', isyeri:'İş Yeri', arsa:'Arsa' }
const TYPE_COLOR = { ev:'#1a2535', isyeri:'#1e1a10', arsa:'#0f1e12' }
const TYPE_TEXT = { ev:'#5b9bd5', isyeri:'#c8a96e', arsa:'#4caf72' }

export default function Dashboard() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('hepsi')
  const [search, setSearch] = useState('')

  useEffect(() => { fetchListings() }, [])

  const fetchListings = async () => {
    const { data } = await supabase
      .from('listings')
      .select('*, listing_photos(url)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    setListings(data || [])
    setLoading(false)
  }

  const filtered = listings
    .filter(l => filter === 'hepsi' || l.type === filter)
    .filter(l => !search || l.title?.toLowerCase().includes(search.toLowerCase()) || l.city?.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <div style={s.loading}>Yükleniyor...</div>

  return (
    <div style={s.page}>
      <div style={s.topBar}>
        <div style={s.searchWrap}>
          <span style={s.searchIcon}>⌕</span>
          <input style={s.searchInput} placeholder="İlan ara..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={s.filters}>
          {['hepsi','ev','isyeri','arsa'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={filter === f ? {...s.filter, ...s.filterActive} : s.filter}>
              {f === 'hepsi' ? 'Tümü' : TYPE_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      <div style={s.countRow}>
        <span style={s.count}>{filtered.length} ilan</span>
        <Link to="/ilan/yeni" style={s.addBtn}>+ Yeni İlan</Link>
      </div>

      {filtered.length === 0 ? (
        <div style={s.empty}>
          <p style={{color:'#555', marginBottom:16}}>Henüz ilan yok.</p>
          <Link to="/ilan/yeni" style={s.addBtn}>İlk ilanı ekle</Link>
        </div>
      ) : (
        <div style={s.list}>
          {filtered.map((l, i) => (
            <Link key={l.id} to={`/ilan/${l.id}`} style={s.row}>
              <div style={s.imgWrap}>
                {l.listing_photos?.[0]
                  ? <img src={l.listing_photos[0].url} alt="" style={s.img} />
                  : <div style={s.noImg}>—</div>
                }
              </div>
              <div style={s.info}>
                <div style={s.infoTop}>
                  <span style={{...s.badge, background: TYPE_COLOR[l.type], color: TYPE_TEXT[l.type]}}>
                    {TYPE_LABEL[l.type]}
                  </span>
                  <span style={s.date}>{new Date(l.created_at).toLocaleDateString('tr-TR')}</span>
                </div>
                <h3 style={s.rowTitle}>{l.title}</h3>
                {l.city && <p style={s.loc}>📍 {l.city}{l.district ? `, ${l.district}` : ''}</p>}
                {l.description && <p style={s.desc}>{l.description.slice(0, 100)}{l.description.length > 100 ? '...' : ''}</p>}
              </div>
              <div style={s.priceCol}>
                {l.price
                  ? <><span style={s.price}>{Number(l.price).toLocaleString('tr-TR')}</span><span style={s.priceUnit}> ₺</span></>
                  : <span style={s.noPrice}>Fiyat yok</span>
                }
                <span style={s.detailLink}>Detay →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

const s = {
  page: { maxWidth:1100, margin:'0 auto', padding:'24px 20px' },
  topBar: { display:'flex', gap:12, marginBottom:16, flexWrap:'wrap', alignItems:'center' },
  searchWrap: { flex:1, minWidth:200, position:'relative' },
  searchIcon: { position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#555', fontSize:18, pointerEvents:'none' },
  searchInput: { width:'100%', padding:'9px 14px 9px 36px', background:'#181818', border:'1px solid #252525', borderRadius:9, fontSize:14, color:'#f0f0ee', outline:'none' },
  filters: { display:'flex', gap:6 },
  filter: { padding:'8px 16px', border:'1px solid #252525', borderRadius:20, background:'transparent', cursor:'pointer', fontSize:13, color:'#777' },
  filterActive: { background:'#c8a96e', border:'1px solid #c8a96e', color:'#0f0f0f', fontWeight:600 },
  countRow: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  count: { fontSize:13, color:'#555' },
  addBtn: { background:'#c8a96e', color:'#0f0f0f', padding:'8px 18px', borderRadius:8, textDecoration:'none', fontSize:13, fontWeight:600 },
  list: { display:'flex', flexDirection:'column', gap:2 },
  row: { display:'flex', alignItems:'center', gap:16, background:'#161616', border:'1px solid #1f1f1f', borderRadius:10, padding:14, textDecoration:'none', color:'inherit', transition:'border-color 0.15s', marginBottom:2 },
  imgWrap: { width:90, height:68, borderRadius:7, overflow:'hidden', background:'#1f1f1f', flexShrink:0 },
  img: { width:'100%', height:'100%', objectFit:'cover' },
  noImg: { width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#333', fontSize:20 },
  info: { flex:1, minWidth:0 },
  infoTop: { display:'flex', alignItems:'center', gap:8, marginBottom:5 },
  badge: { fontSize:10, fontWeight:600, padding:'3px 8px', borderRadius:5, letterSpacing:'0.3px' },
  date: { fontSize:11, color:'#444' },
  rowTitle: { fontSize:14, fontWeight:500, color:'#e8e8e6', marginBottom:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  loc: { fontSize:12, color:'#555', marginBottom:3 },
  desc: { fontSize:12, color:'#444', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  priceCol: { display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8, flexShrink:0 },
  price: { fontSize:17, fontWeight:600, color:'#f0f0ee' },
  priceUnit: { fontSize:13, color:'#777' },
  noPrice: { fontSize:12, color:'#444' },
  detailLink: { fontSize:12, color:'#c8a96e' },
  loading: { textAlign:'center', padding:80, color:'#555' },
  empty: { textAlign:'center', padding:80 }
}
