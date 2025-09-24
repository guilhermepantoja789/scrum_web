import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const publicPaths = ["/", "/api/auth/login", "/api/auth/register"]

// Converter a chave para Uint8Array
function getSecret() {
    return new TextEncoder().encode(process.env.JWT_SECRET!)
}

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl

    // Ignorar assets
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/static") ||
        pathname.startsWith("/favicon.ico") ||
        pathname.startsWith("/robots.txt")
    ) {
        return NextResponse.next()
    }

    // Páginas públicas
    if (publicPaths.includes(pathname)) {
        return NextResponse.next()
    }

    // Pegar token do cookie
    const token = req.cookies.get("token")?.value
    if (!token) {
        return NextResponse.redirect(new URL("/", req.url))
    }

    try {
        const { payload } = await jwtVerify(token, getSecret())
        return NextResponse.next()
    } catch (err: any) {
        return NextResponse.redirect(new URL("/", req.url))
    }
}
