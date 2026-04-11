import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const VIDEO_URL = 'https://fgfmmjazmhxkgdgtubba.supabase.co/storage/v1/object/public/listing-photos/14721758_1920_1080_24fps.mp4'

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
    <>
      <style>{`
        .login-video-side { display: none; }
        .login-form-side { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 32px 24px; background: #f5f4f0; }
        @media(min-width: 768px) {
          .login-wrapper { display: flex !important; }
          .login-video-side { display: block !important; flex: 1; position: relative; overflow: hidden; }
          .login-form-side { flex: 0 0 440px; min-height: 100vh; background: #f5f4f0; }
        }
      `}</style>

      <div className="login-wrapper" style={{ minHeight:'100vh' }}>

        {/* Sol — Video */}
        <div className="login-video-side">
          <video autoPlay muted loop playsInline
            style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}
            src={VIDEO_URL} />
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, rgba(0,0,0,0.15), rgba(0,0,0,0.4))' }} />
          <div style={{ position:'absolute', bottom:40, left:40, zIndex:2 }}>
            <p style={{ color:'rgba(255,255,255,0.7)', fontSize:13, marginBottom:6 }}>Güvenilir • Profesyonel • Hızlı</p>
            <h2 style={{ color:'#fff', fontSize:28, fontWeight:700, lineHeight:1.3, maxWidth:320 }}>
              Konya'nın önde gelen gayrimenkul platformu
            </h2>
          </div>
        </div>

        {/* Sağ — Form */}
        <div className="login-form-side">
          {/* Mobil için video arka plan */}
          <div style={{ display:'none' }} className="mobile-video-bg" />

          <div style={{ width:'100%', maxWidth:360 }}>
            <div style={s.logoWrap}>
              <div style={s.logoBox}><span style={s.logoLetter}>A</span></div>
              <div>
                <h1 style={s.brand}>Afinans Gayrimenkul</h1>
                <p style={s.tagline}>Profesyonel emlak platformu</p>
              </div>
            </div>

            <div style={s.card}>
              <h2 style={s.cardTitle}>Hoş Geldiniz</h2>
              <p style={s.cardSub}>Hesabınıza giriş yapın</p>
              <form onSubmit={handleLogin} style={{marginTop:20}}>
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
      </div>
    </>
  )
}

const s = {
  logoWrap: { display:'flex', alignItems:'center', gap:12, marginBottom:28 },
  logoBox: { width:46, height:46, borderRadius:13, background:'#c8410a', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  logoLetter: { fontSize:22, fontWeight:800, color:'#fff' },
  brand: { fontSize:16, fontWeight:700, color:'#1a1a1a', marginBottom:2 },
  tagline: { fontSize:12, color:'#aaa' },
  card: { background:'#fff', borderRadius:16, padding:'28px 24px', boxShadow:'0 4px 24px rgba(0,0,0,0.07)', border:'1px solid #ece9e4' },
  cardTitle: { fontSize:20, fontWeight:700, color:'#1a1a1a', marginBottom:4 },
  cardSub: { fontSize:13, color:'#aaa' },
  field: { marginBottom:14 },
  label: { display:'block', fontSize:11, color:'#888', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.8px', fontWeight:600 },
  input: { width:'100%', padding:'12px 14px', background:'#f5f4f0', border:'1px solid #e0ddd8', borderRadius:10, fontSize:15, color:'#1a1a1a', outline:'none' },
  error: { background:'#fef0ed', color:'#c8410a', fontSize:13, padding:'10px 14px', borderRadius:10, marginBottom:12, border:'1px solid #fbd5c8' },
  btn: { width:'100%', padding:14, background:'#c8410a', color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:600, cursor:'pointer', marginTop:4 },
  footer: { textAlign:'center', marginTop:18, fontSize:13, color:'#999' },
  link: { color:'#c8410a', textDecoration:'none', fontWeight:600 }
}
