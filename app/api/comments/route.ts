import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/withAuth"
import { CommentService } from "@/lib/data/comments"

// 🔹 GET /api/comments?taskId=...
export const GET = withAuth(async (_user, req) => {
    try {
        const { searchParams } = new URL(req.url)
        const taskId = searchParams.get("taskId")

        if (!taskId) {
            return NextResponse.json({ success: false, message: "taskId é obrigatório" }, { status: 400 })
        }

        const comments = await CommentService.listByTask(taskId)
        return NextResponse.json({ success: true, data: comments })
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 })
    }
})

// 🔹 POST /api/comments
export const POST = withAuth(async (user, req) => {
    try {
        const body = await req.json()
        if (!body.taskId || !body.content) {
            return NextResponse.json({ success: false, message: "taskId e content são obrigatórios" }, { status: 400 })
        }

        const comment = await CommentService.create({
            taskId: body.taskId,
            content: body.content,
            authorId: user.id, // 👈 sempre pega do usuário logado
        })

        return NextResponse.json({ success: true, data: comment }, { status: 201 })
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 })
    }
})
