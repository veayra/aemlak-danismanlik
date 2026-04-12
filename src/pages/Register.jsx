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
        <p style={s.successText}>Yönetici onayından sonra hesabınız aktif olacak.</p>
        <Link to="/giris" style={s.btn}>Giriş Sayfasına Dön</Link>
      </div>
    </div>
  )

  return (
    <div style={s.page}>
      <div style={s.card}>
        <Link to="/giris" style={s.backBtn}>← Geri</Link>
        <div style={s.logoBox}><span style={s.logoLetter}>A</span></div>
        <h1 style={s.title}>Emlakçı Kaydı</h1>
        <p style={s.sub}>Onay sonrası platforma erişebilirsiniz</p>
        <form onSubmit={handleRegister} style={{marginTop:20}}>
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
  page: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 20px', background:'#f5f4f0' },
  card: { width:'100%', maxWidth:420, background:'#fff', border:'1px solid #e0ddd8', borderRadius:20, padding:'32px 28px', boxShadow:'0 4px 24px rgba(0,0,0,0.06)' },
  backBtn: { display:'block', color:'#999', textDecoration:'none', fontSize:13, marginBottom:20 },
  logoBox: { width:48, height:48, borderRadius:14, background:'#c8410a', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 },
  logoLetter: { fontSize:22, fontWeight:800, color:'#fff' },
  title: { fontSize:20, fontWeight:700, color:'#1a1a1a', marginBottom:4 },
  sub: { fontSize:13, color:'#999' },
  field: { marginBottom:14 },
  label: { display:'block', fontSize:11, color:'#888', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.8px', fontWeight:600 },
  input: { width:'100%', padding:'12px 14px', background:'#f5f4f0', border:'1px solid #e0ddd8', borderRadius:10, fontSize:15, color:'#1a1a1a', outline:'none' },
  error: { background:'#fef0ed', color:'#c8410a', fontSize:13, padding:'10px 14px', borderRadius:10, marginBottom:12, border:'1px solid #fbd5c8' },
  btn: { display:'block', width:'100%', padding:14, background:'#c8410a', color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:600, cursor:'pointer', textAlign:'center', textDecoration:'none', marginTop:4 },
  footer: { textAlign:'center', marginTop:16, fontSize:13, color:'#999' },
  link: { color:'#c8410a', textDecoration:'none', fontWeight:600 },
  successIcon: { width:52, height:52, borderRadius:'50%', background:'#edf7f0', color:'#1a7a3f', fontSize:24, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 },
  successText: { fontSize:14, color:'#777', lineHeight:1.6, marginBottom:20 }
}
