import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// Run from apps/frontend/:
//   npx tsx --env-file=.env.local scripts/seed-planes.ts

// Carga .env.local si las vars no vienen del entorno
const envFile = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim()
    if (key && !process.env[key]) process.env[key] = value
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('[seed] Faltan vars de entorno: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

type PlanJson = {
  carreraClave: string
  nombre: string
  data: unknown
}

function isPlanJson(v: unknown): v is PlanJson {
  if (typeof v !== 'object' || v === null) return false
  const obj = v as Record<string, unknown>
  return (
    typeof obj.carreraClave === 'string' &&
    typeof obj.nombre === 'string' &&
    obj.data !== undefined
  )
}

const planesDir = path.join(process.cwd(), 'data', 'planes')

async function main() {
  if (!fs.existsSync(planesDir)) {
    console.error('[seed] Directorio no encontrado:', planesDir)
    process.exit(1)
  }

  const files = fs.readdirSync(planesDir).filter((f) => f.endsWith('.json'))

  if (files.length === 0) {
    console.log('[seed] Sin archivos JSON en', planesDir)
    return
  }

  const supabase = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!)

  let ok = 0
  let failed = 0

  for (const file of files) {
    const filePath = path.join(planesDir, file)
    let json: unknown

    try {
      json = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    } catch (err) {
      console.error(`[seed] JSON inválido en ${file}:`, err)
      failed++
      continue
    }

    if (!isPlanJson(json)) {
      console.error(
        `[seed] ${file} no tiene el shape esperado (carreraClave, nombre, data)`,
      )
      failed++
      continue
    }

    const { error } = await supabase.from('planes_estudio').upsert(
      {
        carrera_clave: json.carreraClave,
        nombre: json.nombre,
        data: json.data,
      },
      { onConflict: 'carrera_clave' },
    )

    if (error) {
      console.error(`[seed] upsert ${json.carreraClave} falló:`, error.message)
      failed++
    } else {
      console.log(`[seed] ✓ ${json.carreraClave} — ${json.nombre}`)
      ok++
    }
  }

  console.log(`\n[seed] Done — ${ok} ok, ${failed} fallidos`)
  if (failed > 0) process.exit(1)
}

main().catch((err: unknown) => {
  console.error('[seed] Fatal:', err)
  process.exit(1)
})
