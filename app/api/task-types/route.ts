// Local: app/api/task-types/route.ts

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/withAuth";
import { TaskTypeService } from "@/lib/data/task-types";

export const GET = withAuth(async () => {
    try {
        const taskTypes = await TaskTypeService.list();
        return NextResponse.json({ success: true, data: taskTypes });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
});

export const POST = withAuth(async (user, req) => {
    try {
        const body = await req.json();
        const newType = await TaskTypeService.create(body);
        return NextResponse.json({ success: true, data: newType }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}, { permission: "admin:manage" }); // Protegido por permissão