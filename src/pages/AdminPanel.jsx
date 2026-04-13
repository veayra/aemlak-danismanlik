import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'
import { sendPushNotification } from '../lib/notifications'

export default function AdminPanel() {
  const { profile } = useAuth()
  const [members, setMembers] = useState([])
  const [listings, setListings] = useState([])
  const [messages, setMessages] = useState([])
  const [tab, setTab] = useState('members')
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (profile?.group_id) fetchAll() }, [profile])

  const fetchAll = async () => {
    const [{ data: m }, { data: l }, { data: msg }] = await Promise.all([
      // Sadece kendi grubundaki üyeler
      supabase.from('profiles').select('*')
        .eq('group_id', profile.group_id)
        .order('created_at', { ascending: false }),
      // Sadece kendi grubundaki ilanlar
      supabase.from('listings').select('*, profiles!listings_user_id_fkey(full_name, group_id)')
        .order('created_at', { ascending: false }),
      // Mesajlar — kendi grubuna ait
      supabase.from('messages')
        .select('*, from_profile:profiles!messages_from_user_id_fkey(full_name, company, group_id), listings(title)')
        .order('created_at', { ascending: false })
    ])

    setMembers(m || [])
    // Sadece kendi grubundaki kullanıcıların ilanları
    setListings((l || []).filter(listing => listing.profiles?.group_id === profile.group_id))
    // Sadece kendi grubundaki mesajlar
    setMessages((msg || []).filter(message => message.from_profile?.group_id === profile.group_id))
    setLoading(false)
  }

  const toggleApprove = async (id, cur) => {
    await supabase.from('profiles').update({ is_approved: !cur }).eq('id', id)
    // Onaylanınca kullanıcıya bildirim gönder
    if (!cur) {
      const member = members.find(m => m.id === id)
      if (member?.onesignal_player_id) {
        await sendPushNotification(
          member.onesignal_player_id,
          'Hesabınız Onaylandı — A Takımı',
          'Hesabınız onaylandı! Artık platforma giriş yapabilirsiniz.'
        )
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

  if (loading) return <div style={{textAlign:'center',padding:80,color:'#aaa',background:'#f5f4f0',minHeight:'100vh'}}>Yükleniyor...</div>

  const pending = members.filter(m => !m.is_approved).length
  const unread = messages.filter(m => !m.is_read).length

  return (
    <div style={s.outer}>
      <div style={s.page}>
        <h1 style={s.title}>Grup Yönetimi</h1>

        <div style={s.stats}>
          {[
            { l:'Üye', v:members.length, icon:'👥' },
            { l:'Bekleyen', v:pending, icon:'⏳', warn:pending>0 },
            { l:'İlan', v:listings.length, icon:'🏠' },
            { l:'Mesaj', v:unread, icon:'💬', warn:unread>0 },
          ].map(st => (
            <div key={st.l} style={s.stat}>
              <span style={{fontSize:20}}>{st.icon}</span>
              <span style={{...s.statV, color:st.warn?'#c8410a':'#1a1a1a'}}>{st.v}</span>
              <span style={s.statL}>{st.l}</span>
            </div>
          ))}
        </div>

        {pending > 0 && (
          <div style={s.pendingAlert}>
            ⚠️ <strong>{pending} yeni üye</strong> onay bekliyor
          </div>
        )}

        <div style={s.tabs}>
          {[['members','Üyeler'],['listings','İlanlar'],['messages','Mesajlar']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)} style={tab===k ? {...s.tab,...s.tabA} : s.tab}>
              {l} {k==='members'&&pending>0&&<span style={s.dot}>{pending}</span>}
              {k==='messages'&&unread>0&&<span style={s.dot}>{unread}</span>}
            </button>
          ))}
        </div>

        {tab === 'members' && (
          <div style={s.list}>
            {members.length===0 && <p style={{textAlign:'center',padding:40,color:'#bbb'}}>Henüz üye yok</p>}
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

        {tab === 'listings' && (
          <div style={s.list}>
            {listings.length===0 && <p style={{textAlign:'center',padding:40,color:'#bbb'}}>Henüz ilan yok</p>}
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

        {tab === 'messages' && (
          <div style={s.list}>
            {messages.length===0 && <p style={{textAlign:'center',padding:40,color:'#bbb'}}>Mesaj yok</p>}
            {messages.map(m => (
              <div key={m.id} style={{...s.msgCard, background:m.is_read?'#fff':'#fffbf0', borderColor:m.is_read?'#ece9e4':'#fde8b0'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                  <p style={{fontSize:14,fontWeight:600,color:'#1a1a1a'}}>{m.from_profile?.full_name} <span style={{fontSize:12,color:'#aaa',fontWeight:400}}>— {m.from_profile?.company}</span></p>
                  <span style={{fontSize:11,color:'#ccc'}}>{new Date(m.created_at).toLocaleDateString('tr-TR')}</span>
                </div>
                <p style={{fontSize:12,color:'#bbb',marginBottom:8}}>📋 {m.listings?.title}</p>
                <p style={{fontSize:14,color:'#555',lineHeight:1.6,background:'#f9f8f6',padding:12,borderRadius:10,marginBottom:m.is_read?0:10}}>{m.content}</p>
                {!m.is_read && <button onClick={() => markRead(m.id)} style={{padding:'5px 14px',border:'1px solid #e0ddd8',borderRadius:7,background:'#fff',cursor:'pointer',fontSize:12,color:'#888'}}>Okundu İşaretle</button>}
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
  stats: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 },
  stat: { background:'#fff', border:'1px solid #ece9e4', borderRadius:12, padding:'14px 8px', display:'flex', flexDirection:'column', alignItems:'center', gap:2 },
  statV: { fontSize:24, fontWeight:700 },
  statL: { fontSize:10, color:'#bbb', textTransform:'uppercase' },
  pendingAlert: { background:'#fef0ed', border:'1px solid #fbd5c8', borderRadius:12, padding:'12px 16px', marginBottom:16, fontSize:14, color:'#c8410a' },
  tabs: { display:'flex', background:'#fff', borderRadius:12, padding:4, marginBottom:16, border:'1px solid #ece9e4', gap:4 },
  tab: { flex:1, padding:'9px', border:'none', background:'transparent', cursor:'pointer', fontSize:13, color:'#aaa', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', gap:5 },
  tabA: { background:'#f5f4f0', color:'#1a1a1a', fontWeight:600 },
  dot: { background:'#c8410a', color:'#fff', fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:10 },
  list: { display:'flex', flexDirection:'column', gap:8 },
  card: { background:'#fff', border:'1px solid #ece9e4', borderRadius:14, padding:14, display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 },
  cardLeft: { display:'flex', alignItems:'center', gap:12, flex:1, minWidth:0 },
  avatar: { width:40, height:40, borderRadius:'50%', background:'#fef0ed', color:'#c8410a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, flexShrink:0 },
  name: { fontSize:14, fontWeight:600, color:'#1a1a1a', marginBottom:2 },
  meta: { fontSize:12, color:'#aaa', marginBottom:4 },
  badge: { fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:5 },
  actionBtn: { padding:'7px 14px', border:'none', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600, flexShrink:0 },
  msgCard: { border:'1px solid', borderRadius:14, padding:14 }
}
