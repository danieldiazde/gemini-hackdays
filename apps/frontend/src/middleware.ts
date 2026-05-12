import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { isUserAllowed } from "@/lib/auth/access";

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const pathname = request.nextUrl.pathname;
  const isDemoPage =
    pathname === "/dashboard" && request.nextUrl.searchParams.get("demo") === "1";
  const isProtectedPage =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/onboarding" ||
    pathname.startsWith("/onboarding/");

  // Allow local UI work without Supabase credentials.
  if (!url || !anonKey) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtectedPage && !isDemoPage) {
    return NextResponse.redirect(new URL("/?error=auth_required", request.url));
  }

  if (user && !isDemoPage && !isUserAllowed(user)) {
    await supabase.auth.signOut();

    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 },
      );
    }

    return NextResponse.redirect(new URL("/?error=access_denied", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)",
  ],
};
