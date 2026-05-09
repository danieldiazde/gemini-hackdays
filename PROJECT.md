# 📚 TecCoach — Documento Maestro del Proyecto

> **Léelo ANTES de empezar a programar. Todos en la misma página = velocidad.**

---

## 1. Visión

**Producto:** Coach académico inteligente para estudiantes del Tec de Monterrey.

**User story principal:**
> Como alumno del Tec, quiero que una IA me diga *qué estudiar esta semana y cuándo*, basándose en mis materias actuales, mis entregas de Canvas y mi calendario de Google, y que me agende los bloques de estudio automáticamente.

**Diferenciadores que vamos a vender en el pitch:**
1. Entiende el modelo Tec21 (Semanas Tec, materias life, bloques)
2. No es solo info: **agenda en Google Calendar con un clic**
3. Privacy-first: solo OAuth Google, nunca credenciales del Tec
4. Contextualizado: sabe que estás en 5to de ITC, no es un ChatGPT genérico

---

## 2. Stack y arquitectura

```
Frontend + Backend: Next.js 15 (App Router, TypeScript)
Auth + DB:          Supabase (Postgres + Google OAuth)
LLM:                Gemini API (gemini-2.5-flash para insights)
Hosting:            Vercel (push-to-deploy desde main)
Pre-procesamiento:  Playwright local → JSON de planes de estudio
Estilo:             Tailwind CSS + paleta Gemini (azul/morado/rosa)
```

**Decisión arquitectónica clave:** todo en Next.js. NO hay backend Python separado. Las API routes de Next.js son nuestro backend. Esto reduce overhead de comunicación entre servicios y simplifica deploy.

**Flujo de datos:**
```
Usuario → OAuth Google → Supabase Auth
                          ↓
              [Onboarding: carrera, semestre, materias, iCal Canvas]
                          ↓
              Sync: Google Calendar + Canvas iCal → Supabase
                          ↓
              Gemini API ← (perfil + materias + eventos) → JSON insights
                          ↓
              Dashboard muestra → Usuario aprueba bloques → Google Calendar API write
```

---

## 3. Roles del equipo

### 👤 Persona A — Data & Foundation
**Misión:** que los datos lleguen y estén bien.
- Scraper SAMP (pre-hackathon)
- Schema Supabase + RLS
- Sync de Canvas iCal
- Integración Google Calendar API (read + write)

### 👤 Persona B — AI & Logic
**Misión:** el cerebro del producto.
- Prompts del coach académico
- Endpoint `/api/insights` con Gemini structured output
- Algoritmo de detección de conflictos
- Lógica de sugerencia de bloques de estudio

### 👤 Persona C — Frontend & Demo
**Misión:** lo que los jueces ven.
- Auth UI + onboarding
- Dashboard con insights
- Vista calendario semanal
- Polish + demo data

---

## 4. Schema de Supabase (SINGLE SOURCE OF TRUTH)

> **Persona A es dueño de este schema.** Si alguien necesita un cambio, lo discute con A primero.

```sql
-- Perfil del usuario (extiende auth.users)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  matricula text unique,
  nombre text,
  carrera_clave text,           -- ej: "ITC19"
  modelo text,                   -- "tec21" | "clasico"
  semestre int,
  preferencias jsonb default '{}'::jsonb,
  canvas_ical_url text,
  created_at timestamptz default now()
);

-- Planes de estudio (seed desde scraper SAMP)
create table planes_estudio (
  carrera_clave text primary key,
  nombre text,
  data jsonb                     -- { semestres: [{numero, materias: [...]}] }
);

-- Materias del semestre actual del usuario
create table materias_inscritas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  clave text,
  nombre text,
  creditos int,
  prioridad int default 3,       -- 1 (baja) - 5 (alta)
  created_at timestamptz default now()
);

-- Eventos sincronizados (cache)
create table eventos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  fuente text not null,          -- "google" | "canvas" | "ai_suggested" | "manual"
  external_id text,
  titulo text not null,
  descripcion text,
  inicio timestamptz not null,
  fin timestamptz not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index eventos_user_inicio_idx on eventos(user_id, inicio);

-- Insights generados (cache)
create table insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  semana_iso text not null,      -- "2026-W19"
  contenido jsonb not null,
  generated_at timestamptz default now(),
  unique(user_id, semana_iso)
);

-- Activar RLS en todas
alter table profiles enable row level security;
alter table materias_inscritas enable row level security;
alter table eventos enable row level security;
alter table insights enable row level security;
-- planes_estudio NO tiene RLS, es lectura pública

-- Policies: cada quien solo ve lo suyo
create policy "users see own profile" on profiles for all using (auth.uid() = id);
create policy "users see own materias" on materias_inscritas for all using (auth.uid() = user_id);
create policy "users see own eventos" on eventos for all using (auth.uid() = user_id);
create policy "users see own insights" on insights for all using (auth.uid() = user_id);
create policy "anyone reads planes" on planes_estudio for select using (true);
```

---

## 5. Contratos de API (CRÍTICO para trabajar en paralelo)

> **Lo que cada endpoint recibe y devuelve. NO cambiar sin avisar al equipo.**

### Owned by Persona A (Data)

#### `POST /api/canvas/sync`
```ts
// Body
{ icalUrl: string }

// Response 200
{ success: true, eventsAdded: number }

// Response 400
{ error: string }
```

#### `POST /api/calendar/sync`
Lee próximos 14 días de Google Calendar del usuario, los guarda en `eventos`.
```ts
// Body: vacío (usa session)
// Response 200
{ success: true, eventsAdded: number }
```

#### `POST /api/calendar/create`
Crea eventos en Google Calendar del usuario.
```ts
// Body
{
  events: Array<{
    titulo: string;
    descripcion?: string;
    inicio: string;  // ISO 8601
    fin: string;     // ISO 8601
  }>
}

// Response 200
{ success: true, created: number, ids: string[] }
```

#### `GET /api/planes/:carreraClave`
```ts
// Response 200
{
  carreraClave: string;
  nombre: string;
  data: {
    semestres: Array<{
      numero: number;
      materias: Array<{
        clave: string;
        nombre: string;
        creditos: number;
        tipo: "regular" | "life" | "semana_tec";
      }>
    }>
  }
}
```

### Owned by Persona B (AI)

#### `POST /api/insights/generate`
Genera insights de la semana actual. Usa cache si ya existe para esta semana ISO.
```ts
// Body
{ forceRefresh?: boolean }

// Response 200
{
  semana_iso: string;
  contenido: {
    mensaje: string;                    // Mensaje motivacional 2-3 líneas
    prioridades: Array<{
      materia: string;
      razon: string;
      urgencia: "alta" | "media" | "baja";
    }>;
    bloques_sugeridos: Array<{
      titulo: string;                   // "Estudiar Compiladores"
      materia: string;
      inicio_iso: string;
      fin_iso: string;
      razon: string;                    // Por qué este horario
    }>
  }
}
```

#### `GET /api/insights/current`
Devuelve el insight cacheado de la semana actual, o null.
```ts
// Response 200
{ insight: <mismo shape de arriba> | null }
```

### Owned by Persona C (Frontend)
No expone APIs, consume las anteriores. Pero define los componentes:

- `<OnboardingFlow />` — multi-step, escribe a `/api/profile/setup`
- `<Dashboard />` — fetcha `/api/insights/current`, muestra todo
- `<WeeklyCalendar />` — fetcha `/api/eventos?week=current`
- `<ApplyBlocksButton />` — POST a `/api/calendar/create` con bloques aprobados

#### `POST /api/profile/setup` (Persona A o C, decidir)
```ts
// Body
{
  matricula: string;
  nombre: string;
  carreraClave: string;
  modelo: "tec21" | "clasico";
  semestre: number;
  materias: Array<{ clave: string; nombre: string; creditos: number; }>;
  canvasIcalUrl?: string;
}
// Response 200
{ success: true }
```

---

## 6. Variables de entorno

Archivo `.env.local` (NO subir a git, está en `.gitignore`):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # Solo en server, nunca en cliente

# Gemini
GEMINI_API_KEY=AIza...

# Google OAuth (configurar en Google Cloud Console)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000   # cambiar en prod
```

**Persona A configura las cuentas y comparte las keys por canal seguro (NO en git, NO en Slack público).**

---

## 7. Estructura de carpetas

```
/teccoach
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (app)/dashboard/page.tsx
│   ├── (app)/onboarding/page.tsx
│   ├── api/
│   │   ├── canvas/sync/route.ts
│   │   ├── calendar/sync/route.ts
│   │   ├── calendar/create/route.ts
│   │   ├── insights/generate/route.ts
│   │   ├── insights/current/route.ts
│   │   ├── planes/[clave]/route.ts
│   │   └── profile/setup/route.ts
│   └── layout.tsx
├── components/
│   ├── onboarding/
│   ├── dashboard/
│   └── ui/                    # shadcn-style primitivos
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # cliente del navegador
│   │   └── server.ts          # cliente del servidor
│   ├── gemini/
│   │   └── client.ts
│   ├── google/
│   │   └── calendar.ts
│   └── ical/
│       └── parser.ts
├── types/
│   └── index.ts               # tipos compartidos
├── scripts/
│   └── scrape-samp.ts         # corre local, no en runtime
├── data/
│   └── planes/                # JSONs de carreras (seed)
└── README.md
```

---

## 8. Convenciones

- **Branches:** `feat/<persona>-<feature>`. Ej: `feat/a-canvas-sync`, `feat/c-dashboard-ui`
- **Commits:** convencionales. `feat:`, `fix:`, `chore:`
- **PRs:** review rápido (no más de 10 min de cola). Si urge, merge directo a main pero avisa en chat.
- **TypeScript:** strict. Nada de `any` salvo emergencia.
- **Comentarios en código:** solo cuando el "por qué" no sea obvio. El "qué" lo dice el código.
- **Nombres en español o inglés:** elige uno y consistencia. Sugerencia: variables de dominio en español (`materias`, `bloques`), código técnico en inglés (`fetchEvents`, `parseIcal`).

---

## 9. Sync points (checkpoints obligatorios)

Cada **8 horas** el equipo se reúne 10 min:

- **H+0**: kickoff, todos arrancan con su prompt
- **H+8**: ¿auth funciona? ¿schema desplegado? ¿scraper terminó?
- **H+16**: ¿API de insights ya devuelve algo? ¿onboarding navegable?
- **H+24**: integración: el dashboard real consume insights reales
- **H+32**: end-to-end funciona, empieza polish
- **H+40**: demo run-through completo
- **H+44**: video de respaldo grabado

**Regla de oro:** si alguien está atorado >2h en algo, lo dice. No se pierde tiempo en silencio.

---

## 10. Demo script (qué tiene que funcionar SÍ O SÍ)

Lo que se muestra a los jueces, en orden:

1. Landing → "Iniciar sesión con Google"
2. OAuth → consent screen → de regreso a la app
3. Onboarding: matrícula, carrera (dropdown jala de SAMP), semestre, materias inscritas, URL iCal Canvas
4. Dashboard:
   - Mensaje del coach: "Hola Andrés, vas en semana 5..."
   - 3 prioridades con urgencia
   - Bloques sugeridos en una vista de calendario semanal
   - Botón "Aplicar a Google Calendar"
5. Click en aplicar → loading → toast de éxito
6. Abrimos Google Calendar en otra pestaña → ahí están los bloques

**Si algo de esto NO funciona, no se demoea.** Better cortar features que demoear bugs.

---

## 11. Cosas que NO hacemos en este hackathon

- ❌ Tests (sí, ya sé. No hay tiempo.)
- ❌ Módulo de finanzas / HEB (es roadmap, lo mencionamos en pitch)
- ❌ Mobile responsive perfecto (desktop-first, demo es en laptop)
- ❌ Múltiples idiomas (español únicamente)
- ❌ Notificaciones push, emails (out of scope)
- ❌ Soporte a múltiples calendarios (solo el primario de Google)
- ❌ Edición de eventos existentes (solo crear nuevos)
- ❌ Refactors "para que quede bonito" si ya funciona

---

## 12. Pitch (para que todos sepan qué construimos)

> "El 70% de los alumnos del Tec planean su semana en una libreta o en su cabeza. Pierden tiempo, se les pasan entregas, y estudian a última hora.
>
> TecCoach conecta tu Google Calendar, tu Canvas y tu plan de estudios del SAMP. Gemini analiza tu carga real y te dice qué estudiar, cuándo, y por qué — y lo agenda con un clic.
>
> No es un ChatGPT genérico: entiende el modelo Tec21, las Semanas Tec, las materias life, y los bloques. Es coach + ejecutivo personal para tu vida académica."

---

**Fin del doc. Ahora cada quien lee su prompt específico y arranca. 🚀**
