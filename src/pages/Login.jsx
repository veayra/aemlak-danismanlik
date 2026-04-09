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
      <div style={s.top}>
        <div style={s.logoWrap}>
          <div style={s.logoIcon}>A</div>
        </div>
        <h1 style={s.title}>Afinans Gayrimenkul</h1>
        <p style={s.sub}>Profesyonel emlak platformu</p>
      </div>
      <div style={s.card}>
        <form onSubmit={handleLogin}>
          <div style={s.field}>
            <label style={s.label}>E-posta</label>
            <input style={s.input} type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="ornek@mail.com" autoComplete="email" />
          </div>
          <div style={s.field}>
            <label style={s.label}>Şifre</label>
            <input style={s.input} type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••" autoComplete="current-password" />
          </div>
          {error && <div style={s.error}>{error}</div>}
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
  page: { minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 20px', background:'#0a0a0a' },
  top: { textAlign:'center', marginBottom:28 },
  logoWrap: { display:'flex', justifyContent:'center', marginBottom:16 },
  logoIcon: { width:60, height:60, borderRadius:16, background:'linear-gradient(135deg,#ff3b5c,#ff6b35)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, fontWeight:800, color:'#fff' },
  title: { fontSize:20, fontWeight:700, color:'#fff', marginBottom:4 },
  sub: { fontSize:13, color:'#555' },
  card: { width:'100%', maxWidth:380, background:'#141414', border:'1px solid #222', borderRadius:20, padding:'28px 24px' },
  field: { marginBottom:16 },
  label: { display:'block', fontSize:11, color:'#555', marginBottom:7, textTransform:'uppercase', letterSpacing:'0.8px', fontWeight:500 },
  input: { width:'100%', padding:'13px 16px', background:'#1c1c1c', border:'1px solid #2a2a2a', borderRadius:12, fontSize:15, color:'#fff', outline:'none' },
  error: { background:'#2a0f0f', color:'#ff6b6b', fontSize:13, padding:'10px 14px', borderRadius:10, marginBottom:12 },
  btn: { width:'100%', padding:14, background:'linear-gradient(135deg,#ff3b5c,#ff6b35)', color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:600, cursor:'pointer', marginTop:4 },
  footer: { textAlign:'center', marginTop:20, fontSize:13, color:'#555' },
  link: { color:'#ff3b5c', textDecoration:'none', fontWeight:500 }
}
