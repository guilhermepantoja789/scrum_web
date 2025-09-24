import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Lista de funções padrão que sua aplicação precisa para funcionar
const defaultRoles = [
    {
        name: 'Admin',
        description: 'Administrador do sistema com acesso total.',
        permissions: [
            'users:create', 'users:read', 'users:update', 'users:delete',
            'roles:create', 'roles:read', 'roles:update', 'roles:delete',
            'projects:read', 'projects:delete' // Admins podem ver/deletar todos os projetos
        ]
    },
    {
        name: 'Member',
        description: 'Usuário padrão do sistema, pode criar e participar de projetos.',
        permissions: [
            'projects:create' // Permissão para criar seus próprios projetos
        ]
    },
    {
        name: 'Owner',
        description: 'Dono de um projeto, controle total sobre ele.',
        permissions: [
            'project:update', 'project:delete', 'project:manage_members'
        ]
    },
    {
        name: 'Editor',
        description: 'Pode editar o conteúdo de um projeto.',
        permissions: [
            'project:manage_tasks', 'project:manage_sprints'
        ]
    },
    {
        name: 'Viewer',
        description: 'Pode apenas visualizar o conteúdo de um projeto.',
        permissions: [
            'project:read_only'
        ]
    }
]

async function main() {
    console.log(`Iniciando o seeding...`)

    for (const role of defaultRoles) {
        // 'upsert' é como "update or insert".
        // Ele tenta encontrar a role pelo nome. Se encontrar, atualiza. Se não, cria.
        // Isso evita erros se você rodar o seed várias vezes.
        await prisma.role.upsert({
            where: { name: role.name },
            update: { permissions: role.permissions, description: role.description },
            create: role,
        })
        console.log(`Função "${role.name}" criada/atualizada.`)
    }

    console.log(`Seeding finalizado.`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })