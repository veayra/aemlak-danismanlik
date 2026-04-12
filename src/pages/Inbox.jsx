import React, { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'

export default function Inbox() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('gelen')
  const [search, setSearch] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => { fetchMessages() }, [tab])

  const fetchMessages = async () => {
    setLoading(true)
    let query = supabase.from('messages')
      .select('*, listings(title, type), from_profile:profiles!messages_from_user_id_fkey(full_name, company), to_profile:profiles!messages_to_user_id_fkey(full_name, company)')
      .order('created_at', { ascending: false })

    if (tab === 'gelen') query = query.eq('to_user_id', user.id)
    else query = query.eq('from_user_id', user.id)

    const { data } = await query
    setMessages(data || [])
    setUnreadCount((data||[]).filter(m => !m.is_read && tab==='gelen').length)
    setLoading(false)

    if (tab === 'gelen') {
      await supabase.from('messages').update({ is_read: true }).eq('to_user_id', user.id).eq('is_read', false)
    }
  }

  const filtered = useMemo(() => {
    if (!search) return messages
    const q = search.toLowerCase()
    return messages.filter(m => {
      const from = m.from_profile?.full_name?.toLowerCase() || ''
      const to = m.to_profile?.full_name?.toLowerCase() || ''
      const listing = m.listings?.title?.toLowerCase() || ''
      const content = m.content?.toLowerCase() || ''
      return from.includes(q) || to.includes(q) || listing.includes(q) || content.includes(q)
    })
  }, [messages, search])

  // Gönderici/alıcıya göre grupla
  const grouped = useMemo(() => {
    const groups = {}
    filtered.forEach(m => {
      const key = tab === 'gelen' ? m.from_user_id : m.to_user_id
      const name = tab === 'gelen' ? m.from_profile?.full_name : m.to_profile?.full_name
      const company = tab === 'gelen' ? m.from_profile?.company : m.to_profile?.company
      if (!groups[key]) groups[key] = { name, company, messages: [], unread: 0 }
      groups[key].messages.push(m)
      if (!m.is_read && tab === 'gelen') groups[key].unread++
    })
    return Object.values(groups)
  }, [filtered, tab])

  const [expanded, setExpanded] = useState(null)

  return (
    <div style={s.outer}>
      <div style={s.page}>
        <div style={s.header}>
          <h1 style={s.title}>Mesaj Kutum</h1>
          {unreadCount > 0 && <span style={s.unreadBadge}>{unreadCount} yeni</span>}
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          <button onClick={() => { setTab('gelen'); setExpanded(null) }} style={tab==='gelen' ? {...s.tab,...s.tabA} : s.tab}>
            Gelen {unreadCount > 0 && tab !== 'gelen' && <span style={s.dot}>{unreadCount}</span>}
          </button>
          <button onClick={() => { setTab('giden'); setExpanded(null) }} style={tab==='giden' ? {...s.tab,...s.tabA} : s.tab}>Giden</button>
        </div>

        {/* Arama */}
        <div style={s.searchWrap}>
          <svg style={s.searchIcon} width="14" height="14" fill="none" stroke="#bbb" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input style={s.searchInput} placeholder="İsim, ilan veya mesaj ara..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')} style={s.clearBtn}>✕</button>}
        </div>

        {loading ? (
          <div style={s.loading}>Yükleniyor...</div>
        ) : grouped.length === 0 ? (
          <div style={s.empty}>
            <p style={{fontSize:36,marginBottom:8}}>📭</p>
            <p style={{color:'#bbb',fontSize:14}}>{search ? 'Sonuç bulunamadı' : 'Henüz mesaj yok'}</p>
          </div>
        ) : (
          <div style={s.list}>
            {grouped.map((g, gi) => (
              <div key={gi}>
                {/* Kişi başlığı */}
                <button onClick={() => setExpanded(expanded===gi ? null : gi)} style={s.personCard}>
                  <div style={s.personAvatar}>{(g.name||'?')[0].toUpperCase()}</div>
                  <div style={s.personInfo}>
                    <p style={s.personName}>{g.name}</p>
                    <p style={s.personCompany}>{g.company} · {g.messages.length} mesaj</p>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    {g.unread > 0 && <span style={s.unreadDot}>{g.unread}</span>}
                    <svg width="16" height="16" fill="none" stroke="#bbb" strokeWidth="2" viewBox="0 0 24 24"
                      style={{transform: expanded===gi ? 'rotate(180deg)' : 'none', transition:'0.2s'}}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </button>

                {/* Mesajlar */}
                {expanded === gi && (
                  <div style={s.msgGroup}>
                    {g.messages.map(m => (
                      <div key={m.id} style={s.msgCard}>
                        <div style={s.msgTop}>
                          <span style={s.msgListing}>📋 {m.listings?.title}</span>
                          <span style={s.msgDate}>{new Date(m.created_at).toLocaleDateString('tr-TR')} {new Date(m.created_at).toLocaleTimeString('tr-TR', {hour:'2-digit',minute:'2-digit'})}</span>
                        </div>
                        <p style={s.msgContent}>{m.content}</p>
                      </div>
                    ))}
                  </div>
                )}
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
  page: { maxWidth:680, margin:'0 auto', padding:'24px 16px 80px' },
  header: { display:'flex', alignItems:'center', gap:12, marginBottom:16 },
  title: { fontSize:22, fontWeight:700, color:'#1a1a1a' },
  unreadBadge: { background:'#c8410a', color:'#fff', fontSize:12, fontWeight:700, padding:'3px 10px', borderRadius:20 },
  tabs: { display:'flex', background:'#fff', borderRadius:12, padding:4, marginBottom:14, border:'1px solid #ece9e4', gap:4 },
  tab: { flex:1, padding:'10px', border:'none', background:'transparent', cursor:'pointer', fontSize:14, color:'#aaa', borderRadius:9, fontWeight:500, display:'flex', alignItems:'center', justifyContent:'center', gap:6 },
  tabA: { background:'#f5f4f0', color:'#1a1a1a', fontWeight:600 },
  dot: { background:'#c8410a', color:'#fff', fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:10 },
  searchWrap: { position:'relative', marginBottom:16 },
  searchIcon: { position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' },
  searchInput: { width:'100%', padding:'11px 36px', background:'#fff', border:'1px solid #e0ddd8', borderRadius:12, fontSize:14, color:'#1a1a1a', outline:'none', boxSizing:'border-box' },
  clearBtn: { position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#bbb', cursor:'pointer', fontSize:14, padding:'2px 4px' },
  list: { display:'flex', flexDirection:'column', gap:6 },
  personCard: { width:'100%', display:'flex', alignItems:'center', gap:12, background:'#fff', border:'1px solid #ece9e4', borderRadius:14, padding:'14px 16px', cursor:'pointer', textAlign:'left', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' },
  personAvatar: { width:44, height:44, borderRadius:'50%', background:'#fef0ed', color:'#c8410a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:700, flexShrink:0 },
  personInfo: { flex:1, minWidth:0 },
  personName: { fontSize:15, fontWeight:600, color:'#1a1a1a', marginBottom:3 },
  personCompany: { fontSize:12, color:'#aaa' },
  unreadDot: { background:'#c8410a', color:'#fff', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:10, flexShrink:0 },
  msgGroup: { background:'#fff', border:'1px solid #ece9e4', borderTop:'none', borderRadius:'0 0 14px 14px', padding:'4px 12px 12px', marginTop:-6, display:'flex', flexDirection:'column', gap:8 },
  msgCard: { background:'#f9f8f6', borderRadius:10, padding:'12px 14px' },
  msgTop: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, flexWrap:'wrap', gap:4 },
  msgListing: { fontSize:12, color:'#aaa', fontWeight:500 },
  msgDate: { fontSize:11, color:'#ccc' },
  msgContent: { fontSize:14, color:'#555', lineHeight:1.6 },
  loading: { textAlign:'center', padding:60, color:'#aaa' },
  empty: { textAlign:'center', padding:'60px 0' }
}
