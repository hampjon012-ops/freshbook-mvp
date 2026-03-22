import type { Handler, HandlerEvent } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://jfnafabrlumgvpzbfbuf.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
)

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? ''
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI ?? 'https://admin.appbok.se/.netlify/functions/google-calendar-sync'

// Exchange auth code for tokens and store in profiles
export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'GET') {
    const code = event.queryStringParameters?.code
    const state = event.queryStringParameters?.state // contains userId

    if (!code || !state) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing code or state' }) }
    }

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      const err = await tokenRes.text()
      return { statusCode: 400, body: JSON.stringify({ error: 'Token exchange failed', detail: err }) }
    }

    const tokens = await tokenRes.json()
    const { access_token, refresh_token, expiry_date } = tokens

    // Save refresh_token in profiles.google_refresh_token
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ google_refresh_token: refresh_token })
      .eq('id', state)

    if (updateError) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to save token', detail: updateError.message }) }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html' },
      body: `<html><body><h2>Google Calendar länkad! ✅</h2><p>Du kan stänga detta fönster.</p><script>if(window.opener){window.opener.postMessage('google_calendar_linked','*');window.close();}</script></body></html>`,
    }
  }

  return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
}
