import prisma from "@/lib/db/connection"

export const UserService = {
    // 🔹 Listar todos os usuários
    async list() {
        return prisma.user.findMany({
            include: {
                role: true,
                projectMemberships: {
                    include: {
                        project: { select: { id: true, name: true, status: true } },
                        role: true,
                    },
                },
            },
        })
    },

    // 🔹 Buscar por ID
    async getById(id: string) {
        return prisma.user.findUnique({
            where: { id },
            include: {
                role: true,
                projectMemberships: {
                    include: {
                        project: { select: { id: true, name: true, status: true } },
                        role: true,
                    },
                },
            },
        })
    },
    // 🔹 Buscar por email
    async getByEmail(email: string) {
        return prisma.user.findUnique({
            where: { email },
            include: {
                projectMemberships: {
                    include: {
                        project: { select: { id: true, name: true, status: true } },
                    },
                },
            },
        })
    },

    // 🔹 Criar usuário
    async create(data: { name?: string; email: string; password: string; roleId: string }) {
        return prisma.user.create({
            data,
            include: {
                role: true,
                projectMemberships: {
                    include: { project: { select: { id: true, name: true, status: true } }, role: true },
                },
            },
        })
    },

    async update(
        id: string,
        data: Partial<{ name: string; email: string; password: string; roleId: string }>
    ) {
        return prisma.user.update({
            where: { id },
            data,
            include: {
                role: true,
                projectMemberships: {
                    include: { project: { select: { id: true, name: true, status: true } }, role: true },
                },
            },
        })
    },

    async remove(id: string) {
        return prisma.user.delete({
            where: { id },
        })
    },
}
