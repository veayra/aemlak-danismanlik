import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminPanel() {
  const [profiles, setProfiles] = useState([])
  const [messages, setMessages] = useState([])
  const [listings, setListings] = useState([])
  const [tab, setTab] = useState('users')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    const [{ data: p }, { data: m }, { data: l }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('messages').select('*, profiles(full_name, phone, company), listings(title)').order('created_at', { ascending: false }),
      supabase.from('listings').select('*, profiles(full_name, company)').order('created_at', { ascending: false })
    ])
    setProfiles(p || []); setMessages(m || []); setListings(l || [])
    setLoading(false)
  }

  const toggleApprove = async (id, cur) => {
    await supabase.from('profiles').update({ is_approved: !cur }).eq('id', id)
    setProfiles(ps => ps.map(p => p.id===id ? {...p, is_approved:!cur} : p))
  }
  const toggleAdmin = async (id, cur) => {
    await supabase.from('profiles').update({ is_admin: !cur }).eq('id', id)
    setProfiles(ps => ps.map(p => p.id===id ? {...p, is_admin:!cur} : p))
  }
  const markRead = async (id) => {
    await supabase.from('messages').update({ is_read: true }).eq('id', id)
    setMessages(ms => ms.map(m => m.id===id ? {...m, is_read:true} : m))
  }
  const deleteListing = async (id) => {
    if (!confirm('Silmek istiyor musunuz?')) return
    await supabase.from('listings').delete().eq('id', id)
    setListings(ls => ls.filter(l => l.id!==id))
  }

  if (loading) return <div style={{textAlign:'center',padding:80,color:'#aaa',background:'#f5f4f0',minHeight:'100vh'}}>Yükleniyor...</div>

  const pending = profiles.filter(p => !p.is_approved).length
  const unread = messages.filter(m => !m.is_read).length

  return (
    <div style={s.outer}>
      <div style={s.page}>
        <h1 style={s.title}>Admin Paneli</h1>

        <div style={s.stats}>
          {[
            { l:'Emlakçı', v: profiles.length, icon:'👥' },
            { l:'Bekleyen', v: pending, icon:'⏳', warn: pending>0 },
            { l:'İlan', v: listings.length, icon:'🏠' },
            { l:'Mesaj', v: unread, icon:'💬', warn: unread>0 },
          ].map(st => (
            <div key={st.l} style={s.stat}>
              <span style={s.statIcon}>{st.icon}</span>
              <span style={{...s.statV, color: st.warn ? '#c8410a' : '#1a1a1a'}}>{st.v}</span>
              <span style={s.statL}>{st.l}</span>
            </div>
          ))}
        </div>

        <div style={s.tabs}>
          {[['users','Emlakçılar',pending],['messages','Mesajlar',unread],['listings','İlanlar',0]].map(([k,l,badge]) => (
            <button key={k} onClick={() => setTab(k)} style={tab===k ? {...s.tab,...s.tabA} : s.tab}>
              {l} {badge>0 && <span style={s.dot}>{badge}</span>}
            </button>
          ))}
        </div>

        {tab === 'users' && (
          <div style={s.cards}>
            {profiles.map(p => (
              <div key={p.id} style={s.userCard}>
                <div style={s.userAvatar}>{(p.full_name||'?')[0].toUpperCase()}</div>
                <div style={s.userInfo}>
                  <p style={s.userName}>{p.full_name}</p>
                  <p style={s.userMeta}>{p.company || '—'} • {p.phone || '—'}</p>
                  <p style={s.userDate}>{new Date(p.created_at).toLocaleDateString('tr-TR')}</p>
                </div>
                <div style={s.userActions}>
                  <span style={p.is_approved ? s.approvedBadge : s.pendingBadge}>
                    {p.is_approved ? 'Onaylı' : 'Bekliyor'}
                  </span>
                  {p.is_admin && <span style={s.adminBadge}>Admin</span>}
                  <div style={{display:'flex',gap:6,marginTop:6}}>
                    <button onClick={() => toggleApprove(p.id, p.is_approved)} style={p.is_approved ? s.btnRed : s.btnGreen}>
                      {p.is_approved ? 'Kaldır' : 'Onayla'}
                    </button>
                    <button onClick={() => toggleAdmin(p.id, p.is_admin)} style={s.btnGray}>
                      {p.is_admin ? 'Adminİ Al' : 'Admin'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'messages' && (
          <div style={s.cards}>
            {messages.length===0 && <p style={s.empty}>Henüz mesaj yok.</p>}
            {messages.map(m => (
              <div key={m.id} style={{...s.msgCard, background: m.is_read ? '#fff' : '#fffbf0', borderColor: m.is_read ? '#ece9e4' : '#fde8b0'}}>
                <div style={s.msgTop}>
                  <div>
                    <span style={s.msgName}>{m.profiles?.full_name}</span>
                    {!m.is_read && <span style={s.newBadge}>Yeni</span>}
                  </div>
                  <span style={s.msgDate}>{new Date(m.created_at).toLocaleDateString('tr-TR')}</span>
                </div>
                <p style={s.msgMeta}>{m.profiles?.company} • {m.profiles?.phone}</p>
                <p style={s.msgIlan}>📋 {m.listings?.title}</p>
                <p style={s.msgContent}>{m.content}</p>
                {!m.is_read && <button onClick={() => markRead(m.id)} style={s.readBtn}>Okundu İşaretle</button>}
              </div>
            ))}
          </div>
        )}

        {tab === 'listings' && (
          <div style={s.cards}>
            {listings.map(l => (
              <div key={l.id} style={s.listingCard}>
                <div style={s.listingInfo}>
                  <p style={s.listingTitle}>{l.title}</p>
                  <p style={s.listingMeta}>{l.profiles?.full_name} • {l.city || '—'} • {l.type}</p>
                  {l.price && <p style={s.listingPrice}>{Number(l.price).toLocaleString('tr-TR')} ₺</p>}
                </div>
                <button onClick={() => deleteListing(l.id)} style={s.btnRed}>Sil</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  outer: { background:'#f5f4f0', minHeight:'100vh' },
  page: { maxWidth:780, margin:'0 auto', padding:'24px 20px 80px' },
  title: { fontSize:22, fontWeight:700, color:'#1a1a1a', marginBottom:20 },
  stats: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:24 },
  stat: { background:'#fff', border:'1px solid #ece9e4', borderRadius:12, padding:'14px 8px', display:'flex', flexDirection:'column', alignItems:'center', gap:2, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' },
  statIcon: { fontSize:20 },
  statV: { fontSize:24, fontWeight:700 },
  statL: { fontSize:10, color:'#bbb', textTransform:'uppercase', letterSpacing:'0.5px' },
  tabs: { display:'flex', background:'#fff', borderRadius:12, padding:4, marginBottom:16, gap:4, border:'1px solid #ece9e4' },
  tab: { flex:1, padding:'9px 8px', border:'none', background:'transparent', cursor:'pointer', fontSize:13, color:'#aaa', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', gap:5 },
  tabA: { background:'#f5f4f0', color:'#1a1a1a', fontWeight:600 },
  dot: { background:'#c8410a', color:'#fff', fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:10 },
  cards: { display:'flex', flexDirection:'column', gap:10 },
  userCard: { background:'#fff', border:'1px solid #ece9e4', borderRadius:14, padding:14, display:'flex', gap:12, alignItems:'flex-start', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' },
  userAvatar: { width:42, height:42, borderRadius:'50%', background:'#fef0ed', border:'2px solid #fbd5c8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, color:'#c8410a', flexShrink:0 },
  userInfo: { flex:1, minWidth:0 },
  userName: { fontSize:14, fontWeight:600, color:'#1a1a1a', marginBottom:3 },
  userMeta: { fontSize:12, color:'#aaa', marginBottom:2 },
  userDate: { fontSize:11, color:'#ccc' },
  userActions: { display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 },
  approvedBadge: { fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:6, background:'#edf7f0', color:'#1a7a3f' },
  pendingBadge: { fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:6, background:'#fffbf0', color:'#d4800a' },
  adminBadge: { fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:6, background:'#e8f0fb', color:'#1a5fb4' },
  btnGreen: { padding:'5px 12px', border:'none', borderRadius:7, background:'#edf7f0', color:'#1a7a3f', cursor:'pointer', fontSize:12, fontWeight:600 },
  btnRed: { padding:'5px 12px', border:'none', borderRadius:7, background:'#fef0ed', color:'#c8410a', cursor:'pointer', fontSize:12 },
  btnGray: { padding:'5px 12px', border:'none', borderRadius:7, background:'#f5f4f0', color:'#888', cursor:'pointer', fontSize:12 },
  msgCard: { border:'1px solid', borderRadius:14, padding:14 },
  msgTop: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 },
  msgName: { fontSize:14, fontWeight:600, color:'#1a1a1a', marginRight:8 },
  newBadge: { fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:5, background:'#fffbf0', color:'#d4800a', border:'1px solid #fde8b0' },
  msgDate: { fontSize:11, color:'#ccc' },
  msgMeta: { fontSize:12, color:'#aaa', marginBottom:6 },
  msgIlan: { fontSize:12, color:'#bbb', marginBottom:8 },
  msgContent: { fontSize:14, color:'#555', lineHeight:1.6, background:'#f5f4f0', padding:12, borderRadius:10, marginBottom:10 },
  readBtn: { padding:'6px 14px', border:'1px solid #e0ddd8', borderRadius:8, background:'#fff', cursor:'pointer', fontSize:12, color:'#888' },
  listingCard: { background:'#fff', border:'1px solid #ece9e4', borderRadius:14, padding:14, display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' },
  listingInfo: { flex:1, minWidth:0 },
  listingTitle: { fontSize:14, fontWeight:600, color:'#1a1a1a', marginBottom:3 },
  listingMeta: { fontSize:12, color:'#aaa', marginBottom:4 },
  listingPrice: { fontSize:13, fontWeight:600, color:'#c8410a' },
  empty: { textAlign:'center', padding:40, color:'#ccc' }
}
