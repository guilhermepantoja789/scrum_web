import { z } from "zod";

export const createSubtaskSchema = z.object({
    title: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
    taskId: z.string().cuid("ID inválido para a task"),
    completed: z.boolean().optional(),
});

export const updateSubtaskSchema = createSubtaskSchema.partial();
