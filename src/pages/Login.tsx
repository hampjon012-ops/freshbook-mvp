import { useState } from 'react'
import { supabase } from '../lib/supabase'

const ADMIN_URL = `${window.location.origin}/`

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '13px 14px', fontSize: 15,
  border: '1px solid #e8e8e8', backgroundColor: '#fff',
  fontFamily: 'Inter, sans-serif', color: '#1a1a1a',
  outline: 'none', borderRadius: 4, boxSizing: 'border-box',
}

function LeftPanel() {
  return (
    <div style={{ flex: 1, backgroundColor: '#1a1a1a', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px', maxWidth: 480 }}>
      <div style={{ marginBottom: 48 }}>
        <h1 style={{ fontSize: 32, fontWeight: 300, color: '#fff', letterSpacing: '0.04em', marginBottom: 8, fontFamily: 'Georgia, serif' }}>FreshBook</h1>
        <p style={{ fontSize: 14, color: '#666', fontWeight: 300 }}>Admin & bokningshantering</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {[
          { icon: '📅', title: 'Bokningsöversikt', desc: 'Se alla bokningar i dag-, vecko- och månadsvy' },
          { icon: '👥', title: 'Personalhantering', desc: 'Hantera stylister och deras tillgänglighet' },
          { icon: '💇', title: 'Tjänster & priser', desc: 'Redigera era tjänster och priser enkelt' },
          { icon: '📊', title: 'Statistik', desc: 'Bokningar, omsättning och kundinsikter' },
        ].map((f, i) => (
          <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 20, marginTop: 2 }}>{f.icon}</span>
            <div>
              <div style={{ fontSize: 14, color: '#fff', fontWeight: 500, marginBottom: 3 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: '#555', fontWeight: 300, lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError('')
    console.log('[OAuth] Starting Google login, redirectTo:', ADMIN_URL)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: ADMIN_URL,
        scopes: [
          'https://www.googleapis.com/auth/calendar.events',
          'https://www.googleapis.com/auth/calendar.readonly',
        ].join(' '),
      },
    })
    if (error) {
      console.error('[OAuth] Error starting Google login:', error)
      setError('Kunde inte starta Google-inloggning. Försök igen.')
      setGoogleLoading(false)
    }
  }

  const handleEmailLogin = async () => {
    if (!email || !password) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Felaktig e-post eller lösenord.')
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#f8f8f8' }}>
      <LeftPanel />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 60px' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <h2 style={{ fontSize: 26, fontWeight: 400, color: '#1a1a1a', marginBottom: 8 }}>Logga in</h2>
          <p style={{ fontSize: 14, color: '#999', marginBottom: 36, fontWeight: 300 }}>Välkommen till FreshBook Admin.</p>

          {/* Google OAuth button */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            style={{
              width: '100%', padding: '13px 14px', fontSize: 14,
              fontFamily: 'Inter, sans-serif', fontWeight: 500,
              backgroundColor: '#fff', color: '#1a1a1a',
              border: '1px solid #e0e0e0', borderRadius: 4,
              cursor: googleLoading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              marginBottom: 20, transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#aaa')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#e0e0e0')}
          >
            {!googleLoading && (
              <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
            )}
            {googleLoading ? 'Öppnar Google...' : 'Fortsätt med Google'}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, backgroundColor: '#e8e8e8' }} />
            <span style={{ fontSize: 12, color: '#bbb' }}>eller</span>
            <div style={{ flex: 1, height: 1, backgroundColor: '#e8e8e8' }} />
          </div>

          {/* Email/password fallback */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: 11, letterSpacing: '0.15em', color: '#999', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>E-post</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="din@email.se"
                onKeyDown={e => e.key === 'Enter' && handleEmailLogin()}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = '#aaa')}
                onBlur={e => (e.currentTarget.style.borderColor = '#e8e8e8')}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, letterSpacing: '0.15em', color: '#999', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>Lösenord</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={e => e.key === 'Enter' && handleEmailLogin()}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = '#aaa')}
                onBlur={e => (e.currentTarget.style.borderColor = '#e8e8e8')}
              />
            </div>
          </div>

          {error && (
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button onClick={handleEmailLogin} disabled={loading} style={{
            width: '100%', padding: '14px', fontSize: 13, letterSpacing: '0.12em',
            fontFamily: 'Inter, sans-serif', fontWeight: 500,
            backgroundColor: loading ? '#ccc' : '#1a1a1a', color: '#fff',
            border: 'none', borderRadius: 4, cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? 'Loggar in...' : 'LOGGA IN MED E-POST'}
          </button>
        </div>
      </div>
    </div>
  )
}
