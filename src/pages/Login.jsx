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
        .login-wrap {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: stretch;
        }

        /* Mobil: video tam ekran arka plan */
        .login-video {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 0;
        }
        .login-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.55);
          z-index: 1;
        }
        .login-left-text { display: none; }
        .login-right {
          position: relative;
          z-index: 2;
          flex: 1;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 32px 24px;
          flex-direction: column;
        }

        /* PC: sol video panel, sağ beyaz panel */
        @media(min-width: 768px) {
          .login-video {
            position: absolute;
            left: 0; top: 0; bottom: 0;
            width: 58%;
            height: 100%;
            object-fit: cover;
            z-index: 0;
          }
          .login-overlay { display: none; }
          .login-left-text {
            display: flex;
            position: absolute;
            left: 0; top: 0; bottom: 0;
            width: 58%;
            z-index: 1;
            flex-direction: column;
            justify-content: flex-end;
            padding: 48px;
            background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 60%);
          }
          .login-right {
            position: absolute;
            right: 0; top: 0; bottom: 0;
            width: 42%;
            background: #fff;
            z-index: 2;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            padding: 48px 48px;
            overflow-y: auto;
          }
        }
      `}</style>

      <div className="login-wrap">
        {/* Video */}
        <video className="login-video" autoPlay muted loop playsInline src={VIDEO_URL} />

        {/* Mobil overlay */}
        <div className="login-overlay" />

        {/* PC sol yazı */}
        <div className="login-left-text">
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.12)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:24, padding:'6px 14px', marginBottom:20 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#4ade80' }}/>
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.85)', fontWeight:500 }}>Yalnızca yetkili emlakçılara özel</span>
          </div>
          <h2 style={{ color:'#fff', fontSize:30, fontWeight:700, lineHeight:1.3, marginBottom:12, maxWidth:360 }}>
            Emlakçıların Buluşma Noktası
          </h2>
          <p style={{ color:'rgba(255,255,255,0.65)', fontSize:14, lineHeight:1.7, maxWidth:340 }}>
            Konya'nın en güvenilir emlak platformunda ilanlarınızı yönetin, diğer profesyonellerle bağlantı kurun.
          </p>
          <div style={{ display:'flex', gap:20, marginTop:24 }}>
            {[['🔒','Gizli & Güvenli'],['🤝','Sadece Emlakçılar'],['⚡','Hızlı & Kolay']].map(([icon,text]) => (
              <div key={text} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:15 }}>{icon}</span>
                <span style={{ fontSize:12, color:'rgba(255,255,255,0.65)', fontWeight:500 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form — mobilde cam efekti, PC'de beyaz */}
        <div className="login-right">
          <div style={{ width:'100%', maxWidth:360 }}>
            {/* Logo */}
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:28 }}>
              <div style={{ width:46, height:46, borderRadius:13, background:'#c8410a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:21, fontWeight:800, color:'#fff', flexShrink:0, boxShadow:'0 4px 12px rgba(200,65,10,0.35)' }}>A</div>
              <div>
                <p style={{ fontSize:15, fontWeight:700, color:'#fff', marginBottom:1 }} className="login-brand">Afinans Gayrimenkul</p>
                <p style={{ fontSize:11, color:'rgba(255,255,255,0.55)' }} className="login-brand-sub">Profesyonel emlak platformu</p>
              </div>
            </div>

            {/* Mobilde cam efektli kart */}
            <div style={s.mobileCard} className="login-card">
              {/* Mobilde başlık yazısı */}
              <div className="login-mobile-heading" style={{ marginBottom:16 }}>
                <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.15)', borderRadius:20, padding:'4px 12px', marginBottom:10 }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:'#4ade80' }}/>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,0.85)', fontWeight:500 }}>Yetkili Emlakçılara Özel</span>
                </div>
                <h2 style={{ fontSize:20, fontWeight:700, color:'#fff', marginBottom:4 }}>Emlakçıların Buluşma Noktası</h2>
                <p style={{ fontSize:12, color:'rgba(255,255,255,0.6)', lineHeight:1.5 }}>Konya'nın güvenilir emlak platformu</p>
              </div>

              <h3 style={s.formTitle} className="login-form-title">Giriş Yap</h3>
              <form onSubmit={handleLogin}>
                <div style={{ marginBottom:14 }}>
                  <label style={s.label} className="login-label">E-posta</label>
                  <input style={s.input} type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="ornek@mail.com" autoComplete="email" />
                </div>
                <div style={{ marginBottom:18 }}>
                  <label style={s.label} className="login-label">Şifre</label>
                  <input style={s.input} type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••" autoComplete="current-password" />
                </div>
                {error && <div style={s.error}>{error}</div>}
                <button style={s.btn} type="submit" disabled={loading}>
                  {loading ? 'Giriş yapılıyor...' : 'Giriş Yap →'}
                </button>
              </form>
              <p style={s.footer} className="login-footer">
                Hesabınız yok mu?{' '}
                <Link to="/kayit" style={{ color:'#fff', textDecoration:'none', fontWeight:700 }} className="login-kayit-link">Kayıt Olun</Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* Mobil: cam efekti, beyaz yazılar */
        .login-card {
          background: rgba(255,255,255,0.12) !important;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.2) !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.25) !important;
        }
        .login-brand { color: #fff !important; }
        .login-brand-sub { color: rgba(255,255,255,0.55) !important; }
        .login-label { color: rgba(255,255,255,0.7) !important; }
        .login-form-title { color: #fff !important; }
        .login-footer { color: rgba(255,255,255,0.6) !important; }
        .login-kayit-link { color: #fff !important; }
        .login-mobile-heading { display: block; }

        /* PC: temiz beyaz form */
        @media(min-width: 768px) {
          .login-card {
            background: transparent !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            border-radius: 0 !important;
          }
          .login-brand { color: #1a1a1a !important; }
          .login-brand-sub { color: #bbb !important; }
          .login-label { color: #888 !important; }
          .login-form-title { color: #1a1a1a !important; font-size: 24px !important; margin-bottom: 20px !important; }
          .login-footer { color: #aaa !important; }
          .login-kayit-link { color: #c8410a !important; }
          .login-mobile-heading { display: none !important; }
          .login-right { align-items: center; justify-content: center; }
        }
      `}</style>
    </>
  )
}

const s = {
  mobileCard: { borderRadius:20, padding:'24px 20px' },
  formTitle: { fontSize:18, fontWeight:700, marginBottom:16 },
  label: { display:'block', fontSize:11, marginBottom:7, fontWeight:600, letterSpacing:'0.5px', textTransform:'uppercase' },
  input: { width:'100%', padding:'13px 16px', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:12, fontSize:15, color:'#fff', outline:'none', fontFamily:'inherit' },
  error: { background:'rgba(200,65,10,0.25)', color:'#ffb4a0', fontSize:13, padding:'10px 14px', borderRadius:10, marginBottom:12, border:'1px solid rgba(200,65,10,0.4)' },
  btn: { width:'100%', padding:'14px', background:'#c8410a', color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:600, cursor:'pointer', boxShadow:'0 4px 12px rgba(200,65,10,0.4)', marginBottom:16 },
  footer: { textAlign:'center', fontSize:13, marginTop:4 }
}
