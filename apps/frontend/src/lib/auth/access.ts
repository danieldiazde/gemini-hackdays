import type { User } from "@supabase/supabase-js";

export function getAllowedUserEmails(): Set<string> | null {
  const raw = process.env.ALLOWED_USER_EMAILS;
  if (!raw?.trim()) return null;

  const emails = raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return emails.length > 0 ? new Set(emails) : null;
}

export function isUserAllowed(user: Pick<User, "email"> | null): boolean {
  const allowedEmails = getAllowedUserEmails();
  if (!allowedEmails) return true;
  if (!user?.email) return false;

  return allowedEmails.has(user.email.toLowerCase());
}
