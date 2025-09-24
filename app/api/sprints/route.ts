// Local: app/api/sprints/route.ts (arquivo que você enviou como route (1).ts)

import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/withAuth"
import { SprintService } from "@/lib/data/sprints"

// 🔹 GET /api/sprints OU /api/sprints?projectId=...
export const GET = withAuth(async (user, req) => {
    try {
        const { searchParams } = new URL(req.url)
        const projectId = searchParams.get("projectId")

        let sprints;

        // Se um projectId for fornecido, busca por projeto
        if (projectId) {
            sprints = await SprintService.listByProject(projectId)
        } else {
            // Se nenhum projectId for fornecido, busca todas as sprints do usuário
            sprints = await SprintService.listByUser(user.id)
        }

        return NextResponse.json({ success: true, data: sprints })
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 })
    }
})

// 🔹 POST /api/sprints (permanece igual)
export const POST = withAuth(async (user, req) => {
    try {
        const body = await req.json()
        const sprint = await SprintService.create({
            name: body.name,
            startDate: body.startDate ? new Date(body.startDate) : undefined,
            endDate: body.endDate ? new Date(body.endDate) : undefined,
            projectId: body.projectId,
            userId: body.userId ?? user.id,
        })
        return NextResponse.json({ success: true, data: sprint }, { status: 201 })
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 })
    }
})