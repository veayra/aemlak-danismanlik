import React, { createContext, useContext, useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import NewListing from './pages/NewListing'
import ListingDetail from './pages/ListingDetail'
import AdminPanel from './pages/AdminPanel'
import Navbar from './components/Navbar'
import InstallBanner from './components/InstallBanner'

export const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, profile, loading } = useAuth()
  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#0a0a0a'}}>
      <div style={{width:32,height:32,border:'2px solid #1f1f1f',borderTop:'2px solid #ff3b5c',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
  if (!user) return <Navigate to="/giris" />
  if (!profile?.is_approved) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0a0a0a',padding:20}}>
      <div style={{background:'#141414',border:'1px solid #222',borderRadius:16,padding:32,maxWidth:360,textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:16}}>⏳</div>
        <h2 style={{fontSize:18,fontWeight:600,marginBottom:8,color:'#fff'}}>Onay Bekleniyor</h2>
        <p style={{color:'#666',fontSize:14,lineHeight:1.6,marginBottom:24}}>Hesabınız yönetici onayından sonra aktif olacak.</p>
        <button onClick={() => supabase.auth.signOut()} style={{padding:'10px 24px',background:'#1f1f1f',border:'1px solid #333',borderRadius:9,color:'#aaa',cursor:'pointer',fontSize:14}}>Çıkış Yap</button>
      </div>
    </div>
  )
  if (adminOnly && !profile?.is_admin) return <Navigate to="/" />
  return children
}

export default function App() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setProfile(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, loading, fetchProfile }}>
      {user && profile?.is_approved && <Navbar />}
      {user && profile?.is_approved && <InstallBanner />}
      <Routes>
        <Route path="/giris" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/kayit" element={!user ? <Register /> : <Navigate to="/" />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/ilan/yeni" element={<ProtectedRoute><NewListing /></ProtectedRoute>} />
        <Route path="/ilan/:id" element={<ProtectedRoute><ListingDetail /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />
      </Routes>
    </AuthContext.Provider>
  )
}
