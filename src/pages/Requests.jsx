import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'

const TYPE_LABEL = { ev:'Konut', isyeri:'İş Yeri', arsa:'Arsa' }
const TYPE_COLOR = { ev:'#c8410a', isyeri:'#1a5fb4', arsa:'#1a7a3f' }
const TYPE_BG = { ev:'#fef0ed', isyeri:'#e8f0fb', arsa:'#edf7f0' }

export default function Requests() {
  const { user, profile } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('hepsi')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ title:'', description:'', type:'ev', budget:'', city:'', district:'' })
  const [budgetDisplay, setBudgetDisplay] = useState('')
  const [saving, setSaving] = useState(false)
  const [msgMap, setMsgMap] = useState({})
  const [sentMap, setSentMap] = useState({})

  useEffect(() => { fetchRequests() }, [])

  const fetchRequests = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('requests')
      .select('*, profiles(full_name, company)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    setRequests(data || [])
    setLoading(false)
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleBudget = (e) => {
    const raw = e.target.value.replace(/\D/g, '')
    setBudgetDisplay(raw ? Number(raw).toLocaleString('tr-TR') : '')
    setForm(f => ({ ...f, budget: raw }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    await supabase.from('requests').insert({
      user_id: user.id,
      title: form.title,
      description: form.description,
      type: form.type,
      budget: form.budget || null,
      city: form.city,
      district: form.district
    })
    setForm({ title:'', description:'', type:'ev', budget:'', city:'', district:'' })
    setBudgetDisplay('')
    setShowForm(false)
    setSaving(false)
    fetchRequests()
  }

  const handleDelete = async (id) => {
    if (!confirm('Bu talep silinsin mi?')) return
    await supabase.from('requests').update({ is_active: false }).eq('id', id)
    setRequests(rs => rs.filter(r => r.id !== id))
  }

  const handleMessage = async (req) => {
    const content = msgMap[req.id]
    if (!content?.trim()) return
    await supabase.from('messages').insert({
      from_user_id: user.id,
      to_user_id: req.user_id,
      listing_id: null,
      content: `[Talep: ${req.title}] ${content}`
    })
    setSentMap(m => ({ ...m, [req.id]: true }))
  }

  const filtered = requests
    .filter(r => filter === 'hepsi' || r.type === filter)
    .filter(r => !search || r.title?.toLowerCase().includes(search.toLowerCase()) || r.city?.toLowerCase().includes(search.toLowerCase()))

  const isAdmin = profile?.role === 'group_admin' || profile?.role === 'master_admin'

  return (
    <>
      <style>{`
        .rq { background:#f5f4f0; min-height:100vh; max-width:900px; margin:0 auto; padding:0 0 80px; }
        .rq-hero { background:#fff; border-bottom:1px solid #ece9e4; padding:20px 20px 18px; }
        .rq-top { display:flex; justify-content:space-between; align-items:center; }
        .rq-title { font-size:22px; font-weight:700; color:#1a1a1a; }
        .rq-add-btn { background:#c8410a; color:#fff; padding:10px 18px; border-radius:10px; border:none; font-size:13px; font-weight:600; cursor:pointer; }

        .rq-form { background:#fff; border-bottom:1px solid #ece9e4; padding:20px; }
        .rq-form-title { font-size:15px; font-weight:700; color:#1a1a1a; margin-bottom:16px; }
        .rq-field { margin-bottom:14px; }
        .rq-lbl { display:block; font-size:11px; color:#888; margin-bottom:6px; font-weight:600; text-transform:uppercase; letter-spacing:0.4px; }
        .rq-inp { width:100%; padding:12px 14px; background:#f5f4f0; border:1.5px solid #e0ddd8; border-radius:11px; font-size:14px; color:#1a1a1a; outline:none; font-family:inherit; box-sizing:border-box; }
        .rq-inp:focus { border-color:#c8410a; background:#fff; }
        .rq-tg { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; }
        .rq-tb { display:flex; flex-direction:column; align-items:center; gap:5px; padding:12px 8px; background:#f5f4f0; border:1.5px solid #e0ddd8; border-radius:11px; cursor:pointer; color:#888; font-size:12px; font-weight:600; }
        .rq-tb.on { background:#fef0ed; border-color:#c8410a; color:#c8410a; }
        .rq-pw { position:relative; }
        .rq-ps { position:absolute; right:14px; top:50%; transform:translateY(-50%); color:#bbb; pointer-events:none; }
        .rq-form-btns { display:flex; gap:10px; margin-top:16px; }
        .rq-cancel { flex:0 0 80px; padding:12px; border:1.5px solid #e0ddd8; border-radius:11px; background:#fff; cursor:pointer; font-size:14px; color:#888; }
        .rq-save { flex:1; padding:12px; border:none; border-radius:11px; background:#c8410a; color:#fff; font-weight:700; cursor:pointer; font-size:14px; }

        .rq-ctrl { display:flex; gap:8px; padding:14px 16px; align-items:center; }
        .rq-sw { position:relative; flex:1; }
        .rq-si { position:absolute; left:11px; top:50%; transform:translateY(-50%); pointer-events:none; }
        .rq-search { width:100%; padding:10px 14px 10px 34px; background:#fff; border:1px solid #e0ddd8; border-radius:10px; font-size:14px; outline:none; box-sizing:border-box; color:#1a1a1a; }
        .rq-filters { display:flex; gap:7px; padding:0 16px 12px; overflow-x:auto; }
        .rq-f { padding:7px 15px; border:1px solid #e0ddd8; border-radius:20px; background:#fff; cursor:pointer; font-size:13px; color:#888; white-space:nowrap; font-weight:500; }
        .rq-f.on { border-color:transparent; color:#fff; }
        .rq-count { font-size:11px; color:#bbb; padding:0 16px 10px; }

        .rq-list { display:flex; flex-direction:column; gap:10px; padding:0 16px; }
        .rq-card { background:#fff; border:1px solid #ece9e4; border-radius:14px; padding:16px; }
        .rq-card-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; }
        .rq-card-user { display:flex; align-items:center; gap:10px; }
        .rq-avatar { width:38px; height:38px; border-radius:50%; background:#fef0ed; color:#c8410a; display:flex; align-items:center; justify-content:center; font-size:15px; font-weight:700; flex-shrink:0; }
        .rq-user-name { font-size:13px; font-weight:600; color:#1a1a1a; }
        .rq-user-co { font-size:11px; color:#aaa; }
        .rq-card-title { font-size:16px; font-weight:700; color:#1a1a1a; margin-bottom:6px; }
        .rq-card-desc { font-size:13px; color:#666; line-height:1.6; margin-bottom:10px; }
        .rq-card-meta { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:12px; }
        .rq-type-pill { font-size:10px; font-weight:700; padding:3px 8px; border-radius:6px; }
        .rq-loc { font-size:12px; color:#aaa; }
        .rq-budget { font-size:17px; font-weight:700; color:#1a1a1a; }
        .rq-date { font-size:11px; color:#ccc; }
        .rq-del-btn { background:none; border:none; color:#ddd; cursor:pointer; font-size:20px; padding:2px 6px; }
        .rq-msg-area { border-top:1px solid #f0ede8; padding-top:12px; }
        .rq-msg-inp { width:100%; padding:10px 12px; background:#f5f4f0; border:1px solid #e0ddd8; border-radius:10px; font-size:13px; color:#1a1a1a; resize:none; font-family:inherit; outline:none; display:block; margin-bottom:8px; box-sizing:border-box; }
        .rq-msg-btn { padding:9px 20px; background:#c8410a; color:#fff; border:none; border-radius:9px; font-size:13px; font-weight:600; cursor:pointer; }
        .rq-sent { font-size:13px; color:#1a7a3f; padding:10px 14px; background:#edf7f0; border-radius:9px; border:1px solid #c8ecd4; }

        @media(min-width:768px) {
          .rq { padding:0 0 32px; }
          .rq-hero { padding:28px 32px 24px; }
          .rq-ctrl { padding:16px 32px; }
          .rq-filters { padding:0 32px 12px; }
          .rq-count { padding:0 32px 10px; }
          .rq-list { padding:0 32px; }
          .rq-form { padding:20px 32px; }
          .rq-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        }
      `}</style>

      <div className="rq">
        <div className="rq-hero">
          <div className="rq-top">
            <h1 className="rq-title">Talepler</h1>
            <button className="rq-add-btn" onClick={() => setShowForm(!showForm)}>
              {showForm ? '✕ Kapat' : '+ Talep Ekle'}
            </button>
          </div>
        </div>

        {showForm && (
          <div className="rq-form">
            <p className="rq-form-title">Yeni Talep Ekle</p>
            <div className="rq-form-grid">
              <div>
                <div className="rq-field">
                  <label className="rq-lbl">Ne Arıyorsunuz? *</label>
                  <input className="rq-inp" value={form.title} onChange={set('title')} required placeholder="Örn: Meram'da 3+1 daire arıyorum" />
                </div>
                <div className="rq-field">
                  <label className="rq-lbl">Açıklama</label>
                  <textarea className="rq-inp" style={{minHeight:80,resize:'vertical'}} value={form.description} onChange={set('description')} placeholder="Detaylar, özellikler, tercihler..." />
                </div>
                <div className="rq-field">
                  <label className="rq-lbl">Talep Tipi</label>
                  <div className="rq-tg">
                    {[['ev','🏠','Konut'],['isyeri','🏢','İş Yeri'],['arsa','🌱','Arsa']].map(([val,icon,lbl]) => (
                      <button key={val} type="button" onClick={() => setForm(f=>({...f,type:val}))} className={`rq-tb${form.type===val?' on':''}`}>
                        <span style={{fontSize:18}}>{icon}</span>{lbl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <div className="rq-field">
                  <label className="rq-lbl">Şehir</label>
                  <input className="rq-inp" value={form.city} onChange={set('city')} placeholder="Konya" />
                </div>
                <div className="rq-field">
                  <label className="rq-lbl">İlçe / Mahalle</label>
                  <input className="rq-inp" value={form.district} onChange={set('district')} placeholder="Meram, Selçuklu..." />
                </div>
                <div className="rq-field">
                  <label className="rq-lbl">Bütçe</label>
                  <div className="rq-pw">
                    <input className="rq-inp" style={{paddingRight:30}} value={budgetDisplay} onChange={handleBudget} placeholder="3.000.000" inputMode="numeric" />
                    <span className="rq-ps">₺</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="rq-form-btns">
              <button className="rq-cancel" onClick={() => setShowForm(false)}>İptal</button>
              <button className="rq-save" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Yayınlanıyor...' : '✓ Talebi Yayınla'}
              </button>
            </div>
          </div>
        )}

        <div className="rq-ctrl">
          <div className="rq-sw">
            <svg className="rq-si" width="14" height="14" fill="none" stroke="#bbb" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className="rq-search" placeholder="Ara..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
        </div>

        <div className="rq-filters">
          {[['hepsi','Tümü'],['ev','🏠 Konut'],['isyeri','🏢 İş Yeri'],['arsa','🌱 Arsa']].map(([f,l])=>(
            <button key={f} onClick={()=>setFilter(f)} className={`rq-f${filter===f?' on':''}`}
              style={filter===f?{background:f==='hepsi'?'#c8410a':TYPE_COLOR[f]}:{}}>
              {l}
            </button>
          ))}
        </div>

        <p className="rq-count">{filtered.length} talep</p>

        {loading ? (
          <div style={{textAlign:'center',padding:60,color:'#bbb'}}>Yükleniyor...</div>
        ) : filtered.length === 0 ? (
          <div style={{textAlign:'center',padding:'60px 20px'}}>
            <p style={{fontSize:36,marginBottom:8}}>🔍</p>
            <p style={{color:'#bbb',fontSize:14}}>Henüz talep yok</p>
            <p style={{color:'#ccc',fontSize:12,marginTop:6}}>İlk talebi siz ekleyin</p>
          </div>
        ) : (
          <div className="rq-list">
            {filtered.map(r => {
              const isOwner = r.user_id === user.id
              const canDelete = isOwner || isAdmin
              return (
                <div key={r.id} className="rq-card">
                  <div className="rq-card-top">
                    <div className="rq-card-user">
                      <div className="rq-avatar">{(r.profiles?.full_name||'?')[0].toUpperCase()}</div>
                      <div>
                        <p className="rq-user-name">{r.profiles?.full_name}</p>
                        {r.profiles?.company && <p className="rq-user-co">{r.profiles.company}</p>}
                      </div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <span className="rq-date">{new Date(r.created_at).toLocaleDateString('tr-TR')}</span>
                      {canDelete && <button className="rq-del-btn" onClick={() => handleDelete(r.id)}>×</button>}
                    </div>
                  </div>

                  <p className="rq-card-title">{r.title}</p>
                  {r.description && <p className="rq-card-desc">{r.description}</p>}

                  <div className="rq-card-meta">
                    <span className="rq-type-pill" style={{color:TYPE_COLOR[r.type],background:TYPE_BG[r.type]}}>
                      {TYPE_LABEL[r.type]}
                    </span>
                    {r.city && <span className="rq-loc">📍 {r.city}{r.district?`, ${r.district}`:''}</span>}
                    {r.budget && <span className="rq-budget">{Number(r.budget).toLocaleString('tr-TR')} ₺</span>}
                  </div>

                  {!isOwner && (
                    <div className="rq-msg-area">
                      {sentMap[r.id] ? (
                        <div className="rq-sent">✓ Mesajınız iletildi.</div>
                      ) : (
                        <>
                          <textarea className="rq-msg-inp" rows={2}
                            value={msgMap[r.id] || ''}
                            onChange={e => setMsgMap(m => ({...m, [r.id]: e.target.value}))}
                            placeholder="Uygun ilanınız var mı? Bilgi verin..." />
                          <button className="rq-msg-btn" onClick={() => handleMessage(r)}>
                            💬 Mesaj Gönder
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
