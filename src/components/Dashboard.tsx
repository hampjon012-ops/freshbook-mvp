import { useState, useEffect, useCallback } from 'react'
import { supabase, supabaseAdmin } from '../lib/supabase'

type Booking = {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  date: string
  start_time: string
  end_time: string
  status: string
  notes: string
  services?: { name: string; price: number }
  profiles?: { full_name: string }
}

type Service = {
  id: string
  name: string
  description: string
  duration_minutes: number
  price: number
  active: boolean
}

type StaffMember = {
  id: string
  full_name: string
  role: string
  created_at?: string
  email?: string
  pending?: boolean  // Invited but never logged in
}

type UserProfile = {
  id: string
  full_name: string
  role: string
}

const ownerTabs = ['Bokningar', 'Tjänster', 'Personal', 'Statistik']

const statusColors: Record<string, string> = {
  confirmed: '#16a34a',
  pending: '#d97706',
  cancelled: '#dc2626',
  completed: '#6b7280',
}
const statusLabels: Record<string, string> = {
  confirmed: 'Bekräftad',
  pending: 'Väntar',
  cancelled: 'Avbokad',
  completed: 'Klar',
}

// ── BookingRow (shared) ───────────────────────────────────────────────────────
function BookingRow({ b, last, onClick }: { b: Booking; last: boolean; onClick: () => void }) {
  const weekdays = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör']
  const d = new Date(b.date)
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 24px', cursor: 'pointer',
      borderBottom: last ? 'none' : '1px solid #f8f8f8', transition: 'background 0.1s'
    }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fafafa')}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ textAlign: 'center', minWidth: 42 }}>
          <div style={{ fontSize: 10, color: '#bbb', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{weekdays[d.getDay()]}</div>
          <div style={{ fontSize: 20, fontWeight: 500, color: '#1a1a1a', lineHeight: 1.2 }}>{d.getDate()}</div>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>{b.customer_name}</div>
          <div style={{ fontSize: 12, color: '#aaa' }}>{b.services?.name ?? '–'} · {b.start_time?.slice(0, 5)}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{
          fontSize: 11, padding: '3px 8px', borderRadius: 20,
          backgroundColor: statusColors[b.status] + '15',
          color: statusColors[b.status], fontWeight: 500
        }}>{statusLabels[b.status] ?? b.status}</span>
        <span style={{ fontSize: 14, color: '#ccc' }}>→</span>
      </div>
    </div>
  )
}

// ── Stylist view ──────────────────────────────────────────────────────────────
function StylistDashboard({ session, profile }: { session: any; profile: UserProfile }) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  const today = new Date().toISOString().split('T')[0]

  const fetchMyBookings = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('bookings')
      .select('*, services(name, price)')
      .eq('stylist_id', profile.id)
      .neq('status', 'cancelled')
      .gte('date', today)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })
    setBookings(data || [])
    setLoading(false)
  }, [profile.id, today])

  useEffect(() => { fetchMyBookings() }, [fetchMyBookings])

  const todayBookings = bookings.filter(b => b.date === today)
  const upcomingBookings = bookings.filter(b => b.date > today)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8f8f8' }}>
      <aside style={{ width: 220, backgroundColor: '#1a1a1a', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '28px 24px 20px' }}>
          <div style={{ fontSize: 20, fontWeight: 300, color: '#fff', letterSpacing: '0.04em', fontFamily: 'Georgia, serif', marginBottom: 4 }}>FreshBook</div>
          <div style={{ fontSize: 11, color: '#555', letterSpacing: '0.1em' }}>STYLIST</div>
        </div>
        <nav style={{ flex: 1, padding: '8px 12px' }}>
          <button style={{
            width: '100%', textAlign: 'left', padding: '11px 12px', fontSize: 13,
            fontFamily: 'Inter, sans-serif', border: 'none', cursor: 'default',
            borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 500
          }}>📅 Mina bokningar</button>
        </nav>
        <div style={{ padding: '16px 24px', borderTop: '1px solid #2a2a2a' }}>
          <div style={{ fontSize: 13, color: '#aaa', marginBottom: 3, fontWeight: 500 }}>{profile.full_name || session.user.email}</div>
          <div style={{ fontSize: 11, color: '#555', marginBottom: 10 }}>{session.user.email}</div>
          <button onClick={() => supabase.auth.signOut()} style={{
            fontSize: 12, color: '#555', background: 'none', border: 'none',
            cursor: 'pointer', padding: 0, fontFamily: 'Inter, sans-serif', letterSpacing: '0.08em'
          }}>LOGGA UT</button>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'auto', padding: '36px 40px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 400, color: '#1a1a1a', marginBottom: 4 }}>
            Hej, {profile.full_name?.split(' ')[0] || 'stylist'}! 👋
          </h1>
          <p style={{ fontSize: 13, color: '#999' }}>
            {todayBookings.length} bokningar idag · {upcomingBookings.length} kommande
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 36 }}>
          {[
            { label: 'Idag', value: todayBookings.length },
            { label: 'Kommande', value: upcomingBookings.length },
            { label: 'Denna vecka', value: bookings.filter(b => {
              const diff = (new Date(b.date).getTime() - new Date().getTime()) / 86400000
              return diff >= 0 && diff < 7
            }).length },
          ].map((s, i) => (
            <div key={i} style={{ backgroundColor: '#fff', padding: '20px 24px', borderRadius: 8, border: '1px solid #eee' }}>
              <div style={{ fontSize: 28, fontWeight: 500, color: '#1a1a1a', marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#999' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>Laddar...</div>
        ) : bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, backgroundColor: '#fff', borderRadius: 8, border: '1px solid #eee' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
            <div style={{ fontSize: 16, color: '#999', marginBottom: 8 }}>Inga kommande bokningar</div>
            <div style={{ fontSize: 13, color: '#ccc' }}>Dina bokningar visas här automatiskt</div>
          </div>
        ) : (
          <div style={{ backgroundColor: '#fff', borderRadius: 8, border: '1px solid #eee', overflow: 'hidden' }}>
            {todayBookings.length > 0 && (
              <>
                <div style={{ padding: '12px 24px', backgroundColor: '#f0fdf4', borderBottom: '1px solid #dcfce7' }}>
                  <span style={{ fontSize: 11, letterSpacing: '0.1em', color: '#16a34a', fontWeight: 600, textTransform: 'uppercase' }}>Idag</span>
                </div>
                {todayBookings.map((b, i) => <BookingRow key={b.id} b={b} last={i === todayBookings.length - 1 && upcomingBookings.length === 0} onClick={() => setSelectedBooking(b)} />)}
              </>
            )}
            {upcomingBookings.length > 0 && (
              <>
                <div style={{ padding: '12px 24px', backgroundColor: '#fafaf9', borderBottom: '1px solid #f0ede9', borderTop: todayBookings.length > 0 ? '2px solid #f0f0f0' : 'none' }}>
                  <span style={{ fontSize: 11, letterSpacing: '0.1em', color: '#aaa', fontWeight: 600, textTransform: 'uppercase' }}>Kommande</span>
                </div>
                {upcomingBookings.map((b, i) => <BookingRow key={b.id} b={b} last={i === upcomingBookings.length - 1} onClick={() => setSelectedBooking(b)} />)}
              </>
            )}
          </div>
        )}
      </main>

      {selectedBooking && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}
          onClick={() => setSelectedBooking(null)}>
          <div style={{ width: 380, backgroundColor: '#fff', padding: '36px 32px', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <h2 style={{ fontSize: 20, fontWeight: 500 }}>Bokningsdetaljer</h2>
              <button onClick={() => setSelectedBooking(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#aaa' }}>×</button>
            </div>
            {[
              ['Kund', selectedBooking.customer_name],
              ['Telefon', selectedBooking.customer_phone || '–'],
              ['Tjänst', selectedBooking.services?.name || '–'],
              ['Datum', selectedBooking.date],
              ['Tid', `${selectedBooking.start_time?.slice(0, 5)} – ${selectedBooking.end_time?.slice(0, 5)}`],
              ['Önskemål', selectedBooking.notes || '–'],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f5f5f5' }}>
                <span style={{ fontSize: 12, color: '#aaa', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{l}</span>
                <span style={{ fontSize: 14, color: '#1a1a1a', textAlign: 'right', maxWidth: 200 }}>{v}</span>
              </div>
            ))}
            <div style={{ marginTop: 20 }}>
              <span style={{
                fontSize: 11, padding: '4px 10px', borderRadius: 20,
                backgroundColor: statusColors[selectedBooking.status] + '15',
                color: statusColors[selectedBooking.status], fontWeight: 500
              }}>{statusLabels[selectedBooking.status] ?? selectedBooking.status}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Owner dashboard ───────────────────────────────────────────────────────────
export default function Dashboard({ session }: { session: any }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  const [tab, setTab] = useState(0)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  const [newSvc, setNewSvc] = useState({ name: '', description: '', duration_minutes: 30, price: 0 })
  const [svcMsg, setSvcMsg] = useState('')

  const [staff, setStaff] = useState<StaffMember[]>([])
  const [staffLoading, setStaffLoading] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteMsg, setInviteMsg] = useState<{ text: string; ok: boolean } | null>(null)

  // Load current user's role — auto-create profile if missing (e.g. invited via Google)
  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', session.user.id)
      .single()
      .then(async ({ data, error }) => {
        if (data) {
          setUserProfile(data as UserProfile)
        } else if (error?.code === 'PGRST116') {
          // No profile found — create a pending stylist profile
          // (owner will approve/change role from Personal tab)
          const name = session.user.user_metadata?.full_name ||
                       session.user.user_metadata?.name ||
                       session.user.email?.split('@')[0] || 'Ny användare'
          await supabaseAdmin.from('profiles').insert({
            id: session.user.id,
            full_name: name,
            role: 'pending'  // Pending until owner approves
          })
          setUserProfile({ id: session.user.id, full_name: name, role: 'pending' })
        }
        setProfileLoading(false)
      })
  }, [session.user.id])

  const fetchBookings = useCallback(async () => {
    const { data } = await supabase
      .from('bookings')
      .select('*, services(name, price), profiles(full_name)')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })
    setBookings(data || [])
    setLoading(false)
  }, [])

  const fetchServices = useCallback(async () => {
    const { data } = await supabase.from('services').select('*').order('name')
    setServices(data || [])
  }, [])

  const fetchStaff = useCallback(async () => {
    setStaffLoading(true)

    // Fetch registered profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, role, created_at')
      .order('full_name')

    // Fetch all auth users to find pending invites (invited but never logged in)
    const { data: authData } = await supabaseAdmin.auth.admin.listUsers()
    const pendingUsers: StaffMember[] = (authData?.users || [])
      .filter((u: any) => !u.last_sign_in_at && u.invited_at)  // invited but never signed in
      .filter((u: any) => !(profiles || []).some((p: any) => p.id === u.id))  // not already in profiles
      .map((u: any) => ({
        id: u.id,
        full_name: u.email || u.id,
        role: 'stylist',
        created_at: u.invited_at,
        email: u.email,
        pending: true,
      }))

    setStaff([...(profiles || []), ...pendingUsers])
    setStaffLoading(false)
  }, [])

  useEffect(() => {
    fetchBookings()
    fetchServices()
  }, [fetchBookings, fetchServices])

  useEffect(() => {
    if (tab === 2) fetchStaff()
  }, [tab, fetchStaff])

  if (profileLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f8f8' }}>
      <div style={{ width: 32, height: 32, border: '2px solid #eee', borderTopColor: '#1a1a1a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  // No profile or pending approval — show waiting screen
  if (!userProfile || userProfile.role === 'pending') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f8f8', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 40 }}>⏳</div>
        <h2 style={{ fontSize: 22, fontWeight: 400, color: '#1a1a1a', margin: 0 }}>Väntar på behörighet</h2>
        <p style={{ fontSize: 14, color: '#999', margin: 0, textAlign: 'center', maxWidth: 320 }}>
          Du är inloggad som <strong>{session.user.email}</strong>.<br />
          Kontakta din administratör för att få tillgång till systemet.
        </p>
        <button onClick={() => supabase.auth.signOut()} style={{ marginTop: 8, fontSize: 13, color: '#aaa', background: 'none', border: '1px solid #eee', borderRadius: 4, padding: '8px 16px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
          Logga ut
        </button>
      </div>
    )
  }

  // Route stylist to their own view
  if (userProfile?.role === 'stylist') {
    return <StylistDashboard session={session} profile={userProfile} />
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('bookings').update({ status }).eq('id', id)
    fetchBookings()
    setSelectedBooking(prev => prev ? { ...prev, status } : null)
  }

  const addService = async () => {
    if (!newSvc.name) return
    const { data: salonData, error: salonErr } = await supabase.rpc('get_my_salon_id')
    if (salonErr || !salonData) {
      setSvcMsg('Fel: Kunde inte hämta salong-id. ' + (salonErr?.message ?? ''))
      setTimeout(() => setSvcMsg(''), 4000)
      return
    }
    const { error } = await supabase.from('services').insert({ ...newSvc, active: true, salon_id: salonData })
    if (error) setSvcMsg('Fel: ' + error.message)
    else { setSvcMsg('Tjänst tillagd! ✓'); setNewSvc({ name: '', description: '', duration_minutes: 30, price: 0 }); fetchServices() }
    setTimeout(() => setSvcMsg(''), 3000)
  }

  const toggleService = async (id: string, active: boolean) => {
    await supabase.from('services').update({ active: !active }).eq('id', id)
    fetchServices()
  }

  const inviteStylist = async () => {
    if (!inviteEmail.trim()) return
    setInviteLoading(true)
    setInviteMsg(null)

    const email = inviteEmail.trim().toLowerCase()
    const adminUrl = window.location.origin

    try {
      // Check if user already exists
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers()
      const existing = listData?.users?.find((u: any) => u.email === email)

      if (existing) {
        // User exists — just upsert their profile as stylist
        const name = existing.user_metadata?.full_name || existing.user_metadata?.name || email.split('@')[0]
        const { error } = await supabaseAdmin.from('profiles').upsert({
          id: existing.id,
          full_name: name,
          role: 'stylist'
        })
        if (error) throw new Error(error.message)
        setInviteMsg({ text: `${email} finns redan — roll satt till Stylist ✓`, ok: true })
        setInviteEmail('')
        setTimeout(fetchStaff, 1000)
      } else {
        // New user — send invite email (Supabase skickar mail med inloggningslänk)
        const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          redirectTo: adminUrl,
          data: { role: 'stylist' }
        })
        if (error) throw new Error(error.message)

        // Pre-create profile row so role is set when they first log in
        if (data.user?.id) {
          await supabaseAdmin.from('profiles').upsert({
            id: data.user.id,
            full_name: email.split('@')[0],
            role: 'stylist'
          })
        }
        setInviteMsg({ text: `Inbjudan skickad till ${email} ✓ — de får ett mail med inloggningslänk`, ok: true })
        setInviteEmail('')
        setTimeout(fetchStaff, 2000)
      }
    } catch (err: any) {
      setInviteMsg({ text: 'Fel: ' + err.message, ok: false })
    }

    setInviteLoading(false)
    setTimeout(() => setInviteMsg(null), 8000)
  }

  const roleLabel = (role: string) => ({ owner: 'Ägare', stylist: 'Stylist', admin: 'Admin', pending: 'Väntar' } as Record<string, string>)[role] ?? role

  const today = new Date().toISOString().split('T')[0]
  const todayBookings = bookings.filter(b => b.date === today)
  const upcomingBookings = bookings.filter(b => b.date >= today && b.status !== 'cancelled')

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8f8f8' }}>
      <aside style={{ width: 220, backgroundColor: '#1a1a1a', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '28px 24px 20px' }}>
          <div style={{ fontSize: 20, fontWeight: 300, color: '#fff', letterSpacing: '0.04em', fontFamily: 'Georgia, serif', marginBottom: 4 }}>FreshBook</div>
          <div style={{ fontSize: 11, color: '#555', letterSpacing: '0.1em' }}>ADMIN</div>
        </div>
        <nav style={{ flex: 1, padding: '8px 12px' }}>
          {ownerTabs.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              width: '100%', textAlign: 'left', padding: '11px 12px',
              fontSize: 13, fontFamily: 'Inter, sans-serif', border: 'none', cursor: 'pointer',
              borderRadius: 6, marginBottom: 2, transition: 'all 0.15s',
              backgroundColor: tab === i ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: tab === i ? '#fff' : '#666', fontWeight: tab === i ? 500 : 400
            }}>
              {['📅', '💇', '👥', '📊'][i]} {t}
            </button>
          ))}
        </nav>
        <div style={{ padding: '16px 24px', borderTop: '1px solid #2a2a2a' }}>
          <div style={{ fontSize: 12, color: '#555', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.user.email}</div>
          <button onClick={() => supabase.auth.signOut()} style={{ fontSize: 12, color: '#555', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'Inter, sans-serif', letterSpacing: '0.08em' }}>LOGGA UT</button>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'auto' }}>

        {/* BOKNINGAR */}
        {tab === 0 && (
          <div style={{ padding: '36px 40px' }}>
            <div style={{ marginBottom: 32 }}>
              <h1 style={{ fontSize: 26, fontWeight: 400, color: '#1a1a1a', marginBottom: 4 }}>Bokningar</h1>
              <p style={{ fontSize: 13, color: '#999' }}>{todayBookings.length} bokningar idag · {upcomingBookings.length} kommande</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 36 }}>
              {[
                { label: 'Idag', value: todayBookings.length, color: '#1a1a1a' },
                { label: 'Denna vecka', value: bookings.filter(b => { const diff = (new Date(b.date).getTime() - new Date().getTime()) / 86400000; return diff >= 0 && diff < 7 }).length, color: '#1a1a1a' },
                { label: 'Bekräftade', value: bookings.filter(b => b.status === 'confirmed').length, color: '#16a34a' },
                { label: 'Väntande', value: bookings.filter(b => b.status === 'pending').length, color: '#d97706' },
              ].map((s, i) => (
                <div key={i} style={{ backgroundColor: '#fff', padding: '20px 24px', borderRadius: 8, border: '1px solid #eee' }}>
                  <div style={{ fontSize: 28, fontWeight: 500, color: s.color, marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>{s.label}</div>
                </div>
              ))}
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>Laddar...</div>
            ) : bookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, backgroundColor: '#fff', borderRadius: 8, border: '1px solid #eee' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
                <div style={{ fontSize: 16, color: '#999', marginBottom: 8 }}>Inga bokningar än</div>
                <div style={{ fontSize: 13, color: '#ccc' }}>Bokningar från kundhemsidan visas här automatiskt</div>
              </div>
            ) : (
              <div style={{ backgroundColor: '#fff', borderRadius: 8, border: '1px solid #eee', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                      {['Kund', 'Tjänst', 'Datum', 'Tid', 'Stylist', 'Status', ''].map(h => (
                        <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: 11, letterSpacing: '0.1em', color: '#aaa', fontWeight: 500, textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map(b => (
                      <tr key={b.id} style={{ borderBottom: '1px solid #f8f8f8', transition: 'background 0.1s' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#fafafa')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>{b.customer_name}</div>
                          <div style={{ fontSize: 12, color: '#aaa' }}>{b.customer_phone}</div>
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: 13, color: '#555' }}>{b.services?.name ?? '–'}</td>
                        <td style={{ padding: '14px 20px', fontSize: 13, color: '#555' }}>{b.date}</td>
                        <td style={{ padding: '14px 20px', fontSize: 13, color: '#555' }}>{b.start_time?.slice(0, 5)}</td>
                        <td style={{ padding: '14px 20px', fontSize: 13, color: '#555' }}>{b.profiles?.full_name ?? '–'}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, backgroundColor: statusColors[b.status] + '15', color: statusColors[b.status], fontWeight: 500 }}>
                            {statusLabels[b.status] ?? b.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <button onClick={() => setSelectedBooking(b)} style={{ fontSize: 12, color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>HANTERA →</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TJÄNSTER */}
        {tab === 1 && (
          <div style={{ padding: '36px 40px' }}>
            <h1 style={{ fontSize: 26, fontWeight: 400, marginBottom: 8 }}>Tjänster</h1>
            <p style={{ fontSize: 13, color: '#999', marginBottom: 36 }}>Lägg till och hantera era tjänster och priser.</p>
            <div style={{ backgroundColor: '#fff', borderRadius: 8, border: '1px solid #eee', padding: '28px', marginBottom: 28 }}>
              <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 20 }}>Lägg till tjänst</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                {[
                  { label: 'Namn', key: 'name', type: 'text', ph: 't.ex. Damklippning' },
                  { label: 'Tid (min)', key: 'duration_minutes', type: 'number', ph: '30' },
                  { label: 'Pris (kr)', key: 'price', type: 'number', ph: '450' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: 11, letterSpacing: '0.12em', color: '#aaa', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>{f.label}</label>
                    <input type={f.type} placeholder={f.ph}
                      value={(newSvc as any)[f.key]}
                      onChange={e => setNewSvc(p => ({ ...p, [f.key]: f.type === 'number' ? +e.target.value : e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #eee', borderRadius: 4, fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none' }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, letterSpacing: '0.12em', color: '#aaa', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Beskrivning (valfritt)</label>
                <input value={newSvc.description} onChange={e => setNewSvc(p => ({ ...p, description: e.target.value }))}
                  placeholder="Kort beskrivning..."
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #eee', borderRadius: 4, fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <button onClick={addService} style={{ backgroundColor: '#1a1a1a', color: '#fff', padding: '10px 24px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13, letterSpacing: '0.1em', fontFamily: 'Inter, sans-serif' }}>LÄGG TILL</button>
                {svcMsg && <span style={{ fontSize: 13, color: svcMsg.startsWith('Fel') ? '#dc2626' : '#16a34a' }}>{svcMsg}</span>}
              </div>
            </div>
            <div style={{ backgroundColor: '#fff', borderRadius: 8, border: '1px solid #eee', overflow: 'hidden' }}>
              {services.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', color: '#aaa', fontSize: 14 }}>Inga tjänster än. Lägg till ovan!</div>
              ) : services.map((s, i) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: i < services.length - 1 ? '1px solid #f5f5f5' : 'none', opacity: s.active ? 1 : 0.4 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 3 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: '#aaa' }}>{s.duration_minutes} min · {s.description}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    <span style={{ fontSize: 17, fontWeight: 500 }}>{s.price.toLocaleString('sv-SE')} kr</span>
                    <button onClick={() => toggleService(s.id, s.active)} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 4, border: '1px solid #eee', cursor: 'pointer', backgroundColor: s.active ? '#f0fdf4' : '#fef2f2', color: s.active ? '#16a34a' : '#dc2626', fontFamily: 'Inter, sans-serif' }}>
                      {s.active ? 'Aktiv' : 'Inaktiv'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PERSONAL */}
        {tab === 2 && (
          <div style={{ padding: '36px 40px' }}>
            <h1 style={{ fontSize: 26, fontWeight: 400, marginBottom: 8 }}>Personal</h1>
            <p style={{ fontSize: 13, color: '#999', marginBottom: 36 }}>Hantera stylister och bjud in ny personal via e-post.</p>
            <div style={{ backgroundColor: '#fff', borderRadius: 8, border: '1px solid #eee', padding: '28px', marginBottom: 28 }}>
              <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>Bjud in stylist</h3>
              <p style={{ fontSize: 13, color: '#999', marginBottom: 20 }}>Stylisten får en inloggningslänk via e-post och kan direkt börja se sina bokningar.</p>
              <div style={{ display: 'flex', gap: 12, maxWidth: 480 }}>
                <input type="email" placeholder="stylist@email.se" value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && inviteStylist()}
                  disabled={inviteLoading}
                  style={{ flex: 1, padding: '11px 14px', border: '1px solid #eee', borderRadius: 4, fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', opacity: inviteLoading ? 0.6 : 1 }}
                />
                <button onClick={inviteStylist} disabled={inviteLoading || !inviteEmail.trim()} style={{
                  backgroundColor: inviteLoading || !inviteEmail.trim() ? '#ccc' : '#1a1a1a', color: '#fff',
                  padding: '11px 22px', border: 'none', borderRadius: 4,
                  cursor: inviteLoading || !inviteEmail.trim() ? 'not-allowed' : 'pointer',
                  fontSize: 13, whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif'
                }}>{inviteLoading ? 'Skickar...' : 'BJUD IN'}</button>
              </div>
              {inviteMsg && <p style={{ marginTop: 12, fontSize: 13, color: inviteMsg.ok ? '#16a34a' : '#dc2626' }}>{inviteMsg.text}</p>}
            </div>
            <div style={{ backgroundColor: '#fff', borderRadius: 8, border: '1px solid #eee', overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>Registrerad personal</span>
                <button onClick={fetchStaff} style={{ fontSize: 12, color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>↻ Uppdatera</button>
              </div>
              {staffLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#aaa', fontSize: 14 }}>Laddar...</div>
              ) : staff.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
                  <div style={{ fontSize: 14, color: '#999', marginBottom: 6 }}>Inga stylister registrerade än</div>
                  <div style={{ fontSize: 12, color: '#ccc' }}>Bjud in personal via formuläret ovan</div>
                </div>
              ) : staff.map((member, i) => (
                <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: i < staff.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: member.pending ? '#fafafa' : '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontFamily: 'Georgia, serif', color: '#bbb', flexShrink: 0, border: member.pending ? '1px dashed #ddd' : 'none' }}>
                      {member.pending ? '✉️' : (member.full_name || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: member.pending ? '#aaa' : '#1a1a1a' }}>
                        {member.pending ? (member.email || member.full_name) : member.full_name || '–'}
                      </div>
                      <div style={{ fontSize: 11, color: '#ccc', marginTop: 2 }}>
                        {member.pending
                          ? `Inbjuden ${new Date(member.created_at!).toLocaleDateString('sv-SE')} — väntar på inloggning`
                          : member.created_at ? `Gick med ${new Date(member.created_at).toLocaleDateString('sv-SE')}` : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {member.pending ? (
                      <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, backgroundColor: '#fef9c3', color: '#a16207', fontWeight: 500 }}>
                        Väntar
                      </span>
                    ) : (
                      <>
                        <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, backgroundColor: member.role === 'owner' ? '#fef3c7' : '#f0fdf4', color: member.role === 'owner' ? '#d97706' : '#16a34a', fontWeight: 500 }}>
                          {roleLabel(member.role)}
                        </span>
                        {(member.role !== 'owner') && (
                          <button
                            onClick={async () => {
                              const newRole = member.role === 'stylist' ? 'owner' : 'stylist'
                              await supabase.from('profiles').update({ role: newRole }).eq('id', member.id)
                              fetchStaff()
                            }}
                            style={{ fontSize: 11, color: member.role === 'pending' ? '#16a34a' : '#aaa', background: 'none', border: `1px solid ${member.role === 'pending' ? '#bbf7d0' : '#eee'}`, borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                          >
                            {member.role === 'pending' ? '✓ Godkänn' : 'Ändra roll'}
                          </button>
                        )}
                        {(!member.pending && member.id) && (
                          <button
                            onClick={() => {
                              const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
                              const redirectUri = encodeURIComponent('https://admin.appbok.se/.netlify/functions/google-calendar-sync')
                              const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly')
                              const state = encodeURIComponent(member.id)
                              window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}&access_type=offline&prompt=consent`
                            }}
                            style={{ fontSize: 11, color: '#4285f4', background: 'none', border: '1px solid #c7d9ff', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                            title="Koppla Google Kalender för denna stylist"
                          >
                            📅 Koppla kalender
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STATISTIK */}
        {tab === 3 && (
          <div style={{ padding: '36px 40px' }}>
            <h1 style={{ fontSize: 26, fontWeight: 400, marginBottom: 8 }}>Statistik</h1>
            <p style={{ fontSize: 13, color: '#999', marginBottom: 36 }}>Översikt över er verksamhet.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 28 }}>
              {[
                { label: 'Totala bokningar', value: bookings.length, icon: '📅' },
                { label: 'Bekräftade', value: bookings.filter(b => b.status === 'confirmed').length, icon: '✅' },
                { label: 'Total omsättning', value: bookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + (b.services?.price || 0), 0).toLocaleString('sv-SE') + ' kr', icon: '💰' },
              ].map((s, i) => (
                <div key={i} style={{ backgroundColor: '#fff', borderRadius: 8, border: '1px solid #eee', padding: '28px 24px' }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>{s.icon}</div>
                  <div style={{ fontSize: 30, fontWeight: 500, color: '#1a1a1a', marginBottom: 6 }}>{s.value}</div>
                  <div style={{ fontSize: 13, color: '#aaa' }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ backgroundColor: '#fff', borderRadius: 8, border: '1px solid #eee', padding: '32px', textAlign: 'center', color: '#aaa' }}>
              <div style={{ fontSize: 14, marginBottom: 8 }}>📈 Detaljerade grafer kommer snart</div>
              <div style={{ fontSize: 12 }}>Bokningar per dag, omsättning per stylist, populäraste tjänster</div>
            </div>
          </div>
        )}
      </main>

      {/* Booking detail panel (owner) */}
      {selectedBooking && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}
          onClick={() => setSelectedBooking(null)}>
          <div style={{ width: 420, backgroundColor: '#fff', padding: '36px 32px', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <h2 style={{ fontSize: 20, fontWeight: 500 }}>Bokningsdetaljer</h2>
              <button onClick={() => setSelectedBooking(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#aaa' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 28 }}>
              {[
                ['Kund', selectedBooking.customer_name],
                ['E-post', selectedBooking.customer_email],
                ['Telefon', selectedBooking.customer_phone || '–'],
                ['Tjänst', selectedBooking.services?.name || '–'],
                ['Datum', selectedBooking.date],
                ['Tid', `${selectedBooking.start_time?.slice(0, 5)} – ${selectedBooking.end_time?.slice(0, 5)}`],
                ['Stylist', selectedBooking.profiles?.full_name || '–'],
                ['Anteckningar', selectedBooking.notes || '–'],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <span style={{ fontSize: 12, color: '#aaa', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{l}</span>
                  <span style={{ fontSize: 14, color: '#1a1a1a', textAlign: 'right', maxWidth: 220 }}>{v}</span>
                </div>
              ))}
            </div>
            <div>
              <p style={{ fontSize: 12, color: '#aaa', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Ändra status</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <button key={key} onClick={() => updateStatus(selectedBooking.id, key)} style={{
                    padding: '8px 16px', borderRadius: 4, border: `1px solid ${statusColors[key]}30`,
                    backgroundColor: selectedBooking.status === key ? statusColors[key] : 'transparent',
                    color: selectedBooking.status === key ? '#fff' : statusColors[key],
                    cursor: 'pointer', fontSize: 13, fontFamily: 'Inter, sans-serif', fontWeight: 500
                  }}>{label}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}