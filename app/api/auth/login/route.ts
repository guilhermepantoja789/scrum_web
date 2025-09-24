import { NextRequest } from "next/server"
import prisma from "@/lib/db/connection"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { success, error } from "@/lib/api/response"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json()

        // ✅ Inclui os dados da role do usuário na consulta
        const user = await prisma.user.findUnique({
            where: { email },
            include: { role: true },
        })
        if (!user) return error("Usuário não encontrado", 404)

        const valid = await bcrypt.compare(password, user.password)
        if (!valid) return error("Senha incorreta", 401)

        // ✅ O payload do token agora inclui o objeto 'role' completo
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET!,
            { expiresIn: "7d" }
        )

        // remove a senha antes de devolver
        const { password: _, ...userSafe } = user

        cookies().set("token", token, { /* ...opções do cookie... */ })

        return success({ token, user: userSafe }, "Login bem-sucedido")
    } catch (err: any) {
        return error("Erro interno: " + err.message, 500)
    }
}