import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/withAuth"
import { SubtaskService } from "@/lib/data/subtasks"

// 🔹 GET /api/subtasks?taskId=...
export const GET = withAuth(async (_user, req) => {
    try {
        const { searchParams } = new URL(req.url)
        const taskId = searchParams.get("taskId")

        if (!taskId) {
            return NextResponse.json({ success: false, message: "taskId é obrigatório" }, { status: 400 })
        }

        const subtasks = await SubtaskService.listByTask(taskId)
        return NextResponse.json({ success: true, data: subtasks })
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 })
    }
})

// 🔹 POST /api/subtasks
export const POST = withAuth(async (_user, req) => {
    try {
        const body = await req.json()

        if (!body.taskId || !body.title) {
            return NextResponse.json(
                { success: false, message: "taskId e title são obrigatórios" },
                { status: 400 }
            )
        }

        const subtask = await SubtaskService.create({
            taskId: body.taskId,
            title: body.title,
        })

        return NextResponse.json({ success: true, data: subtask }, { status: 201 })
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 })
    }
})
