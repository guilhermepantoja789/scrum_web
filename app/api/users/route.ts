// /api/users/route.ts

import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/withAuth"
import { UserService } from "@/lib/data/users"
import bcrypt from "bcryptjs" // ✅ Importa o bcrypt

// 🔹 GET /api/users → lista todos os usuários (sem alterações necessárias)
export const GET = withAuth(async (_user, _req) => {
    try {
        const users = await UserService.list()
        return NextResponse.json({ success: true, data: users })
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 })
    }
}, { permission: "users:read" }) // Exemplo de como usar a nova permissão

// 🔹 POST /api/users → cria um novo usuário
export const POST = withAuth(async (_user, req) => {
    try {
        const body = await req.json()
        if (!body.email || !body.password || !body.roleId) {
            return NextResponse.json(
                { success: false, message: "Email, senha e função são obrigatórios" },
                { status: 400 }
            )
        }

        const hashedPassword = await bcrypt.hash(body.password, 10)

        const user = await UserService.create({
            name: body.name,
            email: body.email,
            password: hashedPassword,
            roleId: body.roleId,
        })

        return NextResponse.json({ success: true, data: user }, { status: 201 })
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 })
    }
}, { permission: "users:create" }) // Exemplo de como usar a nova permissão