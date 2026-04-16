import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'
import { sendPushNotification } from '../lib/notifications'

export default function AdminPanel() {
  const { profile } = useAuth()
  const [tab, setTab] = useState('members')
  const [members, setMembers] = useState([])
  const [listings, setListings] = useState([])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState({ members: false, listings: false, messages: false })

  // Sadece aktif sekmeyi yükle
  const fetchMembers = useCallback(async () => {
    if (loaded.members) return
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*')
      .eq('group_id', profile.group_id)
      .order('created_at', { ascending: false })
    setMembers(data || [])
    setLoaded(l => ({...l, members: true}))
    setLoading(false)
  }, [profile?.group_id, loaded.members])

  const fetchListings = useCallback(async () => {
    if (loaded.listings) return
    setLoading(true)
    const { data } = await supabase.from('listings')
      .select('*, profiles!listings_user_id_fkey(full_name, group_id)')
      .order('created_at', { ascending: false })
    setListings((data || []).filter(l => l.profiles?.group_id === profile.group_id))
    setLoaded(l => ({...l, listings: true}))
    setLoading(false)
  }, [profile?.group_id, loaded.listings])

  const fetchMessages = useCallback(async () => {
    if (loaded.messages) return
    setLoading(true)
    const { data } = await supabase.from('messages')
      .select('*, from_profile:profiles!messages_from_user_id_fkey(full_name, company, group_id), listings(title)')
      .order('created_at', { ascending: false })
    setMessages((data || []).filter(m => m.from_profile?.group_id === profile.group_id))
    setLoaded(l => ({...l, messages: true}))
    setLoading(false)
  }, [profile?.group_id, loaded.messages])

  useEffect(() => {
    if (!profile?.group_id) return
    if (tab === 'members') fetchMembers()
    if (tab === 'listings') fetchListings()
    if (tab === 'messages') fetchMessages()
  }, [tab, profile?.group_id])

  const toggleApprove = async (id, cur) => {
    await supabase.from('profiles').update({ is_approved: !cur }).eq('id', id)
    if (!cur) {
      const member = members.find(m => m.id === id)
      if (member?.onesignal_player_id) {
        await sendPushNotification(member.onesignal_player_id, 'Hesabınız Onaylandı — A Takımı', 'Artık platforma giriş yapabilirsiniz.')
      }
    }
    setMembers(ms => ms.map(m => m.id===id ? {...m, is_approved:!cur} : m))
  }

  const deleteListing = async (id) => {
    if (!confirm('Bu ilan silinsin mi?')) return
    const { data: photos } = await supabase.from('listing_photos').select('url').eq('listing_id', id)
    for (const photo of (photos || [])) {
      const path = photo.url.split('/listing-photos/')[1]
      if (path) await supabase.storage.from('listing-photos').remove([path])
    }
    await supabase.from('listing_photos').delete().eq('listing_id', id)
    await supabase.from('messages').delete().eq('listing_id', id)
    await supabase.from('listings').delete().eq('id', id)
    setListings(ls => ls.filter(l => l.id!==id))
  }

  const markRead = async (id) => {
    await supabase.from('messages').update({ is_read: true }).eq('id', id)
    setMessages(ms => ms.map(m => m.id===id ? {...m, is_read:true} : m))
  }

  const pending = members.filter(m => !m.is_approved).length
  const unread = messages.filter(m => !m.is_read).length

  return (
    <div style={s.outer}>
      <div style={s.page}>
        <h1 style={s.title}>Grup Yönetimi</h1>

        {pending > 0 && (
          <div style={s.pendingAlert}>⚠️ <strong>{pending} yeni üye</strong> onay bekliyor</div>
        )}

        <div style={s.tabs}>
          {[['members','👥 Üyeler'],['listings','🏠 İlanlar'],['messages','💬 Mesajlar']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)} style={tab===k ? {...s.tab,...s.tabA} : s.tab}>
              {l}
              {k==='members'&&pending>0&&<span style={s.dot}>{pending}</span>}
              {k==='messages'&&unread>0&&<span style={s.dot}>{unread}</span>}
            </button>
          ))}
        </div>

        {loading && <div style={{textAlign:'center',padding:40,color:'#bbb'}}>Yükleniyor...</div>}

        {!loading && tab === 'members' && (
          <div style={s.list}>
            {members.length===0 && <p style={s.empty}>Henüz üye yok</p>}
            {members.map(m => (
              <div key={m.id} style={{...s.card, borderLeft: !m.is_approved ? '3px solid #c8410a' : '3px solid transparent'}}>
                <div style={s.cardLeft}>
                  <div style={s.avatar}>{(m.full_name||'?')[0]}</div>
                  <div>
                    <p style={s.name}>{m.full_name}</p>
                    <p style={s.meta}>{m.company} · {m.phone}</p>
                    <span style={{...s.badge, background:m.is_approved?'#edf7f0':'#fef0ed', color:m.is_approved?'#1a7a3f':'#c8410a'}}>
                      {m.is_approved ? '✓ Onaylı' : '⏳ Onay Bekliyor'}
                    </span>
                  </div>
                </div>
                <button onClick={() => toggleApprove(m.id, m.is_approved)}
                  style={{...s.actionBtn, background:m.is_approved?'#fef0ed':'#edf7f0', color:m.is_approved?'#c8410a':'#1a7a3f'}}>
                  {m.is_approved ? 'Kaldır' : 'Onayla'}
                </button>
              </div>
            ))}
          </div>
        )}

        {!loading && tab === 'listings' && (
          <div style={s.list}>
            {listings.length===0 && <p style={s.empty}>Henüz ilan yok</p>}
            {listings.map(l => (
              <div key={l.id} style={s.card}>
                <div style={{flex:1,minWidth:0}}>
                  <p style={s.name}>{l.title}</p>
                  <p style={s.meta}>{l.profiles?.full_name} · {l.city}{l.district?`, ${l.district}`:''}</p>
                  {l.price && <p style={{fontSize:14,fontWeight:600,color:'#c8410a',marginTop:4}}>{Number(l.price).toLocaleString('tr-TR')} ₺</p>}
                </div>
                <button onClick={() => deleteListing(l.id)} style={{...s.actionBtn,background:'#fef0ed',color:'#c8410a'}}>Sil</button>
              </div>
            ))}
          </div>
        )}

        {!loading && tab === 'messages' && (
          <div style={s.list}>
            {messages.length===0 && <p style={s.empty}>Mesaj yok</p>}
            {messages.map(m => (
              <div key={m.id} style={{...s.msgCard, background:m.is_read?'#fff':'#fffbf0', borderColor:m.is_read?'#ece9e4':'#fde8b0'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                  <p style={{fontSize:14,fontWeight:600,color:'#1a1a1a'}}>{m.from_profile?.full_name} <span style={{fontSize:12,color:'#aaa',fontWeight:400}}>— {m.from_profile?.company}</span></p>
                  <span style={{fontSize:11,color:'#ccc'}}>{new Date(m.created_at).toLocaleDateString('tr-TR')}</span>
                </div>
                <p style={{fontSize:12,color:'#bbb',marginBottom:8}}>📋 {m.listings?.title}</p>
                <p style={{fontSize:14,color:'#555',lineHeight:1.6,background:'#f9f8f6',padding:12,borderRadius:10,marginBottom:m.is_read?0:10}}>{m.content}</p>
                {!m.is_read && <button onClick={() => markRead(m.id)} style={{padding:'5px 14px',border:'1px solid #e0ddd8',borderRadius:7,background:'#fff',cursor:'pointer',fontSize:12,color:'#888'}}>Okundu</button>}
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
  page: { maxWidth:780, margin:'0 auto', padding:'20px 16px 80px' },
  title: { fontSize:20, fontWeight:700, color:'#1a1a1a', marginBottom:14 },
  pendingAlert: { background:'#fef0ed', border:'1px solid #fbd5c8', borderRadius:12, padding:'10px 14px', marginBottom:12, fontSize:13, color:'#c8410a' },
  tabs: { display:'flex', background:'#fff', borderRadius:12, padding:3, marginBottom:14, border:'1px solid #ece9e4', gap:3 },
  tab: { flex:1, padding:'9px 6px', border:'none', background:'transparent', cursor:'pointer', fontSize:12, color:'#aaa', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', gap:4, fontWeight:500 },
  tabA: { background:'#f5f4f0', color:'#1a1a1a', fontWeight:600 },
  dot: { background:'#c8410a', color:'#fff', fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:10 },
  list: { display:'flex', flexDirection:'column', gap:8 },
  empty: { textAlign:'center', padding:'40px 0', color:'#bbb', fontSize:14 },
  card: { background:'#fff', border:'1px solid #ece9e4', borderRadius:12, padding:12, display:'flex', justifyContent:'space-between', alignItems:'center', gap:10 },
  cardLeft: { display:'flex', alignItems:'center', gap:10, flex:1, minWidth:0 },
  avatar: { width:38, height:38, borderRadius:'50%', background:'#fef0ed', color:'#c8410a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700, flexShrink:0 },
  name: { fontSize:13, fontWeight:600, color:'#1a1a1a', marginBottom:2 },
  meta: { fontSize:11, color:'#aaa', marginBottom:4 },
  badge: { fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:5 },
  actionBtn: { padding:'6px 12px', border:'none', borderRadius:8, cursor:'pointer', fontSize:11, fontWeight:600, flexShrink:0, whiteSpace:'nowrap' },
  msgCard: { border:'1px solid', borderRadius:12, padding:12 }
}
