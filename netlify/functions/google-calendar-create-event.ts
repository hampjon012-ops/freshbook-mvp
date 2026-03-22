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

// POST /netlify/functions/google-calendar-create-event
// Body: { stylist_id, date, start_time, end_time, customer_name, service_name, notes, booking_id? }
export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const body = JSON.parse(event.body ?? '{}')
  const { stylist_id, date, start_time, end_time, customer_name, service_name, notes, booking_id } = body

  if (!stylist_id || !date || !start_time || !end_time) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) }
  }

  // Get refresh token for this stylist
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, google_refresh_token, full_name')
    .eq('id', stylist_id)
    .single()

  if (profileError || !profile?.google_refresh_token) {
    return { statusCode: 200, body: JSON.stringify({ skipped: true, reason: 'No calendar linked' }) }
  }

  try {
    const accessToken = await getAccessToken(profile.google_refresh_token)

    const [year, month, day] = date.split('-').map(Number)
    const [startHour, startMin] = start_time.split(':').map(Number)
    const durationMin = 60 // default, could be passed in body
    const endHour = Math.floor((startHour * 60 + startMin + durationMin) / 60)
    const endMin = (startHour * 60 + startMin + durationMin) % 60

    const eventRes = await fetch(`${GOOGLE_CALENDAR_URL}/calendars/primary/events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: `💇 ${service_name ?? 'Bokning'} — ${customer_name}`,
        description: [
          `Kund: ${customer_name}`,
          notes ? `Anteckningar: ${notes}` : '',
        ].filter(Boolean).join('\n'),
        start: { dateTime: `${date}T${start_time}:00`, timeZone: 'Europe/Stockholm' },
        end: { dateTime: `${date}T${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}:00`, timeZone: 'Europe/Stockholm' },
        colorId: '9', // Blue = busy
        reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 30 }] },
      }),
    })

    const eventData = await eventRes.json()

    if (!eventRes.ok) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to create event', detail: eventData }) }
    }

    // Save google_event_id on booking if booking_id provided
    if (booking_id) {
      await supabase.from('bookings').update({ notes: (notes ?? '') + `\n[gcal:${eventData.id}]` }).eq('id', booking_id)
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, eventId: eventData.id, htmlLink: eventData.htmlLink }),
    }
  } catch (err: any) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
