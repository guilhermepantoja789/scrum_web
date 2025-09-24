// Local do arquivo: /api/reports/team/route.ts

import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/withAuth"
import { ReportService } from "@/lib/data/reports"

export const GET = withAuth(async (user, req) => {
    try {
        const { searchParams } = new URL(req.url)
        const projectId = searchParams.get("projectId")

        let data;

        if (projectId) {
            // Lógica antiga: busca dados de desempenho de um projeto específico.
            data = await ReportService.userPerformance(projectId);
        } else {
            // Nova lógica: busca dados agregados de desempenho da equipe em todos os projetos.
            data = await ReportService.getAggregatedTeamPerformance(user.id);
        }

        return NextResponse.json({ success: true, data: data });
    } catch (err: any) {
        return NextResponse.json(
            { success: false, message: err.message },
            { status: 500 }
        );
    }
});