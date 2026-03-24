import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const next = params.get('next') || '/'

      console.log('[AuthCallback] Processing OAuth callback, code:', code ? 'present' : 'missing')

      if (!code) {
        console.error('[AuthCallback] No code in callback URL')
        setError('Ingen auktoriseringskod mottagen')
        return
      }

      try {
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        
        if (exchangeError) {
          console.error('[AuthCallback] Error exchanging code:', exchangeError)
          setError(exchangeError.message)
          return
        }

        console.log('[AuthCallback] Session exchanged successfully, user:', data?.user?.email)
        
        // Redirect to the next page or dashboard
        navigate(next, { replace: true })
      } catch (err) {
        console.error('[AuthCallback] Unexpected error:', err)
        setError('Ett oväntat fel inträffade')
      }
    }

    handleCallback()
  }, [navigate])

  if (error) {
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
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>{error}</p>
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
