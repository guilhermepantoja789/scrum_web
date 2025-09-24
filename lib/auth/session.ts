import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import prisma from "@/lib/db/connection"

function getSecret() {
    return new TextEncoder().encode(process.env.JWT_SECRET!)
}

export async function getSessionUser() {
    try {
        const token = cookies().get("token")?.value
        if (!token) return null

        // verifica e decodifica
        const { payload } = await jwtVerify(token, getSecret())

        if (!payload || !payload.id) return null

        // carrega o usuário do banco
        const user = await prisma.user.findUnique({
            where: { id: payload.id as string },
            select: { id: true, email: true, name: true, role: true },
        })

        return user
    } catch (err) {
        console.error("Erro ao validar sessão:", err)
        return null
    }
}
