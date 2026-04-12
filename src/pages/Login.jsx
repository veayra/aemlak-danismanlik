import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const VIDEO_DESKTOP = 'https://fgfmmjazmhxkgdgtubba.supabase.co/storage/v1/object/public/listing-photos/14721758_1920_1080_24fps.mp4'
const VIDEO_MOBILE = 'https://fgfmmjazmhxkgdgtubba.supabase.co/storage/v1/object/public/listing-photos/14786938_1080_1920_30fps.mp4'

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
        html, body { height: 100%; overflow: hidden; }

        .lw {
          position: fixed; inset: 0;
          display: flex; flex-direction: column;
          overflow: hidden;
        }

        /* Video arka plan */
        .lv-m { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center 30%; z-index: 0; }
        .lv-d { display: none; }
        .lo { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.82) 70%, rgba(0,0,0,0.95) 100%); z-index: 1; }

        /* İçerik — tam ortada, scroll yok */
        .lc {
          position: relative; z-index: 2;
          flex: 1; display: flex; flex-direction: column;
          justify-content: center;
          padding: 0 22px;
          overflow: hidden;
        }

        .l-logo { display: flex; align-items: center; gap: 11px; margin-bottom: 20px; }
        .l-logo-icon { width: 44px; height: 44px; border-radius: 13px; background: #c8410a; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; color: #fff; flex-shrink: 0; box-shadow: 0 4px 14px rgba(200,65,10,0.5); }
        .l-logo-name { font-size: 15px; font-weight: 700; color: #fff; line-height: 1.2; }
        .l-logo-sub { font-size: 11px; color: rgba(255,255,255,0.45); margin-top: 2px; }

        .l-badge { display: inline-flex; align-items: center; gap: 7px; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); border-radius: 24px; padding: 5px 13px; margin-bottom: 12px; }
        .l-bdot { width: 7px; height: 7px; border-radius: 50%; background: #4ade80; flex-shrink: 0; }
        .l-btxt { font-size: 11px; color: rgba(255,255,255,0.85); font-weight: 500; }

        .l-title { font-size: 26px; font-weight: 800; color: #fff; line-height: 1.2; margin-bottom: 5px; letter-spacing: -0.5px; }
        .l-sub { font-size: 13px; color: rgba(255,255,255,0.5); margin-bottom: 20px; }

        .l-form { background: rgba(255,255,255,0.1); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.18); border-radius: 18px; padding: 18px; }
        .l-lbl { display: block; font-size: 10px; color: rgba(255,255,255,0.55); margin-bottom: 6px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; }
        .l-inp { width: 100%; padding: 12px 14px; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.18); border-radius: 11px; font-size: 15px; color: #fff; outline: none; font-family: inherit; margin-bottom: 10px; box-sizing: border-box; }
        .l-inp::placeholder { color: rgba(255,255,255,0.3); }
        .l-btn { width: 100%; padding: 14px; background: #c8410a; color: #fff; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; margin-top: 2px; box-shadow: 0 4px 18px rgba(200,65,10,0.55); }
        .l-err { background: rgba(200,65,10,0.25); color: #ffb4a0; font-size: 13px; padding: 9px 13px; border-radius: 9px; margin-bottom: 10px; border: 1px solid rgba(200,65,10,0.4); }
        .l-foot { text-align: center; margin-top: 14px; font-size: 14px; color: rgba(255,255,255,0.45); }
        .l-foot a { color: #fff; text-decoration: none; font-weight: 700; }

        /* PC */
        @media(min-width: 768px) {
          html, body { overflow: auto; }
          .lw { position: relative; min-height: 100vh; flex-direction: row; overflow: visible; }
          .lv-m { display: none; }
          .lv-d { display: block; position: absolute; left: 0; top: 0; bottom: 0; width: 58%; height: 100%; object-fit: cover; z-index: 0; }
          .lo { position: absolute; left: 0; top: 0; bottom: 0; width: 58%; background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 60%); }
          .lc { position: absolute; right: 0; top: 0; bottom: 0; width: 42%; background: #fff; display: flex; flex-direction: column; justify-content: center; padding: 56px 52px; overflow: visible; }
          .l-badge { background: #fef0ed; border-color: #fbd5c8; }
          .l-btxt { color: #c8410a; }
          .l-bdot { background: #c8410a; }
          .l-title { color: #1a1a1a; }
          .l-sub { color: #aaa; }
          .l-logo-name { color: #1a1a1a; }
          .l-logo-sub { color: #bbb; }
          .l-form { background: transparent; backdrop-filter: none; -webkit-backdrop-filter: none; border: none; padding: 0; border-radius: 0; }
          .l-lbl { color: #888; }
          .l-inp { background: #f5f4f0; border: 1.5px solid #e0ddd8; color: #1a1a1a; margin-bottom: 14px; }
          .l-inp::placeholder { color: #bbb; }
          .l-foot { color: #aaa; }
          .l-foot a { color: #c8410a; }
          .l-pc-text { display: flex !important; }
        }

        .l-pc-text {
          display: none;
          position: absolute; left: 0; bottom: 0; width: 58%; z-index: 2;
          flex-direction: column; padding: 44px;
          background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%);
        }
      `}</style>

      <div className="lw">
        <video className="lv-m" autoPlay muted loop playsInline src={VIDEO_MOBILE} />
        <video className="lv-d" autoPlay muted loop playsInline src={VIDEO_DESKTOP} />
        <div className="lo" />

        {/* PC sol yazı */}
        <div className="l-pc-text">
          <div className="l-badge" style={{marginBottom:14}}>
            <div className="l-bdot"/><span className="l-btxt">Yalnızca yetkili emlakçılara özel</span>
          </div>
          <h2 style={{color:'#fff',fontSize:28,fontWeight:700,lineHeight:1.3,marginBottom:10,maxWidth:340}}>Emlakçıların Buluşma Noktası</h2>
          <p style={{color:'rgba(255,255,255,0.6)',fontSize:14,lineHeight:1.7,maxWidth:320,marginBottom:20}}>Konya'nın en güvenilir emlak platformunda ilanlarınızı yönetin.</p>
          <div style={{display:'flex',gap:20}}>
            {[['🔒','Gizli'],['🤝','Emlakçılara Özel'],['⚡','Hızlı']].map(([i,t])=>(
              <div key={t} style={{display:'flex',alignItems:'center',gap:5,color:'rgba(255,255,255,0.65)',fontSize:12,fontWeight:500}}><span>{i}</span><span>{t}</span></div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="lc">
          <div className="l-logo">
            <div className="l-logo-icon">A</div>
            <div>
              <div className="l-logo-name">A Takımı</div>
              <div className="l-logo-sub">Profesyonel emlak platformu</div>
            </div>
          </div>

          <div className="l-badge" style={{marginBottom:10}}>
            <div className="l-bdot"/><span className="l-btxt">Yetkili Emlakçılara Özel</span>
          </div>

          <h1 className="l-title">Emlakçıların<br/>Buluşma Noktası</h1>
          <p className="l-sub">Konya'nın güvenilir emlak platformu</p>

          <div className="l-form">
            <label className="l-lbl">E-posta</label>
            <input className="l-inp" type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="ornek@mail.com" autoComplete="email" />
            <label className="l-lbl">Şifre</label>
            <input className="l-inp" type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••" autoComplete="current-password" onKeyDown={e=>e.key==='Enter'&&handleLogin(e)} />
            {error && <div className="l-err">{error}</div>}
            <button className="l-btn" onClick={handleLogin} disabled={loading}>
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap →'}
            </button>
          </div>
          <p className="l-foot">Hesabınız yok mu? <Link to="/kayit">Kayıt Olun</Link></p>
        </div>
      </div>
    </>
  )
}
