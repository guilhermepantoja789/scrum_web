import prisma from "@/lib/db/connection";
import type { Prisma, TaskStatus, TaskPriority } from "@prisma/client";

// Tipos para os filtros que a API vai receber
type TaskFilters = {
    searchQuery?: string;
    projectId?: string;
    sprintId?: string | null;
    assigneeId?: string | null;
    typeId?: string | null;
    status?: TaskStatus;
    priority?: TaskPriority;
    userId: string; // ID do usuário logado para garantir permissão
};

export const TaskService = {
    // 👇 NOVA FUNÇÃO PARA FILTRAGEM AVANÇADA 👇
    async list(filters: TaskFilters) {
        const { searchQuery, projectId, sprintId, assigneeId, typeId, status, priority, userId } = filters;

        // Cláusula 'where' principal para garantir que o usuário só veja tarefas de projetos aos quais pertence
        const where: Prisma.TaskWhereInput = {
            project: {
                OR: [
                    { ownerId: userId },
                    { memberships: { some: { userId } } }
                ]
            }
        };

        // Adiciona filtros dinamicamente
        if (searchQuery) {
            where.OR = [
                { title: { contains: searchQuery, mode: 'insensitive' } },
                { description: { contains: searchQuery, mode: 'insensitive' } },
            ];
        }
        if (projectId) where.projectId = projectId;
        if (sprintId) where.sprintId = sprintId === 'backlog' ? null : sprintId;
        if (assigneeId) where.assigneeId = assigneeId === 'unassigned' ? null : assigneeId;
        if (typeId) where.typeId = typeId === 'none' ? null : typeId;
        if (status) where.status = status;
        if (priority) where.priority = priority;

        return prisma.task.findMany({
            where,
            include: { // Inclui todos os dados necessários para o TaskCard
                project: { select: { name: true } },
                assignee: { select: { id: true, name: true, email: true } },
                sprint: { select: { id: true, name: true } },
                type: true,
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    },

    // 🔹 Listar tasks de um projeto (função original mantida)
    async listByProject(projectId: string) {
        return prisma.task.findMany({
            where: { projectId },
            include: {
                assignee: { select: { id: true, name: true, email: true } },
                sprint: true,
                comments: { include: { author: { select: { id: true, name: true, email: true } } } },
                subtasks: true,
                attachments: true,
                type: true,
            },
        })
    },

    // 🔹 Buscar task por ID (função original mantida)
    async getById(id: string) {
        return prisma.task.findUnique({
            where: { id },
            include: {
                project: {
                    include: {
                        owner: { select: { id: true, name: true, email: true } },
                        memberships: {
                            include: { user: { select: { id: true, name: true, email: true } } },
                        },
                    },
                },
                assignee: { select: { id: true, name: true, email: true } },
                sprint: true,
                comments: {
                    include: {
                        author: { select: { id: true, name: true, email: true } },
                    },
                },
                subtasks: true,
                attachments: true,
                type: true,
            },
        })
    },

    // 🔹 Criar task (função original mantida e ajustada)
    async create(data: {
        title: string
        description?: string | null
        status?: TaskStatus
        priority?: TaskPriority
        storyPoints?: number
        dueDate?: Date
        projectId: string
        sprintId?: string | null
        assigneeId?: string | null
        typeId?: string | null
    }) {
        if (data.assigneeId) {
            const membership = await prisma.projectMember.findUnique({
                where: { userId_projectId: { userId: data.assigneeId, projectId: data.projectId } },
            })
            if (!membership) throw new Error("Usuário não é membro do projeto")
        }

        return prisma.task.create({
            data,
            include: { assignee: { select: { id: true, name: true, email: true } } },
        })
    },

    // 🔹 Atualizar task (função original mantida)
    async update(
        id: string,
        data: Partial<{
            title: string; description: string | null; status: TaskStatus;
            priority: TaskPriority; storyPoints: number; dueDate: Date | string | null;
            sprintId: string | null; assigneeId: string | null; typeId: string | null;
        }>
    ) {
        // Lógica para converter string de data para objeto Date, se necessário
        if (typeof data.dueDate === 'string') {
            data.dueDate = new Date(data.dueDate);
        }

        if (data.assigneeId) {
            const task = await prisma.task.findUnique({
                where: { id },
                select: { projectId: true },
            })
            if (!task) throw new Error("Task não encontrada")

            const membership = await prisma.projectMember.findUnique({
                where: { userId_projectId: { userId: data.assigneeId, projectId: task.projectId } },
            })
            if (!membership) throw new Error("Usuário não é membro do projeto")
        }

        return prisma.task.update({
            where: { id },
            data,
            include: { assignee: { select: { id: true, name: true, email: true } } },
        })
    },

    // 🔹 Remover task (função original mantida)
    async remove(id: string) {
        return prisma.task.delete({
            where: { id },
        })
    },
}