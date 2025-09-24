import prisma from "@/lib/db/connection"

export const CommentService = {
    // 🔹 Listar comentários de uma task
    async listByTask(taskId: string) {
        return prisma.comment.findMany({
            where: { taskId },
            include: {
                author: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: "asc" },
        })
    },

    // 🔹 Buscar comentário por ID
    async getById(id: string) {
        return prisma.comment.findUnique({
            where: { id },
            include: {
                author: { select: { id: true, name: true, email: true } },
            },
        })
    },

    // 🔹 Criar comentário
    async create(data: { content: string; taskId: string; authorId: string }) {
        // garante que o autor existe
        const user = await prisma.user.findUnique({
            where: { id: data.authorId },
            select: { id: true },
        })

        if (!user) {
            throw new Error("Autor inválido")
        }

        return prisma.comment.create({
            data,
            include: {
                author: { select: { id: true, name: true, email: true } },
            },
        })
    },

    // 🔹 Atualizar comentário
    async update(id: string, data: { content: string }) {
        return prisma.comment.update({
            where: { id },
            data,
            include: {
                author: { select: { id: true, name: true, email: true } },
            },
        })
    },

    // 🔹 Remover comentário
    async remove(id: string) {
        return prisma.comment.delete({
            where: { id },
        })
    },
}
