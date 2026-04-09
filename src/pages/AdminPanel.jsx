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
    setProfiles(p || [])
    setMessages(m || [])
    setListings(l || [])
    setLoading(false)
  }

  const toggleApprove = async (id, current) => {
    await supabase.from('profiles').update({ is_approved: !current }).eq('id', id)
    setProfiles(ps => ps.map(p => p.id === id ? { ...p, is_approved: !current } : p))
  }

  const toggleAdmin = async (id, current) => {
    await supabase.from('profiles').update({ is_admin: !current }).eq('id', id)
    setProfiles(ps => ps.map(p => p.id === id ? { ...p, is_admin: !current } : p))
  }

  const markRead = async (id) => {
    await supabase.from('messages').update({ is_read: true }).eq('id', id)
    setMessages(ms => ms.map(m => m.id === id ? { ...m, is_read: true } : m))
  }

  const deleteListing = async (id) => {
    if (!confirm('Bu ilanı silmek istiyor musunuz?')) return
    await supabase.from('listings').delete().eq('id', id)
    setListings(ls => ls.filter(l => l.id !== id))
  }

  if (loading) return <div style={s.loading}>Yükleniyor...</div>

  const pending = profiles.filter(p => !p.is_approved).length
  const unread = messages.filter(m => !m.is_read).length

  return (
    <div style={s.page}>
      <h1 style={s.title}>Admin Paneli</h1>
      <div style={s.stats}>
        {[
          { l:'Toplam Emlakçı', v: profiles.length },
          { l:'Onay Bekleyen', v: pending, warn: pending > 0 },
          { l:'Toplam İlan', v: listings.length },
          { l:'Okunmamış Mesaj', v: unread, warn: unread > 0 },
        ].map(s2 => (
          <div key={s2.l} style={s.stat}>
            <p style={s.statL}>{s2.l}</p>
            <p style={{...s.statV, color: s2.warn ? '#c8a96e' : '#f0f0ee'}}>{s2.v}</p>
          </div>
        ))}
      </div>

      <div style={s.tabs}>
        {[['users','Emlakçılar'],['messages','Mesajlar'],['listings','İlanlar']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={tab===k ? {...s.tab,...s.tabActive} : s.tab}>{l}
            {k==='users' && pending>0 && <span style={s.dot}>{pending}</span>}
            {k==='messages' && unread>0 && <span style={s.dot}>{unread}</span>}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <div style={s.tableWrap}>
          <table style={s.tbl}>
            <thead><tr style={s.thead}>
              <th style={s.th}>Ad Soyad</th><th style={s.th}>Firma</th><th style={s.th}>Telefon</th>
              <th style={s.th}>Kayıt</th><th style={s.th}>Durum</th><th style={s.th}>İşlem</th>
            </tr></thead>
            <tbody>
              {profiles.map(p => (
                <tr key={p.id} style={s.tr}>
                  <td style={s.td}>{p.full_name}</td>
                  <td style={s.td}>{p.company || '—'}</td>
                  <td style={s.td}>{p.phone || '—'}</td>
                  <td style={s.td}>{new Date(p.created_at).toLocaleDateString('tr-TR')}</td>
                  <td style={s.td}>
                    <span style={p.is_approved ? s.approved : s.pending}>{p.is_approved ? 'Onaylı' : 'Bekliyor'}</span>
                    {p.is_admin && <span style={s.adminBadge}>Admin</span>}
                  </td>
                  <td style={s.td}>
                    <button onClick={() => toggleApprove(p.id, p.is_approved)} style={p.is_approved ? s.btnRed : s.btnGold}>
                      {p.is_approved ? 'Kaldır' : 'Onayla'}
                    </button>
                    <button onClick={() => toggleAdmin(p.id, p.is_admin)} style={s.btnGray}>
                      {p.is_admin ? 'Admini Al' : 'Admin Yap'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'messages' && (
        <div style={s.msgList}>
          {messages.length === 0 && <p style={s.empty}>Henüz mesaj yok.</p>}
          {messages.map(m => (
            <div key={m.id} style={{...s.msgCard, background: m.is_read ? '#161616' : '#1a1710'}}>
              <div style={s.msgHeader}>
                <div>
                  <strong style={s.msgName}>{m.profiles?.full_name}</strong>
                  <span style={s.msgMeta}> — {m.profiles?.company} — {m.profiles?.phone}</span>
                </div>
                <div style={{display:'flex', gap:8, alignItems:'center'}}>
                  {!m.is_read && <span style={s.newBadge}>Yeni</span>}
                  <span style={s.msgDate}>{new Date(m.created_at).toLocaleString('tr-TR')}</span>
                </div>
              </div>
              <p style={s.msgIlan}>İlan: <strong style={{color:'#888'}}>{m.listings?.title}</strong></p>
              <p style={s.msgContent}>{m.content}</p>
              {!m.is_read && <button onClick={() => markRead(m.id)} style={s.readBtn}>Okundu İşaretle</button>}
            </div>
          ))}
        </div>
      )}

      {tab === 'listings' && (
        <div style={s.tableWrap}>
          <table style={s.tbl}>
            <thead><tr style={s.thead}>
              <th style={s.th}>Başlık</th><th style={s.th}>Emlakçı</th><th style={s.th}>Tip</th>
              <th style={s.th}>Şehir</th><th style={s.th}>Fiyat</th><th style={s.th}>Tarih</th><th style={s.th}>İşlem</th>
            </tr></thead>
            <tbody>
              {listings.map(l => (
                <tr key={l.id} style={s.tr}>
                  <td style={s.td}>{l.title}</td>
                  <td style={s.td}>{l.profiles?.full_name}<br/><span style={{fontSize:11,color:'#555'}}>{l.profiles?.company}</span></td>
                  <td style={s.td}>{l.type}</td>
                  <td style={s.td}>{l.city || '—'}</td>
                  <td style={s.td}>{l.price ? Number(l.price).toLocaleString('tr-TR') + ' ₺' : '—'}</td>
                  <td style={s.td}>{new Date(l.created_at).toLocaleDateString('tr-TR')}</td>
                  <td style={s.td}><button onClick={() => deleteListing(l.id)} style={s.btnRed}>Sil</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const s = {
  page: { maxWidth:1100, margin:'0 auto', padding:'28px 20px' },
  title: { fontFamily:"'DM Serif Display',serif", fontSize:22, fontWeight:400, color:'#f0f0ee', marginBottom:20 },
  stats: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:24 },
  stat: { background:'#161616', border:'1px solid #222', borderRadius:10, padding:'16px 18px' },
  statL: { fontSize:11, color:'#555', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.5px' },
  statV: { fontSize:26, fontWeight:600 },
  tabs: { display:'flex', gap:0, marginBottom:20, borderBottom:'1px solid #222' },
  tab: { padding:'10px 20px', border:'none', background:'none', cursor:'pointer', fontSize:14, color:'#666', borderBottom:'2px solid transparent', display:'flex', alignItems:'center', gap:6 },
  tabActive: { color:'#c8a96e', borderBottom:'2px solid #c8a96e' },
  dot: { background:'#c8a96e', color:'#0f0f0f', fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:10 },
  tableWrap: { overflowX:'auto' },
  tbl: { width:'100%', borderCollapse:'collapse', background:'#161616', borderRadius:10, overflow:'hidden', border:'1px solid #222' },
  thead: { background:'#1a1a1a' },
  th: { padding:'11px 14px', textAlign:'left', fontSize:11, fontWeight:600, color:'#555', letterSpacing:'0.5px', textTransform:'uppercase', whiteSpace:'nowrap' },
  tr: { borderTop:'1px solid #1f1f1f' },
  td: { padding:'12px 14px', fontSize:13, color:'#ccc', verticalAlign:'middle' },
  approved: { background:'#0a1f0a', color:'#2ecc71', fontSize:10, fontWeight:600, padding:'3px 8px', borderRadius:5, marginRight:4 },
  pending: { background:'#1f1a0a', color:'#c8a96e', fontSize:10, fontWeight:600, padding:'3px 8px', borderRadius:5, marginRight:4 },
  adminBadge: { background:'#15152a', color:'#818cf8', fontSize:10, fontWeight:600, padding:'3px 8px', borderRadius:5 },
  btnGold: { padding:'4px 12px', border:'none', borderRadius:5, background:'#c8a96e', color:'#0f0f0f', cursor:'pointer', fontSize:12, fontWeight:600, marginRight:6 },
  btnRed: { padding:'4px 12px', border:'none', borderRadius:5, background:'#2a0f0f', color:'#e74c3c', cursor:'pointer', fontSize:12, marginRight:6 },
  btnGray: { padding:'4px 12px', border:'none', borderRadius:5, background:'#222', color:'#888', cursor:'pointer', fontSize:12 },
  msgList: { display:'flex', flexDirection:'column', gap:8 },
  msgCard: { border:'1px solid #222', borderRadius:10, padding:16 },
  msgHeader: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6, flexWrap:'wrap', gap:8 },
  msgName: { fontSize:14, color:'#f0f0ee' },
  msgMeta: { fontSize:12, color:'#555' },
  msgIlan: { fontSize:12, color:'#555', marginBottom:8 },
  msgContent: { fontSize:14, color:'#aaa', lineHeight:1.6, background:'#1a1a1a', padding:12, borderRadius:8, marginBottom:10 },
  newBadge: { background:'#1f1a0e', color:'#c8a96e', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:5 },
  msgDate: { fontSize:11, color:'#444' },
  readBtn: { padding:'5px 14px', border:'1px solid #2a2a2a', borderRadius:6, background:'transparent', cursor:'pointer', fontSize:12, color:'#777' },
  empty: { textAlign:'center', padding:40, color:'#444' },
  loading: { textAlign:'center', padding:80, color:'#555' }
}
