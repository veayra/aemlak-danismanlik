import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'

export default function Navbar() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/giris')
  }

  const isActive = (path) => location.pathname === path

  return (
    <>
      <nav style={s.nav}>
        <div style={s.inner}>
          <Link to="/" style={s.brand}>
            <span style={s.brandDot}>◆</span>
            <span>A Emlak Danışmanlık</span>
          </Link>
          <div style={s.links}>
            <Link to="/" style={isActive('/') ? {...s.link, ...s.linkActive} : s.link}>İlanlar</Link>
            <Link to="/ilan/yeni" style={isActive('/ilan/yeni') ? {...s.link, ...s.linkActive} : s.link}>+ İlan Ekle</Link>
            {profile?.is_admin && <Link to="/admin" style={isActive('/admin') ? {...s.link, ...s.linkActive} : s.link}>Admin</Link>}
          </div>
          <div style={s.right}>
            <span style={s.userName}>{profile?.full_name?.split(' ')[0]}</span>
            <button onClick={handleLogout} style={s.logoutBtn}>Çıkış</button>
          </div>
        </div>
      </nav>
      <style>{`
        @media(max-width:640px){
          .nav-links{display:none!important}
          .nav-right{display:none!important}
        }
      `}</style>
    </>
  )
}

const s = {
  nav: { background:'#111111', borderBottom:'1px solid #252525', position:'sticky', top:0, zIndex:100 },
  inner: { maxWidth:1200, margin:'0 auto', padding:'0 20px', height:58, display:'flex', alignItems:'center', justifyContent:'space-between', gap:20 },
  brand: { display:'flex', alignItems:'center', gap:8, textDecoration:'none', color:'#f0f0ee', fontFamily:"'DM Serif Display', serif", fontSize:17, whiteSpace:'nowrap' },
  brandDot: { color:'#c8a96e', fontSize:9 },
  links: { display:'flex', gap:2, flex:1, justifyContent:'center' },
  link: { color:'#888', textDecoration:'none', fontSize:13, padding:'6px 14px', borderRadius:8 },
  linkActive: { color:'#f0f0ee', background:'#1f1f1f' },
  right: { display:'flex', alignItems:'center', gap:12, whiteSpace:'nowrap' },
  userName: { fontSize:12, color:'#555' },
  logoutBtn: { fontSize:12, color:'#c8a96e', background:'none', border:'1px solid #2a2a2a', borderRadius:7, padding:'5px 12px', cursor:'pointer' }
}
