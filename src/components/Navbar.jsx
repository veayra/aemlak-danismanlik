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
        .top-nav { display: none; }
        .bottom-nav { display: flex; }
        @media(min-width: 768px) {
          .top-nav { display: flex !important; }
          .bottom-nav { display: none !important; }
        }
      `}</style>

      {/* Desktop top nav */}
      <nav className="top-nav" style={s.topNav}>
        <div style={s.topInner}>
          <Link to="/" style={s.brand}>◆ Afinans Gayrimenkul</Link>
          <div style={s.topLinks}>
            <Link to="/" style={path==='/' ? {...s.tl,...s.tlA} : s.tl}>İlanlar</Link>
            <Link to="/ilan/yeni" style={path==='/ilan/yeni' ? {...s.tl,...s.tlA} : s.tl}>+ İlan Ekle</Link>
            {profile?.is_admin && <Link to="/admin" style={path==='/admin' ? {...s.tl,...s.tlA} : s.tl}>Admin</Link>}
            <button onClick={handleLogout} style={s.logoutBtn}>Çıkış</button>
          </div>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="bottom-nav" style={s.bottomNav}>
        <Link to="/" style={s.navItem}>
          <svg width="22" height="22" fill="none" stroke={path==='/' ? '#ff3b5c' : '#555'} strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span style={{...s.navLabel, color: path==='/' ? '#ff3b5c' : '#555'}}>İlanlar</span>
        </Link>

        <Link to="/ilan/yeni" style={s.navItemCenter}>
          <div style={s.addCircle}>
            <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
        </Link>

        {profile?.is_admin
          ? <Link to="/admin" style={s.navItem}>
              <svg width="22" height="22" fill="none" stroke={path==='/admin' ? '#ff3b5c' : '#555'} strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
              <span style={{...s.navLabel, color: path==='/admin' ? '#ff3b5c' : '#555'}}>Admin</span>
            </Link>
          : <button onClick={handleLogout} style={{...s.navItem, background:'none', border:'none', cursor:'pointer', padding:'8px 20px'}}>
              <svg width="22" height="22" fill="none" stroke="#555" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              <span style={{...s.navLabel, color:'#555'}}>Çıkış</span>
            </button>
        }
      </nav>
    </>
  )
}

const s = {
  topNav: { background:'#0f0f0f', borderBottom:'1px solid #1f1f1f', position:'sticky', top:0, zIndex:100 },
  topInner: { maxWidth:1100, margin:'0 auto', padding:'0 24px', height:54, display:'flex', alignItems:'center', justifyContent:'space-between' },
  brand: { textDecoration:'none', color:'#fff', fontSize:15, fontWeight:700, letterSpacing:'-0.3px' },
  topLinks: { display:'flex', alignItems:'center', gap:4 },
  tl: { color:'#666', textDecoration:'none', fontSize:13, padding:'6px 14px', borderRadius:8 },
  tlA: { color:'#fff', background:'#1f1f1f' },
  logoutBtn: { color:'#ff3b5c', background:'none', border:'none', fontSize:13, cursor:'pointer', padding:'6px 14px' },
  bottomNav: { position:'fixed', bottom:0, left:0, right:0, height:60, background:'#0f0f0f', borderTop:'1px solid #1a1a1a', alignItems:'center', justifyContent:'space-around', zIndex:100 },
  navItem: { display:'flex', flexDirection:'column', alignItems:'center', gap:4, textDecoration:'none', padding:'8px 20px' },
  navItemCenter: { display:'flex', alignItems:'center', justifyContent:'center', textDecoration:'none' },
  addCircle: { width:46, height:46, borderRadius:'50%', background:'#ff3b5c', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:2 },
  navLabel: { fontSize:10, fontWeight:500, letterSpacing:'0.3px' }
}
