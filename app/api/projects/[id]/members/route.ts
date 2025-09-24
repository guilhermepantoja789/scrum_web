import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/withAuth"
import { ProjectService } from "@/lib/data/projects"

export const POST = withAuth(async (_user, req, { params }) => {
    try {
        const projectId = params?.id
        if (!projectId) {
            return NextResponse.json({ success: false, message: "ID do projeto é obrigatório" }, { status: 400 })
        }

        const { userId, roleId } = await req.json();
        if (!userId || !roleId) {
            return NextResponse.json({ success: false, message: "userId e roleId são obrigatórios" }, { status: 400 });
        }

        // Usando o service que já criamos
        const newMember = await ProjectService.addMember(projectId, userId, roleId);

        return NextResponse.json({ success: true, data: newMember }, { status: 201 });

    } catch (err: any) {
        // Trata erro de membro já existente
        if (err.code === 'P2002') {
            return NextResponse.json({ success: false, message: "Este usuário já é membro do projeto." }, { status: 409 });
        }
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}, { permission: "project:manage_members" });


export const PUT = withAuth(async (_user, req, { params }) => {
    try {
        const projectId = params?.id
        if (!projectId) {
            return NextResponse.json({ success: false, message: "ID do projeto é obrigatório" }, { status: 400 })
        }

        const { userId, newRoleId } = await req.json();
        if (!userId || !newRoleId) {
            return NextResponse.json({ success: false, message: "userId e newRoleId são obrigatórios" }, { status: 400 });
        }

        const updatedMember = await ProjectService.updateMemberRole(projectId, userId, newRoleId);

        return NextResponse.json({ success: true, data: updatedMember });

    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}, { permission: "project:manage_members" }); // Protegido por permissão!