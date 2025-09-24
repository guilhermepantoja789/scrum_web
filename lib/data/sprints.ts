import prisma from "@/lib/db/connection"

export const SprintService = {
    // 🔹 Listar todos os sprints de um projeto
    async listByProject(projectId: string) {
        return prisma.sprint.findMany({
            where: { projectId },
            include: {
                project: { select: { id: true, name: true } }, // Adicionado para consistência
                tasks: true,
            },
        })
    },

    // 👇 FUNÇÃO ADICIONADA
    // 🔹 Listar todos os sprints de um usuário (em todos os projetos)
    async listByUser(userId: string) {
        return prisma.sprint.findMany({
            where: {
                // Filtra por sprints cujo projeto tem o usuário como membro ou dono
                project: {
                    OR: [
                        { ownerId: userId },
                        { memberships: { some: { userId: userId } } }
                    ]
                }
            },
            include: {
                project: { // Inclui o nome do projeto, necessário para o frontend
                    select: {
                        id: true,
                        name: true
                    }
                },
                tasks: true // Inclui as tarefas de cada sprint
            },
            orderBy: {
                startDate: 'desc'
            }
        });
    },

    // 🔹 Buscar sprint por ID
    async getById(id: string) {
        return prisma.sprint.findUnique({
            where: { id },
            include: {
                project: { select: { id: true, name: true } },
                tasks: true,
            },
        })
    },

    // 🔹 Criar sprint
    async create(data: {
        name: string
        startDate?: Date
        endDate?: Date
        projectId: string
        userId: string // userId aqui é o criador/responsável, não necessariamente o logado
    }) {
        // valida se o usuário que está criando é membro do projeto
        const project = await prisma.project.findUnique({
            where: { id: data.projectId },
            include: { memberships: { where: { userId: data.userId } } }
        });

        if (!project || (project.ownerId !== data.userId && project.memberships.length === 0)) {
            throw new Error("Usuário não tem permissão para criar sprints neste projeto")
        }

        return prisma.sprint.create({
            data: {
                name: data.name,
                startDate: data.startDate,
                endDate: data.endDate,
                projectId: data.projectId,
                userId: data.userId // Associa a sprint a um usuário
            },
            include: {
                project: { select: { id: true, name: true } },
                tasks: true,
            },
        })
    },

    // 🔹 Atualizar sprint
    async update(
        id: string,
        data: Partial<{
            name: string
            startDate: Date
            endDate: Date
            userId: string // Para reatribuir a sprint
        }>
    ) {
        // Lógica de validação pode ser adicionada aqui se necessário
        return prisma.sprint.update({
            where: { id },
            data,
            include: {
                project: { select: { id: true, name: true } },
                tasks: true,
            },
        })
    },

    // 🔹 Remover sprint
    async remove(id: string) {
        // Opcional: Desassociar tarefas em vez de deletar junto com a sprint
        await prisma.task.updateMany({
            where: { sprintId: id },
            data: { sprintId: null } // Mover tarefas para o backlog
        });

        return prisma.sprint.delete({
            where: { id },
        })
    },
}