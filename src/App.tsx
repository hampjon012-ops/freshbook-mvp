import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AuthCallback from './pages/AuthCallback'

// Protected route wrapper using Supabase session
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div className="loading-screen">Laddar...</div>
  }

  return session ? <>{children}</> : <Navigate to="/login" replace />
}

// Root page that handles OAuth callback via query params
function RootPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const code = searchParams.get('code')
    const next = searchParams.get('next') || '/'

    console.log('[RootPage OAuth] Checking for code in URL:', code ? 'present' : 'missing')

    if (!code) {
      // No code, check session and show dashboard or redirect to login
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          navigate('/', { replace: true })
        } else {
          navigate('/login', { replace: true })
        }
      })
      return
    }

    // Exchange code for session
    supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
      if (error) {
        console.error('[RootPage OAuth] Error exchanging code:', error)
        setErrorMsg(error.message)
        setStatus('error')
      } else {
        console.log('[RootPage OAuth] Session exchanged successfully')
        navigate(next, { replace: true })
      }
    })
  }, [searchParams, navigate])

  if (status === 'error') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '20px 24px',
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '18px', color: '#dc2626', marginBottom: '8px' }}>Inloggning misslyckades</h2>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>{errorMsg}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            style={{
              padding: '10px 20px',
              backgroundColor: '#1a1a1a',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Tillbaka till inloggning
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e8e8e8',
          borderTopColor: '#1a1a1a',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }} />
        <p style={{ fontSize: '14px', color: '#666' }}>Loggar in...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/" element={<RootPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
