// Local: app/api/task-types/[id]/route.ts

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/withAuth";
import { TaskTypeService } from "@/lib/data/task-types";

export const PUT = withAuth(async (user, req, { params }) => {
    try {
        const id = params?.id;
        const body = await req.json();
        const updatedType = await TaskTypeService.update(id!, body);
        return NextResponse.json({ success: true, data: updatedType });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}, { permission: "admin:manage" });

export const DELETE = withAuth(async (user, req, { params }) => {
    try {
        const id = params?.id;
        await TaskTypeService.remove(id!);
        return NextResponse.json({ success: true, message: "Tipo de tarefa excluído." });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}, { permission: "admin:manage" });