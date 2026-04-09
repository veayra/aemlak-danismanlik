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
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.successIcon}>✓</div>
        <h2 style={styles.title}>Kayıt Tamamlandı!</h2>
        <p style={styles.sub}>Hesabınız oluşturuldu. Yönetici onayından sonra sisteme erişebilirsiniz.</p>
        <Link to="/giris" style={styles.btn}>Giriş Sayfasına Dön</Link>
      </div>
    </div>
  )

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h1 style={styles.title}>Emlakçı Kaydı</h1>
        <p style={styles.sub}>Bilgilerinizi doldurun, yönetici onayından sonra aktif olursunuz</p>
        <form onSubmit={handleRegister}>
          {[
            { key:'full_name', label:'Ad Soyad', type:'text', placeholder:'Ahmet Yılmaz' },
            { key:'company', label:'Firma / Ofis Adı', type:'text', placeholder:'Yılmaz Emlak' },
            { key:'phone', label:'Telefon', type:'tel', placeholder:'05XX XXX XX XX' },
            { key:'email', label:'E-posta', type:'email', placeholder:'ornek@mail.com' },
            { key:'password', label:'Şifre', type:'password', placeholder:'En az 6 karakter' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key} style={styles.field}>
              <label style={styles.label}>{label}</label>
              <input style={styles.input} type={type} value={form[key]} onChange={set(key)} required placeholder={placeholder} />
            </div>
          ))}
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? 'Kaydediliyor...' : 'Kayıt Ol'}
          </button>
        </form>
        <p style={styles.footer}>Zaten hesabınız var mı? <Link to="/giris" style={styles.link}>Giriş Yapın</Link></p>
      </div>
    </div>
  )
}

const styles = {
  wrap: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20, paddingTop:40, paddingBottom:40 },
  card: { background:'#fff', border:'1px solid #e5e7eb', borderRadius:16, padding:40, width:'100%', maxWidth:440 },
  title: { fontSize:20, fontWeight:700, marginBottom:4, textAlign:'center' },
  sub: { fontSize:13, color:'#6b7280', textAlign:'center', marginBottom:24 },
  field: { marginBottom:14 },
  label: { display:'block', fontSize:13, fontWeight:500, marginBottom:5, color:'#374151' },
  input: { width:'100%', padding:'10px 14px', border:'1px solid #d1d5db', borderRadius:8, fontSize:14, outline:'none' },
  error: { color:'#ef4444', fontSize:13, marginBottom:12 },
  submitBtn: { width:'100%', padding:'12px', background:'#1d4ed8', color:'#fff', border:'none', borderRadius:8, fontSize:15, fontWeight:600, cursor:'pointer', marginTop:4 },
  footer: { textAlign:'center', marginTop:16, fontSize:13, color:'#6b7280' },
  link: { color:'#1d4ed8', textDecoration:'none', fontWeight:500 },
  successIcon: { width:56, height:56, borderRadius:'50%', background:'#d1fae5', color:'#065f46', fontSize:28, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' },
  btn: { display:'block', textAlign:'center', marginTop:20, padding:'12px', background:'#1d4ed8', color:'#fff', borderRadius:8, textDecoration:'none', fontWeight:600, fontSize:14 }
}
