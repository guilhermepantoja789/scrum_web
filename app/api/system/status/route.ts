import { NextResponse } from "next/server"
import prisma from "@/lib/db/connection"

export async function GET() {
    try {
        // Primeiro, encontramos o ID da role 'Admin'
        const adminRole = await prisma.role.findUnique({
            where: { name: 'Admin' },
            select: { id: true }
        })

        // Se a role 'Admin' não existir (algo deu errado no seed), consideramos que não há admin
        if (!adminRole) {
            return NextResponse.json({ hasAdmin: false });
        }

        // Contamos quantos usuários têm essa role
        const adminCount = await prisma.user.count({
            where: { roleId: adminRole.id }
        })

        return NextResponse.json({ hasAdmin: adminCount > 0 });

    } catch (err: any) {
        console.error("[API_ERROR] /api/system/status:", err.message)
        // Em caso de erro, assumimos o pior cenário para forçar a verificação manual
        return NextResponse.json({ success: false, message: "Erro ao verificar o status do sistema" }, { status: 500 })
    }
}