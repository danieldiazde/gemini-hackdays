import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";

const TEST_EMAIL = "test-e2e@teccoach.dev";

interface SetupResult {
  userId: string;
  jwt: string;
}

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

function readFixture() {
  const fixturePath = join(__dirname, "fixtures", "test-user.json");
  return JSON.parse(readFileSync(fixturePath, "utf-8")) as {
    name: string;
    semestre: number;
    carrera: string;
    materias: Array<{
      clave: string;
      nombre: string;
      creditos: number;
    }>;
    canvasIcalUrl: string;
  };
}

export async function setup(): Promise<SetupResult> {
  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!supabaseUrl) {
    throw new Error(
      "Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL",
    );
  }

  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const anonKey =
    process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!anonKey) {
    throw new Error(
      "Missing SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Generate a fresh random password each run so signInWithPassword always works
  // even when the user already existed with an unknown prior password.
  const password = randomBytes(20).toString("hex");

  let userId: string;

  const { data: created, error: createErr } =
    await admin.auth.admin.createUser({
      email: TEST_EMAIL,
      password,
      email_confirm: true,
    });

  if (createErr) {
    // 422 = "User already registered". Any other status is a real error.
    if (createErr.status !== 422) {
      throw new Error(`createUser failed (${createErr.status}): ${createErr.message}`);
    }

    // Find the existing user by email via listUsers. In test environments the
    // user count is tiny so a single page is always sufficient.
    const { data: list, error: listErr } =
      await admin.auth.admin.listUsers({ perPage: 1000 });
    if (listErr) {
      throw new Error(`listUsers failed: ${listErr.message}`);
    }

    const existing = list.users.find((u) => u.email === TEST_EMAIL);
    if (!existing) {
      throw new Error(
        "User was reported as already registered but was not found in listUsers",
      );
    }
    userId = existing.id;

    // Reset to the new password so the sign-in below succeeds.
    const { error: updateErr } = await admin.auth.admin.updateUserById(
      userId,
      { password },
    );
    if (updateErr) {
      throw new Error(`updateUserById failed: ${updateErr.message}`);
    }
  } else {
    userId = created.user.id;
  }

  // Upsert profile row with data from the test fixture.
  const fixture = readFixture();
  const profileRow = {
    id: userId,
    nombre: fixture.name,
    matricula: "A01783438",
    carrera_clave: fixture.carrera,
    modelo: "tec21",
    semestre: fixture.semestre,
    materias: fixture.materias.map((m, i) => ({
      clave: m.clave,
      nombre: m.nombre,
      creditos: m.creditos,
      prioridad: i + 1,
    })),
    canvas_ical_url: fixture.canvasIcalUrl,
  };

  const { error: profileErr } = await admin
    .from("profiles")
    .upsert(profileRow, { onConflict: "id" });

  if (profileErr) {
    throw new Error(`profiles upsert failed: ${profileErr.message}`);
  }

  // Sign in with the anon client to obtain a real user-scoped JWT. The service
  // role key cannot produce user JWTs via signInWithPassword.
  const anon = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: signIn, error: signInErr } =
    await anon.auth.signInWithPassword({ email: TEST_EMAIL, password });

  if (signInErr || !signIn.session) {
    throw new Error(
      `signInWithPassword failed: ${signInErr?.message ?? "no session returned"}`,
    );
  }

  return { userId, jwt: signIn.session.access_token };
}
