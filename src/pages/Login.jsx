import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

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
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h1 style={styles.title}>A Emlak Danışmanlık</h1>
        <p style={styles.sub}>Sisteme giriş yapın</p>
        <form onSubmit={handleLogin}>
          <div style={styles.field}>
            <label style={styles.label}>E-posta</label>
            <input style={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="ornek@mail.com" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Şifre</label>
            <input style={styles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
        <p style={styles.footer}>Hesabınız yok mu? <Link to="/kayit" style={styles.link}>Kayıt Olun</Link></p>
      </div>
    </div>
  )
}

const styles = {
  wrap: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20 },
  card: { background:'#fff', border:'1px solid #e5e7eb', borderRadius:16, padding:40, width:'100%', maxWidth:420 },
  title: { fontSize:22, fontWeight:700, marginBottom:4, textAlign:'center' },
  sub: { fontSize:14, color:'#6b7280', textAlign:'center', marginBottom:28 },
  field: { marginBottom:16 },
  label: { display:'block', fontSize:13, fontWeight:500, marginBottom:6, color:'#374151' },
  input: { width:'100%', padding:'10px 14px', border:'1px solid #d1d5db', borderRadius:8, fontSize:14, outline:'none' },
  error: { color:'#ef4444', fontSize:13, marginBottom:12 },
  btn: { width:'100%', padding:'12px', background:'#1d4ed8', color:'#fff', border:'none', borderRadius:8, fontSize:15, fontWeight:600, cursor:'pointer', marginTop:4 },
  footer: { textAlign:'center', marginTop:20, fontSize:13, color:'#6b7280' },
  link: { color:'#1d4ed8', textDecoration:'none', fontWeight:500 }
}
