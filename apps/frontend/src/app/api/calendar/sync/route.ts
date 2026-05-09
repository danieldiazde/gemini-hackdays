import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase/server'
import { getProviderToken, listEvents } from '@/lib/google/calendar'

export async function POST() {
  try {
    const supabase = await getSupabaseServer()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 },
      )
    }

    let token: string
    try {
      token = await getProviderToken(user.id)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error de token'
      const status = message === 're-login requerido' ? 401 : 500
      return NextResponse.json({ success: false, error: message }, { status })
    }

    const fromDate = new Date()
    const toDate = new Date()
    toDate.setDate(toDate.getDate() + 14)

    const gcalEvents = await listEvents(token, fromDate, toDate)

    if (gcalEvents.length === 0) {
      return NextResponse.json({ success: true, eventsAdded: 0 })
    }

    type EventoRow = {
      user_id: string
      source: 'google'
      external_id: string
      titulo: string
      fecha_inicio: string
      fecha_fin: string
    }

    const rows: EventoRow[] = []

    for (const event of gcalEvents) {
      if (!event.summary) continue

      const inicio =
        event.start.dateTime ??
        (event.start.date ? `${event.start.date}T00:00:00Z` : null)
      const fin =
        event.end.dateTime ??
        (event.end.date ? `${event.end.date}T23:59:59Z` : null)

      if (!inicio || !fin) continue

      rows.push({
        user_id: user.id,
        source: 'google',
        external_id: event.id,
        titulo: event.summary,
        fecha_inicio: inicio,
        fecha_fin: fin,
      })
    }

    if (rows.length === 0) {
      return NextResponse.json({ success: true, eventsAdded: 0 })
    }

    // Requiere: UNIQUE (user_id, external_id) en la tabla eventos
    const { error: upsertError } = await supabase
      .from('eventos')
      .upsert(rows, { onConflict: 'user_id,external_id' })

    if (upsertError) {
      console.error('[calendar/sync] upsert error:', upsertError.message)
      return NextResponse.json(
        { success: false, error: 'Error al guardar eventos' },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, eventsAdded: rows.length })
  } catch (err) {
    console.error('[calendar/sync] unexpected:', err)
    const message = err instanceof Error ? err.message : 'Error interno'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
