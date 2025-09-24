import { NextResponse } from "next/server"
import { success } from "@/lib/api/response"
import { cookies } from "next/headers"

export async function POST() {
    // 🔹 remove o cookie `token`
    cookies().set("token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0, // expira imediatamente
    })

    return success(null, "Logout bem-sucedido")
}
