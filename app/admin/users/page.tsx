"use client"

import { useState, useEffect } from "react"
import { Plus, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { useAuthContext } from "@/context/AuthContext"
import { useToast } from "@/hooks/use-toast"
import DashboardLayout from "@/components/layout/dashboard-layout"

// Componentes UI
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Role = {
    id: string
    name: string
    description?: string | null
    permissions: string[]
}

// Tipo para o usuário, incluindo os projetos
type UserWithProjects = {
    id: string;
    name: string | null;
    email: string;
    role: Role;
    projectMemberships: any[];
}

export default function UsersPage() {
    const [users, setUsers] = useState<UserWithProjects[]>([])
    const [roles, setRoles] = useState<Role[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { getAuthHeaders } = useAuthContext()
    const { toast } = useToast()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<UserWithProjects | null>(null)

    // Estados do formulário
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [roleId, setRoleId] = useState("")

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const [usersRes, rolesRes] = await Promise.all([
                fetch("/api/users", { headers: getAuthHeaders() }),
                fetch("/api/roles", { headers: getAuthHeaders() })
            ])
            const usersData = await usersRes.json()
            const rolesData = await rolesRes.json()

            if (usersData.success) setUsers(usersData.data)
            if (rolesData.success) setRoles(rolesData.data)

        } catch (error) {
            toast({ title: "Erro de Rede", description: "Não foi possível carregar os dados.", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const resetForm = () => {
        setName("")
        setEmail("")
        setPassword("")
        setRoleId("")
        setEditingUser(null)
    }

    const openModal = (user: UserWithProjects | null = null) => {
        if (user) {
            setEditingUser(user)
            setName(user.name || "")
            setEmail(user.email)
            setRoleId(user.role.id)
            setPassword("") // Senha não é preenchida na edição por segurança
        } else {
            resetForm()
        }
        setIsModalOpen(true)
    }

    const handleSubmit = async () => {
        const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users"
        const method = editingUser ? "PUT" : "POST"

        const body: any = { name, email, roleId }
        // Só adiciona a senha no body se for criação ou se o campo foi preenchido na edição
        if (!editingUser || password) {
            body.password = password
        }

        try {
            const response = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(body) })
            const result = await response.json()
            if (result.success) {
                toast({ title: "Sucesso!", description: `Usuário ${editingUser ? 'atualizado' : 'criado'}.` })
                fetchData()
                setIsModalOpen(false)
                resetForm()
            } else {
                toast({ title: "Erro", description: result.message, variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Erro de Rede", description: "A operação falhou.", variant: "destructive" })
        }
    }

    const handleDelete = async (userId: string) => {
        if (!confirm("Tem certeza que deseja excluir este usuário?")) return;
        try {
            const response = await fetch(`/api/users/${userId}`, { method: 'DELETE', headers: getAuthHeaders() })
            const result = await response.json()
            if (result.success) {
                toast({ title: "Sucesso!", description: "Usuário excluído." })
                fetchData()
            } else {
                toast({ title: "Erro", description: result.message, variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Erro de Rede", description: "Não foi possível excluir o usuário.", variant: "destructive" })
        }
    }

    return (
        <DashboardLayout>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Gerenciar Usuários</h1>
                <Button onClick={() => openModal()}>
                    <Plus className="mr-2 h-4 w-4" /> Novo Usuário
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Função</TableHead>
                                <TableHead>Projetos</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={5} className="text-center">Carregando...</TableCell></TableRow>
                            ) : (
                                users.map(user => (
                                    <TableRow key={user.id}>
                                        <TableCell>{user.name || "-"}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell className="capitalize">{user.role.name}</TableCell>
                                        <TableCell>{user.projectMemberships.length}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onClick={() => openModal(user)}><Edit className="mr-2 h-4 w-4"/> Editar</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDelete(user.id)} className="text-red-500"><Trash2 className="mr-2 h-4 w-4"/> Excluir</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Modal de Criar/Editar Usuário */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingUser ? "Editar Usuário" : "Criar Novo Usuário"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Input placeholder="Nome" value={name} onChange={e => setName(e.target.value)} />
                        <Input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                        <Input placeholder={editingUser ? "Nova Senha (deixe em branco para não alterar)" : "Senha"} type="password" value={password} onChange={e => setPassword(e.target.value)} />
                        <Select value={roleId} onValueChange={setRoleId} disabled={roles.length === 0}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione uma função" />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map(role => (
                                    <SelectItem key={role.id} value={role.id}>
                                        {role.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit}>Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    )
}