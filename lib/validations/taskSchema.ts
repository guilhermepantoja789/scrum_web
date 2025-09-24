import { z } from "zod";

export const createTaskSchema = z.object({
    title: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
    description: z.string().optional(),
    status: z.enum(["todo", "doing", "done", "canceled"]).default("todo"),
    priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
    storyPoints: z.number().optional(),
    dueDate: z.coerce.date().optional(),
    projectId: z.string().cuid("ID inválido para o projeto"),
    sprintId: z.string().cuid("ID inválido para a sprint").optional(),
    assigneeId: z.string().cuid("ID inválido para o usuário").optional(),
});

export const updateTaskSchema = createTaskSchema.partial();
