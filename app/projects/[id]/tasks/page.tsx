"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Calendar, Check, MoreHorizontal, Plus, Search, AlertCircle, Edit, Eye } from "lucide-react"

// Hooks, Tipos e Componentes da nossa arquitetura
import { useAuthContext } from "@/context/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { TaskFormModal } from "@/components/kanban/TaskFormModal" // Reutilizaremos o modal do Kanban

// Tipo de tarefa com os dados relacionados que a API nos envia
// 1. A importação agora traz os VALORES dos Enums, e não apenas os tipos.
import { Project, Task, User, TaskStatus, TaskPriority } from "@prisma/client"

// 2. O tipo de tarefa agora inclui a relação 'project', correspondendo ao que os componentes filhos esperam.
type TaskWithRelations = Task & {
    project: { name: string } | null;
    assignee: { name: string; email: string } | null
}

export default function ProjectTasksPage() {
    const params = useParams()
    const router = useRouter()
    const projectId = params.id as string

    // Hooks
    const { getAuthHeaders, isAuthenticated } = useAuthContext()
    const { toast } = useToast()

    // Estados para dados reais da API
    const [project, setProject] = useState<Project | null>(null)
    const [tasks, setTasks] = useState<TaskWithRelations[]>([])
    const [users, setUsers] = useState<Partial<User>[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Estados para filtros e modais
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [priorityFilter, setPriorityFilter] = useState("all")
    const [assigneeFilter, setAssigneeFilter] = useState("all")
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingTask, setEditingTask] = useState<TaskWithRelations | null>(null)


    // --- LÓGICA DE DADOS ---
    const fetchData = useCallback(async () => {
        if (!isAuthenticated || !projectId) return
        setIsLoading(true)
        try {
            const [projectRes, tasksRes, usersRes] = await Promise.all([
                fetch(`/api/projects/${projectId}`, { headers: getAuthHeaders() }),
                fetch(`/api/tasks?projectId=${projectId}`, { headers: getAuthHeaders() }),
                fetch(`/api/users`, { headers: getAuthHeaders() }),
            ]);

            const projectResult = await projectRes.json()
            const tasksResult = await tasksRes.json()
            const usersResult = await usersRes.json()

            if (!projectResult.success) {
                toast({ title: "Erro", description: "Projeto não encontrado ou acesso negado.", variant: "destructive" })
                return router.push('/projects')
            }

            setProject(projectResult.data)
            setTasks(tasksResult.success ? tasksResult.data : [])
            setUsers(usersResult.success ? usersResult.data : [])

        } catch (error) {
            toast({ title: "Erro de Rede", description: "Falha na comunicação com o servidor.", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }, [isAuthenticated, projectId, getAuthHeaders, toast, router])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // --- LÓGICA DE FILTROS ---
    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            const searchMatch = task.title.toLowerCase().includes(searchQuery.toLowerCase())
            const statusMatch = statusFilter === "all" || task.status === statusFilter
            const priorityMatch = priorityFilter === "all" || task.priority === priorityFilter
            const assigneeMatch = assigneeFilter === "all" || task.assigneeId === assigneeFilter
            return searchMatch && statusMatch && priorityMatch && assigneeMatch
        })
    }, [tasks, searchQuery, statusFilter, priorityFilter, assigneeFilter])

    const uniqueAssignees = useMemo(() => {
        const assigneeIds = new Set(tasks.map(task => task.assigneeId).filter(Boolean));
        return users.filter(user => assigneeIds.has(user.id!));
    }, [tasks, users])


    // --- FUNÇÕES DE AÇÃO ---
    const handleTaskFormSubmit = async (data: any) => {
        const isEditing = !!editingTask
        const url = isEditing ? `/api/tasks/${editingTask.id}` : '/api/tasks'
        const method = isEditing ? 'PUT' : 'POST'
        const payload = isEditing ? data : { ...data, projectId }

        try {
            const response = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(payload) })
            const result = await response.json()
            if (result.success) {
                toast({ title: "Sucesso!", description: `Tarefa ${isEditing ? 'atualizada' : 'criada'}.` })
                fetchData() // Atualiza a lista
                setIsModalOpen(false)
                setEditingTask(null)
            } else {
                toast({ title: "Erro", description: result.message, variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Erro de Rede", description: "A operação falhou.", variant: "destructive" })
        }
    }

    // Contagem de tarefas por status
    const taskCounts = useMemo(() => ({
        total: tasks.length,
        todo: tasks.filter((task) => task.status === "todo").length,
        doing: tasks.filter((task) => task.status === "doing").length,
        done: tasks.filter((task) => task.status === "done").length,
    }), [tasks])

    const openCreateModal = () => {
        setEditingTask(null)
        setIsModalOpen(true)
    }

    const openEditModal = (task: TaskWithRelations) => {
        setEditingTask(task)
        setIsModalOpen(true)
    }

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="text-center p-10">Carregando tarefas...</div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                {/* Cabeçalho */}
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/projects/${projectId}`}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Tarefas do Projeto</h1>
                        <p className="text-slate-500">{project?.name}</p>
                    </div>
                </div>

                {/* Cards de estatísticas */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{taskCounts.total}</div></CardContent></Card>
                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">A Fazer</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{taskCounts.todo}</div></CardContent></Card>
                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Em Progresso</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{taskCounts.doing}</div></CardContent></Card>
                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Concluídas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{taskCounts.done}</div></CardContent></Card>
                </div>

                {/* Barra de pesquisa e filtros */}
                <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input placeholder="Buscar tarefas..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {Object.values(TaskStatus).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Prioridade" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                {Object.values(TaskPriority).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Responsável" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {uniqueAssignees.map((user) => <SelectItem key={user.id} value={user.id!}>{user.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button onClick={openCreateModal}><Plus className="mr-2 h-4 w-4" /> Nova Tarefa</Button>
                    </div>
                </div>

                {/* Lista de tarefas */}
                <div className="space-y-4">
                    {filteredTasks.length > 0 ? (
                        filteredTasks.map((task) => (
                            <Card key={task.id} className="transition-all hover:shadow-md">
                                <CardContent className="p-4">
                                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                        <div className="flex-1">
                                            <div className="mb-1 flex items-center gap-2">
                                                <Link href={`/tasks/${task.id}`} className="text-lg font-medium hover:underline">{task.title}</Link>
                                                <Badge variant="outline">{task.priority}</Badge>
                                                <Badge variant="secondary">{task.status}</Badge>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={`https://i.pravatar.cc/32?u=${task.assignee?.email}`} />
                                                    <AvatarFallback>{task.assignee?.name?.charAt(0) || '?'}</AvatarFallback>
                                                </Avatar>
                                                <div className="text-sm">
                                                    <div className="font-medium">{task.assignee?.name || 'Não atribuído'}</div>
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onSelect={() => router.push(`/tasks/${task.id}`)}><Eye className="mr-2 h-4 w-4" />Ver Detalhes</DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => openEditModal(task)}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Card className="flex flex-col items-center justify-center border-dashed p-6">
                            <AlertCircle className="h-6 w-6 text-slate-500 mb-2" />
                            <h3 className="text-lg font-medium text-slate-800">Nenhuma tarefa encontrada</h3>
                            <p className="mb-4 mt-1 text-sm text-slate-500">Tente ajustar os filtros ou crie uma nova tarefa.</p>
                            <Button onClick={openCreateModal}><Plus className="mr-2 h-4 w-4" /> Nova Tarefa</Button>
                        </Card>
                    )}
                </div>
            </div>

            {/* Usamos o mesmo modal do Kanban para consistência */}
            <TaskFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleTaskFormSubmit}
                task={editingTask}
                projects={project ? [project] : []}
                users={users}
            />
        </DashboardLayout>
    )
}