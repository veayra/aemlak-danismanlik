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

  if (loading) return <div style={styles.loading}>Yükleniyor...</div>

  const pending = profiles.filter(p => !p.is_approved).length
  const unread = messages.filter(m => !m.is_read).length

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Admin Paneli</h1>

      <div style={styles.stats}>
        {[
          { label:'Toplam Emlakçı', val: profiles.length },
          { label:'Onay Bekleyen', val: pending, red: pending > 0 },
          { label:'Toplam İlan', val: listings.length },
          { label:'Okunmamış Mesaj', val: unread, red: unread > 0 },
        ].map(s => (
          <div key={s.label} style={styles.stat}>
            <p style={styles.statLabel}>{s.label}</p>
            <p style={{ ...styles.statVal, color: s.red ? '#ef4444' : '#1a1a1a' }}>{s.val}</p>
          </div>
        ))}
      </div>

      <div style={styles.tabs}>
        {[['users','Emlakçılar'],['messages','Mesajlar'],['listings','İlanlar']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={tab === k ? styles.tabActive : styles.tab}>{l}</button>
        ))}
      </div>

      {tab === 'users' && (
        <div style={styles.table}>
          <table style={styles.tbl}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>Ad Soyad</th>
                <th style={styles.th}>Firma</th>
                <th style={styles.th}>Telefon</th>
                <th style={styles.th}>Kayıt</th>
                <th style={styles.th}>Durum</th>
                <th style={styles.th}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(p => (
                <tr key={p.id} style={styles.tr}>
                  <td style={styles.td}>{p.full_name}</td>
                  <td style={styles.td}>{p.company || '-'}</td>
                  <td style={styles.td}>{p.phone || '-'}</td>
                  <td style={styles.td}>{new Date(p.created_at).toLocaleDateString('tr-TR')}</td>
                  <td style={styles.td}>
                    <span style={p.is_approved ? styles.approved : styles.pending}>
                      {p.is_approved ? 'Onaylı' : 'Bekliyor'}
                    </span>
                    {p.is_admin && <span style={styles.adminBadge}>Admin</span>}
                  </td>
                  <td style={styles.td}>
                    <button onClick={() => toggleApprove(p.id, p.is_approved)}
                      style={p.is_approved ? styles.btnDanger : styles.btnSuccess}>
                      {p.is_approved ? 'Kaldır' : 'Onayla'}
                    </button>
                    <button onClick={() => toggleAdmin(p.id, p.is_admin)} style={styles.btnGray}>
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
        <div style={styles.msgList}>
          {messages.length === 0 && <p style={styles.empty}>Henüz mesaj yok.</p>}
          {messages.map(m => (
            <div key={m.id} style={{ ...styles.msgCard, background: m.is_read ? '#fff' : '#eff6ff' }}>
              <div style={styles.msgHeader}>
                <div>
                  <strong style={styles.msgName}>{m.profiles?.full_name}</strong>
                  <span style={styles.msgMeta}> — {m.profiles?.company} — {m.profiles?.phone}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  {!m.is_read && <span style={styles.unreadDot}>Yeni</span>}
                  <span style={styles.msgDate}>{new Date(m.created_at).toLocaleString('tr-TR')}</span>
                </div>
              </div>
              <p style={styles.msgIlan}>İlan: <strong>{m.listings?.title}</strong></p>
              <p style={styles.msgContent}>{m.content}</p>
              {!m.is_read && (
                <button onClick={() => markRead(m.id)} style={styles.readBtn}>Okundu İşaretle</button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'listings' && (
        <div style={styles.table}>
          <table style={styles.tbl}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>Başlık</th>
                <th style={styles.th}>Emlakçı</th>
                <th style={styles.th}>Tip</th>
                <th style={styles.th}>Şehir</th>
                <th style={styles.th}>Fiyat</th>
                <th style={styles.th}>Tarih</th>
                <th style={styles.th}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {listings.map(l => (
                <tr key={l.id} style={styles.tr}>
                  <td style={styles.td}>{l.title}</td>
                  <td style={styles.td}>{l.profiles?.full_name}<br/><span style={{fontSize:11,color:'#9ca3af'}}>{l.profiles?.company}</span></td>
                  <td style={styles.td}>{l.type}</td>
                  <td style={styles.td}>{l.city || '-'}</td>
                  <td style={styles.td}>{l.price ? Number(l.price).toLocaleString('tr-TR') + ' ₺' : '-'}</td>
                  <td style={styles.td}>{new Date(l.created_at).toLocaleDateString('tr-TR')}</td>
                  <td style={styles.td}>
                    <button onClick={() => deleteListing(l.id)} style={styles.btnDanger}>Sil</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const styles = {
  page: { maxWidth:1100, margin:'0 auto', padding:'28px 20px' },
  title: { fontSize:22, fontWeight:700, marginBottom:20 },
  stats: { display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginBottom:24 },
  stat: { background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, padding:'16px 20px' },
  statLabel: { fontSize:12, color:'#6b7280', marginBottom:4 },
  statVal: { fontSize:26, fontWeight:700 },
  tabs: { display:'flex', gap:4, marginBottom:20, borderBottom:'1px solid #e5e7eb', paddingBottom:0 },
  tab: { padding:'10px 20px', border:'none', background:'none', cursor:'pointer', fontSize:14, color:'#6b7280', borderBottom:'2px solid transparent' },
  tabActive: { padding:'10px 20px', border:'none', background:'none', cursor:'pointer', fontSize:14, color:'#1d4ed8', fontWeight:600, borderBottom:'2px solid #1d4ed8' },
  table: { overflowX:'auto' },
  tbl: { width:'100%', borderCollapse:'collapse', background:'#fff', borderRadius:10, overflow:'hidden', border:'1px solid #e5e7eb' },
  thead: { background:'#f9fafb' },
  th: { padding:'12px 16px', textAlign:'left', fontSize:12, fontWeight:600, color:'#6b7280', whiteSpace:'nowrap' },
  tr: { borderTop:'1px solid #f3f4f6' },
  td: { padding:'12px 16px', fontSize:13, verticalAlign:'middle' },
  approved: { background:'#d1fae5', color:'#065f46', fontSize:11, fontWeight:600, padding:'3px 8px', borderRadius:20, marginRight:4 },
  pending: { background:'#fef3c7', color:'#92400e', fontSize:11, fontWeight:600, padding:'3px 8px', borderRadius:20, marginRight:4 },
  adminBadge: { background:'#e0e7ff', color:'#3730a3', fontSize:11, fontWeight:600, padding:'3px 8px', borderRadius:20 },
  btnSuccess: { padding:'5px 12px', border:'none', borderRadius:6, background:'#d1fae5', color:'#065f46', cursor:'pointer', fontSize:12, fontWeight:600, marginRight:6 },
  btnDanger: { padding:'5px 12px', border:'none', borderRadius:6, background:'#fee2e2', color:'#991b1b', cursor:'pointer', fontSize:12, fontWeight:600, marginRight:6 },
  btnGray: { padding:'5px 12px', border:'none', borderRadius:6, background:'#f3f4f6', color:'#374151', cursor:'pointer', fontSize:12 },
  msgList: { display:'flex', flexDirection:'column', gap:12 },
  msgCard: { border:'1px solid #e5e7eb', borderRadius:10, padding:16 },
  msgHeader: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 },
  msgName: { fontSize:14 },
  msgMeta: { fontSize:13, color:'#6b7280' },
  msgIlan: { fontSize:12, color:'#6b7280', marginBottom:8 },
  msgContent: { fontSize:14, color:'#374151', lineHeight:1.6, background:'#f9fafb', padding:12, borderRadius:8, marginBottom:10 },
  unreadDot: { background:'#dbeafe', color:'#1e40af', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:20 },
  msgDate: { fontSize:11, color:'#9ca3af' },
  readBtn: { padding:'6px 14px', border:'1px solid #d1d5db', borderRadius:6, background:'#fff', cursor:'pointer', fontSize:12, color:'#374151' },
  empty: { textAlign:'center', padding:40, color:'#9ca3af' },
  loading: { textAlign:'center', padding:60, color:'#6b7280' }
}
