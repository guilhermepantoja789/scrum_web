"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { BarChart3, Calendar, Clock, Edit, Plus, Users } from "lucide-react"

// Componentes de UI (sem alterações)
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import DashboardLayout from "@/components/layout/dashboard-layout"

// Hooks e Contexto
import { useAuthContext } from "@/context/AuthContext"
import { useToast } from "@/hooks/use-toast"
import type { Project, ProjectStatus } from "@prisma/client" // Importando o status também

// --- INÍCIO DAS MUDANÇAS ---

// 1. Tipagem mais precisa para o projeto, de acordo com o retorno da sua API.
//    Sua API agora inclui `owner` e `members`.
type ProjectWithDetails = Project & {
    owner: {
        id: string
        name: string | null
        email: string | null
    }
    members: {
        id: string
        name: string | null
        email: string | null
        projectRole: string // ou ProjectRole do Prisma se preferir importar
    }[]
}

export default function DashboardPage() {
    // 2. O estado agora usa a nova tipagem `ProjectWithDetails`
    const [projects, setProjects] = useState<ProjectWithDetails[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { getAuthHeaders, isAuthenticated } = useAuthContext()
    const { toast } = useToast()

    const fetchProjects = async () => {
        setIsLoading(true)
        try {
            const response = await fetch("/api/projects", {
                headers: getAuthHeaders(),
            })
            const result = await response.json()
            if (result.success) {
                setProjects(result.data) // Os dados da API já batem com a nova tipagem
            } else {
                toast({ title: "Erro", description: result.message, variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Erro de Rede", description: "Não foi possível buscar os projetos.", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (isAuthenticated) {
            fetchProjects()
        }
    }, [isAuthenticated])

    // Lógica dos modais e estados de formulário
    const [showNewProjectModal, setShowNewProjectModal] = useState(false)
    const [newProjectName, setNewProjectName] = useState("")
    const [newProjectDescription, setNewProjectDescription] = useState("")

    // 3. O estado do projeto em edição também usa a nova tipagem
    const [editingProject, setEditingProject] = useState<ProjectWithDetails | null>(null)
    const [editProjectName, setEditProjectName] = useState("")
    const [editProjectDescription, setEditProjectDescription] = useState("")
    const [editProjectStatus, setEditProjectStatus] = useState<ProjectStatus>("active")
    const [showEditProjectModal, setShowEditProjectModal] = useState(false)

    // A função de CRIAR projeto já está correta e não precisa de mudanças.
    // Ela envia `name` e `description`, e a API cuida de associar o `ownerId`.
    const handleCreateProject = async () => {
        try {
            const response = await fetch("/api/projects", {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    name: newProjectName,
                    description: newProjectDescription,
                }),
            })

            const result = await response.json()

            if (result.success) {
                toast({ title: "Sucesso!", description: "Projeto criado com sucesso." })
                fetchProjects() // Atualiza a lista de projetos
                setShowNewProjectModal(false)
                setNewProjectName("")
                setNewProjectDescription("")
            } else {
                toast({ title: "Erro", description: result.message, variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Erro de Rede", description: "Não foi possível criar o projeto.", variant: "destructive" })
        }
    }

    // A função de EDITAR projeto também já está correta.
    // O endpoint (`/api/projects/${editingProject.id}`) e o método PUT estão certos.
    const handleSaveProjectChanges = async () => {
        if (!editingProject) return

        try {
            const response = await fetch(`/api/projects/${editingProject.id}`, {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    name: editProjectName,
                    description: editProjectDescription,
                    status: editProjectStatus,
                }),
            })

            const result = await response.json()

            if (result.success) {
                toast({ title: "Sucesso!", description: "Projeto atualizado." })
                fetchProjects() // Atualiza a lista
                setShowEditProjectModal(false)
                setEditingProject(null)
            } else {
                toast({ title: "Erro", description: result.message, variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Erro de Rede", description: "Não foi possível atualizar o projeto.", variant: "destructive" })
        }
    }

    // 4. A função para abrir o modal agora recebe o tipo `ProjectWithDetails`
    const openEditProjectModal = (project: ProjectWithDetails) => {
        setEditingProject(project)
        setEditProjectName(project.name)
        setEditProjectDescription(project.description || "")
        setEditProjectStatus(project.status)
        setShowEditProjectModal(true)
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
                    {/* Modal de Criar Projeto (sem alterações na estrutura) */}
                    <Dialog open={showNewProjectModal} onOpenChange={setShowNewProjectModal}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Novo Projeto
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Criar Novo Projeto</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <Input value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder="Nome do Projeto"/>
                                <Textarea value={newProjectDescription} onChange={(e) => setNewProjectDescription(e.target.value)} placeholder="Descrição"/>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowNewProjectModal(false)}>Cancelar</Button>
                                <Button onClick={handleCreateProject}>Criar Projeto</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    {/* Modal de Editar Projeto (sem alterações na estrutura) */}
                    <Dialog open={showEditProjectModal} onOpenChange={setShowEditProjectModal}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Editar Projeto</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <Input value={editProjectName} onChange={(e) => setEditProjectName(e.target.value)} placeholder="Nome do Projeto"/>
                                <Textarea value={editProjectDescription} onChange={(e) => setEditProjectDescription(e.target.value)} placeholder="Descrição"/>
                                <Select value={editProjectStatus} onValueChange={(value) => setEditProjectStatus(value as ProjectStatus)}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Ativo</SelectItem>
                                        <SelectItem value="paused">Pausado</SelectItem>
                                        <SelectItem value="completed">Concluído</SelectItem>
                                        <SelectItem value="archived">Arquivado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowEditProjectModal(false)}>Cancelar</Button>
                                <Button onClick={handleSaveProjectChanges}>Salvar Alterações</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{projects.filter((p) => p.status === "active").length}</div>
                        </CardContent>
                    </Card>
                    {/* Você pode adicionar outros cards aqui */}
                </div>

                <div>
                    <h2 className="mb-4 text-xl font-semibold text-slate-800">Projetos</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {isLoading ? <p>Carregando projetos...</p> : projects.map((project) => (
                            <Link href={`/projects/${project.id}`} key={project.id} className="block">
                                <Card className="flex flex-col h-full transition-all hover:shadow-md">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="min-w-0"> {/* <-- CORREÇÃO APLICADA AQUI */}
                                                <CardTitle className="text-lg">{project.name}</CardTitle>
                                                <CardDescription className="line-clamp-2 break-words">{project.description || "Sem descrição"}</CardDescription>
                                            </div>
                                            <Button
                                                variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0"
                                                onClick={(e) => { e.preventDefault(); openEditProjectModal(project); }}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        {/* Bônus: Exibir o status de forma mais visual */}
                                        <div className="text-sm text-slate-600">
                                            Status: <span className="font-medium capitalize">{project.status}</span>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        {/* Bônus: Usar os dados de `members` que a API agora fornece */}
                                        <div className="flex items-center text-sm text-slate-500">
                                            <Users className="mr-2 h-4 w-4" />
                                            {project?.members?.length || 0} {(project?.members?.length || 0) === 1 ? 'membro' : 'membros'}
                                        </div>
                                    </CardFooter>
                                </Card>
                            </Link>
                        ))}
                        {/* Card para adicionar novo projeto */}
                        <Card
                            className="flex h-full min-h-[150px] flex-col items-center justify-center border-dashed p-6 cursor-pointer hover:border-slate-400 transition-colors"
                            onClick={() => setShowNewProjectModal(true)}
                        >
                            <Plus className="h-6 w-6 text-slate-500 mb-2" />
                            <h3 className="text-lg font-medium text-slate-800">Novo Projeto</h3>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}