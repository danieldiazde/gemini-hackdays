import * as nodeIcal from 'node-ical'

export type EntregaCanvas = {
  external_id: string   // UID del evento iCal
  titulo: string        // SUMMARY
  fecha_entrega: string // ISO 8601 date-only: "YYYY-MM-DD"
  fuente: 'canvas'
}

export async function parseCanvasIcal(url: string): Promise<EntregaCanvas[]> {
  const normalizedUrl = url.startsWith('webcal://')
    ? url.replace('webcal://', 'https://')
    : url

  let events: nodeIcal.CalendarResponse
  try {
    events = await nodeIcal.async.fromURL(normalizedUrl)
  } catch (err) {
    throw new Error(`No se pudo obtener el iCal de Canvas: ${String(err)}`)
  }

  const entregas: EntregaCanvas[] = []

  for (const component of Object.values(events)) {
    if (!component || component.type !== 'VEVENT') continue

    const event = component as nodeIcal.VEvent
    const uid = event.uid
    const summary = typeof event.summary === 'string' ? event.summary : event.summary?.val
    const start = event.start

    if (!uid || !summary || !start) continue

    const dateObj = start instanceof Date ? start : new Date(String(start))
    if (isNaN(dateObj.getTime())) continue

    // Usamos UTC para consistencia — Canvas envía DTSTART en UTC
    const fecha_entrega = [
      dateObj.getUTCFullYear(),
      String(dateObj.getUTCMonth() + 1).padStart(2, '0'),
      String(dateObj.getUTCDate()).padStart(2, '0'),
    ].join('-')

    entregas.push({ external_id: uid, titulo: summary, fecha_entrega, fuente: 'canvas' })
  }

  return entregas
}

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Parses a Canvas iCal feed and upserts the entregas into the `eventos`
 * table for the given user. Reusable from the route and from server
 * components that want to auto-refresh on dashboard load.
 */
export async function syncCanvasIcalToDb(
  supabase: SupabaseClient,
  userId: string,
  icalUrl: string,
): Promise<number> {
  const entregas = await parseCanvasIcal(icalUrl)
  if (entregas.length === 0) return 0

  const rows = entregas.map((e) => ({
    user_id: userId,
    source: 'canvas' as const,
    external_id: e.external_id,
    titulo: e.titulo,
    fecha_inicio: `${e.fecha_entrega}T00:00:00Z`,
    fecha_fin: `${e.fecha_entrega}T23:59:59Z`,
  }))

  const { error } = await supabase
    .from('eventos')
    .upsert(rows, { onConflict: 'user_id,external_id' })
  if (error) throw new Error(`upsert eventos: ${error.message}`)

  return rows.length
}
