import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/withAuth"
import { ReportService } from "@/lib/data/reports"

// GET /api/reports/overview?projectId=...
export const GET = withAuth(async (user, req) => {
    try {
        const { searchParams } = new URL(req.url)
        const projectId = searchParams.get("projectId")

        let data;

        if (projectId) {
            // Se um projectId for fornecido, usa a função antiga
            data = await ReportService.projectSummary(projectId)
        } else {
            // Se NENHUM projectId for fornecido, usa a nova função de AGREGAÇÃO
            data = await ReportService.getAggregatedOverview(user.id)
        }

        return NextResponse.json({ success: true, data: data })
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 })
    }
})