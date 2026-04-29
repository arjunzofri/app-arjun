import { auth } from "./lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/", "/productos", "/entradas", "/salidas", "/usuarios"]
const authRoutes = ["/login"]
const publicRoutes = ["/setup", "/api/setup"]

export async function middleware(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + "/")
  )
  const isAuthRoute = authRoutes.includes(pathname)
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  if (isPublicRoute) return NextResponse.next()

  if (!session && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
