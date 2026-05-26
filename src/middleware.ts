import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/auth/callback",
  "/auth/reset-password",
];

const ONBOARDING_SKIP = ["/onboarding", "/api/", "/auth/"];

function needsOnboardingCheck(pathname: string): boolean {
  if (ONBOARDING_SKIP.some((p) => pathname.startsWith(p))) return false;
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return false;
  return true;
}

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!user && !isPublic && pathname !== "/") {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("company_name, owner_name")
      .eq("id", user.id)
      .maybeSingle();

    const complete =
      Boolean(profile?.company_name?.trim()) &&
      Boolean(profile?.owner_name?.trim());

    if (pathname === "/onboarding" && complete) {
      const dash = request.nextUrl.clone();
      dash.pathname = "/dashboard";
      return NextResponse.redirect(dash);
    }

    if (
      needsOnboardingCheck(pathname) &&
      !complete
    ) {
      const onboarding = request.nextUrl.clone();
      onboarding.pathname = "/onboarding";
      return NextResponse.redirect(onboarding);
    }

    if (
      pathname === "/login" ||
      pathname === "/register" ||
      pathname === "/forgot-password"
    ) {
      const target = request.nextUrl.clone();
      target.pathname = complete ? "/dashboard" : "/onboarding";
      return NextResponse.redirect(target);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
