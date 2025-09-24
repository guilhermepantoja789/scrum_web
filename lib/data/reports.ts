import prisma from "@/lib/db/connection"

// Uma função auxiliar para obter os IDs de projeto de um usuário
async function getProjectIdsByUser(userId: string): Promise<string[]> {
    const memberships = await prisma.projectMember.findMany({
        where: { userId },
        select: { projectId: true },
    })
    return memberships.map((m) => m.projectId)
}

// --- Funções de Agregação ---

/**
 * Agrega os dados da "Visão Geral" de todos os projetos de um usuário.
 */
async function getAggregatedOverview(userId: string) {
    const projectIds = await getProjectIdsByUser(userId);

    if (projectIds.length === 0) {
        return {
            stats: { totalTarefas: 0, tarefasConcluidas: 0, percentualConcluidas: 0, tempoMedioConclusao: 0 },
            velocity: 0
        };
    }

    // Busca todas as tarefas dos projetos do usuário
    const tasks = await prisma.task.findMany({
        where: { projectId: { in: projectIds } },
    });

    const sprints = await prisma.sprint.findMany({
        where: { projectId: { in: projectIds } },
        select: { storyPointsCompleted: true }
    });

    const totalTarefas = tasks.length;
    const tarefasConcluidas = tasks.filter((t) => t.status === 'done');
    const totalConcluidas = tarefasConcluidas.length;

    // Calcula o tempo médio de conclusão em dias
    let tempoMedioConclusao = 0;
    if (totalConcluidas > 0) {
        const totalTempoMs = tarefasConcluidas.reduce((acc, task) => {
            const tempoConclusao = task.updatedAt.getTime(); // 'updatedAt' é usado como data de conclusão
            const tempoCriacao = task.createdAt.getTime();
            return acc + (tempoConclusao - tempoCriacao);
        }, 0);
        const tempoMedioMs = totalTempoMs / totalConcluidas;
        tempoMedioConclusao = Math.round(tempoMedioMs / (1000 * 60 * 60 * 24)); // Converte para dias
    }

    const percentualConcluidas = totalTarefas > 0 ? Math.round((totalConcluidas / totalTarefas) * 100) : 0;

    // Calcula a velocidade total somando os pontos de todas as sprints
    const velocity = sprints.reduce((acc, sprint) => acc + (sprint.storyPointsCompleted || 0), 0);

    return {
        stats: {
            totalTarefas,
            tarefasConcluidas: totalConcluidas,
            percentualConcluidas,
            tempoMedioConclusao
        },
        velocity
    };
}


/**
 * Agrega os dados de "Sprints" de todos os projetos de um usuário.
 */
async function getAggregatedSprints(userId: string) {
    const projectIds = await getProjectIdsByUser(userId);

    if (projectIds.length === 0) {
        return { sprints: [] };
    }

    // 1. Busca todas as sprints dos projetos do usuário
    const sprints = await prisma.sprint.findMany({
        where: { projectId: { in: projectIds } },
        include: {
            project: {
                select: { name: true }
            }
        },
        orderBy: {
            endDate: 'desc'
        }
    });

    if (sprints.length === 0) {
        return { sprints: [] };
    }

    const sprintIds = sprints.map(s => s.id);

    // 2. Busca TODAS as tarefas de TODAS essas sprints em UMA ÚNICA query
    const tasks = await prisma.task.findMany({
        where: {
            sprintId: { in: sprintIds }
        },
        select: {
            sprintId: true,
            status: true,
        }
    });

    // 3. Agrupa as contagens em memória (muito mais rápido que consultar o banco N vezes)
    const taskCountsBySprintId = new Map<string, { total: number, concluidas: number }>();

    for (const task of tasks) {
        if (!task.sprintId) continue;

        if (!taskCountsBySprintId.has(task.sprintId)) {
            taskCountsBySprintId.set(task.sprintId, { total: 0, concluidas: 0 });
        }

        const counts = taskCountsBySprintId.get(task.sprintId)!;
        counts.total++;
        if (task.status === 'done') {
            counts.concluidas++;
        }
    }

    // 4. Monta a resposta final combinando os dados
    const result = sprints.map(sprint => {
        const counts = taskCountsBySprintId.get(sprint.id) || { total: 0, concluidas: 0 };
        return {
            id: sprint.id,
            nome: `${sprint.name} (${sprint.project.name})`,
            dataInicio: sprint.startDate,
            dataFim: sprint.endDate,
            totalTarefas: counts.total,
            tarefasConcluidas: counts.concluidas
        };
    });

    return { sprints: result };
}


/**
 * Agrega os dados de "Equipe" de todos os projetos de um usuário.
 */
async function getAggregatedTeamPerformance(userId: string) {
    const projectIds = await getProjectIdsByUser(userId);

    if (projectIds.length === 0) {
        return { teamPerformance: [] };
    }

    // Busca todos os membros únicos dos projetos
    const members = await prisma.user.findMany({
        where: {
            projectMemberships: {
                some: {
                    projectId: { in: projectIds }
                }
            }
        },
        select: { id: true, name: true }
    });

    // Para cada membro, busca as estatísticas de tarefas
    const performanceData = await Promise.all(
        members.map(async (member) => {
            const tasks = await prisma.task.findMany({
                where: {
                    assigneeId: member.id,
                    projectId: { in: projectIds }
                },
                select: { status: true }
            });

            const totalTarefas = tasks.length;
            const tarefasConcluidas = tasks.filter(t => t.status === 'done').length;
            const tarefasPendentes = totalTarefas - tarefasConcluidas;
            const eficiencia = totalTarefas > 0 ? Math.round((tarefasConcluidas / totalTarefas) * 100) : 0;

            return {
                id: member.id,
                nome: member.name,
                totalTarefas,
                tarefasConcluidas,
                tarefasPendentes,
                eficiencia
            };
        })
    );

    return { teamPerformance: performanceData };
}

export const ReportService = {
    // 🔹 Estatísticas de um projeto
    async projectSummary(projectId: string) {
        const [project, taskCounts, sprintCounts] = await Promise.all([
            prisma.project.findUnique({
                where: { id: projectId },
                select: {
                    id: true,
                    name: true,
                    status: true,
                    createdAt: true,
                    owner: { select: { id: true, name: true, email: true } },
                    memberships: {
                        include: {
                            user: { select: { id: true, name: true, email: true } },
                            role: true
                        },
                    },
                },
            }),
            prisma.task.groupBy({
                by: ["status"],
                where: { projectId },
                _count: true,
            }),
            prisma.sprint.count({
                where: { projectId },
            }),
        ])

        return {
            ...project,
            taskStats: taskCounts.reduce(
                (acc, t) => {
                    acc[t.status] = t._count
                    return acc
                },
                {} as Record<string, number>
            ),
            sprintCount: sprintCounts,
            members: project?.memberships.map((m) => ({
                ...m.user,
                projectRole: m.role.name,
            })),
        }
    },

    // 🔹 Relatório de progresso de sprints
    async sprintProgress(projectId: string) {
        const sprints = await prisma.sprint.findMany({
            where: { projectId },
            include: {
                tasks: {
                    select: { id: true, status: true, storyPoints: true },
                },
            },
            orderBy: { startDate: "asc" },
        })

        return sprints.map((s) => {
            const totalTasks = s.tasks.length
            const doneTasks = s.tasks.filter((t) => t.status === "done").length
            const totalPoints = s.tasks.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0)
            const donePoints = s.tasks
                .filter((t) => t.status === "done")
                .reduce((sum, t) => sum + (t.storyPoints ?? 0), 0)

            return {
                id: s.id,
                name: s.name,
                startDate: s.startDate,
                endDate: s.endDate,
                totalTasks,
                doneTasks,
                totalPoints,
                donePoints,
            }
        })
    },

    // 🔹 Relatório de desempenho por usuário (dentro de um projeto)
    async userPerformance(projectId: string) {
        const tasks = await prisma.task.findMany({
            where: { projectId, assigneeId: { not: null } },
            include: {
                assignee: { select: { id: true, name: true, email: true } },
            },
        })

        const stats: Record<
            string,
            { user: { id: string; name: string | null; email: string }; total: number; done: number }
        > = {}

        for (const task of tasks) {
            if (!task.assignee) continue
            const key = task.assignee.id
            if (!stats[key]) {
                stats[key] = { user: task.assignee, total: 0, done: 0 }
            }
            stats[key].total += 1
            if (task.status === "done") stats[key].done += 1
        }

        return Object.values(stats).map((s) => ({
            ...s,
            completionRate: s.total > 0 ? s.done / s.total : 0,
        }))
    },

    getAggregatedOverview,
    getAggregatedSprints,
    getAggregatedTeamPerformance,
}
