import { z } from "zod";

export const createProjectSchema = z.object({
    name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
    description: z.string().optional(),
    status: z.enum(["active", "paused", "completed", "archived"]).default("active"),
    ownerId: z.string().cuid("ID inválido para o proprietário"),
});

export const updateProjectSchema = createProjectSchema.partial();
