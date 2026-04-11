import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'

const TYPE_LABEL = { ev:'Konut', isyeri:'İş Yeri', arsa:'Arsa' }
const TYPE_COLOR = { ev:'#c8410a', isyeri:'#1a5fb4', arsa:'#1a7a3f' }
const TYPE_BG = { ev:'#fef0ed', isyeri:'#e8f0fb', arsa:'#edf7f0' }
const EXPIRE_DAYS = 60

export default function Dashboard() {
  const { profile } = useAuth()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('hepsi')
  const [sort, setSort] = useState('yeni')
  const [search, setSearch] = useState('')

  useEffect(() => { fetchListings() }, [])

  const fetchListings = async () => {
    const { data } = await supabase
      .from('listings').select('*, listing_photos(url)')
      .eq('is_active', true).order('created_at', { ascending: false })
    const now = new Date()
    const active = []
    for (const l of (data || [])) {
      const diffDays = (now - new Date(l.created_at)) / (1000*60*60*24)
      if (diffDays > EXPIRE_DAYS) {
        await supabase.from('listings').update({ is_active: false }).eq('id', l.id)
      } else { active.push(l) }
    }
    setListings(active)
    setLoading(false)
  }

  const daysLeft = (ca) => Math.max(0, EXPIRE_DAYS - Math.floor((new Date() - new Date(ca)) / (1000*60*60*24)))

  const sorted = [...listings]
    .filter(l => filter === 'hepsi' || l.type === filter)
    .filter(l => !search || l.title?.toLowerCase().includes(search.toLowerCase()) || l.city?.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => {
      if (sort==='yeni') return new Date(b.created_at)-new Date(a.created_at)
      if (sort==='eski') return new Date(a.created_at)-new Date(b.created_at)
      if (sort==='dusuk') return (a.price||0)-(b.price||0)
      if (sort==='yuksek') return (b.price||0)-(a.price||0)
      return 0
    })

  return (
    <div style={s.outer}>
      <div style={s.page}>
        <div style={s.header}>
          <div>
            <p style={s.greeting}>Merhaba, {profile?.full_name?.split(' ')[0]} 👋</p>
            <h1 style={s.headerTitle}>Aktif İlanlar</h1>
          </div>
          <Link to="/ilan/yeni" style={s.addBtnTop}>+ İlan Ekle</Link>
        </div>

        <div style={s.searchWrap}>
          <svg style={s.searchIcon} width="15" height="15" fill="none" stroke="#aaa" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input style={s.searchInput} placeholder="Şehir, ilçe veya başlık ara..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div style={s.filterWrap}>
          {['hepsi','ev','isyeri','arsa'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{...s.filter, ...(filter===f ? {background: f==='hepsi'?'#c8410a':TYPE_COLOR[f], color:'#fff', borderColor:'transparent'} : {})}}>
              {f === 'hepsi' ? 'Tümü' : TYPE_LABEL[f]}
            </button>
          ))}
        </div>

        <div style={s.sortRow}>
          <span style={s.countTxt}>{sorted.length} ilan</span>
          <select style={s.sortSelect} value={sort} onChange={e => setSort(e.target.value)}>
            <option value="yeni">En yeni</option>
            <option value="eski">En eski</option>
            <option value="dusuk">Fiyat (düşük)</option>
            <option value="yuksek">Fiyat (yüksek)</option>
          </select>
        </div>

        {loading ? (
          <div style={s.list}>{[1,2,3].map(i=><div key={i} style={s.skeleton}/>)}</div>
        ) : sorted.length === 0 ? (
          <div style={s.empty}>
            <p style={{fontSize:36,marginBottom:8}}>🏠</p>
            <p style={{color:'#bbb',fontSize:14}}>Henüz ilan yok.</p>
          </div>
        ) : (
          <div style={s.list}>
            {sorted.map(l => {
              const dl = daysLeft(l.created_at)
              return (
                <Link key={l.id} to={`/ilan/${l.id}`} style={s.card}>
                  <div style={s.imgBox}>
                    {l.listing_photos?.[0]
                      ? <img src={l.listing_photos[0].url} alt="" style={s.img} />
                      : <div style={s.noImg}>
                          <svg width="24" height="24" fill="none" stroke="#ddd" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        </div>
                    }
                  </div>
                  <div style={s.info}>
                    <div style={s.badgeRow}>
                      <span style={{...s.badge, color:TYPE_COLOR[l.type], background:TYPE_BG[l.type]}}>{TYPE_LABEL[l.type]}</span>
                      {dl <= 14 && <span style={s.expireBadge}>{dl}g kaldı</span>}
                      <span style={s.dateSmall}>{new Date(l.created_at).toLocaleDateString('tr-TR')}</span>
                    </div>
                    <p style={s.cardTitle}>{l.title}</p>
                    {l.city && <p style={s.loc}>📍 {l.city}{l.district ? `, ${l.district}` : ''}</p>}
                    {l.price
                      ? <p style={s.price}>{Number(l.price).toLocaleString('tr-TR')} ₺</p>
                      : <p style={s.noPrice}>Fiyat belirtilmemiş</p>
                    }
                  </div>
                  <svg width="14" height="14" fill="none" stroke="#ccc" strokeWidth="2.5" viewBox="0 0 24 24" style={{flexShrink:0}}><polyline points="9 18 15 12 9 6"/></svg>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" style={s.waBtn}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>
    </div>
  )
}

const s = {
  outer: { background:'#f5f4f0', minHeight:'100vh', position:'relative' },
  page: { maxWidth:780, margin:'0 auto', padding:'24px 20px 80px' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 },
  greeting: { fontSize:12, color:'#aaa', marginBottom:2 },
  headerTitle: { fontSize:24, fontWeight:700, color:'#1a1a1a' },
  addBtnTop: { background:'#c8410a', color:'#fff', padding:'9px 18px', borderRadius:10, textDecoration:'none', fontSize:13, fontWeight:600, whiteSpace:'nowrap' },
  searchWrap: { position:'relative', marginBottom:12 },
  searchIcon: { position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' },
  searchInput: { width:'100%', padding:'12px 16px 12px 38px', background:'#fff', border:'1px solid #e8e5e0', borderRadius:12, fontSize:14, color:'#1a1a1a', outline:'none', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' },
  filterWrap: { display:'flex', gap:8, marginBottom:12, overflowX:'auto', paddingBottom:2 },
  filter: { padding:'8px 18px', border:'1px solid #e0ddd8', borderRadius:20, background:'#fff', cursor:'pointer', fontSize:13, color:'#888', whiteSpace:'nowrap', flexShrink:0 },
  sortRow: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  countTxt: { fontSize:12, color:'#bbb' },
  sortSelect: { background:'#fff', border:'1px solid #e0ddd8', borderRadius:8, color:'#888', fontSize:13, padding:'6px 10px', outline:'none', cursor:'pointer' },
  list: { display:'flex', flexDirection:'column', gap:8 },
  card: { display:'flex', alignItems:'center', gap:14, background:'#fff', border:'1px solid #ece9e4', borderRadius:14, padding:14, textDecoration:'none', color:'inherit', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' },
  imgBox: { width:100, height:80, borderRadius:10, overflow:'hidden', background:'#f5f4f0', flexShrink:0 },
  img: { width:'100%', height:'100%', objectFit:'cover', display:'block' },
  noImg: { width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' },
  info: { flex:1, minWidth:0 },
  badgeRow: { display:'flex', alignItems:'center', gap:6, marginBottom:6, flexWrap:'wrap' },
  badge: { fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:6 },
  expireBadge: { fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:6, background:'#fff8e6', color:'#d4800a' },
  dateSmall: { fontSize:11, color:'#bbb' },
  cardTitle: { fontSize:14, fontWeight:600, color:'#1a1a1a', marginBottom:4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  loc: { fontSize:12, color:'#aaa', marginBottom:4 },
  price: { fontSize:16, fontWeight:700, color:'#1a1a1a' },
  noPrice: { fontSize:12, color:'#ccc' },
  skeleton: { height:108, background:'#fff', borderRadius:14, border:'1px solid #ece9e4' },
  empty: { textAlign:'center', padding:'60px 0' },
  waBtn: { position:'fixed', bottom:80, right:20, width:52, height:52, borderRadius:'50%', background:'#25d366', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, textDecoration:'none', boxShadow:'0 4px 16px rgba(37,211,102,0.4)' }
}
