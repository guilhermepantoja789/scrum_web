import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/withAuth"
import { SubtaskService } from "@/lib/data/subtasks"

export const PUT = withAuth(async (_user, req, context) => {
    try {
        const subtaskId = context?.params?.id
        if (!subtaskId) {
            return NextResponse.json({ success: false, message: "id é obrigatório" }, { status: 400 })
        }

        const body = await req.json()
        const updated = await SubtaskService.update(subtaskId, body)

        return NextResponse.json({ success: true, data: updated })
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 })
    }
})

export const DELETE = withAuth(async (_user, _req, context) => {
    try {
        const subtaskId = context?.params?.id
        if (!subtaskId) {
            return NextResponse.json({ success: false, message: "id é obrigatório" }, { status: 400 })
        }

        await SubtaskService.remove(subtaskId)
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 })
    }
})
