import React, { useEffect, useState } from 'react'

export default function InstallBanner() {
  const [prompt, setPrompt] = useState(null)
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('installBannerDismissed')) return
    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())
    if (ios && !window.navigator.standalone) { setIsIOS(true); setShow(true); return }
    const handler = (e) => { e.preventDefault(); setPrompt(e); setShow(true) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (prompt) { prompt.prompt(); const { outcome } = await prompt.userChoice; if (outcome==='accepted') setShow(false) }
  }

  const handleDismiss = () => { setShow(false); localStorage.setItem('installBannerDismissed','1') }

  if (!show) return null

  return (
    <div style={s.banner}>
      <div style={s.icon}>A</div>
      <div style={s.text}>
        <p style={s.title}>Ana ekrana ekle</p>
        <p style={s.sub}>{isIOS ? 'Paylaş → "Ana Ekrana Ekle"' : 'Uygulamayı telefonunuza ekleyin'}</p>
      </div>
      <div style={s.actions}>
        {!isIOS && <button onClick={handleInstall} style={s.installBtn}>Ekle</button>}
        <button onClick={handleDismiss} style={s.closeBtn}>✕</button>
      </div>
    </div>
  )
}

const s = {
  banner: { position:'fixed', bottom:70, left:12, right:12, zIndex:300, background:'#fff', border:'1px solid #ece9e4', borderRadius:16, padding:'12px 14px', display:'flex', alignItems:'center', gap:12, boxShadow:'0 8px 32px rgba(0,0,0,0.12)' },
  icon: { width:44, height:44, borderRadius:12, background:'#c8410a', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:800, flexShrink:0 },
  text: { flex:1, minWidth:0 },
  title: { fontSize:14, fontWeight:600, color:'#1a1a1a', marginBottom:2 },
  sub: { fontSize:12, color:'#aaa', lineHeight:1.4 },
  actions: { display:'flex', alignItems:'center', gap:8, flexShrink:0 },
  installBtn: { background:'#c8410a', color:'#fff', border:'none', borderRadius:8, padding:'7px 14px', fontSize:13, fontWeight:600, cursor:'pointer' },
  closeBtn: { background:'none', border:'none', color:'#bbb', fontSize:16, cursor:'pointer', padding:'4px 6px' }
}
