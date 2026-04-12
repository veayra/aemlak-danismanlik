import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function MasterAdmin() {
  const [groups, setGroups] = useState([])
  const [profiles, setProfiles] = useState([])
  const [tab, setTab] = useState('groups')
  const [loading, setLoading] = useState(true)
  const [newGroup, setNewGroup] = useState({ name:'', code:'' })
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    const [{ data: g }, { data: p }] = await Promise.all([
      supabase.from('groups').select('*, profiles(count)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*, groups(name)').order('created_at', { ascending: false })
    ])
    setGroups(g || [])
    setProfiles(p || [])
    setLoading(false)
  }

  const createGroup = async (e) => {
    e.preventDefault()
    setCreating(true)
    const code = newGroup.code.toUpperCase().replace(/\s/g, '')
    const { error } = await supabase.from('groups').insert({ name: newGroup.name, code })
    if (error) { alert('Hata: ' + error.message); setCreating(false); return }
    setNewGroup({ name:'', code:'' })
    setShowForm(false)
    setCreating(false)
    fetchAll()
  }

  const toggleGroupStatus = async (id, current) => {
    const status = current === 'active' ? 'suspended' : 'active'
    await supabase.from('groups').update({ status }).eq('id', id)
    setGroups(gs => gs.map(g => g.id===id ? {...g, status} : g))
  }

  const setUserRole = async (id, role) => {
    await supabase.from('profiles').update({ role }).eq('id', id)
    setProfiles(ps => ps.map(p => p.id===id ? {...p, role} : p))
  }

  const toggleApprove = async (id, current) => {
    await supabase.from('profiles').update({ is_approved: !current }).eq('id', id)
    setProfiles(ps => ps.map(p => p.id===id ? {...p, is_approved:!current} : p))
  }

  if (loading) return <div style={{textAlign:'center',padding:80,color:'#aaa',background:'#f5f4f0',minHeight:'100vh'}}>Yükleniyor...</div>

  return (
    <div style={s.outer}>
      <div style={s.page}>
        <div style={s.header}>
          <div>
            <h1 style={s.title}>Master Admin Paneli</h1>
            <p style={s.sub}>{groups.length} grup · {profiles.length} kullanıcı</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={s.addBtn}>+ Yeni Grup</button>
        </div>

        {showForm && (
          <form onSubmit={createGroup} style={s.formCard}>
            <h3 style={s.formTitle}>Yeni Grup Oluştur</h3>
            <div style={s.formRow}>
              <div style={{flex:1}}>
                <label style={s.label}>Grup Adı</label>
                <input style={s.input} value={newGroup.name} onChange={e=>setNewGroup(n=>({...n,name:e.target.value}))} required placeholder="Yılmaz Emlak Grubu" />
              </div>
              <div style={{flex:1}}>
                <label style={s.label}>Grup Kodu</label>
                <input style={s.input} value={newGroup.code} onChange={e=>setNewGroup(n=>({...n,code:e.target.value.toUpperCase()}))} required placeholder="YILMAZ01" maxLength={10} />
                <p style={{fontSize:11,color:'#aaa',marginTop:4}}>Emlakçılar bu kodla kayıt olur</p>
              </div>
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:4}}>
              <button type="button" onClick={() => setShowForm(false)} style={s.cancelBtn}>İptal</button>
              <button type="submit" style={s.submitBtn} disabled={creating}>{creating ? 'Oluşturuluyor...' : 'Grubu Oluştur'}</button>
            </div>
          </form>
        )}

        <div style={s.tabs}>
          {[['groups','Gruplar'],['users','Kullanıcılar']].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)} style={tab===k ? {...s.tab,...s.tabA} : s.tab}>{l}</button>
          ))}
        </div>

        {tab === 'groups' && (
          <div style={s.list}>
            {groups.map(g => (
              <div key={g.id} style={s.card}>
                <div style={s.cardLeft}>
                  <div style={s.groupIcon}>{g.name[0]}</div>
                  <div>
                    <p style={s.groupName}>{g.name}</p>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginTop:4}}>
                      <span style={s.codeTag}>{g.code}</span>
                      <span style={{...s.statusBadge, background:g.status==='active'?'#edf7f0':'#fef0ed', color:g.status==='active'?'#1a7a3f':'#c8410a'}}>
                        {g.status === 'active' ? 'Aktif' : 'Askıya Alındı'}
                      </span>
                    </div>
                    <p style={{fontSize:11,color:'#bbb',marginTop:4}}>{new Date(g.created_at).toLocaleDateString('tr-TR')} tarihinde oluşturuldu</p>
                  </div>
                </div>
                <button onClick={() => toggleGroupStatus(g.id, g.status)}
                  style={{...s.actionBtn, background:g.status==='active'?'#fef0ed':'#edf7f0', color:g.status==='active'?'#c8410a':'#1a7a3f'}}>
                  {g.status === 'active' ? 'Askıya Al' : 'Aktifleştir'}
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 'users' && (
          <div style={s.list}>
            {profiles.map(p => (
              <div key={p.id} style={s.card}>
                <div style={s.cardLeft}>
                  <div style={{...s.groupIcon, background:'#e8f0fb', color:'#1a5fb4'}}>{(p.full_name||'?')[0]}</div>
                  <div>
                    <p style={s.groupName}>{p.full_name || p.email || "İsimsiz"}</p>
                    <p style={{fontSize:12,color:'#aaa',marginBottom:4}}>{p.company} · {p.phone}</p>
                    <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                      <span style={{...s.codeTag, background:'#f5f4f0'}}>{p.groups?.name || 'Grup yok'}</span>
                      <span style={{...s.statusBadge, background:p.is_approved?'#edf7f0':'#fffbf0', color:p.is_approved?'#1a7a3f':'#d4800a'}}>
                        {p.is_approved ? 'Onaylı' : 'Bekliyor'}
                      </span>
                      <span style={{...s.statusBadge, background:'#e8f0fb', color:'#1a5fb4'}}>{p.role==='master_admin'?'Ana Yönetici':p.role==='group_admin'?'Yönetici':'Üye'}</span>
                    </div>
                  </div>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:6,flexShrink:0}}>
                  <button onClick={() => toggleApprove(p.id, p.is_approved)}
                    style={{...s.actionBtn, background:p.is_approved?'#fef0ed':'#edf7f0', color:p.is_approved?'#c8410a':'#1a7a3f', fontSize:11}}>
                    {p.is_approved ? 'Onayı Kaldır' : 'Onayla'}
                  </button>
                  <select value={p.role} onChange={e=>setUserRole(p.id,e.target.value)} style={s.roleSelect}>
                    <option value="agent">Üye</option>
                    <option value="group_admin">Yönetici</option>
                    <option value="master_admin">Ana Yönetici</option>
                  </select>
                </div>
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
  page: { maxWidth:900, margin:'0 auto', padding:'24px 20px 80px' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 },
  title: { fontSize:22, fontWeight:700, color:'#1a1a1a', marginBottom:2 },
  sub: { fontSize:13, color:'#aaa' },
  addBtn: { background:'#c8410a', color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', fontSize:14, fontWeight:600, cursor:'pointer' },
  formCard: { background:'#fff', border:'1px solid #ece9e4', borderRadius:14, padding:20, marginBottom:20 },
  formTitle: { fontSize:15, fontWeight:700, color:'#1a1a1a', marginBottom:16 },
  formRow: { display:'flex', gap:16, flexWrap:'wrap' },
  label: { display:'block', fontSize:11, color:'#888', marginBottom:6, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.3px' },
  input: { width:'100%', padding:'11px 14px', background:'#f5f4f0', border:'1.5px solid #e0ddd8', borderRadius:10, fontSize:14, color:'#1a1a1a', outline:'none', fontFamily:'inherit' },
  cancelBtn: { padding:'9px 20px', border:'1px solid #e0ddd8', borderRadius:9, background:'#fff', cursor:'pointer', fontSize:13, color:'#888' },
  submitBtn: { padding:'9px 24px', border:'none', borderRadius:9, background:'#c8410a', color:'#fff', fontWeight:600, cursor:'pointer', fontSize:13 },
  tabs: { display:'flex', background:'#fff', borderRadius:12, padding:4, marginBottom:16, border:'1px solid #ece9e4' },
  tab: { flex:1, padding:'9px', border:'none', background:'transparent', cursor:'pointer', fontSize:14, color:'#aaa', borderRadius:9, fontWeight:500 },
  tabA: { background:'#f5f4f0', color:'#1a1a1a', fontWeight:600 },
  list: { display:'flex', flexDirection:'column', gap:8 },
  card: { background:'#fff', border:'1px solid #ece9e4', borderRadius:14, padding:16, display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' },
  cardLeft: { display:'flex', alignItems:'center', gap:12, flex:1, minWidth:0 },
  groupIcon: { width:42, height:42, borderRadius:'50%', background:'#fef0ed', color:'#c8410a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, flexShrink:0 },
  groupName: { fontSize:14, fontWeight:600, color:'#1a1a1a', marginBottom:2 },
  codeTag: { fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:5, background:'#f5f4f0', color:'#888', fontFamily:'monospace' },
  statusBadge: { fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:5 },
  actionBtn: { padding:'7px 14px', border:'none', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600, white:'nowrap', flexShrink:0 },
  roleSelect: { padding:'5px 8px', border:'1px solid #e0ddd8', borderRadius:7, fontSize:11, color:'#555', background:'#f5f4f0', cursor:'pointer', outline:'none' }
}
