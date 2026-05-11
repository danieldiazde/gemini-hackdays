import { NextResponse } from 'next/server'

import { parseCanvasIcal } from '@/lib/ical/parser'
import { getSupabaseServer } from '@/lib/supabase/server'
import { canvasSyncBodySchema, parseOrFail } from '@/lib/validation/schemas'

export async function POST(request: Request) {
  const raw = await request.json().catch(() => null)
  const parsed = parseOrFail(canvasSyncBodySchema, raw)
  if (!parsed.ok) {
    return NextResponse.json(
      { success: false, error: parsed.error },
      { status: 400 },
    )
  }
  const { icalUrl } = parsed.data

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

    const entregas = await parseCanvasIcal(icalUrl)

    if (entregas.length === 0) {
      return NextResponse.json({ success: true, eventsAdded: 0 })
    }

    const rows = entregas.map((e) => ({
      user_id: user.id,
      source: 'canvas' as const,
      external_id: e.external_id,
      titulo: e.titulo,
      fecha_inicio: `${e.fecha_entrega}T00:00:00Z`,
      fecha_fin: `${e.fecha_entrega}T23:59:59Z`,
    }))

    // Requiere constraint única en DB:
    //   ALTER TABLE eventos ADD CONSTRAINT eventos_user_external_unique
    //   UNIQUE (user_id, external_id);
    const { error: upsertError } = await supabase
      .from('eventos')
      .upsert(rows, { onConflict: 'user_id,external_id' })

    if (upsertError) {
      console.error('[canvas/sync] upsert error:', upsertError.message)
      return NextResponse.json(
        { success: false, error: 'Error al guardar eventos' },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, eventsAdded: rows.length })
  } catch (err) {
    console.error('[canvas/sync] unexpected:', err)
    // Only surface our own deliberately-thrown messages (URL validation,
    // parse failures). Anything else stays generic to avoid leaking
    // internal details like DB column names.
    const safeMessages = [
      'URL inválida',
      'La URL debe usar HTTPS',
      'Host no permitido',
      'La URL debe terminar en .ics',
      'No se pudo obtener el iCal de Canvas',
    ]
    const message = err instanceof Error ? err.message : ''
    const surface = safeMessages.some((m) => message.startsWith(m))
      ? message
      : 'No pudimos sincronizar Canvas. Inténtalo de nuevo.'
    return NextResponse.json(
      { success: false, error: surface },
      { status: 500 },
    )
  }
}
