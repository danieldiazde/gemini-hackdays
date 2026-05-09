import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase/server'
import {
  getProviderToken,
  createEvents,
  type NewCalEvent,
} from '@/lib/google/calendar'

type EventInput = {
  titulo: string
  descripcion?: string
  inicio: string
  fin: string
}

function isEventInput(e: unknown): e is EventInput {
  if (typeof e !== 'object' || e === null) return false
  const ev = e as Record<string, unknown>
  return (
    typeof ev.titulo === 'string' &&
    typeof ev.inicio === 'string' &&
    typeof ev.fin === 'string'
  )
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Body inválido' },
      { status: 400 },
    )
  }

  const rawEvents = (body as Record<string, unknown>).events
  if (!Array.isArray(rawEvents) || rawEvents.length === 0) {
    return NextResponse.json(
      { success: false, error: 'events debe ser un array no vacío' },
      { status: 400 },
    )
  }

  const validEvents: EventInput[] = rawEvents.filter(isEventInput)
  if (validEvents.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Ningún evento tiene los campos requeridos (titulo, inicio, fin)' },
      { status: 400 },
    )
  }

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

    const newCalEvents: NewCalEvent[] = validEvents.map((e) => ({
      titulo: e.titulo,
      descripcion: e.descripcion,
      inicio: e.inicio,
      fin: e.fin,
    }))

    const { ids: createdIds, errors: createErrors } = await createEvents(
      token,
      newCalEvents,
    )

    if (createdIds.length === 0) {
      const first = createErrors[0]
      const detail = first
        ? ` Google respondió ${first.status}: ${first.message}`
        : ''
      let hint = ''
      if (first) {
        const msg = first.message.toLowerCase()
        if (msg.includes('has not been used') || msg.includes('disabled')) {
          hint = ' Habilita la Google Calendar API en Google Cloud Console y reintenta.'
        } else if (first.status === 401 || msg.includes('insufficient')) {
          hint = ' Cierra sesión y vuelve a entrar para autorizar Google Calendar.'
        }
      }
      return NextResponse.json(
        {
          success: false,
          error: `No se pudo crear ningún evento.${detail}${hint}`,
          errors: createErrors,
        },
        { status: 500 },
      )
    }

    // Guardamos en DB los que efectivamente se crearon en Google Calendar.
    // createEvents procesa en orden y solo incluye IDs de éxitos, así que
    // el índice i corresponde al evento validEvents[i] en el happy path.
    const insertRows = createdIds.map((gcalId, i) => ({
      user_id: user.id,
      source: 'ai_suggested' as const,
      external_id: gcalId,
      titulo: validEvents[i]?.titulo ?? '',
      fecha_inicio: validEvents[i]?.inicio ?? '',
      fecha_fin: validEvents[i]?.fin ?? '',
    }))

    const { error: insertError } = await supabase
      .from('eventos')
      .insert(insertRows)

    if (insertError) {
      // Los eventos ya existen en Google Calendar aunque falle la inserción en DB.
      console.error('[calendar/create] insert en DB falló:', insertError.message)
    }

    return NextResponse.json({
      success: true,
      created: createdIds.length,
      ids: createdIds,
    })
  } catch (err) {
    console.error('[calendar/create] unexpected:', err)
    const message = err instanceof Error ? err.message : 'Error interno'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
