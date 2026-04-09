import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('E-posta veya şifre hatalı.')
    setLoading(false)
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>◆</div>
        <h1 style={s.title}>A Emlak Danışmanlık</h1>
        <p style={s.sub}>Profesyonel emlak platformu</p>
        <form onSubmit={handleLogin} style={{marginTop:28}}>
          <label style={s.label}>E-posta</label>
          <input style={s.input} type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="ornek@mail.com" />
          <label style={{...s.label, marginTop:14}}>Şifre</label>
          <input style={s.input} type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••" />
          {error && <p style={s.error}>{error}</p>}
          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
        <p style={s.footer}>Hesabınız yok mu? <Link to="/kayit" style={s.link}>Kayıt Olun</Link></p>
      </div>
    </div>
  )
}

const s = {
  page: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'#0f0f0f' },
  card: { background:'#161616', border:'1px solid #252525', borderRadius:16, padding:'40px 36px', width:'100%', maxWidth:400 },
  logo: { fontSize:24, color:'#c8a96e', textAlign:'center', marginBottom:12 },
  title: { fontFamily:"'DM Serif Display',serif", fontSize:22, textAlign:'center', color:'#f0f0ee', fontWeight:400 },
  sub: { fontSize:13, color:'#555', textAlign:'center', marginTop:4 },
  label: { display:'block', fontSize:12, color:'#777', marginBottom:6, letterSpacing:'0.5px', textTransform:'uppercase' },
  input: { width:'100%', padding:'11px 14px', background:'#1f1f1f', border:'1px solid #2a2a2a', borderRadius:8, fontSize:14, color:'#f0f0ee', outline:'none', marginBottom:2 },
  error: { color:'#e74c3c', fontSize:13, margin:'10px 0' },
  btn: { width:'100%', padding:13, background:'#c8a96e', color:'#0f0f0f', border:'none', borderRadius:9, fontSize:14, fontWeight:600, cursor:'pointer', marginTop:20 },
  footer: { textAlign:'center', marginTop:20, fontSize:13, color:'#555' },
  link: { color:'#c8a96e', textDecoration:'none' }
}
