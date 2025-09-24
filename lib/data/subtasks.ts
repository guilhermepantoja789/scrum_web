import prisma from "@/lib/db/connection"

export const SubtaskService = {
    // 🔹 Listar subtasks de uma task
    async listByTask(taskId: string) {
        return prisma.subtask.findMany({
            where: { taskId },
            orderBy: { createdAt: "asc" },
        })
    },

    // 🔹 Criar subtask
    async create(data: { title: string; taskId: string }) {
        return prisma.subtask.create({
            data,
        })
    },

    // 🔹 Atualizar subtask
    async update(id: string, data: Partial<{ title: string; completed: boolean }>) {
        return prisma.subtask.update({
            where: { id },
            data,
        })
    },

    // 🔹 Remover subtask
    async remove(id: string) {
        return prisma.subtask.delete({
            where: { id },
        })
    },
}
