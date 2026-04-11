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
        .lw { position: relative; min-height: 100vh; display: flex; align-items: stretch; }

        /* Mobil video */
        .lv-mobile { position: fixed; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center 20%; z-index: 0; }
        .lv-desktop { display: none; }

        .lo { position: fixed; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 55%, rgba(0,0,0,0.1) 100%); z-index: 1; }

        .lc {
          position: relative; z-index: 2; flex: 1;
          display: flex; flex-direction: column; justify-content: flex-end;
          padding: 28px 22px 44px;
        }

        .l-logo { display: flex; align-items: center; gap: 11px; margin-bottom: 24px; }
        .l-logo-icon { width: 46px; height: 46px; border-radius: 13px; background: #c8410a; display: flex; align-items: center; justify-content: center; font-size: 21px; font-weight: 800; color: #fff; flex-shrink: 0; box-shadow: 0 4px 16px rgba(200,65,10,0.45); }
        .l-logo-name { font-size: 16px; font-weight: 700; color: #fff; line-height: 1.2; }
        .l-logo-sub { font-size: 11px; color: rgba(255,255,255,0.45); margin-top: 2px; }

        .l-badge { display: inline-flex; align-items: center; gap: 7px; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); border-radius: 24px; padding: 5px 13px; margin-bottom: 14px; width: fit-content; }
        .l-badge-dot { width: 7px; height: 7px; border-radius: 50%; background: #4ade80; flex-shrink:0; }
        .l-badge-txt { font-size: 11px; color: rgba(255,255,255,0.85); font-weight: 500; }

        .l-title { font-size: 26px; font-weight: 800; color: #fff; line-height: 1.25; margin-bottom: 6px; letter-spacing: -0.5px; }
        .l-sub { font-size: 13px; color: rgba(255,255,255,0.5); margin-bottom: 22px; }

        .l-form { background: rgba(255,255,255,0.1); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.18); border-radius: 18px; padding: 20px; }
        .l-label { display: block; font-size: 10px; color: rgba(255,255,255,0.55); margin-bottom: 6px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; }
        .l-input { width: 100%; padding: 13px 15px; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.18); border-radius: 11px; font-size: 15px; color: #fff; outline: none; font-family: inherit; margin-bottom: 12px; box-sizing: border-box; }
        .l-input::placeholder { color: rgba(255,255,255,0.3); }
        .l-btn { width: 100%; padding: 15px; background: #c8410a; color: #fff; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; margin-top: 4px; box-shadow: 0 4px 20px rgba(200,65,10,0.5); }
        .l-err { background: rgba(200,65,10,0.25); color: #ffb4a0; font-size: 13px; padding: 10px 14px; border-radius: 10px; margin-bottom: 10px; border: 1px solid rgba(200,65,10,0.4); }
        .l-footer { text-align: center; margin-top: 16px; font-size: 14px; color: rgba(255,255,255,0.45); }
        .l-footer a { color: #fff; text-decoration: none; font-weight: 700; }

        /* PC */
        @media(min-width: 768px) {
          .lv-mobile { display: none; }
          .lv-desktop { display: block; position: absolute; left: 0; top: 0; bottom: 0; width: 58%; height: 100%; object-fit: cover; z-index: 0; }
          .lo { position: absolute; left: 0; top: 0; bottom: 0; width: 58%; background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 60%); }
          .lc { position: absolute; right: 0; top: 0; bottom: 0; width: 42%; background: #fff; display: flex; flex-direction: column; justify-content: center; padding: 56px 52px; z-index: 2; }
          .l-badge { background: #fef0ed; border-color: #fbd5c8; }
          .l-badge-txt { color: #c8410a; }
          .l-badge-dot { background: #c8410a; }
          .l-title { color: #1a1a1a; font-size: 28px; }
          .l-sub { color: #aaa; }
          .l-logo-name { color: #1a1a1a; }
          .l-logo-sub { color: #bbb; }
          .l-form { background: transparent; backdrop-filter: none; -webkit-backdrop-filter: none; border: none; padding: 0; border-radius: 0; }
          .l-label { color: #888; }
          .l-input { background: #f5f4f0; border: 1.5px solid #e0ddd8; color: #1a1a1a; margin-bottom: 14px; }
          .l-input::placeholder { color: #bbb; }
          .l-footer { color: #aaa; }
          .l-footer a { color: #c8410a; }
          .l-left-text { display: flex !important; }
        }

        .l-left-text {
          display: none;
          position: absolute; left: 0; bottom: 0; width: 58%; z-index: 2;
          flex-direction: column; padding: 48px;
          background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%);
        }
      `}</style>

      <div className="lw">
        <video className="lv-mobile" autoPlay muted loop playsInline src={VIDEO_MOBILE} />
        <video className="lv-desktop" autoPlay muted loop playsInline src={VIDEO_DESKTOP} />
        <div className="lo" />

        {/* PC sol yazı */}
        <div className="l-left-text">
          <div className="l-badge" style={{marginBottom:16}}>
            <div className="l-badge-dot"/>
            <span className="l-badge-txt">Yalnızca yetkili emlakçılara özel</span>
          </div>
          <h2 style={{color:'#fff',fontSize:28,fontWeight:700,lineHeight:1.3,marginBottom:10,maxWidth:340}}>Emlakçıların Buluşma Noktası</h2>
          <p style={{color:'rgba(255,255,255,0.6)',fontSize:14,lineHeight:1.7,maxWidth:320,marginBottom:20}}>Konya'nın en güvenilir emlak platformunda ilanlarınızı yönetin.</p>
          <div style={{display:'flex',gap:20}}>
            {[['🔒','Gizli & Güvenli'],['🤝','Sadece Emlakçılar'],['⚡','Hızlı & Kolay']].map(([icon,text]) => (
              <div key={text} style={{display:'flex',alignItems:'center',gap:6,color:'rgba(255,255,255,0.65)',fontSize:12,fontWeight:500}}>
                <span>{icon}</span><span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="lc">
          <div className="l-logo">
            <div className="l-logo-icon">A</div>
            <div>
              <div className="l-logo-name">Afinans Gayrimenkul</div>
              <div className="l-logo-sub">Profesyonel emlak platformu</div>
            </div>
          </div>

          <div className="l-badge" style={{marginBottom:12}}>
            <div className="l-badge-dot"/>
            <span className="l-badge-txt">Yetkili Emlakçılara Özel</span>
          </div>

          <h1 className="l-title">Emlakçıların<br/>Buluşma Noktası</h1>
          <p className="l-sub">Konya'nın güvenilir emlak platformu</p>

          <div className="l-form">
            <label className="l-label">E-posta</label>
            <input className="l-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="ornek@mail.com" autoComplete="email" />
            <label className="l-label">Şifre</label>
            <input className="l-input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••" autoComplete="current-password" onKeyDown={e=>e.key==='Enter'&&handleLogin(e)} />
            {error && <div className="l-err">{error}</div>}
            <button className="l-btn" onClick={handleLogin} disabled={loading}>
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap →'}
            </button>
          </div>
          <p className="l-footer">Hesabınız yok mu? <Link to="/kayit">Kayıt Olun</Link></p>
        </div>
      </div>
    </>
  )
}
