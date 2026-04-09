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

export const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <div style={styles.loading}>Yükleniyor...</div>
  if (!user) return <Navigate to="/giris" />
  if (!profile?.is_approved) return (
    <div style={styles.waiting}>
      <div style={styles.waitingBox}>
        <h2 style={{fontSize:20,marginBottom:12}}>Hesabınız onay bekliyor</h2>
        <p style={{color:'#666',fontSize:14}}>Yönetici hesabınızı onayladıktan sonra sisteme erişebilirsiniz.</p>
        <button onClick={() => supabase.auth.signOut()} style={styles.btnOutline}>Çıkış Yap</button>
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

const styles = {
  loading: { display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontSize:16, color:'#666' },
  waiting: { display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', padding:20 },
  waitingBox: { background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:32, maxWidth:400, textAlign:'center' },
  btnOutline: { marginTop:20, padding:'10px 24px', border:'1px solid #d1d5db', borderRadius:8, background:'transparent', cursor:'pointer', fontSize:14 }
}
