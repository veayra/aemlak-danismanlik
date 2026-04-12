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
    const { data } = await supabase
      .from('messages')
      .select('*, listing:listings(id,title,type), from_profile:profiles!messages_from_user_id_fkey(id,full_name,company,onesignal_player_id), to_profile:profiles!messages_to_user_id_fkey(id,full_name,company,onesignal_player_id)')
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    const convMap = {}
    for (const m of (data || [])) {
      const key = m.listing_id
      if (!convMap[key]) {
        const otherProfile = m.from_user_id === user.id ? m.to_profile : m.from_profile
        convMap[key] = { listing_id: m.listing_id, listing: m.listing, other: otherProfile, last_message: m.content, last_date: m.created_at, unread: 0 }
      }
      if (m.to_user_id === user.id && !m.is_read) convMap[key].unread++
    }
    setConversations(Object.values(convMap))
    setLoading(false)
  }

  const fetchMessages = async (conv) => {
    const { data } = await supabase
      .from('messages')
      .select('*, from_profile:profiles!messages_from_user_id_fkey(id,full_name)')
      .eq('listing_id', conv.listing_id)
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .order('created_at', { ascending: true })
    setMessages(data || [])
    await supabase.from('messages').update({ is_read: true }).eq('listing_id', conv.listing_id).eq('to_user_id', user.id)
    setConversations(cs => cs.map(c => c.listing_id === conv.listing_id ? {...c, unread: 0} : c))
  }

  const sendReply = async () => {
    if (!reply.trim() || !selected || sending) return
    setSending(true)
    await supabase.from('messages').insert({
      from_user_id: user.id,
      to_user_id: selected.other?.id,
      listing_id: selected.listing_id,
      content: reply.trim()
    })
    if (selected.other?.onesignal_player_id) {
      await sendPushNotification(selected.other.onesignal_player_id, 'Yeni Mesaj — A Takımı', `${profile?.full_name}: "${selected.listing?.title}" hakkında yanıtladı.`)
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
    <>
      <style>{`
        .ib-outer { background:#f5f4f0; display:flex; height:calc(100vh - 62px); overflow:hidden; max-width:1000px; margin:0 auto; }
        .ib-sidebar { width:100%; display:flex; flex-direction:column; background:#fff; overflow:hidden; border-right:1px solid #ece9e4; }
        .ib-chat { display:none; flex:1; flex-direction:column; background:#f5f4f0; overflow:hidden; }

        /* Mobil: sohbet açılınca tam ekran */
        .ib-chat.open {
          display:flex;
          position:fixed;
          inset:0;
          z-index:200;
          top:0;
          bottom:0;
        }
        .ib-sidebar.hidden { display:none; }

        .conv-hdr { padding:16px; border-bottom:1px solid #ece9e4; flex-shrink:0; }
        .conv-title { font-size:20px; font-weight:700; color:#1a1a1a; }
        .conv-list { flex:1; overflow-y:auto; }
        .conv-btn { width:100%; display:flex; align-items:center; gap:12px; padding:14px 16px; border:none; border-bottom:1px solid #f0ede8; cursor:pointer; text-align:left; }
        .conv-btn.has-unread { background:#fffbf0; }
        .conv-btn:not(.has-unread) { background:#fff; }
        .conv-av { width:48px; height:48px; border-radius:50%; background:#fef0ed; color:#c8410a; display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:700; flex-shrink:0; }
        .conv-body { flex:1; min-width:0; }
        .conv-row1 { display:flex; justify-content:space-between; margin-bottom:3px; }
        .conv-name { font-size:15px; font-weight:600; color:#1a1a1a; }
        .conv-date { font-size:11px; color:#ccc; }
        .conv-row2 { display:flex; align-items:center; gap:5px; margin-bottom:2px; }
        .conv-pill { font-size:9px; font-weight:700; padding:2px 6px; border-radius:4px; flex-shrink:0; }
        .conv-iname { font-size:12px; color:#aaa; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .conv-last { font-size:12px; color:#bbb; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .conv-badge { width:22px; height:22px; border-radius:50%; background:#c8410a; color:#fff; font-size:11px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

        /* Sohbet ekranı */
        .chat-top { display:flex; align-items:center; gap:10px; padding:12px 14px; background:#fff; border-bottom:1px solid #ece9e4; flex-shrink:0; }
        .chat-back { width:38px; height:38px; border-radius:10px; background:#f5f4f0; border:1px solid #e0ddd8; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; }
        .chat-av { width:38px; height:38px; border-radius:50%; background:#fef0ed; color:#c8410a; display:flex; align-items:center; justify-content:center; font-size:15px; font-weight:700; flex-shrink:0; }
        .chat-info { flex:1; min-width:0; }
        .chat-name { font-size:15px; font-weight:600; color:#1a1a1a; margin-bottom:1px; }
        .chat-ilan { font-size:11px; color:#aaa; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

        .chat-msgs { flex:1; overflow-y:auto; padding:14px; display:flex; flex-direction:column; gap:10px; }
        
        .chat-reply { display:flex; gap:10px; padding:10px 14px; background:#fff; border-top:1px solid #ece9e4; align-items:flex-end; flex-shrink:0; }
        .chat-inp { flex:1; padding:11px 14px; background:#f5f4f0; border:1.5px solid #e0ddd8; border-radius:12px; font-size:15px; color:#1a1a1a; outline:none; font-family:inherit; resize:none; max-height:100px; line-height:1.5; }
        .chat-send { width:44px; height:44px; border-radius:50%; background:#c8410a; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; transition:opacity 0.15s; }

        .msg-row { display:flex; align-items:flex-end; gap:8px; }
        .bubble-me { background:#c8410a; color:#fff; border-radius:16px 16px 4px 16px; max-width:72%; padding:10px 14px; }
        .bubble-other { background:#fff; color:#1a1a1a; border-radius:16px 16px 16px 4px; max-width:72%; padding:10px 14px; box-shadow:0 1px 3px rgba(0,0,0,0.06); }
        .bubble-txt { font-size:14px; line-height:1.55; word-break:break-word; }
        .bubble-time { font-size:10px; margin-top:4px; text-align:right; }
        .msg-av { width:28px; height:28px; border-radius:50%; background:#e8e5e0; color:#888; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; flex-shrink:0; }

        .ib-empty { flex:1; display:none; align-items:center; justify-content:center; flex-direction:column; background:#f5f4f0; }

        @media(min-width:768px) {
          .ib-outer { height:calc(100vh - 64px); }
          .ib-sidebar { width:360px; flex-shrink:0; }
          .ib-sidebar.hidden { display:flex !important; }
          .ib-chat { display:flex !important; position:static !important; }
          .ib-chat.open { position:static !important; }
          .ib-empty { display:flex !important; }
          .chat-back { display:none; }
        }
      `}</style>

      <div className="ib-outer">
        {/* Sol liste */}
        <div className={`ib-sidebar${selected ? ' hidden' : ''}`}>
          <div className="conv-hdr">
            <h1 className="conv-title">Mesajlar</h1>
          </div>
          {loading ? (
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'#bbb',fontSize:14}}>Yükleniyor...</div>
          ) : conversations.length === 0 ? (
            <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
              <p style={{fontSize:36,marginBottom:8}}>📭</p>
              <p style={{color:'#bbb',fontSize:14}}>Henüz mesaj yok</p>
            </div>
          ) : (
            <div className="conv-list">
              {conversations.map(c => (
                <button key={c.listing_id} onClick={() => setSelected(c)} className={`conv-btn${c.unread>0?' has-unread':''}`}>
                  <div className="conv-av">{(c.other?.full_name||'?')[0].toUpperCase()}</div>
                  <div className="conv-body">
                    <div className="conv-row1">
                      <span className="conv-name">{c.other?.full_name||'Bilinmiyor'}</span>
                      <span className="conv-date">{new Date(c.last_date).toLocaleDateString('tr-TR')}</span>
                    </div>
                    <div className="conv-row2">
                      <span className="conv-pill" style={{color:TYPE_COLOR[c.listing?.type],background:TYPE_BG[c.listing?.type]}}>{TYPE_LABEL[c.listing?.type]}</span>
                      <span className="conv-iname">{c.listing?.title}</span>
                    </div>
                    <p className="conv-last">{c.last_message}</p>
                  </div>
                  {c.unread > 0 && <div className="conv-badge">{c.unread}</div>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sağ sohbet */}
        <div className={`ib-chat${selected ? ' open' : ''}`}>
          {selected ? (
            <>
              <div className="chat-top">
                <button className="chat-back" onClick={() => setSelected(null)}>
                  <svg width="18" height="18" fill="none" stroke="#1a1a1a" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div className="chat-av">{(selected.other?.full_name||'?')[0].toUpperCase()}</div>
                <div className="chat-info">
                  <p className="chat-name">{selected.other?.full_name}</p>
                  <p className="chat-ilan">{selected.listing?.title}</p>
                </div>
              </div>

              <div className="chat-msgs">
                {messages.map(m => {
                  const isMe = m.from_user_id === user.id
                  return (
                    <div key={m.id} className="msg-row" style={{justifyContent:isMe?'flex-end':'flex-start'}}>
                      {!isMe && <div className="msg-av">{(m.from_profile?.full_name||'?')[0].toUpperCase()}</div>}
                      <div className={isMe?'bubble-me':'bubble-other'}>
                        <p className="bubble-txt">{m.content}</p>
                        <p className="bubble-time" style={{color:isMe?'rgba(255,255,255,0.6)':'#bbb'}}>
                          {new Date(m.created_at).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef}/>
              </div>

              <div className="chat-reply">
                <textarea className="chat-inp" value={reply} onChange={e=>setReply(e.target.value)}
                  placeholder="Mesajınızı yazın..." rows={1}
                  onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendReply()}}} />
                <button className="chat-send" onClick={sendReply} disabled={sending||!reply.trim()}
                  style={{opacity:(!reply.trim()||sending)?0.4:1}}>
                  <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </div>
            </>
          ) : (
            <div className="ib-empty">
              <p style={{fontSize:40,marginBottom:12}}>💬</p>
              <p style={{color:'#bbb',fontSize:14}}>Bir sohbet seçin</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
