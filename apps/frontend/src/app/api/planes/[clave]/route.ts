import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clave: string }> },
) {
  const { clave } = await params

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('planes_estudio')
      .select('*')
      .eq('carrera_clave', clave)
      .maybeSingle()

    if (error) {
      console.error('[planes/[clave]] db error:', error.message)
      return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ success: false, error: 'Plan no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true, ...data })
  } catch (err) {
    console.error('[planes/[clave]] unexpected:', err)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
