import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/withAuth"
import { TaskService } from "@/lib/data/tasks" //

// Rota GET para buscar uma tarefa
export const GET = withAuth(async (_user, _req, { params }) => {
    try {
        const id = params?.id
        if (!id) {
            return NextResponse.json({ success: false, message: "ID da tarefa é obrigatório" }, { status: 400 })
        }
        const task = await TaskService.getById(id) // Válido conforme tasks.ts
        if (!task) {
            return NextResponse.json({ success: false, message: "Tarefa não encontrada" }, { status: 404 })
        }
        return NextResponse.json({ success: true, data: task })
    } catch (err: any) {
        console.error("[API_ERROR] GET /api/tasks/[id]:", err)
        return NextResponse.json({ success: false, message: "Erro ao buscar tarefa" }, { status: 500 })
    }
})

// Rota PUT para atualizar uma tarefa
export const PUT = withAuth(async (_user, req, { params }) => {
    try {
        const id = params?.id
        if (!id) {
            return NextResponse.json({ success: false, message: "ID da tarefa é obrigatório" }, { status: 400 })
        }

        const body = await req.json()

        // 👇 CORREÇÃO APLICADA AQUI
        // Se sprintId for uma string vazia, converta para null.
        if (body.sprintId === '') {
            body.sprintId = null
        }

        // Faça o mesmo para outros IDs opcionais como boa prática.
        if (body.assigneeId === '') {
            body.assigneeId = null
        }

        const updatedTask = await TaskService.update(id, body)

        return NextResponse.json({ success: true, data: updatedTask })
    } catch (err: any) {
        console.error(`[API_ERROR] PUT /api/tasks/${params?.id}:`, err.message)
        return NextResponse.json({ success: false, message: err.message || "Erro ao atualizar tarefa" }, { status: 500 })
    }
})

// Rota DELETE para remover uma tarefa
export const DELETE = withAuth(async (_user, _req, { params }) => {
    try {
        const id = params?.id
        if (!id) {
            return NextResponse.json({ success: false, message: "ID da tarefa é obrigatório" }, { status: 400 })
        }
        await TaskService.remove(id) // Válido conforme tasks.ts
        return NextResponse.json({ success: true, message: "Tarefa removida" })
    } catch (err: any) {
        console.error(`[API_ERROR] DELETE /api/tasks/${params?.id}:`, err)
        return NextResponse.json({ success: false, message: "Erro ao remover tarefa" }, { status: 500 })
    }
})