import React, { createContext, useContext, useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { registerPushPlayer } from './lib/notifications'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import NewListing from './pages/NewListing'
import ListingDetail from './pages/ListingDetail'
import AdminPanel from './pages/AdminPanel'
import MasterAdmin from './pages/MasterAdmin'
import Inbox from './pages/Inbox'
import ResetPassword from './pages/ResetPassword'
import Navbar from './components/Navbar'
import InstallBanner from './components/InstallBanner'

export const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

function ProtectedRoute({ children, roles = [] }) {
  const { user, profile, loading } = useAuth()
  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#f5f4f0'}}>
      <div style={{width:32,height:32,border:'3px solid #e0ddd8',borderTop:'3px solid #c8410a',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
  if (!user) return <Navigate to="/giris" />
  if (!profile?.is_approved) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f5f4f0',padding:20}}>
      <div style={{background:'#fff',border:'1px solid #ece9e4',borderRadius:16,padding:32,maxWidth:360,textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:16}}>⏳</div>
        <h2 style={{fontSize:18,fontWeight:600,marginBottom:8,color:'#1a1a1a'}}>Onay Bekleniyor</h2>
        <p style={{color:'#aaa',fontSize:14,lineHeight:1.6,marginBottom:24}}>Hesabınız yönetici onayından sonra aktif olacak.</p>
        <button onClick={() => supabase.auth.signOut()} style={{padding:'10px 24px',background:'#f5f4f0',border:'1px solid #e0ddd8',borderRadius:9,color:'#888',cursor:'pointer',fontSize:14}}>Çıkış Yap</button>
      </div>
    </div>
  )
  if (roles.length > 0 && !roles.includes(profile?.role)) return <Navigate to="/" />
  return children
}

export default function App() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
    setTimeout(() => registerPushPlayer(supabase, userId), 3000)
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
        <Route path="/sifre-yenile" element={<ResetPassword />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/ilan/yeni" element={<ProtectedRoute><NewListing /></ProtectedRoute>} />
        <Route path="/ilan/:id" element={<ProtectedRoute><ListingDetail /></ProtectedRoute>} />
        <Route path="/mesajlar" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={['group_admin','master_admin']}><AdminPanel /></ProtectedRoute>} />
        <Route path="/master" element={<ProtectedRoute roles={['master_admin']}><MasterAdmin /></ProtectedRoute>} />
      </Routes>
    </AuthContext.Provider>
  )
}
