import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/withAuth"
import { ProjectService } from "@/lib/data/projects"

export const DELETE = withAuth(async (_user, _req, { params }) => {
    try {
        const projectId = params?.id
        const userId = params?.userId

        if (!projectId || !userId) {
            return NextResponse.json({ success: false, message: "ID do projeto e do usuário são obrigatórios" }, { status: 400 })
        }

        // Usando o service que já criamos
        await ProjectService.removeMember(projectId, userId);

        return NextResponse.json({ success: true, message: "Membro removido com sucesso." });

    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}, { permission: "project:manage_members" });