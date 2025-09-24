import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/withAuth"
import { SprintService } from "@/lib/data/sprints"

export const GET = withAuth(async (_user, _req, context) => {
    try {
        const sprintId = context?.params?.id
        if (!sprintId) {
            return NextResponse.json({ success: false, message: "Parâmetro id é obrigatório" }, { status: 400 })
        }

        const sprint = await SprintService.getById(sprintId)
        if (!sprint) {
            return NextResponse.json({ success: false, message: "Sprint não encontrado" }, { status: 404 })
        }
        return NextResponse.json({ success: true, data: sprint })
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 })
    }
})

export const PUT = withAuth(async (_user, req, context) => {
    try {
        const sprintId = context?.params?.id
        if (!sprintId) {
            return NextResponse.json({ success: false, message: "Parâmetro id é obrigatório" }, { status: 400 })
        }

        const body = await req.json()
        const sprint = await SprintService.update(sprintId, body)
        return NextResponse.json({ success: true, data: sprint })
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 })
    }
})

export const DELETE = withAuth(async (_user, _req, context) => {
    try {
        const sprintId = context?.params?.id
        if (!sprintId) {
            return NextResponse.json({ success: false, message: "Parâmetro id é obrigatório" }, { status: 400 })
        }

        await SprintService.remove(sprintId)
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 })
    }
})

