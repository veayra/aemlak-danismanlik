import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'
import { sendPushNotification } from '../lib/notifications'

export default function Inbox() {
  const { user, profile } = useAuth()
  const [conversations, setConversations] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => { fetchConversations() }, [])
  useEffect(() => { if (selected) fetchMessages(selected) }, [selected])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const fetchConversations = async () => {
    setLoading(true)
    // Gelen ve giden mesajları çek, listing bazında grupla
    const { data } = await supabase
      .from('messages')
      .select('*, listing:listings(id, title, type), from_profile:profiles!messages_from_user_id_fkey(id, full_name, company, onesignal_player_id), to_profile:profiles!messages_to_user_id_fkey(id, full_name, company)')
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    // Listing bazında benzersiz sohbetler oluştur
    const convMap = {}
    for (const m of (data || [])) {
      const key = m.listing_id
      if (!convMap[key]) {
        const otherProfile = m.from_user_id === user.id ? m.to_profile : m.from_profile
        convMap[key] = {
          listing_id: m.listing_id,
          listing: m.listing,
          other: otherProfile,
          last_message: m.content,
          last_date: m.created_at,
          unread: 0
        }
      }
      if (m.to_user_id === user.id && !m.is_read) convMap[key].unread++
    }
    setConversations(Object.values(convMap))
    setLoading(false)
  }

  const fetchMessages = async (conv) => {
    const { data } = await supabase
      .from('messages')
      .select('*, from_profile:profiles!messages_from_user_id_fkey(id, full_name)')
      .eq('listing_id', conv.listing_id)
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .order('created_at', { ascending: true })
    setMessages(data || [])
    // Okundu işaretle
    await supabase.from('messages').update({ is_read: true })
      .eq('listing_id', conv.listing_id)
      .eq('to_user_id', user.id)
    setConversations(cs => cs.map(c => c.listing_id === conv.listing_id ? {...c, unread: 0} : c))
  }

  const sendReply = async () => {
    if (!reply.trim() || !selected) return
    setSending(true)
    const toUserId = selected.other?.id
    await supabase.from('messages').insert({
      from_user_id: user.id,
      to_user_id: toUserId,
      listing_id: selected.listing_id,
      content: reply.trim()
    })
    // Push bildirim gönder
    if (selected.other?.onesignal_player_id) {
      await sendPushNotification(
        selected.other.onesignal_player_id,
        'Yeni Mesaj — A Takımı',
        `${profile?.full_name}: "${selected.listing?.title}" hakkında yanıtladı.`
      )
    }
    setReply('')
    setSending(false)
    fetchMessages(selected)
    fetchConversations()
  }

  const TYPE_COLOR = { ev:'#c8410a', isyeri:'#1a5fb4', arsa:'#1a7a3f' }
  const TYPE_BG = { ev:'#fef0ed', isyeri:'#e8f0fb', arsa:'#edf7f0' }
  const TYPE_LABEL = { ev:'Konut', isyeri:'İş Yeri', arsa:'Arsa' }

  return (
    <div style={s.outer}>
      {/* Mobil: liste veya sohbet */}
      {/* PC: yan yana */}
      <div style={s.layout}>

        {/* Sol — sohbet listesi */}
        <div style={{...s.sidebar, display: selected ? 'none' : 'flex'}} className="conv-list">
          <div style={s.sideHeader}>
            <h1 style={s.title}>Mesajlar</h1>
          </div>
          {loading ? (
            <div style={s.empty}>Yükleniyor...</div>
          ) : conversations.length === 0 ? (
            <div style={s.empty}>
              <p style={{fontSize:32,marginBottom:8}}>📭</p>
              <p style={{color:'#bbb',fontSize:14}}>Henüz mesaj yok</p>
            </div>
          ) : (
            <div style={s.convList}>
              {conversations.map(c => (
                <button key={c.listing_id} onClick={() => setSelected(c)} style={{...s.convItem, background: c.unread>0 ? '#fffbf0' : '#fff', borderColor: c.unread>0 ? '#fde8b0' : '#ece9e4'}}>
                  <div style={s.convAvatar}>{(c.other?.full_name||'?')[0].toUpperCase()}</div>
                  <div style={s.convBody}>
                    <div style={s.convTop}>
                      <span style={s.convName}>{c.other?.full_name || 'Bilinmiyor'}</span>
                      <span style={s.convDate}>{new Date(c.last_date).toLocaleDateString('tr-TR')}</span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
                      <span style={{...s.typePill, color:TYPE_COLOR[c.listing?.type], background:TYPE_BG[c.listing?.type]}}>{TYPE_LABEL[c.listing?.type]}</span>
                      <span style={s.convListing}>{c.listing?.title}</span>
                    </div>
                    <p style={s.convLast}>{c.last_message}</p>
                  </div>
                  {c.unread > 0 && <div style={s.unreadBadge}>{c.unread}</div>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sağ — sohbet ekranı */}
        {selected && (
          <div style={s.chatPane}>
            <div style={s.chatHeader}>
              <button onClick={() => setSelected(null)} style={s.backBtn}>
                <svg width="18" height="18" fill="none" stroke="#1a1a1a" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <div style={s.chatHeaderInfo}>
                <p style={s.chatName}>{selected.other?.full_name}</p>
                <p style={s.chatListing}>{selected.listing?.title}</p>
              </div>
            </div>

            <div style={s.messagesList}>
              {messages.map(m => {
                const isMe = m.from_user_id === user.id
                return (
                  <div key={m.id} style={{...s.msgWrap, justifyContent: isMe ? 'flex-end' : 'flex-start'}}>
                    {!isMe && <div style={s.msgAvatar}>{(m.from_profile?.full_name||'?')[0].toUpperCase()}</div>}
                    <div style={{...s.bubble, background: isMe ? '#c8410a' : '#fff', color: isMe ? '#fff' : '#1a1a1a', borderBottomRightRadius: isMe ? 4 : 16, borderBottomLeftRadius: isMe ? 16 : 4}}>
                      <p style={s.bubbleText}>{m.content}</p>
                      <p style={{...s.bubbleTime, color: isMe ? 'rgba(255,255,255,0.6)' : '#bbb'}}>
                        {new Date(m.created_at).toLocaleTimeString('tr-TR', {hour:'2-digit',minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            <div style={s.replyBar}>
              <textarea
                style={s.replyInput}
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="Mesajınızı yazın..."
                rows={1}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
              />
              <button onClick={sendReply} disabled={sending || !reply.trim()} style={{...s.sendBtn, opacity: (!reply.trim() || sending) ? 0.5 : 1}}>
                <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </div>
        )}

        {/* PC'de sağ taraf boşsa */}
        {!selected && (
          <div style={s.chatEmpty}>
            <p style={{fontSize:40,marginBottom:12}}>💬</p>
            <p style={{color:'#bbb',fontSize:14}}>Bir sohbet seçin</p>
          </div>
        )}
      </div>

      <style>{`
        @media(min-width: 768px) {
          .conv-list { display: flex !important; }
        }
      `}</style>
    </div>
  )
}

const s = {
  outer: { background:'#f5f4f0', minHeight:'100vh' },
  layout: { maxWidth:1000, margin:'0 auto', display:'flex', height:'calc(100vh - 64px)' },
  sidebar: { width:'100%', flexDirection:'column', background:'#fff', borderRight:'1px solid #ece9e4', overflowY:'auto' },
  sideHeader: { padding:'20px 16px 12px', borderBottom:'1px solid #ece9e4', flexShrink:0 },
  title: { fontSize:20, fontWeight:700, color:'#1a1a1a' },
  convList: { flex:1, overflowY:'auto' },
  convItem: { width:'100%', display:'flex', alignItems:'flex-start', gap:12, padding:'14px 16px', border:'none', borderBottom:'1px solid #f0ede8', cursor:'pointer', textAlign:'left', position:'relative' },
  convAvatar: { width:44, height:44, borderRadius:'50%', background:'#fef0ed', color:'#c8410a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, fontWeight:700, flexShrink:0 },
  convBody: { flex:1, minWidth:0 },
  convTop: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 },
  convName: { fontSize:14, fontWeight:600, color:'#1a1a1a' },
  convDate: { fontSize:11, color:'#ccc' },
  typePill: { fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:4, flexShrink:0 },
  convListing: { fontSize:12, color:'#aaa', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  convLast: { fontSize:12, color:'#bbb', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginTop:2 },
  unreadBadge: { width:20, height:20, borderRadius:'50%', background:'#c8410a', color:'#fff', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  chatPane: { flex:1, display:'flex', flexDirection:'column', background:'#f5f4f0' },
  chatHeader: { display:'flex', alignItems:'center', gap:12, padding:'14px 16px', background:'#fff', borderBottom:'1px solid #ece9e4', flexShrink:0 },
  backBtn: { width:36, height:36, borderRadius:10, background:'#f5f4f0', border:'1px solid #e0ddd8', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 },
  chatHeaderInfo: { flex:1, minWidth:0 },
  chatName: { fontSize:15, fontWeight:600, color:'#1a1a1a', marginBottom:1 },
  chatListing: { fontSize:11, color:'#aaa', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  messagesList: { flex:1, overflowY:'auto', padding:'16px 16px', display:'flex', flexDirection:'column', gap:10 },
  msgWrap: { display:'flex', alignItems:'flex-end', gap:8 },
  msgAvatar: { width:28, height:28, borderRadius:'50%', background:'#e8e5e0', color:'#888', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0, marginBottom:2 },
  bubble: { maxWidth:'70%', padding:'10px 14px', borderRadius:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' },
  bubbleText: { fontSize:14, lineHeight:1.55, wordBreak:'break-word' },
  bubbleTime: { fontSize:10, marginTop:4, textAlign:'right' },
  replyBar: { display:'flex', gap:10, padding:'10px 16px', background:'#fff', borderTop:'1px solid #ece9e4', alignItems:'flex-end', flexShrink:0 },
  replyInput: { flex:1, padding:'11px 14px', background:'#f5f4f0', border:'1.5px solid #e0ddd8', borderRadius:12, fontSize:15, color:'#1a1a1a', outline:'none', fontFamily:'inherit', resize:'none', lineHeight:1.5 },
  sendBtn: { width:44, height:44, borderRadius:'50%', background:'#c8410a', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, boxShadow:'0 2px 8px rgba(200,65,10,0.3)' },
  chatEmpty: { flex:1, display:'none', alignItems:'center', justifyContent:'center', flexDirection:'column', background:'#f5f4f0' },
  empty: { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:40 }
}
