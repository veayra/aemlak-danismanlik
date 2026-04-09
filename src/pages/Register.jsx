import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Register() {
  const [form, setForm] = useState({ full_name:'', company:'', phone:'', email:'', password:'' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { full_name: form.full_name } }
    })
    if (error) { setError(error.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('profiles').update({ full_name: form.full_name, company: form.company, phone: form.phone }).eq('id', data.user.id)
    }
    setSuccess(true)
    setLoading(false)
  }

  if (success) return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.successIcon}>✓</div>
        <h2 style={s.title}>Başvurunuz Alındı!</h2>
        <p style={s.successText}>Hesabınız yönetici onayından sonra aktif olacak. En kısa sürede bildirim yapılacak.</p>
        <Link to="/giris" style={s.btn}>Giriş Sayfasına Dön</Link>
      </div>
    </div>
  )

  return (
    <div style={s.page}>
      <div style={s.header}>
        <Link to="/giris" style={s.backBtn}>← Geri</Link>
        <h1 style={s.title}>Emlakçı Kaydı</h1>
        <p style={s.sub}>Onay sonrası platforma erişebilirsiniz</p>
      </div>
      <div style={s.card}>
        <form onSubmit={handleRegister}>
          {[
            { k:'full_name', l:'Ad Soyad', t:'text', p:'Ahmet Yılmaz' },
            { k:'company', l:'Firma / Ofis', t:'text', p:'Yılmaz Emlak' },
            { k:'phone', l:'Telefon', t:'tel', p:'05XX XXX XX XX' },
            { k:'email', l:'E-posta', t:'email', p:'ornek@mail.com' },
            { k:'password', l:'Şifre', t:'password', p:'En az 6 karakter' },
          ].map(({ k, l, t, p }) => (
            <div key={k} style={s.field}>
              <label style={s.label}>{l}</label>
              <input style={s.input} type={t} value={form[k]} onChange={set(k)} required placeholder={p} />
            </div>
          ))}
          {error && <div style={s.error}>{error}</div>}
          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'Kaydediliyor...' : 'Kayıt Ol'}
          </button>
        </form>
        <p style={s.footer}>Zaten hesabınız var mı? <Link to="/giris" style={s.link}>Giriş Yapın</Link></p>
      </div>
    </div>
  )
}

const s = {
  page: { minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 20px', background:'#0a0a0a' },
  header: { width:'100%', maxWidth:380, marginBottom:20 },
  backBtn: { color:'#666', textDecoration:'none', fontSize:13, display:'block', marginBottom:12 },
  title: { fontSize:20, fontWeight:700, color:'#fff', marginBottom:4 },
  sub: { fontSize:13, color:'#555' },
  card: { width:'100%', maxWidth:380, background:'#141414', border:'1px solid #222', borderRadius:20, padding:'28px 24px' },
  field: { marginBottom:14 },
  label: { display:'block', fontSize:11, color:'#555', marginBottom:7, textTransform:'uppercase', letterSpacing:'0.8px', fontWeight:500 },
  input: { width:'100%', padding:'13px 16px', background:'#1c1c1c', border:'1px solid #2a2a2a', borderRadius:12, fontSize:15, color:'#fff', outline:'none' },
  error: { background:'#2a0f0f', color:'#ff6b6b', fontSize:13, padding:'10px 14px', borderRadius:10, marginBottom:12 },
  btn: { display:'block', width:'100%', padding:14, background:'linear-gradient(135deg,#ff3b5c,#ff6b35)', color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:600, cursor:'pointer', marginTop:8, textAlign:'center', textDecoration:'none' },
  footer: { textAlign:'center', marginTop:16, fontSize:13, color:'#555' },
  link: { color:'#ff3b5c', textDecoration:'none', fontWeight:500 },
  successIcon: { width:56, height:56, borderRadius:'50%', background:'#0a2a0a', color:'#00c853', fontSize:26, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' },
  successText: { fontSize:14, color:'#666', textAlign:'center', lineHeight:1.6, marginBottom:20 }
}
