import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/withAuth"
import { ProjectService } from "@/lib/data/projects"

// 🔹 GET /api/projects → lista projetos do usuário autenticado
export const GET = withAuth(async (user) => {
    try {
        const projects = await ProjectService.listByUser(user.id)
        return NextResponse.json({ success: true, data: projects })
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 })
    }
})

// 🔹 POST /api/projects → cria novo projeto
export const POST = withAuth(async (user, req) => {
    try {
        const body = await req.json()

        if (!body.name) {
            return NextResponse.json(
                { success: false, message: "Nome do projeto é obrigatório" },
                { status: 400 }
            )
        }

        const project = await ProjectService.create({
            name: body.name,
            description: body.description,
            ownerId: user.id, // o criador é o dono
        })

        return NextResponse.json({ success: true, data: project }, { status: 201 })
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 })
    }
})
