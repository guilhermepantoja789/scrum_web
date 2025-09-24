import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/withAuth"
import { ReportService } from "@/lib/data/reports"
import { ProjectService } from "@/lib/data/projects"

// GET /api/reports/projects
export const GET = withAuth(async (user) => {
    try {
        // busca todos os projetos em que o usuário participa
        const projects = await ProjectService.listByUser(user.id)

        // monta resumo de cada projeto usando ReportService
        const summaries = await Promise.all(
            projects.map((p) => ReportService.projectSummary(p.id))
        )

        return NextResponse.json({ success: true, data: summaries })
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 })
    }
})
