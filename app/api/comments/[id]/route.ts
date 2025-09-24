import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/withAuth"
import { CommentService } from "@/lib/data/comments"

export const PUT = withAuth(async (user, req, context) => {
    try {
        const commentId = context?.params?.id
        if (!commentId) {
            return NextResponse.json({ success: false, message: "id é obrigatório" }, { status: 400 })
        }

        const body = await req.json()
        if (!body.content) {
            return NextResponse.json({ success: false, message: "content é obrigatório" }, { status: 400 })
        }

        // opcional: validar se o usuário é o autor do comentário
        const existing = await CommentService.getById?.(commentId)
        if (existing && existing.authorId !== user.id && user.role.name !== "admin") {
            return NextResponse.json({ success: false, message: "Você não pode editar este comentário" }, { status: 403 })
        }

        const updated = await CommentService.update(commentId, { content: body.content })
        return NextResponse.json({ success: true, data: updated })
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 })
    }
})

export const DELETE = withAuth(async (user, _req, context) => {
    try {
        const commentId = context?.params?.id
        if (!commentId) {
            return NextResponse.json({ success: false, message: "id é obrigatório" }, { status: 400 })
        }

        // opcional: validar se o usuário é o autor do comentário
        const existing = await CommentService.getById?.(commentId)
        if (existing && existing.authorId !== user.id && user.role.name !== "admin") {
            return NextResponse.json({ success: false, message: "Você não pode excluir este comentário" }, { status: 403 })
        }

        await CommentService.remove(commentId)
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 })
    }
})
