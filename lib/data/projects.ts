import prisma from "@/lib/db/connection"
import type { Prisma, ProjectStatus, TaskStatus, TaskPriority, TaskType } from "@prisma/client"

/** ===================== DTOs (Data Transfer Objects) ===================== */

export type UiComment = { id: string; content: string; createdAt: string; author: { name: string; email: string } }
export type UiSubtask = { id: string; title: string; completed: boolean }
export type UiAttachment = { id: string; fileName: string; url: string; fileType: string }

export type TaskWithRelations = {
    id: string; title: string; description: string | null; status: TaskStatus;
    priority: TaskPriority; storyPoints: number | null; dueDate: string | null;
    createdAt: string; updatedAt: string; projectId: string; sprintId: string | null;
    assigneeId: string | null; typeId: string | null;
    project: { name: string } | null;
    assignee: { name: string; email: string } | null;
    comments: UiComment[]; subtasks: UiSubtask[]; attachments: UiAttachment[];
    sprint: { id: string; name: string } | null;
    type: TaskType | null;
}

export type SprintWithTasks = {
    id: string; name: string; startDate: string | null; endDate: string | null;
    storyPointsCommitted: number | null; storyPointsCompleted: number | null;
    projectId: string; project: { name: string; id: string }; tasks: TaskWithRelations[];
}

export type Member = {
    id: string; name: string; email: string; projectRole: string;
    role: { id: string; name: string; description: string | null; permissions: string[] }
}

export type ProjectWithDetails = {
    id: string; name: string; description: string | null; status: ProjectStatus;
    ownerId: string; createdAt: string; updatedAt: string;
    members: Member[]; tasks: TaskWithRelations[]; sprints: SprintWithTasks[];
}

/** ===================== Funções Auxiliares de Mapeamento ===================== */

function toIso(d: Date | string | null | undefined): string | null {
    if (!d) return null
    return typeof d === "string" ? d : d.toISOString()
}

function mapComment(c: any): UiComment {
    return { id: c.id, content: c.content, createdAt: toIso(c.createdAt)!, author: { name: c.author?.name ?? "", email: c.author?.email ?? "" } }
}

function mapSubtask(s: any): UiSubtask {
    return { id: s.id, title: s.title, completed: Boolean(s.completed) }
}

function mapAttachment(a: any): UiAttachment {
    return { id: a.id, fileName: a.fileName, url: a.url, fileType: a.fileType }
}

function mapTask(t: any): TaskWithRelations {
    return {
        id: t.id, title: t.title, description: t.description ?? null, status: t.status as TaskStatus,
        priority: t.priority as TaskPriority, storyPoints: t.storyPoints ?? null, dueDate: toIso(t.dueDate),
        createdAt: toIso(t.createdAt)!, updatedAt: toIso(t.updatedAt)!, projectId: t.projectId,
        sprintId: t.sprintId ?? null, assigneeId: t.assigneeId ?? null, typeId: t.typeId ?? null,
        project: t.project ? { name: t.project.name } : null,
        assignee: t.assignee ? { name: t.assignee.name ?? "", email: t.assignee.email } : null,
        comments: (t.comments ?? []).map(mapComment), subtasks: (t.subtasks ?? []).map(mapSubtask),
        attachments: (t.attachments ?? []).map(mapAttachment),
        sprint: t.sprint ? { id: t.sprint.id, name: t.sprint.name } : null,
        type: t.type || null,
    }
}

function mapMember(m: any): Member {
    return {
        id: m.user.id, name: m.user.name ?? "", email: m.user.email,
        projectRole: m.role?.name ?? "Member",
        role: { id: m.role?.id ?? "", name: m.role?.name ?? "", description: m.role?.description ?? null, permissions: m.role?.permissions ?? [] }
    }
}

function _mapProjectToDto(p: any): ProjectWithDetails | null {
    if (!p) return null;
    return {
        id: p.id, name: p.name, description: p.description ?? null, status: p.status as ProjectStatus,
        ownerId: p.ownerId, createdAt: toIso(p.createdAt)!, updatedAt: toIso(p.updatedAt)!,
        members: (p.memberships ?? []).map(mapMember),
        tasks: (p.tasks ?? []).map(mapTask),
        sprints: (p.sprints ?? []).map((s: any) => ({
            id: s.id, name: s.name, startDate: toIso(s.startDate), endDate: toIso(s.endDate),
            storyPointsCommitted: s.storyPointsCommitted ?? 0, storyPointsCompleted: s.storyPointsCompleted ?? 0,
            projectId: p.id, project: { name: p.name, id: p.id },
            tasks: (s.tasks ?? []).map(mapTask),
        })),
    }
}

const projectIncludeAll: Prisma.ProjectInclude = {
    owner: { select: { id: true, name: true, email: true } },
    memberships: { include: { user: { select: { id: true, name: true, email: true, role: true } }, role: true } },
    tasks: {
        include: {
            assignee: { select: { id: true, name: true, email: true } },
            comments: { include: { author: { select: { name: true, email: true } } }, orderBy: { createdAt: 'desc' } },
            subtasks: true, attachments: true, sprint: { select: { id: true, name: true } },
            type: true,
        },
        orderBy: { createdAt: "desc" },
    },
    sprints: {
        include: {
            tasks: {
                include: { assignee: true, sprint: true, project: { select: { name: true } }, type: true }
            }
        },
        orderBy: { startDate: "desc" },
    },
}

export const ProjectService = {
    async getById(id: string): Promise<ProjectWithDetails | null> {
        const p = await prisma.project.findUnique({ where: { id }, include: projectIncludeAll })
        return _mapProjectToDto(p)
    },

    async listByUser(userId: string): Promise<ProjectWithDetails[]> {
        const projectsFromDb = await prisma.project.findMany({
            where: { OR: [{ ownerId: userId }, { memberships: { some: { userId } } }] },
            include: projectIncludeAll,
            orderBy: { createdAt: "desc" },
        })
        return projectsFromDb.map(p => _mapProjectToDto(p)!);
    },

    async create(data: { name: string; description?: string | null; status?: ProjectStatus; ownerId: string }) {
        const created = await prisma.project.create({ data: { ...data, status: data.status ?? "active" } })
        return this.getById(created.id)
    },

    async update(id: string, data: Partial<{ name: string; description: string | null; status: ProjectStatus }>) {
        await prisma.project.update({ where: { id }, data })
        return this.getById(id)
    },

    async remove(id: string) {
        await prisma.$transaction(async (tx) => {
            const tasks = await tx.task.findMany({ where: { projectId: id }, select: { id: true } });
            const taskIds = tasks.map(t => t.id);
            if (taskIds.length > 0) {
                await tx.comment.deleteMany({ where: { taskId: { in: taskIds } } });
                await tx.subtask.deleteMany({ where: { taskId: { in: taskIds } } });
                await tx.attachment.deleteMany({ where: { taskId: { in: taskIds } } });
                await tx.task.deleteMany({ where: { id: { in: taskIds } } });
            }
            await tx.projectMember.deleteMany({ where: { projectId: id } })
            await tx.sprint.deleteMany({ where: { projectId: id } })
            await tx.project.delete({ where: { id } })
        })
    },

    async addMember(projectId: string, userId: string, roleId: string) {
        await prisma.projectMember.create({ data: { projectId, userId, roleId } })
        return this.getById(projectId)
    },

    async updateMemberRole(projectId: string, userId: string, newRoleId: string) {
        await prisma.projectMember.update({
            where: { userId_projectId: { userId, projectId } },
            data: { roleId: newRoleId },
        })
        return this.getById(projectId)
    },

    async removeMember(projectId: string, userId: string) {
        const project = await prisma.project.findUnique({ where: { id: projectId }, select: { ownerId: true } })
        if (!project) throw new Error("Projeto não encontrado")
        if (project.ownerId === userId) throw new Error("Não é possível remover o proprietário do projeto")
        await prisma.projectMember.delete({ where: { userId_projectId: { userId, projectId } } })
        return this.getById(projectId)
    },
}