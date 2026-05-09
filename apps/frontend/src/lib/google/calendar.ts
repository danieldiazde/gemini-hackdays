import type { SupabaseClient } from '@supabase/supabase-js'

import { getSupabaseServer } from '@/lib/supabase/server'

export type GCalEvent = {
  id: string
  summary: string
  start: { date?: string; dateTime?: string }
  end: { date?: string; dateTime?: string }
}

export type NewCalEvent = {
  titulo: string
  descripcion?: string
  inicio: string
  fin: string
}

type GCalListResponse = { items?: GCalEvent[] }
type GCalCreatedEvent = { id?: string }

// --- getProviderToken ---

export async function getProviderToken(userId: string): Promise<string> {
  const supabase = await getSupabaseServer()
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    throw new Error(`Error obteniendo sesión para ${userId}: ${error.message}`)
  }
  if (!session?.provider_token) {
    throw new Error('re-login requerido')
  }

  return session.provider_token
}

// --- listEvents ---

export async function listEvents(
  token: string,
  fromDate: Date,
  toDate: Date,
): Promise<GCalEvent[]> {
  const params = new URLSearchParams({
    timeMin: fromDate.toISOString(),
    timeMax: toDate.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '100',
  })

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${token}` } },
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Google Calendar listEvents ${response.status}: ${text}`)
  }

  const data = (await response.json()) as GCalListResponse
  return data.items ?? []
}

// --- createEvents ---

export type CreateEventsResult = {
  ids: string[]
  /** Per-event errors keyed by titulo. Empty if everything succeeded. */
  errors: Array<{ titulo: string; status: number; message: string }>
}

const TIMEZONE = 'America/Monterrey'

export async function createEvents(
  token: string,
  events: NewCalEvent[],
): Promise<CreateEventsResult> {
  const ids: string[] = []
  const errors: CreateEventsResult['errors'] = []

  for (const event of events) {
    try {
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            summary: event.titulo,
            description: `[TecCoach] ${event.descripcion ?? ''}`,
            // Always include timeZone so Google doesn't reject when the
            // dateTime string is missing an offset.
            start: { dateTime: event.inicio, timeZone: TIMEZONE },
            end: { dateTime: event.fin, timeZone: TIMEZONE },
          }),
        },
      )

      if (!response.ok) {
        const text = await response.text()
        console.error(
          `[createEvents] falló "${event.titulo}" (${response.status}): ${text}`,
        )
        // Try to surface a clean message from Google's JSON error envelope.
        let message = text
        try {
          const json = JSON.parse(text) as { error?: { message?: string } }
          if (json.error?.message) message = json.error.message
        } catch {
          // not JSON, keep raw text (truncated)
        }
        errors.push({
          titulo: event.titulo,
          status: response.status,
          message: message.slice(0, 500),
        })
        continue
      }

      const created = (await response.json()) as GCalCreatedEvent
      if (created.id) ids.push(created.id)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[createEvents] error inesperado en "${event.titulo}":`, err)
      errors.push({ titulo: event.titulo, status: 0, message })
    }
  }

  return { ids, errors }
}

// --- syncGoogleCalendarToDb ---

/**
 * Pulls the next 14 days of Google Calendar events and upserts them into
 * the `eventos` table. Reusable from API routes and from server components.
 * Throws on failure so the caller can decide how to surface it.
 */
export async function syncGoogleCalendarToDb(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const token = await getProviderToken(userId)

  const fromDate = new Date()
  const toDate = new Date()
  toDate.setDate(toDate.getDate() + 14)

  const events = await listEvents(token, fromDate, toDate)

  type EventoRow = {
    user_id: string
    source: 'google'
    external_id: string
    titulo: string
    fecha_inicio: string
    fecha_fin: string
  }

  const rows: EventoRow[] = []
  for (const event of events) {
    if (!event.summary) continue
    const inicio =
      event.start.dateTime ??
      (event.start.date ? `${event.start.date}T00:00:00Z` : null)
    const fin =
      event.end.dateTime ??
      (event.end.date ? `${event.end.date}T23:59:59Z` : null)
    if (!inicio || !fin) continue
    rows.push({
      user_id: userId,
      source: 'google',
      external_id: event.id,
      titulo: event.summary,
      fecha_inicio: inicio,
      fecha_fin: fin,
    })
  }

  if (rows.length === 0) return 0

  const { error } = await supabase
    .from('eventos')
    .upsert(rows, { onConflict: 'user_id,external_id' })
  if (error) throw new Error(`upsert eventos: ${error.message}`)

  return rows.length
}
