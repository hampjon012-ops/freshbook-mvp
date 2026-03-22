import type { Handler, HandlerEvent } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://jfnafabrlumgvpzbfbuf.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
)

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_CALENDAR_URL = 'https://www.googleapis.com/calendar/v3'

async function getAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  const data = await res.json()
  return data.access_token
}

// GET /netlify/functions/google-calendar-get-busy?stylist_id=xxx&start=2026-03-22&end=2026-03-23
export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const { stylist_id, start, end } = event.queryStringParameters ?? {}
  if (!stylist_id || !start || !end) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing parameters: stylist_id, start, end' }) }
  }

  // Get refresh token for this stylist
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, google_refresh_token, full_name')
    .eq('id', stylist_id)
    .single()

  if (profileError || !profile?.google_refresh_token) {
    return { statusCode: 200, body: JSON.stringify({ busy: [] }) } // No calendar linked = all free
  }

  try {
    const accessToken = await getAccessToken(profile.google_refresh_token)

    const calRes = await fetch(
      `${GOOGLE_CALENDAR_URL}/freeBusy?key=${process.env.GOOGLE_CLIENT_ID}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeMin: `${start}T00:00:00Z`,
          timeMax: `${end}T23:59:59Z`,
          items: [{ id: 'primary' }],
        }),
      }
    )

    const calData = await calRes.json()
    const busySlots: { start: string; end: string }[] = calData.calendars?.primary?.busy ?? []

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ busy: busySlots, stylist: profile.full_name }),
    }
  } catch (err: any) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
