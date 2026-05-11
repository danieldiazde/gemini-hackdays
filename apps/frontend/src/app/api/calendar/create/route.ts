import { NextResponse } from 'next/server'

import {
  getProviderToken,
  createEvents,
  type NewCalEvent,
} from '@/lib/google/calendar'
import { getSupabaseServer } from '@/lib/supabase/server'
import {
  calendarCreateBodySchema,
  parseOrFail,
} from '@/lib/validation/schemas'

export async function POST(request: Request) {
  const raw = await request.json().catch(() => null)
  const parsed = parseOrFail(calendarCreateBodySchema, raw)
  if (!parsed.ok) {
    return NextResponse.json(
      { success: false, error: parsed.error },
      { status: 400 },
    )
  }
  const validEvents = parsed.data.events

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
      let status = 500
      if (first) {
        const msg = first.message.toLowerCase()
        if (msg.includes('has not been used') || msg.includes('disabled')) {
          hint = ' Habilita la Google Calendar API en Google Cloud Console y reintenta.'
          status = 503
        } else if (first.status === 401 || msg.includes('invalid credentials')) {
          hint = ' Tu sesión con Google expiró. Cierra sesión y vuelve a entrar.'
          status = 401
        } else if (msg.includes('insufficient') || first.status === 403) {
          hint = ' Falta el permiso de Google Calendar. Cierra sesión, vuelve a entrar y acepta el acceso al calendario.'
          status = 403
        }
      }
      return NextResponse.json(
        {
          success: false,
          error: `No se pudo crear ningún evento.${detail}${hint}`,
          errors: createErrors,
        },
        { status },
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
