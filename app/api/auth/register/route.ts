import { NextRequest } from "next/server"
import prisma from "@/lib/db/connection"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { success, error } from "@/lib/api/response" // Supondo que você tenha helpers de resposta
import { cookies } from "next/headers"

// Função de resposta de erro genérica (caso você não tenha uma)
// function error(message: string, status: number) {
//     return new Response(JSON.stringify({ success: false, message }), { status })
// }

export async function POST(req: NextRequest) {
    try {
        const { name, email, password } = await req.json()

        if (!name || !email || !password) {
            return error("Nome, email e senha são obrigatórios.", 400)
        }
        if (password.length < 6) {
            return error("A senha deve ter no mínimo 6 caracteres.", 400)
        }

        const exists = await prisma.user.findUnique({ where: { email } })
        if (exists) {
            return error("Email já registrado", 400)
        }

        // LÓGICA DE INICIALIZAÇÃO: Verifica se um admin já existe
        const adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } });
        if (!adminRole) {
            // Este é um erro crítico do sistema, pois a role deveria ter sido criada pelo seed.
            return error("Função 'Admin' não configurada no sistema. Execute o seed do banco de dados.", 500)
        }

        const adminCount = await prisma.user.count({ where: { roleId: adminRole.id } });

        let userRole;
        // Se não houver admins, a role deste novo usuário será 'Admin'.
        if (adminCount === 0) {
            userRole = adminRole;
            console.log(`Nenhum administrador encontrado. Promovendo o usuário ${email} para Admin.`);
        } else {
            // Caso contrário, usa a role padrão 'Member'.
            const memberRole = await prisma.role.findUnique({ where: { name: "Member" } });
            if (!memberRole) {
                return error("Função padrão 'Member' não encontrada no sistema.", 500);
            }
            userRole = memberRole;
        }

        const hashed = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashed,
                roleId: userRole.id // Usa a role determinada pela lógica acima
            },
        })

        const tokenPayload = {
            id: user.id,
            email: user.email,
            role: {
                id: userRole.id,
                name: userRole.name,
                permissions: userRole.permissions
            }
        }

        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET!, { expiresIn: "7d" })

        const { password: _, ...userSafe } = user

        cookies().set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 7 dias
        })

        // Retorna o usuário com o objeto role completo para o frontend
        return success({ token, user: { ...userSafe, role: userRole } }, "Cadastro bem-sucedido", 201)
    } catch (err: any) {
        console.error("[API_ERROR] /api/auth/register:", err);
        return error("Erro interno do servidor: " + err.message, 500)
    }
}