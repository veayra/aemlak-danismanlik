import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'

const TYPE_LABEL = { ev:'Konut', isyeri:'İş Yeri', arsa:'Arsa' }
const TYPE_COLOR = { ev:'#c8410a', isyeri:'#1a5fb4', arsa:'#1a7a3f' }
const TYPE_BG = { ev:'#fef0ed', isyeri:'#e8f0fb', arsa:'#edf7f0' }
const EXPIRE_DAYS = 90

export default function Dashboard() {
  const { profile } = useAuth()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('hepsi')
  const [sort, setSort] = useState('yeni')
  const [search, setSearch] = useState('')

  useEffect(() => { fetchListings() }, [])

  const fetchListings = async () => {
    const { data } = await supabase.from('listings').select('*, listing_photos(url)').eq('is_active', true).order('created_at', { ascending: false })
    const now = new Date()
    const active = []
    for (const l of (data || [])) {
      if ((now - new Date(l.created_at)) / (1000*60*60*24) > EXPIRE_DAYS) {
        await supabase.from('listings').update({ is_active: false }).eq('id', l.id)
      } else active.push(l)
    }
    setListings(active)
    setLoading(false)
  }

  const daysLeft = (ca) => Math.max(0, EXPIRE_DAYS - Math.floor((new Date() - new Date(ca)) / (1000*60*60*24)))

  const sorted = [...listings]
    .filter(l => filter==='hepsi' || l.type===filter)
    .filter(l => !search || l.title?.toLowerCase().includes(search.toLowerCase()) || l.city?.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => {
      if (sort==='yeni') return new Date(b.created_at)-new Date(a.created_at)
      if (sort==='eski') return new Date(a.created_at)-new Date(b.created_at)
      if (sort==='dusuk') return (a.price||0)-(b.price||0)
      if (sort==='yuksek') return (b.price||0)-(a.price||0)
      return 0
    })

  return (
    <>
      <style>{`
        .dp { background:#f5f4f0; min-height:100vh; max-width:900px; margin:0 auto; padding:0 0 80px; }
        .dp-hero { background:#fff; border-bottom:1px solid #ece9e4; padding:20px 20px 18px; }
        .dp-hero-top { display:flex; justify-content:space-between; align-items:flex-start; }
        .dp-greet { font-size:12px; color:#bbb; margin-bottom:3px; }
        .dp-title { font-size:22px; font-weight:700; color:#1a1a1a; }
        .dp-add { background:#c8410a; color:#fff; padding:10px 18px; border-radius:10px; text-decoration:none; font-size:13px; font-weight:600; white-space:nowrap; flex-shrink:0; }
        .dp-ctrl { display:flex; gap:8px; padding:14px 16px; align-items:center; }
        .dp-sw { position:relative; flex:1; }
        .dp-si { position:absolute; left:11px; top:50%; transform:translateY(-50%); pointer-events:none; }
        .dp-search { width:100%; padding:10px 14px 10px 34px; background:#fff; border:1px solid #e0ddd8; border-radius:10px; font-size:14px; color:#1a1a1a; outline:none; box-sizing:border-box; }
        .dp-sort { background:#fff; border:1px solid #e0ddd8; border-radius:10px; color:#888; font-size:13px; padding:9px 12px; outline:none; cursor:pointer; flex-shrink:0; }
        .dp-filters { display:flex; gap:7px; padding:0 16px 12px; overflow-x:auto; }
        .dp-f { padding:7px 15px; border:1px solid #e0ddd8; border-radius:20px; background:#fff; cursor:pointer; font-size:13px; color:#888; white-space:nowrap; flex-shrink:0; font-weight:500; }
        .dp-f.on { border-color:transparent; color:#fff; }
        .dp-count { font-size:11px; color:#bbb; padding:0 16px 10px; }
        .dp-list { display:flex; flex-direction:column; gap:1px; }
        .dp-card { display:flex; background:#fff; border-bottom:1px solid #f0ede8; text-decoration:none; color:inherit; }
        .dp-img { width:110px; height:90px; flex-shrink:0; position:relative; overflow:hidden; background:#f0ede8; }
        .dp-img img { width:100%; height:100%; object-fit:cover; display:block; }
        .dp-noimg { width:100%; height:100%; display:flex; align-items:center; justify-content:center; }
        .dp-type { position:absolute; bottom:6px; left:6px; font-size:9px; font-weight:700; padding:2px 7px; border-radius:5px; }
        .dp-body { flex:1; padding:12px 10px 12px 12px; min-width:0; display:flex; flex-direction:column; justify-content:space-between; }
        .dp-t { font-size:14px; font-weight:600; color:#1a1a1a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:3px; }
        .dp-loc { font-size:11px; color:#bbb; margin-bottom:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .dp-bot { display:flex; align-items:center; justify-content:space-between; }
        .dp-price { font-size:16px; font-weight:700; color:#1a1a1a; }
        .dp-price span { font-size:12px; color:#bbb; font-weight:400; }
        .dp-noprice { font-size:11px; color:#ccc; }
        .dp-meta { display:flex; align-items:center; gap:6px; }
        .dp-date { font-size:10px; color:#ccc; }
        .dp-exp { font-size:9px; font-weight:700; padding:2px 6px; border-radius:5px; background:#fffbf0; color:#d4800a; border:1px solid #fde8b0; }
        .dp-arr { color:#ddd; flex-shrink:0; padding:0 8px 0 4px; display:flex; align-items:center; }
        .dp-wa { position:fixed; bottom:72px; right:16px; width:50px; height:50px; border-radius:50%; background:#25d366; display:flex; align-items:center; justify-content:center; z-index:200; text-decoration:none; box-shadow:0 4px 16px rgba(37,211,102,0.4); }
        @media(min-width:768px) {
          .dp { padding:0 0 32px; }
          .dp-hero { padding:28px 32px 24px; }
          .dp-ctrl { padding:16px 32px; }
          .dp-filters { padding:0 32px 14px; }
          .dp-count { padding:0 32px 10px; }
          .dp-list { gap:6px; padding:0 32px; }
          .dp-card { border-radius:12px; border:1px solid #ece9e4 !important; border-bottom:1px solid #ece9e4 !important; box-shadow:0 1px 4px rgba(0,0,0,0.04); }
          .dp-img { width:130px; height:100px; }
          .dp-t { font-size:15px; }
          .dp-price { font-size:18px; }
          .dp-title { font-size:26px; }
          .dp-wa { bottom:20px; }
        }
      `}</style>

      <div className="dp">
        <div className="dp-hero">
          <div className="dp-hero-top">
            <div>
              <p className="dp-greet">Hoş geldiniz, {profile?.full_name?.split(' ')[0]} 👋</p>
              <h1 className="dp-title">Takım Portföyü</h1>
            </div>
            <Link to="/ilan/yeni" className="dp-add">+ İlan Ekle</Link>
          </div>
        </div>

        <div className="dp-ctrl">
          <div className="dp-sw">
            <svg className="dp-si" width="14" height="14" fill="none" stroke="#bbb" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className="dp-search" placeholder="Ara..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <select className="dp-sort" value={sort} onChange={e=>setSort(e.target.value)}>
            <option value="yeni">En yeni</option>
            <option value="eski">En eski</option>
            <option value="dusuk">Fiyat ↑</option>
            <option value="yuksek">Fiyat ↓</option>
          </select>
        </div>

        <div className="dp-filters">
          {[['hepsi','Tümü'],['ev','🏠 Konut'],['isyeri','🏢 İş Yeri'],['arsa','🌱 Arsa']].map(([f,l])=>(
            <button key={f} onClick={()=>setFilter(f)} className={`dp-f${filter===f?' on':''}`}
              style={filter===f ? {background:f==='hepsi'?'#c8410a':TYPE_COLOR[f]} : {}}>
              {l}
            </button>
          ))}
        </div>

        <p className="dp-count">{sorted.length} ilan</p>

        {loading ? (
          <div style={{display:'flex',flexDirection:'column',gap:1}}>
            {[1,2,3,4].map(i=><div key={i} style={{height:90,background:'#fff',borderBottom:'1px solid #f0ede8'}}/>)}
          </div>
        ) : sorted.length===0 ? (
          <div style={{textAlign:'center',padding:'60px 20px'}}>
            <p style={{fontSize:40,marginBottom:12}}>🏠</p>
            <p style={{color:'#bbb',fontSize:14}}>Henüz ilan yok</p>
          </div>
        ) : (
          <div className="dp-list">
            {sorted.map(l => {
              const dl = daysLeft(l.created_at)
              const photo = l.listing_photos?.[0]?.url
              return (
                <Link key={l.id} to={`/ilan/${l.id}`} className="dp-card">
                  <div className="dp-img">
                    {photo ? <img src={photo} alt="" /> : <div className="dp-noimg"><svg width="24" height="24" fill="none" stroke="#ddd" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>}
                    <span className="dp-type" style={{color:TYPE_COLOR[l.type],background:TYPE_BG[l.type]}}>{TYPE_LABEL[l.type]}</span>
                  </div>
                  <div className="dp-body">
                    <div>
                      <p className="dp-t">{l.title}</p>
                      {l.city && <p className="dp-loc">📍 {l.city}{l.district?`, ${l.district}`:''}</p>}
                    </div>
                    <div className="dp-bot">
                      {l.price ? <p className="dp-price">{Number(l.price).toLocaleString('tr-TR')} <span>₺</span></p> : <p className="dp-noprice">Fiyat yok</p>}
                      <div className="dp-meta">
                        {dl<=14 && <span className="dp-exp">{dl}g</span>}
                        <span className="dp-date">{new Date(l.created_at).toLocaleDateString('tr-TR')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="dp-arr"><svg width="14" height="14" fill="none" stroke="#ddd" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg></div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" className="dp-wa">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>
    </>
  )
}
