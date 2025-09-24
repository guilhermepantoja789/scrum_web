import { NextResponse, type NextRequest } from "next/server"
import { getSessionUser } from "@/lib/auth/session"

// O tipo de usuário retornado pela sua sessão agora precisa incluir sua role e as permissões dela.
type UserWithRoleAndPermissions = {
    id: string
    name?: string | null
    email: string
    role: {
        id: string
        name: string
        permissions: string[]
    }
}

// Assinatura do handler
type AuthHandler = (
    user: UserWithRoleAndPermissions,
    req: NextRequest,
    context: { params?: Record<string, string> }
) => Promise<Response>

// Opções do withAuth, agora com 'permission'
type AuthOptions = {
    permission?: string
}

export function withAuth(handler: AuthHandler, options?: AuthOptions) {
    return async (req: NextRequest, context?: { params?: Record<string, string> }) => {
        // Importante: getSessionUser() agora deve buscar o usuário com sua role e permissões.
        // Isso pode exigir uma consulta ao banco de dados se a sessão não guardar esses dados.
        const user = (await getSessionUser()) as UserWithRoleAndPermissions | null

        if (!user) {
            return NextResponse.json({ success: false, message: "Não autenticado" }, { status: 401 })
        }

        // ✅ Lógica de verificação de permissão
        if (options?.permission) {
            const userPermissions = user.role?.permissions || []
            if (!userPermissions.includes(options.permission)) {
                return NextResponse.json(
                    { success: false, message: "Acesso negado. Permissão necessária." },
                    { status: 403 }
                )
            }
        }

        return handler(user, req, context || { params: {} })
    }
}