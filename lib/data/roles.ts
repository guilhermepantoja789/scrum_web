import prisma from "@/lib/db/connection"

export const RoleService = {
    // Listar todas as roles
    async list() {
        return prisma.role.findMany()
    },

    // Criar role
    async create(data: { name: string; description?: string; permissions: string[] }) {
        return prisma.role.create({ data })
    },

    // Atualizar role
    async update(id: string, data: Partial<{ name: string; description: string; permissions: string[] }>) {
        return prisma.role.update({ where: { id }, data })
    },

    // Remover role
    async remove(id: string) {
        return prisma.role.delete({ where: { id } })
    },
}