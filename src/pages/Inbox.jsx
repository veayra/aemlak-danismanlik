import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'

export default function Inbox() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('gelen')

  useEffect(() => { fetchMessages() }, [tab])

  const fetchMessages = async () => {
    setLoading(true)
    let query = supabase.from('messages')
      .select('*, listings(title, type), from_profile:profiles!messages_from_user_id_fkey(full_name, company), to_profile:profiles!messages_to_user_id_fkey(full_name)')
      .order('created_at', { ascending: false })

    if (tab === 'gelen') query = query.eq('to_user_id', user.id)
    else query = query.eq('from_user_id', user.id)

    const { data } = await query
    setMessages(data || [])
    setLoading(false)

    // Gelen mesajları okundu işaretle
    if (tab === 'gelen') {
      await supabase.from('messages').update({ is_read: true }).eq('to_user_id', user.id).eq('is_read', false)
    }
  }

  return (
    <div style={s.outer}>
      <div style={s.page}>
        <h1 style={s.title}>Mesaj Kutum</h1>

        <div style={s.tabs}>
          <button onClick={() => setTab('gelen')} style={tab==='gelen' ? {...s.tab,...s.tabA} : s.tab}>Gelen</button>
          <button onClick={() => setTab('giden')} style={tab==='giden' ? {...s.tab,...s.tabA} : s.tab}>Giden</button>
        </div>

        {loading ? (
          <div style={s.loading}>Yükleniyor...</div>
        ) : messages.length === 0 ? (
          <div style={s.empty}>
            <p style={{fontSize:36,marginBottom:8}}>📭</p>
            <p style={{color:'#bbb',fontSize:14}}>Henüz mesaj yok</p>
          </div>
        ) : (
          <div style={s.list}>
            {messages.map(m => (
              <div key={m.id} style={{...s.card, background: !m.is_read && tab==='gelen' ? '#fffbf0' : '#fff', borderColor: !m.is_read && tab==='gelen' ? '#fde8b0' : '#ece9e4'}}>
                <div style={s.cardTop}>
                  <div>
                    {tab === 'gelen'
                      ? <p style={s.name}>{m.from_profile?.full_name} <span style={s.company}>— {m.from_profile?.company}</span></p>
                      : <p style={s.name}>→ {m.to_profile?.full_name}</p>
                    }
                    <p style={s.listing}>📋 {m.listings?.title}</p>
                  </div>
                  <div style={{textAlign:'right'}}>
                    {!m.is_read && tab==='gelen' && <span style={s.newBadge}>Yeni</span>}
                    <p style={s.date}>{new Date(m.created_at).toLocaleDateString('tr-TR')}</p>
                  </div>
                </div>
                <p style={s.content}>{m.content}</p>
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
  title: { fontSize:22, fontWeight:700, color:'#1a1a1a', marginBottom:16 },
  tabs: { display:'flex', background:'#fff', borderRadius:12, padding:4, marginBottom:16, border:'1px solid #ece9e4' },
  tab: { flex:1, padding:'9px', border:'none', background:'transparent', cursor:'pointer', fontSize:14, color:'#aaa', borderRadius:9, fontWeight:500 },
  tabA: { background:'#f5f4f0', color:'#1a1a1a', fontWeight:600 },
  list: { display:'flex', flexDirection:'column', gap:8 },
  card: { border:'1px solid', borderRadius:14, padding:16, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' },
  cardTop: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 },
  name: { fontSize:14, fontWeight:600, color:'#1a1a1a', marginBottom:3 },
  company: { fontSize:12, color:'#aaa', fontWeight:400 },
  listing: { fontSize:12, color:'#bbb' },
  content: { fontSize:14, color:'#555', lineHeight:1.6, background:'#f9f8f6', padding:12, borderRadius:10 },
  newBadge: { display:'inline-block', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:6, background:'#fffbf0', color:'#d4800a', border:'1px solid #fde8b0', marginBottom:4 },
  date: { fontSize:11, color:'#ccc' },
  loading: { textAlign:'center', padding:60, color:'#aaa' },
  empty: { textAlign:'center', padding:'60px 0' }
}
