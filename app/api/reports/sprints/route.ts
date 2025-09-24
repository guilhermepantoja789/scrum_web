// Local do arquivo: /api/reports/sprints/route.ts

import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/withAuth"
import { ReportService } from "@/lib/data/reports"

export const GET = withAuth(async (user, req) => {
    try {
        const { searchParams } = new URL(req.url)
        const projectId = searchParams.get("projectId")

        let data;

        if (projectId) {
            // Lógica antiga: busca dados de um projeto específico.
            // Assumindo que sua função original se chama sprintProgress
            data = await ReportService.sprintProgress(projectId);
        } else {
            // Nova lógica: busca dados agregados de todos os projetos do usuário.
            data = await ReportService.getAggregatedSprints(user.id);
        }

        return NextResponse.json({ success: true, data: data });
    } catch (err: any) {
        return NextResponse.json(
            { success: false, message: err.message },
            { status: 500 }
        );
    }
});