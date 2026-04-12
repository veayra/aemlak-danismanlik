import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'

export default function Navbar() {
  const { profile } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const path = location.pathname

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/giris')
  }

  return (
    <>
      <style>{`
        .top-nav { display:none; }
        .bottom-nav { display:flex; }
        @media(min-width:768px) {
          .top-nav { display:flex !important; }
          .bottom-nav { display:none !important; }
        }
      `}</style>

      <nav className="top-nav" style={s.topNav}>
        <div style={s.inner}>
          <Link to="/" style={s.brand}>
            <div style={s.brandIcon}>A</div>
            <div>
              <div style={s.brandName}>A Takımı</div>
              <div style={s.brandSub}>Profesyonel Emlak Platformu</div>
            </div>
          </Link>
          <div style={s.links}>
            <Link to="/" style={path==='/' ? {...s.link,...s.linkActive} : s.link}>İlanlar</Link>
            {profile?.is_admin && <Link to="/admin" style={path==='/admin' ? {...s.link,...s.linkActive} : s.link}>Admin</Link>}
            <Link to="/ilan/yeni" style={s.addBtn}>+ İlan Ekle</Link>
          </div>
          <div style={s.userArea}>
            <div style={s.userAvatar}>{(profile?.full_name||'?')[0].toUpperCase()}</div>
            <span style={s.userName}>{profile?.full_name}</span>
            <button onClick={handleLogout} style={s.logoutBtn}>Çıkış</button>
          </div>
        </div>
      </nav>

      <nav className="bottom-nav" style={s.bottomNav}>
        <Link to="/" style={s.navItem}>
          <svg width="22" height="22" fill="none" stroke={path==='/' ? '#c8410a' : '#bbb'} strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span style={{...s.navLabel, color:path==='/' ? '#c8410a' : '#bbb'}}>İlanlar</span>
        </Link>
        <Link to="/ilan/yeni" style={s.navItemCenter}>
          <div style={s.addCircle}>
            <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
          <span style={{...s.navLabel, color:'#bbb', marginTop:2}}>Ekle</span>
        </Link>
        {profile?.is_admin && (
          <Link to="/admin" style={s.navItem}>
            <svg width="22" height="22" fill="none" stroke={path==='/admin' ? '#c8410a' : '#bbb'} strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            <span style={{...s.navLabel, color:path==='/admin' ? '#c8410a' : '#bbb'}}>Admin</span>
          </Link>
        )}
        <button onClick={handleLogout} style={{...s.navItem, background:'none', border:'none', cursor:'pointer', padding:'6px 12px'}}>
          <svg width="22" height="22" fill="none" stroke="#bbb" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          <span style={{...s.navLabel, color:'#bbb'}}>Çıkış</span>
        </button>
      </nav>
    </>
  )
}

const s = {
  topNav: { background:'#fff', borderBottom:'1px solid #ece9e4', position:'sticky', top:0, zIndex:100, boxShadow:'0 1px 8px rgba(0,0,0,0.05)' },
  inner: { maxWidth:1280, margin:'0 auto', padding:'0 40px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between', gap:32 },
  brand: { display:'flex', alignItems:'center', gap:12, textDecoration:'none', flexShrink:0 },
  brandIcon: { width:40, height:40, borderRadius:12, background:'#c8410a', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:800, boxShadow:'0 2px 8px rgba(200,65,10,0.3)' },
  brandName: { fontSize:15, fontWeight:700, color:'#1a1a1a', lineHeight:1.2 },
  brandSub: { fontSize:10, color:'#bbb', marginTop:1 },
  links: { display:'flex', alignItems:'center', gap:4, flex:1, justifyContent:'center' },
  link: { color:'#777', textDecoration:'none', fontSize:14, padding:'8px 16px', borderRadius:9, fontWeight:500 },
  linkActive: { color:'#c8410a', background:'#fef0ed', fontWeight:600 },
  addBtn: { background:'#c8410a', color:'#fff', textDecoration:'none', fontSize:13, padding:'9px 20px', borderRadius:9, fontWeight:600, marginLeft:8 },
  userArea: { display:'flex', alignItems:'center', gap:10, flexShrink:0, background:'#f5f4f0', border:'1px solid #ece9e4', borderRadius:24, padding:'6px 16px 6px 8px' },
  userAvatar: { width:30, height:30, borderRadius:'50%', background:'#c8410a', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700 },
  userName: { fontSize:13, color:'#555', fontWeight:500, maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  logoutBtn: { display:'flex', alignItems:'center', color:'#aaa', background:'none', border:'none', fontSize:12, cursor:'pointer', padding:'0 0 0 8px', borderLeft:'1px solid #ece9e4', marginLeft:4 },
  bottomNav: { position:'fixed', bottom:0, left:0, right:0, height:62, background:'#fff', borderTop:'1px solid #ece9e4', alignItems:'center', justifyContent:'space-around', zIndex:100, boxShadow:'0 -2px 12px rgba(0,0,0,0.06)' },
  navItem: { display:'flex', flexDirection:'column', alignItems:'center', gap:3, textDecoration:'none', padding:'6px 12px' },
  navItemCenter: { display:'flex', flexDirection:'column', alignItems:'center', gap:3, textDecoration:'none' },
  addCircle: { width:44, height:44, borderRadius:'50%', background:'#c8410a', display:'flex', alignItems:'center', justifyContent:'center', marginTop:-10, boxShadow:'0 4px 12px rgba(200,65,10,0.35)' },
  navLabel: { fontSize:10, fontWeight:500 }
}
