import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'

export default function Navbar() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/giris')
  }

  const active = (path) => location.pathname === path ? { ...styles.link, color: '#1d4ed8', fontWeight: 600 } : styles.link

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        <Link to="/" style={styles.brand}>A Emlak Danışmanlık</Link>
        <div style={styles.links}>
          <Link to="/" style={active('/')}>İlanlar</Link>
          <Link to="/ilan/yeni" style={active('/ilan/yeni')}>+ İlan Ekle</Link>
          {profile?.is_admin && <Link to="/admin" style={active('/admin')}>Admin</Link>}
          <span style={styles.name}>{profile?.full_name}</span>
          <button onClick={handleLogout} style={styles.logout}>Çıkış</button>
        </div>
      </div>
    </nav>
  )
}

const styles = {
  nav: { background:'#fff', borderBottom:'1px solid #e5e7eb', position:'sticky', top:0, zIndex:100 },
  inner: { maxWidth:1100, margin:'0 auto', padding:'0 20px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between' },
  brand: { fontWeight:700, fontSize:17, color:'#1a1a1a', textDecoration:'none' },
  links: { display:'flex', alignItems:'center', gap:24 },
  link: { color:'#374151', textDecoration:'none', fontSize:14 },
  name: { fontSize:13, color:'#6b7280', borderLeft:'1px solid #e5e7eb', paddingLeft:16 },
  logout: { fontSize:13, color:'#ef4444', background:'none', border:'none', cursor:'pointer', padding:0 }
}
