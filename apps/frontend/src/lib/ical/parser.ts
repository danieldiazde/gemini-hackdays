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
    if (component.type !== 'VEVENT') continue

    const event = component as nodeIcal.VEvent
    const uid = event.uid
    const summary = event.summary
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
