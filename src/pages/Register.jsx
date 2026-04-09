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
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name } }
    })
    if (error) { setError(error.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('profiles').update({
        full_name: form.full_name,
        company: form.company,
        phone: form.phone
      }).eq('id', data.user.id)
    }
    setSuccess(true)
    setLoading(false)
  }

  if (success) return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.successIcon}>✓</div>
        <h2 style={s.title}>Başvurunuz Alındı</h2>
        <p style={s.successText}>Hesabınız oluşturuldu. Yönetici onayından sonra sisteme erişebilirsiniz.</p>
        <Link to="/giris" style={s.btn}>Giriş Sayfasına Dön</Link>
      </div>
    </div>
  )

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>◆</div>
        <h1 style={s.title}>Emlakçı Kaydı</h1>
        <p style={s.sub}>Bilgilerinizi doldurun, onay sonrası aktif olursunuz</p>
        <form onSubmit={handleRegister} style={{marginTop:24}}>
          {[
            { k:'full_name', l:'Ad Soyad', t:'text', p:'Ahmet Yılmaz' },
            { k:'company', l:'Firma / Ofis', t:'text', p:'Yılmaz Emlak' },
            { k:'phone', l:'Telefon', t:'tel', p:'05XX XXX XX XX' },
            { k:'email', l:'E-posta', t:'email', p:'ornek@mail.com' },
            { k:'password', l:'Şifre', t:'password', p:'En az 6 karakter' },
          ].map(({ k, l, t, p }) => (
            <div key={k} style={{marginBottom:12}}>
              <label style={s.label}>{l}</label>
              <input style={s.input} type={t} value={form[k]} onChange={set(k)} required placeholder={p} />
            </div>
          ))}
          {error && <p style={s.error}>{error}</p>}
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
  page: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20, paddingTop:40, paddingBottom:40, background:'#0f0f0f' },
  card: { background:'#161616', border:'1px solid #252525', borderRadius:16, padding:'36px', width:'100%', maxWidth:420 },
  logo: { fontSize:22, color:'#c8a96e', textAlign:'center', marginBottom:10 },
  title: { fontFamily:"'DM Serif Display',serif", fontSize:20, textAlign:'center', color:'#f0f0ee', fontWeight:400 },
  sub: { fontSize:12, color:'#555', textAlign:'center', marginTop:4 },
  label: { display:'block', fontSize:11, color:'#666', marginBottom:5, letterSpacing:'0.5px', textTransform:'uppercase' },
  input: { width:'100%', padding:'10px 14px', background:'#1f1f1f', border:'1px solid #2a2a2a', borderRadius:8, fontSize:14, color:'#f0f0ee', outline:'none' },
  error: { color:'#e74c3c', fontSize:13, margin:'8px 0' },
  btn: { display:'block', width:'100%', padding:13, background:'#c8a96e', color:'#0f0f0f', border:'none', borderRadius:9, fontSize:14, fontWeight:600, cursor:'pointer', marginTop:16, textAlign:'center', textDecoration:'none' },
  footer: { textAlign:'center', marginTop:16, fontSize:13, color:'#555' },
  link: { color:'#c8a96e', textDecoration:'none' },
  successIcon: { width:52, height:52, borderRadius:'50%', background:'#1a2e1a', color:'#2ecc71', fontSize:24, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' },
  successText: { fontSize:14, color:'#777', textAlign:'center', marginTop:8, marginBottom:20, lineHeight:1.6 }
}
