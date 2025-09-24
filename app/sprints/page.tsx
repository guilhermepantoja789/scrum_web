"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Calendar, Eye, Plus, Search, FolderKanban } from "lucide-react"

// Hooks, Tipos e Componentes
import { useAuthContext } from "@/context/AuthContext"
import { useToast } from "@/hooks/use-toast"
import type { Project, Sprint, Task } from "@prisma/client"
import { cn } from "@/lib/utils"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

// 👇 1. IMPORTANDO OS TIPOS CORRETOS DO SEU ARQUIVO DE SERVIÇO
import { SprintTasksModal } from "@/components/kanban/SprintTasksModal"
import { TaskCard } from "@/components/kanban/TaskCard"
import { TaskDetailsModal } from "@/components/kanban/TaskDetailsModal"
import { TaskFormModal } from "@/components/kanban/TaskFormModal"
import type { SprintWithTasks as SprintDTO, TaskWithRelations as TaskDTO, Member as MemberDTO } from "@/lib/data/projects"


// Tipo para o status calculado da sprint
type SprintStatus = "planned" | "in-progress" | "completed" | "delayed";

export default function SprintsPage() {
    const { getAuthHeaders, isAuthenticated } = useAuthContext()
    const { toast } = useToast()

    const [sprints, setSprints] = useState<SprintDTO[]>([]) // <-- Usa SprintDTO
    const [projects, setProjects] = useState<Project[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const [searchQuery, setSearchQuery] = useState("")
    const [projectFilter, setProjectFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState<"all" | SprintStatus>("all")

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [newSprintData, setNewSprintData] = useState({ name: '', projectId: '', startDate: '', endDate: '' })

    const [modalState, setModalState] = useState<{ type: 'viewTask' | 'editTask' | null, data?: any }>({ type: null });
    const [viewingSprint, setViewingSprint] = useState<SprintDTO | null>(null); // <-- Usa SprintDTO
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
    const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string } | null>(null)

    const fetchData = useCallback(async () => {
        if (!isAuthenticated) return
        setIsLoading(true)
        try {
            const [sprintsRes, projectsRes] = await Promise.all([
                fetch('/api/sprints', { headers: getAuthHeaders() }),
                fetch('/api/projects', { headers: getAuthHeaders() })
            ])
            const sprintsResult = await sprintsRes.json()
            const projectsResult = await projectsRes.json()
            if (sprintsResult.success) setSprints(sprintsResult.data || [])
            if (projectsResult.success) setProjects(projectsResult.data || [])
        } catch (error) {
            toast({ title: "Erro de Rede", description: "Não foi possível buscar os dados.", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }, [isAuthenticated, getAuthHeaders, toast])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const getSprintStatus = (sprint: SprintDTO): { status: SprintStatus; label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' } => {
        const now = new Date();
        const start = new Date(sprint.startDate!);
        const end = new Date(sprint.endDate!);
        now.setHours(0, 0, 0, 0);

        if (end < now) return { status: "completed", label: "Concluída", variant: "default" };
        if (start > now) return { status: "planned", label: "Planejada", variant: "secondary" };
        if (now >= start && now <= end) return { status: "in-progress", label: "Em Andamento", variant: "outline" };
        return { status: "delayed", label: "Atrasada", variant: "destructive" };
    };

    const filteredSprints = useMemo(() => {
        return sprints.filter((sprint) => {
            // 2. CORRIGE A BUSCA, AGORA O TIPO ESTÁ CORRETO E 'project' NÃO EXISTE NO DTO
            const searchMatch = sprint.name.toLowerCase().includes(searchQuery.toLowerCase())

            const projectMatch = projectFilter === 'all' || sprint.projectId === projectFilter
            const statusMatch = statusFilter === 'all' || getSprintStatus(sprint as any).status === statusFilter // Usamos 'as any' para contornar a diferença de Date/string

            return searchMatch && projectMatch && statusMatch
        })
    }, [sprints, searchQuery, projectFilter, statusFilter])

    const handleCreateSprint = async () => {
        if (!newSprintData.name || !newSprintData.projectId || !newSprintData.startDate || !newSprintData.endDate) {
            return toast({ title: "Erro", description: "Todos os campos são obrigatórios.", variant: "destructive" })
        }
        try {
            const response = await fetch('/api/sprints', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    ...newSprintData,
                    startDate: new Date(newSprintData.startDate),
                    endDate: new Date(newSprintData.endDate)
                })
            })
            const result = await response.json()
            if (result.success) {
                toast({ title: "Sucesso!", description: "Sprint criada." })
                fetchData()
                setIsCreateModalOpen(false)
                setNewSprintData({ name: '', projectId: '', startDate: '', endDate: '' })
            } else {
                toast({ title: "Erro", description: result.message, variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Erro de Rede", description: "Não foi possível criar a sprint.", variant: "destructive" })
        }
    }

    const calculateSprintProgress = (tasks?: TaskDTO[]) => {
        if (!tasks || tasks.length === 0) return 0
        const completedTasks = tasks.filter(t => t.status === 'done').length
        return Math.round((completedTasks / tasks.length) * 100)
    }

    const taskForViewModal = useMemo(() => {
        if (modalState.type !== 'viewTask' || !modalState.data?.id) return null;
        for (const sprint of sprints) {
            const found = sprint.tasks.find(t => t.id === modalState.data.id);
            if (found) return found;
        }
        return null;
    }, [modalState, sprints]);

    const handleTaskFormSubmit = async (data: any) => {
        const isEditing = !!modalState.data?.id;
        const url = isEditing ? `/api/tasks/${modalState.data.id}` : '/api/tasks';
        const method = isEditing ? 'PUT' : 'POST';
        const payload = { ...data, projectId: viewingSprint?.projectId };
        try {
            const response = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(payload) });
            const result = await response.json();
            if (response.ok) {
                toast({ title: "Sucesso!", description: `Tarefa ${isEditing ? 'atualizada' : 'criada'}.` });
                fetchData();
                setModalState({ type: null });
            } else {
                toast({ title: "Erro", description: result.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Erro de Rede", description: "A operação falhou.", variant: "destructive" });
        }
    };

    const handleDeleteTask = async () => {
        if (!itemToDelete) return;
        try {
            const response = await fetch(`/api/tasks/${itemToDelete.id}`, { method: 'DELETE', headers: getAuthHeaders() });
            if (response.ok) {
                toast({ title: "Sucesso!", description: "Tarefa excluída." });
                fetchData();
            } else {
                const result = await response.json();
                toast({ title: "Erro", description: result.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Erro de Rede", description: "Não foi possível excluir a tarefa.", variant: "destructive" });
        } finally {
            setShowDeleteConfirmation(false);
            setItemToDelete(null);
        }
    }

    if (isLoading) {
        return <DashboardLayout><div className="text-center p-10">Carregando sprints...</div></DashboardLayout>
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-bold text-slate-800">Sprints</h1>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Sprint
                    </Button>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input placeholder="Buscar por nome da sprint..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                        <Select value={projectFilter} onValueChange={setProjectFilter}>
                            <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Projeto" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Projetos</SelectItem>
                                {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                            <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Status</SelectItem>
                                <SelectItem value="in-progress">Em andamento</SelectItem>
                                <SelectItem value="planned">Planejada</SelectItem>
                                <SelectItem value="completed">Concluída</SelectItem>
                                <SelectItem value="delayed">Atrasada</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {filteredSprints.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredSprints.map((sprint) => {
                            const progress = calculateSprintProgress(sprint.tasks);
                            const sprintStatus = getSprintStatus(sprint as any);

                            return (
                                <Card key={sprint.id} className="flex flex-col">
                                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                        <div className="space-y-1">
                                            <CardTitle className="text-xl font-bold">{sprint.name}</CardTitle>
                                            <CardDescription className="text-slate-600">Projeto X</CardDescription> {/* Placeholder */}
                                        </div>
                                        <Badge variant={sprintStatus.variant} className="capitalize">{sprintStatus.label}</Badge>
                                    </CardHeader>
                                    <CardContent className="flex-grow space-y-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <Calendar className="h-4 w-4" />
                                            <span>{new Date(sprint.startDate!).toLocaleDateString('pt-BR')} - {new Date(sprint.endDate!).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                        <div>
                                            <div className="mb-1 flex items-center justify-between text-sm">
                                                <span className="text-slate-500">Progresso</span>
                                                <span className="font-medium">{progress}%</span>
                                            </div>
                                            <Progress value={progress} className="h-2" />
                                        </div>
                                    </CardContent>
                                    <CardFooter className="pt-0">
                                        <Button variant="outline" size="sm" className="w-full" onClick={() => setViewingSprint(sprint)}>
                                            <Eye className="mr-2 h-4 w-4" />
                                            Ver Tarefas ({sprint.tasks?.length ?? 0})
                                        </Button>
                                    </CardFooter>
                                </Card>
                            )
                        })}
                    </div>
                ) : (
                    <Card className="flex flex-col items-center justify-center border-dashed p-10 text-center">
                        <FolderKanban className="h-12 w-12 text-slate-400 mb-4" />
                        <h3 className="text-lg font-medium text-slate-800">Nenhuma sprint encontrada</h3>
                        <p className="mb-4 mt-1 text-slate-500">Tente ajustar os filtros ou crie uma nova sprint.</p>
                        <Button onClick={() => setIsCreateModalOpen(true)}><Plus className="mr-2 h-4 w-4" />Nova Sprint</Button>
                    </Card>
                )}
            </div>

            {/* Modal de Criação de Sprint */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Criar Nova Sprint</DialogTitle>
                        <DialogDescription>Preencha os detalhes da nova sprint.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="sprint-name">Nome da Sprint</Label>
                            <Input id="sprint-name" value={newSprintData.name} onChange={(e) => setNewSprintData({...newSprintData, name: e.target.value})} required/>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="sprint-project">Projeto</Label>
                            <Select value={newSprintData.projectId} onValueChange={(value) => setNewSprintData({...newSprintData, projectId: value})}>
                                <SelectTrigger><SelectValue placeholder="Selecione um projeto" /></SelectTrigger>
                                <SelectContent>
                                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="start-date">Data de Início</Label>
                                <Input id="start-date" type="date" value={newSprintData.startDate} onChange={(e) => setNewSprintData({...newSprintData, startDate: e.target.value})} required/>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="end-date">Data de Término</Label>
                                <Input id="end-date" type="date" value={newSprintData.endDate} onChange={(e) => setNewSprintData({...newSprintData, endDate: e.target.value})} required/>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreateSprint}>Criar Sprint</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modais de Tarefas */}
            <SprintTasksModal
                isOpen={!!viewingSprint}
                onClose={() => setViewingSprint(null)}
                sprint={viewingSprint}
                onViewTask={(task) => setModalState({ type: 'viewTask', data: task })}
                onEditTask={(task) => setModalState({ type: 'editTask', data: task })}
                onDeleteTask={(taskId, taskName) => {
                    setShowDeleteConfirmation(true);
                    setItemToDelete({ id: taskId, name: taskName });
                }}
            />

            <TaskDetailsModal
                isOpen={modalState.type === 'viewTask'}
                onClose={() => setModalState({ type: null })}
                task={taskForViewModal as any}
                onDataRefresh={fetchData}
                onStatusChange={() => {}}
            />

            <TaskFormModal
                isOpen={modalState.type === 'editTask'}
                onClose={() => setModalState({ type: null })}
                onSubmit={handleTaskFormSubmit}
                task={modalState.type === 'editTask' ? modalState.data : null}
                projects={projects}
                users={[]}
                sprints={sprints}
            />

            <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>A ação de excluir "{itemToDelete?.name}" não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteTask} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    )
}