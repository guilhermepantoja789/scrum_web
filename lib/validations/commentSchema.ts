import { z } from "zod";

export const createCommentSchema = z.object({
    content: z.string().min(1, "O comentário não pode estar vazio"),
    taskId: z.string().cuid("ID inválido para a task"),
});

export const updateCommentSchema = z.object({
    content: z.string().min(1, "O comentário não pode estar vazio"),
});
