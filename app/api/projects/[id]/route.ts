import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/withAuth"
import { ProjectService } from "@/lib/data/projects" //

export const GET = withAuth(async (_user, _req, { params }) => {
    try {
        const id = params?.id
        if (!id) {
            return NextResponse.json({ success: false, message: "ID do projeto é obrigatório" }, { status: 400 })
        }
        const project = await ProjectService.getById(id) // Válido conforme projects.ts
        if (!project) return NextResponse.json({ success: false, message: "Projeto não encontrado" }, { status: 404 })
        return NextResponse.json({ success: true, data: project })
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 })
    }
})

export const PUT = withAuth(async (_user, req, { params }) => {
    try {
        const id = params?.id
        if (!id) {
            return NextResponse.json({ success: false, message: "ID do projeto é obrigatório" }, { status: 400 })
        }
        const body = await req.json()
        const project = await ProjectService.update(id, body) // Válido conforme projects.ts
        return NextResponse.json({ success: true, data: project })
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 })
    }
})

export const DELETE = withAuth(async (_user, _req, { params }) => {
    try {
        const id = params?.id
        if (!id) {
            return NextResponse.json({ success: false, message: "ID do projeto é obrigatório" }, { status: 400 })
        }
        await ProjectService.remove(id) // Válido conforme projects.ts
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 })
    }
})