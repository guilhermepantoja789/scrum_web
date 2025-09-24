"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { useAuthContext } from "@/context/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Edit, Trash2, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Tipo Role para o frontend
type Role = {
    id: string
    name: string
    description?: string | null
    permissions: string[]
}

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { getAuthHeaders } = useAuthContext()
    const { toast } = useToast()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingRole, setEditingRole] = useState<Role | null>(null)

    // Estados do formulário
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [permissions, setPermissions] = useState("")

    const fetchRoles = async () => {
        setIsLoading(true)
        try {
            const res = await fetch("/api/roles", { headers: getAuthHeaders() })
            const data = await res.json()
            if (data.success) {
                setRoles(data.data)
            }
        } catch (error) {
            toast({ title: "Erro", description: "Não foi possível carregar as funções.", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchRoles()
    }, [])

    const resetForm = () => {
        setName("")
        setDescription("")
        setPermissions("")
        setEditingRole(null)
    }

    const openModal = (role: Role | null = null) => {
        if (role) {
            setEditingRole(role)
            setName(role.name)
            setDescription(role.description || "")
            setPermissions(role.permissions.join(", "))
        } else {
            resetForm()
        }
        setIsModalOpen(true)
    }

    const handleSubmit = async () => {
        const url = editingRole ? `/api/roles/${editingRole.id}` : "/api/roles"
        const method = editingRole ? "PUT" : "POST"

        const permissionsArray = permissions.split(',').map(p => p.trim()).filter(Boolean)
        const body = { name, description, permissions: permissionsArray }

        try {
            const response = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(body) })
            const result = await response.json()
            if (result.success) {
                toast({ title: "Sucesso!", description: `Função ${editingRole ? 'atualizada' : 'criada'}.` })
                fetchRoles()
                setIsModalOpen(false)
                resetForm()
            } else {
                toast({ title: "Erro", description: result.message, variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Erro de Rede", description: "A operação falhou.", variant: "destructive" })
        }
    }

    const handleDelete = async (roleId: string) => {
        if (!confirm("Tem certeza? Esta ação não pode ser desfeita.")) return
        try {
            const res = await fetch(`/api/roles/${roleId}`, { method: "DELETE", headers: getAuthHeaders() })
            const data = await res.json()
            if (data.success) {
                toast({ title: "Sucesso!", description: "Função removida." })
                fetchRoles()
            } else {
                toast({ title: "Erro", description: data.message, variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Erro de Rede", description: "Não foi possível remover a função.", variant: "destructive" })
        }
    }

    return (
        <DashboardLayout>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Gerenciar Funções</h1>
                <Button onClick={() => openModal()}><Plus className="mr-2 h-4 w-4" /> Nova Função</Button>
            </div>
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead>Permissões</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={4} className="text-center">Carregando...</TableCell></TableRow>
                            ) : (
                                roles.map(role => (
                                    <TableRow key={role.id}>
                                        <TableCell className="font-medium">{role.name}</TableCell>
                                        <TableCell>{role.description}</TableCell>
                                        <TableCell className="text-xs text-slate-600">{role.permissions.join(', ')}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onClick={() => openModal(role)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDelete(role.id)} className="text-red-500"><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
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

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{editingRole ? "Editar Função" : "Criar Nova Função"}</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Input placeholder="Nome da Função" value={name} onChange={e => setName(e.target.value)} />
                        <Textarea placeholder="Descrição" value={description} onChange={e => setDescription(e.target.value)} />
                        <Textarea placeholder="Permissões (separadas por vírgula), ex: users:read, users:create" value={permissions} onChange={e => setPermissions(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setIsModalOpen(false); resetForm(); }}>Cancelar</Button>
                        <Button onClick={handleSubmit}>Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    )
}