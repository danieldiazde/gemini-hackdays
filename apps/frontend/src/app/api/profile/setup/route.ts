import { NextResponse } from 'next/server'
import { createClient as createSSRClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { parseCanvasIcal } from '@/lib/ical/parser'

type MateriaInput = {
  clave: string
  nombre: string
  creditos: number
}

type HorasEntry = { horas_clase: number | null; horas_auto: number | null }

type PlanDataRaw = {
  semestres?: Array<{
    materias?: Array<{ clave?: string; horasClase?: number; horasAuto?: number }>
  }>
}

function isValidModelo(v: unknown): v is 'tec21' | 'clasico' {
  return v === 'tec21' || v === 'clasico'
}

function isValidMateria(m: unknown): m is MateriaInput {
  if (typeof m !== 'object' || m === null) return false
  const mat = m as Record<string, unknown>
  return (
    typeof mat.clave === 'string' &&
    typeof mat.nombre === 'string' &&
    typeof mat.creditos === 'number'
  )
}

export async function POST(request: Request) {
  // --- Paso 1: autenticación ---
  const authClient = await createSSRClient()
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: 'No autenticado' },
      { status: 401 },
    )
  }

  // --- Paso 2: parsear y validar body ---
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Body inválido' },
      { status: 400 },
    )
  }

  const b = body as Record<string, unknown>
  const { matricula, nombre, carreraClave, modelo, semestre, materias, canvasIcalUrl } = b

  if (typeof matricula !== 'string' || !matricula.trim()) {
    return NextResponse.json(
      { success: false, error: 'matricula requerida' },
      { status: 400 },
    )
  }
  if (typeof nombre !== 'string' || !nombre.trim()) {
    return NextResponse.json(
      { success: false, error: 'nombre requerido' },
      { status: 400 },
    )
  }
  if (typeof carreraClave !== 'string' || !carreraClave.trim()) {
    return NextResponse.json(
      { success: false, error: 'carreraClave requerida' },
      { status: 400 },
    )
  }
  if (!isValidModelo(modelo)) {
    return NextResponse.json(
      { success: false, error: 'modelo debe ser "tec21" o "clasico"' },
      { status: 400 },
    )
  }
  if (typeof semestre !== 'number' || !Number.isInteger(semestre) || semestre < 1) {
    return NextResponse.json(
      { success: false, error: 'semestre debe ser un entero >= 1' },
      { status: 400 },
    )
  }
  if (!Array.isArray(materias) || materias.length === 0) {
    return NextResponse.json(
      { success: false, error: 'materias debe ser un array no vacío' },
      { status: 400 },
    )
  }
  if (!materias.every(isValidMateria)) {
    return NextResponse.json(
      { success: false, error: 'Cada materia requiere clave (string), nombre (string) y creditos (number)' },
      { status: 400 },
    )
  }

  const icalUrl =
    typeof canvasIcalUrl === 'string' && canvasIcalUrl.trim()
      ? canvasIcalUrl.trim()
      : null

  // Service role client — bypasea RLS para poder escribir profiles de usuarios nuevos
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  try {
    // --- Paso 3: upsert profile ---
    const { error: profileError } = await admin.from('profiles').upsert(
      {
        id: user.id,
        matricula: matricula.trim(),
        nombre: nombre.trim(),
        carrera_clave: carreraClave.trim(),
        modelo,
        semestre,
        canvas_ical_url: icalUrl,
      },
      { onConflict: 'id' },
    )

    if (profileError) {
      console.error('[profile/setup] profile upsert error:', profileError.message)
      return NextResponse.json(
        { success: false, error: 'Error al guardar perfil' },
        { status: 500 },
      )
    }

    // --- Lookup horas desde el plan de carrera (best effort) ---
    const horasMap = new Map<string, HorasEntry>()
    const { data: planRow } = await admin
      .from('planes_estudio')
      .select('data')
      .eq('carrera_clave', carreraClave.trim())
      .maybeSingle()

    if (planRow?.data) {
      const planData = planRow.data as PlanDataRaw
      for (const sem of planData.semestres ?? []) {
        for (const mat of sem.materias ?? []) {
          if (mat.clave) {
            horasMap.set(mat.clave, {
              horas_clase: mat.horasClase ?? null,
              horas_auto: mat.horasAuto ?? null,
            })
          }
        }
      }
    }

    // --- Paso 4: reemplazar materias_inscritas ---
    const { error: deleteError } = await admin
      .from('materias_inscritas')
      .delete()
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('[profile/setup] delete materias error:', deleteError.message)
      return NextResponse.json(
        { success: false, error: 'Error al limpiar materias anteriores' },
        { status: 500 },
      )
    }

    const materiaRows = (materias as MateriaInput[]).map((m) => {
      const horas = horasMap.get(m.clave) ?? { horas_clase: null, horas_auto: null }
      return {
        user_id: user.id,
        clave: m.clave,
        nombre: m.nombre,
        creditos: m.creditos,
        prioridad: 3,
        horas_clase: horas.horas_clase,
        horas_auto: horas.horas_auto,
      }
    })

    const { error: insertError } = await admin
      .from('materias_inscritas')
      .insert(materiaRows)

    if (insertError) {
      console.error('[profile/setup] insert materias error:', insertError.message)
      return NextResponse.json(
        { success: false, error: 'Error al guardar materias' },
        { status: 500 },
      )
    }

    // --- Paso 5: Canvas sync (best effort, no falla el endpoint) ---
    if (icalUrl) {
      try {
        const entregas = await parseCanvasIcal(icalUrl)

        if (entregas.length > 0) {
          const eventoRows = entregas.map((e) => ({
            user_id: user.id,
            fuente: 'canvas' as const,
            external_id: e.external_id,
            titulo: e.titulo,
            inicio: `${e.fecha_entrega}T00:00:00Z`,
            fin: `${e.fecha_entrega}T23:59:59Z`,
          }))

          const { error: canvasError } = await admin
            .from('eventos')
            .upsert(eventoRows, { onConflict: 'user_id,external_id' })

          if (canvasError) {
            console.error(
              '[profile/setup] canvas eventos upsert error (non-fatal):',
              canvasError.message,
            )
          }
        }
      } catch (canvasErr) {
        console.error('[profile/setup] canvas sync falló (non-fatal):', canvasErr)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[profile/setup] unexpected:', err)
    const message = err instanceof Error ? err.message : 'Error interno'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
