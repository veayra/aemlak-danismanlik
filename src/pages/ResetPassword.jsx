import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Supabase reset linkinden gelen session'ı yakala
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Kullanıcı reset linkine tıkladı, form göster
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleReset = async (e) => {
    e.preventDefault()
    if (password !== confirm) { setError('Şifreler eşleşmiyor.'); return }
    if (password.length < 6) { setError('Şifre en az 6 karakter olmalı.'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError('Hata: ' + error.message); setLoading(false); return }
    setDone(true)
    setLoading(false)
    setTimeout(() => navigate('/giris'), 2500)
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logoBox}><span style={s.logoLetter}>A</span></div>
        <h1 style={s.title}>Yeni Şifre Belirle</h1>
        <p style={s.sub}>Lütfen yeni şifrenizi girin</p>

        {done ? (
          <div style={s.success}>
            <p style={s.successIcon}>✓</p>
            <p style={s.successText}>Şifreniz güncellendi! Giriş sayfasına yönlendiriliyorsunuz...</p>
          </div>
        ) : (
          <form onSubmit={handleReset} style={{marginTop:20}}>
            <div style={s.field}>
              <label style={s.label}>Yeni Şifre</label>
              <input style={s.input} type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="En az 6 karakter" />
            </div>
            <div style={s.field}>
              <label style={s.label}>Şifre Tekrar</label>
              <input style={s.input} type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required placeholder="Şifreyi tekrar girin" />
            </div>
            {error && <div style={s.error}>{error}</div>}
            <button style={s.btn} type="submit" disabled={loading}>
              {loading ? 'Güncelleniyor...' : 'Şifremi Güncelle'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

const s = {
  page: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 20px', background:'#f5f4f0' },
  card: { width:'100%', maxWidth:400, background:'#fff', border:'1px solid #ece9e4', borderRadius:20, padding:'32px 28px', boxShadow:'0 4px 24px rgba(0,0,0,0.06)' },
  logoBox: { width:48, height:48, borderRadius:14, background:'#c8410a', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 },
  logoLetter: { fontSize:22, fontWeight:800, color:'#fff' },
  title: { fontSize:20, fontWeight:700, color:'#1a1a1a', marginBottom:4 },
  sub: { fontSize:13, color:'#999' },
  field: { marginBottom:14 },
  label: { display:'block', fontSize:11, color:'#888', marginBottom:6, fontWeight:600, letterSpacing:'0.3px', textTransform:'uppercase' },
  input: { width:'100%', padding:'12px 14px', background:'#f5f4f0', border:'1px solid #e0ddd8', borderRadius:10, fontSize:15, color:'#1a1a1a', outline:'none', fontFamily:'inherit', boxSizing:'border-box' },
  error: { background:'#fef0ed', color:'#c8410a', fontSize:13, padding:'10px 14px', borderRadius:10, marginBottom:12, border:'1px solid #fbd5c8' },
  btn: { display:'block', width:'100%', padding:14, background:'#c8410a', color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:600, cursor:'pointer' },
  success: { textAlign:'center', padding:'20px 0' },
  successIcon: { fontSize:40, color:'#1a7a3f', marginBottom:12 },
  successText: { fontSize:14, color:'#555', lineHeight:1.6 }
}
