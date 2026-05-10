import * as nodeIcal from 'node-ical'

// en-CA emits ISO YYYY-MM-DD for the date parts. Pinning timeZone to
// America/Monterrey gives us the date the student actually sees on their
// calendar, regardless of how the iCal feed encodes its timestamps.
const MTY_DATE_FMT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Monterrey',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export type EntregaCanvas = {
  external_id: string   // UID del evento iCal
  titulo: string        // SUMMARY
  fecha_entrega: string // ISO 8601 date-only: "YYYY-MM-DD"
  fuente: 'canvas'
}

/**
 * Validate an iCal feed URL: reject any non-HTTPS scheme, any internal/loopback
 * host, and anything that doesn't end in `.ics`. The whole point of this check
 * is to prevent SSRF — without it, a user could trick the server into hitting
 * `http://169.254.169.254/...` (cloud metadata) or arbitrary internal IPs.
 */
function assertSafeIcalUrl(rawUrl: string): URL {
  const normalized = rawUrl.startsWith('webcal://')
    ? rawUrl.replace('webcal://', 'https://')
    : rawUrl

  let parsed: URL
  try {
    parsed = new URL(normalized)
  } catch {
    throw new Error('URL inválida')
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('La URL debe usar HTTPS')
  }

  const host = parsed.hostname.toLowerCase()
  const blockedExact = ['localhost', '0.0.0.0', '::1', '[::1]']
  if (
    blockedExact.includes(host) ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
    host === '169.254.169.254'
  ) {
    throw new Error('Host no permitido')
  }

  if (!parsed.pathname.toLowerCase().endsWith('.ics')) {
    throw new Error('La URL debe terminar en .ics')
  }

  return parsed
}

export async function parseCanvasIcal(url: string): Promise<EntregaCanvas[]> {
  const safe = assertSafeIcalUrl(url)

  let events: nodeIcal.CalendarResponse
  try {
    events = await nodeIcal.async.fromURL(safe.toString())
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

    // Extract the date as the user would see it in Monterrey, not UTC. Canvas
    // sometimes sends timestamps with non-UTC offsets and using getUTCDate()
    // shifted deadlines forward when an event was scheduled near midnight.
    const fecha_entrega = MTY_DATE_FMT.format(dateObj)

    entregas.push({ external_id: uid, titulo: summary.trim().slice(0, 255), fecha_entrega, fuente: 'canvas' })
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
    // Tag with Monterrey offset so the day the student sees the deadline
    // matches what Canvas displayed.
    fecha_inicio: `${e.fecha_entrega}T00:00:00-06:00`,
    fecha_fin: `${e.fecha_entrega}T23:59:59-06:00`,
  }))

  const { error } = await supabase
    .from('eventos')
    .upsert(rows, { onConflict: 'user_id,external_id' })
  if (error) throw new Error(`upsert eventos: ${error.message}`)

  return rows.length
}
