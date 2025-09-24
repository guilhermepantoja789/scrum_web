// Local: lib/data/task-types.ts

import prisma from "@/lib/db/connection";
import type { TaskType } from "@prisma/client";

export const TaskTypeService = {
    async list() {
        return prisma.taskType.findMany({
            orderBy: { name: 'asc' }
        });
    },

    async getById(id: string) {
        return prisma.taskType.findUnique({
            where: { id }
        });
    },

    async create(data: Pick<TaskType, 'name' | 'icon' | 'color'>) {
        return prisma.taskType.create({
            data
        });
    },

    async update(id: string, data: Partial<Pick<TaskType, 'name' | 'icon' | 'color'>>) {
        return prisma.taskType.update({
            where: { id },
            data
        });
    },

    async remove(id: string) {
        // Opcional: Desassociar este tipo de todas as tarefas antes de deletar
        await prisma.task.updateMany({
            where: { typeId: id },
            data: { typeId: null }
        });

        return prisma.taskType.delete({
            where: { id }
        });
    }
};