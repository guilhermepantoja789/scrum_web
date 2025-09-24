import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/withAuth"
import { TaskService } from "@/lib/data/tasks"
import {TaskPriority, TaskStatus} from "@prisma/client";

// 🔹 GET /api/tasks?projectId=...
export const GET = withAuth(async (user, req) => {
    try {
        const { searchParams } = new URL(req.url);

        const filters = {
            userId: user.id,
            searchQuery: searchParams.get("searchQuery") || undefined,
            projectId: searchParams.get("projectId") || undefined,
            sprintId: searchParams.get("sprintId") || undefined,
            assigneeId: searchParams.get("assigneeId") || undefined,
            typeId: searchParams.get("typeId") || undefined,
            status: searchParams.get("status") as TaskStatus || undefined,
            priority: searchParams.get("priority") as TaskPriority || undefined,
        };

        const tasks = await TaskService.list(filters);

        // Mapeia para o formato DTO que o frontend espera (se necessário, ou ajuste o DTO)
        // Por simplicidade aqui, vamos assumir que o frontend pode lidar com o retorno direto
        // Idealmente, você usaria as funções `mapTask` do seu `projects.ts` aqui.

        return NextResponse.json({ success: true, data: tasks });

    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
});


// 🔹 POST /api/tasks
export const POST = withAuth(async (user, req) => {
    try {
        const body = await req.json()
        const task = await TaskService.create({
            title: body.title,
            description: body.description,
            status: body.status,
            priority: body.priority,
            storyPoints: body.storyPoints,
            dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
            projectId: body.projectId,
            sprintId: body.sprintId || undefined,
            assigneeId: body.assigneeId || undefined,
        })
        return NextResponse.json({ success: true, data: task }, { status: 201 })
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 })
    }
})
