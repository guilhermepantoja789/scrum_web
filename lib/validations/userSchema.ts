import { z } from "zod";

export const updateUserSchema = z.object({
    name: z.string().min(2, "Nome muito curto").optional(),
    email: z.string().email("Email inválido").optional(),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional(),
});
