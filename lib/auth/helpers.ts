import { jwtVerify } from "jose"

const JWT_SECRET = process.env.JWT_SECRET

function getJwtSecretKey(): Uint8Array {
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET não está definido nas variáveis de ambiente")
    }
    return new TextEncoder().encode(JWT_SECRET)
}

/**
 * Verifica o token JWT e retorna { userId } se for válido.
 * Mantém este helper sem acesso ao DB (compatível com Edge).
 */
export async function verifyAuth(token: string): Promise<{ userId: string } | null> {
    try {
        const { payload } = await jwtVerify(token, getJwtSecretKey())
        const userId = payload.userId as string | undefined
        if (!userId) return null
        return { userId }
    } catch {
        return null
    }
}
