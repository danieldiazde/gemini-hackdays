export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}. Set it in apps/frontend/.env.local.`,
    );
  }
  return value;
}

export function publicEnv(name: `NEXT_PUBLIC_${string}`): string | undefined {
  return process.env[name];
}
