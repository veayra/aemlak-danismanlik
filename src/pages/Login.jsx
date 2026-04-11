import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const VIDEO_URL = 'https://fgfmmjazmhxkgdgtubba.supabase.co/storage/v1/object/public/listing-photos/istockphoto-2252268051-640_adpp_is.mp4'

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
      {/* Video arka plan */}
      <video autoPlay muted loop playsInline style={s.video} src={VIDEO_URL} />
      <div style={s.overlay} />

      {/* İçerik */}
      <div style={s.content}>
        <div style={s.top}>
          <div style={s.logoBox}>
            <span style={s.logoLetter}>A</span>
          </div>
          <h1 style={s.brand}>Afinans Gayrimenkul</h1>
          <p style={s.tagline}>Profesyonel emlak platformu</p>
        </div>

        <div style={s.card}>
          <h2 style={s.cardTitle}>Giriş Yap</h2>
          <form onSubmit={handleLogin}>
            <div style={s.field}>
              <label style={s.label}>E-posta</label>
              <input style={s.input} type="email" value={email}
                onChange={e => setEmail(e.target.value)} required placeholder="ornek@mail.com" autoComplete="email" />
            </div>
            <div style={s.field}>
              <label style={s.label}>Şifre</label>
              <input style={s.input} type="password" value={password}
                onChange={e => setPassword(e.target.value)} required placeholder="••••••••" autoComplete="current-password" />
            </div>
            {error && <div style={s.error}>{error}</div>}
            <button style={s.btn} type="submit" disabled={loading}>
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
          <p style={s.footer}>Hesabınız yok mu? <Link to="/kayit" style={s.link}>Kayıt Olun</Link></p>
        </div>
      </div>
    </div>
  )
}

const s = {
  page: { minHeight:'100vh', position:'relative', display:'flex', alignItems:'center', justifyContent:'center', padding:20, overflow:'hidden' },
  video: { position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', zIndex:0 },
  overlay: { position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.65) 100%)', zIndex:1 },
  content: { position:'relative', zIndex:2, width:'100%', maxWidth:400, display:'flex', flexDirection:'column', alignItems:'center', gap:24 },
  top: { textAlign:'center' },
  logoBox: { width:64, height:64, borderRadius:18, background:'#c8410a', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' },
  logoLetter: { fontSize:28, fontWeight:800, color:'#fff' },
  brand: { fontSize:22, fontWeight:700, color:'#fff', marginBottom:4, letterSpacing:'-0.3px' },
  tagline: { fontSize:13, color:'rgba(255,255,255,0.6)' },
  card: { width:'100%', background:'rgba(255,255,255,0.95)', backdropFilter:'blur(20px)', borderRadius:20, padding:'28px 24px', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' },
  cardTitle: { fontSize:18, fontWeight:700, color:'#1a1a1a', marginBottom:20 },
  field: { marginBottom:14 },
  label: { display:'block', fontSize:11, color:'#888', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.8px', fontWeight:600 },
  input: { width:'100%', padding:'12px 14px', background:'#f5f4f0', border:'1px solid #e0ddd8', borderRadius:10, fontSize:15, color:'#1a1a1a', outline:'none' },
  error: { background:'#fef0ed', color:'#c8410a', fontSize:13, padding:'10px 14px', borderRadius:10, marginBottom:12, border:'1px solid #fbd5c8' },
  btn: { width:'100%', padding:14, background:'#c8410a', color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:600, cursor:'pointer', marginTop:4 },
  footer: { textAlign:'center', marginTop:18, fontSize:13, color:'#999' },
  link: { color:'#c8410a', textDecoration:'none', fontWeight:600 }
}
