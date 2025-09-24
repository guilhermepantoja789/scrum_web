// Local: app/api/tasks/[id]/comments/route.ts

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/withAuth";
import prisma from "@/lib/db/connection";

// POST /api/tasks/{taskId}/comments -> Cria um novo comentário
export const POST = withAuth(async (user, req, { params }) => {
    try {
        const taskId = params?.id;
        if (!taskId) {
            return NextResponse.json({ success: false, message: "ID da tarefa é obrigatório." }, { status: 400 });
        }

        const body = await req.json();
        const { content } = body;
        if (!content) {
            return NextResponse.json({ success: false, message: "O conteúdo do comentário é obrigatório." }, { status: 400 });
        }

        // TODO: Adicionar verificação se o usuário tem permissão para comentar nesta tarefa (se ele pertence ao projeto)

        const newComment = await prisma.comment.create({
            data: {
                content,
                taskId,
                authorId: user.id, // O autor é o usuário autenticado
            },
            include: {
                author: { select: { name: true, email: true } }
            }
        });

        return NextResponse.json({ success: true, data: newComment }, { status: 201 });

    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
});