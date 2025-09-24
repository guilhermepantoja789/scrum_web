// lib/validations/sprintSchema.ts
import { z } from "zod";

export const createSprintSchema = z.object({
    name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
    projectId: z.string().cuid("ID inválido para o projeto"),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    storyPointsCommitted: z.number().optional(),
    storyPointsCompleted: z.number().optional(),
});

// Para update: todos os campos são opcionais
export const updateSprintSchema = createSprintSchema.partial();
