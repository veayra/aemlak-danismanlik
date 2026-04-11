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
        .login-video { display: block; }
        .login-form-wrap { 
          position: absolute; inset: 0; display: flex; 
          align-items: center; justify-content: center; 
          padding: 24px; z-index: 2;
        }
        @media(min-width: 768px) {
          .login-video { position: absolute; left: 0; top: 0; bottom: 0; width: 60%; }
          .login-form-wrap { 
            position: absolute; right: 0; top: 0; bottom: 0; width: 40%; 
            background: #fff; align-items: center; justify-content: center;
            padding: 48px 40px;
          }
          .login-overlay { display: none !important; }
          .login-card { background: transparent !important; box-shadow: none !important; border: none !important; padding: 0 !important; }
          .login-title { color: #1a1a1a !important; }
          .login-sub { color: #aaa !important; }
          .login-label { color: #888 !important; }
          .login-footer { color: #aaa !important; }
        }
      `}</style>

      <div style={{ position:'relative', minHeight:'100vh', overflow:'hidden', background:'#1a1a1a' }}>
        {/* Video */}
        <video className="login-video" autoPlay muted loop playsInline
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}
          src={VIDEO_URL} />

        {/* Overlay (sadece mobil) */}
        <div className="login-overlay" style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.55)', zIndex:1 }} />

        {/* PC'de sol altta yazı */}
        <div style={{ position:'absolute', bottom:40, left:40, zIndex:2, display:'none' }} className="login-tagline-desktop">
          <p style={{ color:'rgba(255,255,255,0.65)', fontSize:13, marginBottom:8 }}>Güvenilir • Profesyonel • Hızlı</p>
          <h2 style={{ color:'#fff', fontSize:26, fontWeight:700, lineHeight:1.35, maxWidth:300 }}>
            Konya'nın önde gelen gayrimenkul platformu
          </h2>
        </div>

        {/* Form */}
        <div className="login-form-wrap">
          <div style={{ width:'100%', maxWidth:340 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:28 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:'#c8410a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:800, color:'#fff', flexShrink:0, boxShadow:'0 2px 8px rgba(200,65,10,0.35)' }}>A</div>
              <div>
                <p className="login-title" style={{ fontSize:15, fontWeight:700, color:'#fff', marginBottom:1 }}>Afinans Gayrimenkul</p>
                <p className="login-sub" style={{ fontSize:11, color:'rgba(255,255,255,0.55)' }}>Profesyonel emlak platformu</p>
              </div>
            </div>

            <div className="login-card" style={{ background:'rgba(255,255,255,0.1)', backdropFilter:'blur(20px)', borderRadius:16, padding:'28px 24px', border:'1px solid rgba(255,255,255,0.15)', boxShadow:'0 8px 32px rgba(0,0,0,0.2)' }}>
              <h2 className="login-title" style={{ fontSize:20, fontWeight:700, color:'#fff', marginBottom:4 }}>Giriş Yap</h2>
              <p className="login-sub" style={{ fontSize:13, color:'rgba(255,255,255,0.5)', marginBottom:20 }}>Hesabınıza erişin</p>

              <form onSubmit={handleLogin}>
                <div style={{ marginBottom:14 }}>
                  <label className="login-label" style={{ display:'block', fontSize:11, color:'rgba(255,255,255,0.6)', marginBottom:7, textTransform:'uppercase', letterSpacing:'0.8px', fontWeight:600 }}>E-posta</label>
                  <input style={s.input} type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="ornek@mail.com" autoComplete="email" />
                </div>
                <div style={{ marginBottom:16 }}>
                  <label className="login-label" style={{ display:'block', fontSize:11, color:'rgba(255,255,255,0.6)', marginBottom:7, textTransform:'uppercase', letterSpacing:'0.8px', fontWeight:600 }}>Şifre</label>
                  <input style={s.input} type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••" autoComplete="current-password" />
                </div>
                {error && <div style={s.error}>{error}</div>}
                <button style={s.btn} type="submit" disabled={loading}>
                  {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                </button>
              </form>
            </div>

            <p className="login-footer" style={{ textAlign:'center', marginTop:18, fontSize:13, color:'rgba(255,255,255,0.5)' }}>
              Hesabınız yok mu? <Link to="/kayit" style={{ color:'#fff', textDecoration:'none', fontWeight:600 }}>Kayıt Olun</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

const s = {
  input: { width:'100%', padding:'12px 14px', background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:10, fontSize:15, color:'#fff', outline:'none', fontFamily:'inherit' },
  error: { background:'rgba(200,65,10,0.25)', color:'#ffb4a0', fontSize:13, padding:'10px 14px', borderRadius:10, marginBottom:12, border:'1px solid rgba(200,65,10,0.4)' },
  btn: { width:'100%', padding:14, background:'#c8410a', color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:600, cursor:'pointer', boxShadow:'0 2px 8px rgba(200,65,10,0.4)' }
}
