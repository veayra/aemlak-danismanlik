import React, { useEffect, useState } from 'react'

export default function InstallBanner() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showInstall, setShowInstall] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent)
  const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches

  useEffect(() => {
    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())
    setIsIOS(ios)

    // Ana ekrana ekle — sadece mobil, standalone değilse
    if (isMobile && !isStandalone && !localStorage.getItem('installDismissed')) {
      if (ios) {
        setTimeout(() => setShowInstall(true), 5000)
      } else {
        const handler = (e) => {
          e.preventDefault()
          setInstallPrompt(e)
          setTimeout(() => setShowInstall(true), 5000)
        }
        window.addEventListener('beforeinstallprompt', handler)
        return () => window.removeEventListener('beforeinstallprompt', handler)
      }
    }
  }, [])

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default' && !localStorage.getItem('notifDismissed')) {
      const delay = isMobile ? 9000 : 3000
      setTimeout(() => setShowNotif(true), delay)
    }
  }, [])

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt()
      await installPrompt.userChoice
    }
    localStorage.setItem('installDismissed', '1')
    setShowInstall(false)
  }

  const handleNotifAllow = async () => {
    setShowNotif(false)
    try {
      await Notification.requestPermission()
      if (window.OneSignalDeferred) {
        window.OneSignalDeferred.push(async (OneSignal) => {
          await OneSignal.showSlidedownPrompt({ force: true })
        })
      }
    } catch(e) {}
  }

  const notifBottom = showInstall && isMobile ? 150 : 74

  return (
    <>
      {/* Bildirim izni */}
      {showNotif && (
        isMobile ? (
          <div style={{...s.mobileCard, bottom: notifBottom}}>
            <span style={{fontSize:22}}>🔔</span>
            <div style={{flex:1,minWidth:0}}>
              <p style={s.cardTitle}>Mesajları kaçırmayın!</p>
              <p style={s.cardSub}>Bildirimleri açın, yeni mesajlardan anında haberdar olun</p>
            </div>
            <div style={s.actions}>
              <button onClick={handleNotifAllow} style={s.btnOrange}>Aç</button>
              <button onClick={() => { setShowNotif(false); localStorage.setItem('notifDismissed','1') }} style={s.btnClose}>✕</button>
            </div>
          </div>
        ) : (
          <div style={s.pcBar}>
            <span style={{fontSize:16}}>🔔</span>
            <p style={{fontSize:13,color:'rgba(255,255,255,0.9)',flex:1}}>Mesaj bildirimlerini açın, yeni mesajları kaçırmayın</p>
            <button onClick={handleNotifAllow} style={{...s.btnOrange, fontSize:12, padding:'6px 14px'}}>İzin Ver</button>
            <button onClick={() => { setShowNotif(false); localStorage.setItem('notifDismissed','1') }} style={{...s.btnClose, color:'rgba(255,255,255,0.5)'}}>✕</button>
          </div>
        )
      )}

      {/* Ana ekrana ekle — sadece mobil */}
      {showInstall && isMobile && (
        <div style={{...s.mobileCard, bottom: 74}}>
          <span style={{fontSize:22}}>📲</span>
          <div style={{flex:1,minWidth:0}}>
            <p style={s.cardTitle}>Ana ekrana ekleyin</p>
            <p style={s.cardSub}>
              {isIOS
                ? 'Paylaş → "Ana Ekrana Ekle" ile yükleyin'
                : 'En iyi deneyim için uygulamayı ana ekrana ekleyin'
              }
            </p>
          </div>
          <div style={s.actions}>
            {!isIOS && <button onClick={handleInstall} style={s.btnOrange}>Ekle</button>}
            <button onClick={() => { setShowInstall(false); localStorage.setItem('installDismissed','1') }} style={s.btnClose}>✕</button>
          </div>
        </div>
      )}
    </>
  )
}

const s = {
  mobileCard: {
    position:'fixed', left:10, right:10, zIndex:300,
    background:'#fff', border:'1px solid #ece9e4', borderRadius:16,
    padding:'12px 14px', display:'flex', alignItems:'flex-start', gap:10,
    boxShadow:'0 8px 32px rgba(0,0,0,0.12)'
  },
  pcBar: {
    position:'fixed', top:64, left:0, right:0, zIndex:300,
    background:'#1a1a1a', padding:'10px 24px',
    display:'flex', alignItems:'center', gap:12
  },
  cardTitle: { fontSize:14, fontWeight:600, color:'#1a1a1a', marginBottom:2 },
  cardSub: { fontSize:12, color:'#888', lineHeight:1.4 },
  actions: { display:'flex', alignItems:'center', gap:8, flexShrink:0 },
  btnOrange: { background:'#c8410a', color:'#fff', border:'none', borderRadius:8, padding:'7px 14px', fontSize:13, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' },
  btnClose: { background:'none', border:'none', color:'#bbb', fontSize:16, cursor:'pointer', padding:'4px 6px' }
}
