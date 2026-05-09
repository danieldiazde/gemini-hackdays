import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseCanvasIcal } from '@/lib/ical/parser'

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

  const icalUrl = (body as Record<string, unknown>).icalUrl
  if (typeof icalUrl !== 'string' || !icalUrl.trim()) {
    return NextResponse.json(
      { success: false, error: 'icalUrl requerido' },
      { status: 400 },
    )
  }

  try {
    const supabase = await createClient()

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
      fuente: 'canvas' as const,
      external_id: e.external_id,
      titulo: e.titulo,
      inicio: `${e.fecha_entrega}T00:00:00Z`,
      fin: `${e.fecha_entrega}T23:59:59Z`,
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
    const message = err instanceof Error ? err.message : 'Error interno'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
