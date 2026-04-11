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
        .login-wrap { display: flex; min-height: 100vh; }
        .login-left { display: none; }
        .login-right { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px 24px; background: #f5f4f0; }
        @media(min-width: 768px) {
          .login-left { display: flex; flex: 1; position: relative; overflow: hidden; flex-direction: column; justify-content: flex-end; padding: 48px; }
          .login-right { flex: 0 0 460px; min-height: 100vh; }
        }
      `}</style>

      <div className="login-wrap">
        {/* Sol — Video */}
        <div className="login-left">
          <video autoPlay muted loop playsInline
            style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', zIndex:0 }}
            src={VIDEO_URL} />
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 60%)', zIndex:1 }} />
          <div style={{ position:'relative', zIndex:2 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.12)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:24, padding:'6px 14px', marginBottom:20 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#4ade80' }}/>
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.85)', fontWeight:500 }}>Yalnızca yetkili emlakçılara özel</span>
            </div>
            <h2 style={{ color:'#fff', fontSize:32, fontWeight:700, lineHeight:1.3, marginBottom:12, maxWidth:380 }}>
              Emlakçıların Buluşma Noktası
            </h2>
            <p style={{ color:'rgba(255,255,255,0.6)', fontSize:15, lineHeight:1.6, maxWidth:360 }}>
              Konya'nın en güvenilir emlak platformunda ilanlarınızı yönetin, diğer profesyonellerle bağlantı kurun.
            </p>
            <div style={{ display:'flex', gap:20, marginTop:28 }}>
              {[['🔒','Gizli & Güvenli'],['🤝','Sadece Emlakçılar'],['⚡','Hızlı & Kolay']].map(([icon, text]) => (
                <div key={text} style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontSize:16 }}>{icon}</span>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.65)', fontWeight:500 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sağ — Form */}
        <div className="login-right">
          <div style={{ width:'100%', maxWidth:380 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:36 }}>
              <div style={{ width:48, height:48, borderRadius:14, background:'#c8410a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:800, color:'#fff', boxShadow:'0 4px 12px rgba(200,65,10,0.35)', flexShrink:0 }}>A</div>
              <div>
                <p style={{ fontSize:16, fontWeight:700, color:'#1a1a1a', marginBottom:2 }}>Afinans Gayrimenkul</p>
                <p style={{ fontSize:12, color:'#bbb' }}>Profesyonel emlak platformu</p>
              </div>
            </div>

            <h1 style={{ fontSize:24, fontWeight:700, color:'#1a1a1a', marginBottom:6 }}>Hoş Geldiniz</h1>
            <p style={{ fontSize:14, color:'#aaa', marginBottom:28 }}>Hesabınıza giriş yapın</p>

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom:18 }}>
                <label style={s.label}>E-posta</label>
                <input style={s.input} type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="ornek@mail.com" autoComplete="email" />
              </div>
              <div style={{ marginBottom:20 }}>
                <label style={s.label}>Şifre</label>
                <input style={s.input} type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••" autoComplete="current-password" />
              </div>
              {error && <div style={s.error}>{error}</div>}
              <button style={s.btn} type="submit" disabled={loading}>
                {loading ? 'Giriş yapılıyor...' : 'Giriş Yap →'}
              </button>
            </form>

            <div style={{ display:'flex', alignItems:'center', gap:12, margin:'24px 0' }}>
              <div style={{ flex:1, height:1, background:'#ece9e4' }}/>
              <span style={{ fontSize:12, color:'#ccc' }}>veya</span>
              <div style={{ flex:1, height:1, background:'#ece9e4' }}/>
            </div>

            <p style={{ textAlign:'center', fontSize:14, color:'#aaa' }}>
              Hesabınız yok mu?{' '}
              <Link to="/kayit" style={{ color:'#c8410a', textDecoration:'none', fontWeight:600 }}>Kayıt Olun</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

const s = {
  label: { display:'block', fontSize:12, color:'#888', marginBottom:8, fontWeight:600, letterSpacing:'0.3px' },
  input: { width:'100%', padding:'13px 16px', background:'#fff', border:'1.5px solid #e0ddd8', borderRadius:12, fontSize:15, color:'#1a1a1a', outline:'none', fontFamily:'inherit', boxShadow:'0 1px 4px rgba(0,0,0,0.04)', transition:'border-color 0.15s' },
  error: { background:'#fef0ed', color:'#c8410a', fontSize:13, padding:'12px 16px', borderRadius:10, marginBottom:16, border:'1px solid #fbd5c8' },
  btn: { width:'100%', padding:'14px', background:'#c8410a', color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:600, cursor:'pointer', boxShadow:'0 4px 12px rgba(200,65,10,0.3)', letterSpacing:'0.2px' }
}
