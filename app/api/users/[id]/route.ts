import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/withAuth"
import { UserService } from "@/lib/data/users"

export const GET = withAuth(async (_user, _req, context) => {
    try {
        const userId = context?.params?.id
        if (!userId) {
            return NextResponse.json({ success: false, message: "id é obrigatório" }, { status: 400 })
        }

        const user = await UserService.getById(userId)
        if (!user) {
            return NextResponse.json({ success: false, message: "Usuário não encontrado" }, { status: 404 })
        }

        return NextResponse.json({ success: true, data: user })
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 })
    }
})

export const PUT = withAuth(async (_user, req, context) => {
    try {
        const userId = context?.params?.id
        if (!userId) {
            return NextResponse.json({ success: false, message: "id é obrigatório" }, { status: 400 })
        }

        const body = await req.json()
        const user = await UserService.update(userId, body)

        return NextResponse.json({ success: true, data: user })
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 })
    }
})

export const DELETE = withAuth(async (_user, _req, context) => {
    try {
        const userId = context?.params?.id
        if (!userId) {
            return NextResponse.json({ success: false, message: "id é obrigatório" }, { status: 400 })
        }

        await UserService.remove(userId)
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 })
    }
})
