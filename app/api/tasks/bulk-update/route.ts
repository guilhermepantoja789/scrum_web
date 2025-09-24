// Local: app/api/tasks/bulk-update/route.ts

import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/withAuth"
import prisma from "@/lib/db/connection"

// Rota para atualizar várias tarefas de uma vez (ex: mover para sprint)
export const PATCH = withAuth(async (user, req) => {
    try {
        const body = await req.json();
        const { taskIds, sprintId } = body;

        if (!Array.isArray(taskIds) || taskIds.length === 0) {
            return NextResponse.json({ success: false, message: "A lista de 'taskIds' é obrigatória." }, { status: 400 });
        }

        await prisma.task.updateMany({
            where: {
                id: {
                    in: taskIds,
                },
                // Opcional: garantir que o usuário só possa mover tarefas do projeto certo
                project: { memberships: { some: { userId: user.id } } }
            },
            data: {
                sprintId: sprintId, // Pode ser um ID de sprint ou `null` para mover para o backlog
            },
        });

        return NextResponse.json({ success: true, message: "Tarefas atualizadas com sucesso." });

    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
});