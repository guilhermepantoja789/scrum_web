"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

// Ícones
import { ArrowLeft, Edit, Plus, Trash, UserPlus, MoreHorizontal, Shield, Settings, GitBranch, TrendingUp, Clock, CheckCircle } from "lucide-react"
import { TaskDistributionChart } from "@/components/charts/TaskDistributionChart"

// Hooks, Contexto e Tipos
import { useAuthContext } from "@/context/AuthContext"
import { useToast } from "@/hooks/use-toast"
import type { ProjectStatus, Role, TaskStatus } from "@prisma/client"
import type {
    ProjectWithDetails as ProjectDTO,
    SprintWithTasks as SprintDTO,
    TaskWithRelations as TaskDTO,
    Member as MemberDTO,
} from "@/lib/data/projects"

// Componentes UI
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { TaskCard } from "@/components/kanban/TaskCard"
import { TaskFormModal } from "@/components/kanban/TaskFormModal"
import { TaskDetailsModal } from "@/components/kanban/TaskDetailsModal"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

type SystemUser = { id: string; name: string | null; email: string }

export function ProjectClientPage({ initialProject }: { initialProject: ProjectDTO | null }) {
    const router = useRouter()
    const projectId = initialProject?.id

    const { getAuthHeaders } = useAuthContext()
    const { toast } = useToast()

    const [project, setProject] = useState<ProjectDTO | null>(initialProject)
    const [systemUsers, setSystemUsers] = useState<SystemUser[]>([])
    const [projectRoles, setProjectRoles] = useState<Role[]>([])
    const [selectedSprintId, setSelectedSprintId] = useState<string>('');
    const [taskTypes, setTaskTypes] = useState<any[]>([])

    const [selectedBacklogTasks, setSelectedBacklogTasks] = useState<Set<string>>(new Set());
    const [targetSprintId, setTargetSprintId] = useState<string>("");
    const [selectedSprintTasks, setSelectedSprintTasks] = useState<Set<string>>(new Set());

    const [modalState, setModalState] = useState<{ type: 'addMember' | 'editMember' | 'newTask' | 'editTask' | 'newSprint' | 'viewTask' | null; data?: any }>({ type: null })

    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
    const [itemToDelete, setItemToDelete] = useState<{ type: 'member' | 'project' | 'task' | 'sprint', id: string, name: string, extraId?: string } | null>(null)
    const [selectedUser, setSelectedUser] = useState<string>("");
    const [selectedRole, setSelectedRole] = useState<string>("");

    const fetchData = useCallback(async (fullReload = false) => {
        if (!projectId) return

        try {
            const promises = [
                fetch('/api/users', { headers: getAuthHeaders() }),
                fetch('/api/roles', { headers: getAuthHeaders() }),
                fetch('/api/task-types', { headers: getAuthHeaders() }),
            ];

            if (fullReload) {
                promises.unshift(fetch(`/api/projects/${projectId}`, { headers: getAuthHeaders() }));
            }

            const responses = await Promise.all(promises);
            let projectRes, usersRes, rolesRes, taskTypesRes;

            if (fullReload) {
                projectRes = responses.shift()!;
                [usersRes, rolesRes, taskTypesRes] = responses;
            } else {
                [usersRes, rolesRes, taskTypesRes] = responses;
            }

            if (projectRes) {
                const projectResult = await projectRes.json();
                if (projectResult.success) {
                    setProject(projectResult.data);
                    if (!selectedSprintId) {
                        const firstActiveSprint = projectResult.data?.sprints?.[0]?.id;
                        if (firstActiveSprint) setSelectedSprintId(firstActiveSprint);
                    }
                }
            }

            const usersResult = await usersRes.json();
            const rolesResult = await rolesRes.json();
            const taskTypesResult = await taskTypesRes.json();

            if (usersResult.success) setSystemUsers(usersResult.data);
            if (rolesResult.success) setProjectRoles(rolesResult.data.filter((r: Role) => ['Owner', 'Editor', 'Viewer'].includes(r.name)));
            if (taskTypesResult.success) setTaskTypes(taskTypesResult.data);

        } catch (error) {
            toast({ title: "Erro de Rede", description: "Falha ao buscar dados.", variant: "destructive" })
        }
    }, [projectId, getAuthHeaders, toast, selectedSprintId]);

    useEffect(() => {
        fetchData(true);
    }, []);

    const {
        backlog, taskCounts, kanbanTasks, projectSprints, sprintVelocity,
        averageLeadTime, statusDistribution, priorityDistribution
    } = useMemo(() => {
        const initialKanbanState: Record<TaskStatus, TaskDTO[]> = { todo: [], doing: [], done: [], canceled: [] }
        if (!project) {
            return {
                backlog: [], taskCounts: { total: 0, done: 0 }, kanbanTasks: initialKanbanState, projectSprints: [],
                sprintVelocity: 0, averageLeadTime: 0, statusDistribution: [], priorityDistribution: []
            }
        }
        const backlog = project.tasks.filter(t => !t.sprintId)
        const taskCounts = { total: project.tasks.length, done: project.tasks.filter(t => t.status === "done").length }
        const tasksForKanban = selectedSprintId ? project.tasks.filter(task => task.sprintId === selectedSprintId) : [];
        const kanbanTasks = tasksForKanban.reduce((acc, task) => { acc[task.status].push(task); return acc; }, initialKanbanState)
        const completedSprints = project.sprints.filter(s => new Date(s.endDate!) < new Date()).slice(0, 3);
        const totalPoints = completedSprints.reduce((sum, sprint) => {
            const sprintPoints = sprint.tasks.filter(t => t.status === 'done').reduce((taskSum, task) => taskSum + (task.storyPoints || 0), 0);
            return sum + sprintPoints;
        }, 0);
        const sprintVelocity = completedSprints.length > 0 ? Math.round(totalPoints / completedSprints.length) : 0;
        const doneTasks = project.tasks.filter(t => t.status === 'done' && t.createdAt && t.updatedAt);
        const totalLeadTime = doneTasks.reduce((sum, task) => {
            const leadTime = new Date(task.updatedAt).getTime() - new Date(task.createdAt).getTime();
            return sum + leadTime;
        }, 0);
        const averageLeadTimeMs = doneTasks.length > 0 ? totalLeadTime / doneTasks.length : 0;
        const averageLeadTime = Math.round(averageLeadTimeMs / (1000 * 60 * 60 * 24));
        const statusDistribution = (['todo', 'doing', 'done', 'canceled'] as TaskStatus[]).map(status => ({
            name: status.charAt(0).toUpperCase() + status.slice(1),
            value: project.tasks.filter(t => t.status === status).length
        })).filter(item => item.value > 0);
        const priorityDistribution = (['low', 'medium', 'high', 'urgent']).map(priority => ({
            name: priority.charAt(0).toUpperCase() + priority.slice(1),
            value: project.tasks.filter(t => t.priority === priority).length
        })).filter(item => item.value > 0);
        return {
            backlog, taskCounts, kanbanTasks, projectSprints: project.sprints,
            sprintVelocity, averageLeadTime, statusDistribution, priorityDistribution
        }
    }, [project, selectedSprintId])

    const projectProgress = useMemo(() => {
        if (!taskCounts.total) return 0
        return Math.round((taskCounts.done / taskCounts.total) * 100)
    }, [taskCounts])

    const projectsForModal = useMemo(() => {
        if (!project) return []
        return [{ id: project.id, name: project.name, status: project.status as ProjectStatus, ownerId: project.ownerId }]
    }, [project])

    const taskForViewModal = useMemo(() => {
        if (modalState.type !== 'viewTask' || !modalState.data?.id || !project) return null;
        return project.tasks.find(t => t.id === modalState.data.id) ?? null;
    }, [modalState, project]);

    // --- FUNÇÕES DE AÇÃO (HANDLERS) ---

    const handleBulkUpdateTasks = async (taskIds: string[], sprintId: string | null) => {
        try {
            const response = await fetch('/api/tasks/bulk-update', { method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify({ taskIds, sprintId }) });
            const result = await response.json();
            if(response.ok) {
                toast({ title: "Sucesso!", description: "Tarefas movidas." });
                fetchData(true);
            } else {
                toast({ title: "Erro", description: result.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Erro de Rede", description: "Não foi possível mover as tarefas.", variant: "destructive" });
        } finally {
            setSelectedBacklogTasks(new Set());
            setSelectedSprintTasks(new Set());
            setTargetSprintId("");
        }
    }
    const handleBacklogTaskSelect = (taskId: string) => { setSelectedBacklogTasks(prev => { const newSet = new Set(prev); if (newSet.has(taskId)) newSet.delete(taskId); else newSet.add(taskId); return newSet; }); }
    const handleSprintTaskSelect = (taskId: string) => { setSelectedSprintTasks(prev => { const newSet = new Set(prev); if (newSet.has(taskId)) newSet.delete(taskId); else newSet.add(taskId); return newSet; }); }
    const handleDragStart = (e: React.DragEvent, task: TaskDTO) => { if (selectedBacklogTasks.has(task.id)) { const taskIds = Array.from(selectedBacklogTasks); e.dataTransfer.setData("taskIds", JSON.stringify(taskIds)); } else { e.dataTransfer.setData("taskIds", JSON.stringify([task.id])); } }
    const handleDropOnSprint = (e: React.DragEvent, targetSprintId: string) => { try { const taskIds = JSON.parse(e.dataTransfer.getData("taskIds")) as string[]; if (taskIds && taskIds.length > 0) handleBulkUpdateTasks(taskIds, targetSprintId); } catch (error) { toast({ title: "Erro", description: "Não foi possível mover a tarefa.", variant: "destructive" }); } }
    const handleDropOnKanban = (e: React.DragEvent, targetStatus: TaskStatus) => { try { const taskIds = JSON.parse(e.dataTransfer.getData("taskIds")) as string[]; const taskId = taskIds[0]; const task = project?.tasks.find(t => t.id === taskId); if (task && task.status !== targetStatus) handleTaskStatusChange(taskId, targetStatus); } catch(error) { /* Ignora */ } };
    const handleDragOver = (e: React.DragEvent) => e.preventDefault();
    const handleAddMember = async () => {
        if (!selectedUser || !selectedRole) {
            toast({ title: "Erro de Validação", description: "Selecione um usuário e uma função.", variant: "destructive" });
            return;
        }
        try {
            const res = await fetch(`/api/projects/${projectId}/members`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ userId: selectedUser, roleId: selectedRole }) });
            const result = await res.json();
            if (res.ok) {
                toast({ title: "Sucesso!", description: "Membro adicionado ao projeto." });
                fetchData(true);
                setModalState({ type: null });
                setSelectedUser("");
                setSelectedRole("");
            } else {
                toast({ title: "Erro", description: result.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Erro de Rede", description: "Não foi possível adicionar o membro.", variant: "destructive" });
        }
    };
    const handleUpdateMemberRole = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newRoleId = formData.get("roleId") as string;
        const userId = modalState.data?.id;
        try {
            const res = await fetch(`/api/projects/${projectId}/members`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ userId, newRoleId }) });
            const result = await res.json();
            if (res.ok) {
                toast({ title: "Sucesso!", description: "Função do membro atualizada." });
                fetchData(true);
                setModalState({ type: null });
            } else {
                toast({ title: "Erro", description: result.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Erro de Rede", description: "Não foi possível atualizar a função.", variant: "destructive" });
        }
    };
    const handleEditProject = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const dataToUpdate = { name: formData.get("name") as string, description: formData.get("description") as string, status: formData.get("status") as ProjectStatus };
        try {
            const response = await fetch(`/api/projects/${projectId}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(dataToUpdate) });
            const result = await response.json();
            if (response.ok) {
                toast({ title: "Sucesso!", description: "Projeto atualizado." });
                fetchData(true);
            } else {
                toast({ title: "Erro", description: result.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Erro de Rede", description: "Não foi possível salvar as alterações.", variant: "destructive" });
        }
    };
    const handleTaskFormSubmit = async (data: any) => {
        const isEditing = !!modalState.data?.id;
        const url = isEditing ? `/api/tasks/${modalState.data.id}` : '/api/tasks';
        const method = isEditing ? 'PUT' : 'POST';
        const payload = isEditing ? data : { ...data, projectId: projectId };
        try {
            const response = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(payload) });
            const result = await response.json();
            if (response.ok) {
                toast({ title: "Sucesso!", description: `Tarefa ${isEditing ? 'atualizada' : 'criada'}.` });
                fetchData(true);
                setModalState({ type: null });
            } else {
                toast({ title: "Erro", description: result.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Erro de Rede", description: "A operação falhou.", variant: "destructive" });
        }
    };
    const handleTaskStatusChange = async (taskId: string, status: TaskStatus) => {
        try {
            const response = await fetch(`/api/tasks/${taskId}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ status }) });
            const result = await response.json();
            if (response.ok) {
                toast({ title: "Sucesso!", description: "Status da tarefa atualizado." });
                fetchData(true);
            } else {
                toast({ title: "Erro", description: result.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Erro de Rede", description: "Não foi possível mover a tarefa.", variant: "destructive" });
        }
    };
    const handleCreateSprint = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const startDateString = formData.get("startDate") as string;
        const endDateString = formData.get("endDate") as string;
        if (!name || !startDateString || !endDateString) {
            toast({ title: "Erro de Validação", description: "Preencha todos os campos obrigatórios.", variant: "destructive" });
            return;
        }
        const newSprintData = { name, startDate: new Date(startDateString), endDate: new Date(endDateString) };
        try {
            const response = await fetch('/api/sprints', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ ...newSprintData, projectId: projectId }) });
            const result = await response.json();
            if (response.ok) {
                toast({ title: "Sucesso!", description: "Sprint criada." });
                fetchData(true);
                setModalState({ type: null });
            } else {
                toast({ title: "Erro", description: result.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Erro de Rede", description: "Não foi possível criar a sprint.", variant: "destructive" });
        }
    };
    const handleDelete = async () => {
        if (!itemToDelete) return;
        let url = '';
        switch (itemToDelete.type) {
            case 'project': url = `/api/projects/${itemToDelete.id}`; break;
            case 'member': url = `/api/projects/${projectId}/members/${itemToDelete.id}`; break;
            case 'task': url = `/api/tasks/${itemToDelete.id}`; break;
            case 'sprint': url = `/api/sprints/${itemToDelete.id}`; break;
        }
        try {
            const response = await fetch(url, { method: 'DELETE', headers: getAuthHeaders() });
            if (response.ok) {
                toast({ title: "Sucesso!", description: `${itemToDelete.type.charAt(0).toUpperCase() + itemToDelete.type.slice(1)} foi excluído(a).` });
                if (itemToDelete.type === 'project') router.push('/projects');
                else fetchData(true);
            } else {
                const result = await response.json();
                toast({ title: "Erro", description: result.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Erro de Rede", description: "Não foi possível excluir.", variant: "destructive" });
        } finally {
            setShowDeleteConfirmation(false);
            setItemToDelete(null);
        }
    };
    const handleTaskUpdate = async (taskId: string, data: Partial<TaskDTO>) => {
        try {
            const response = await fetch(`/api/tasks/${taskId}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) });
            const result = await response.json();
            if (response.ok) {
                toast({ title: "Sucesso!", description: "Tarefa atualizada." });
                fetchData(true);
            } else {
                toast({ title: "Erro", description: result.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Erro de Rede", description: "Não foi possível atualizar a tarefa.", variant: "destructive" });
        }
    };

    if (!project) { return <DashboardLayout><div className="text-center p-10">Carregando ou projeto não encontrado...</div></DashboardLayout>; }

    return (
        <DashboardLayout>
            <div className="flex items-center gap-2 mb-6">
                <Button variant="ghost" size="icon" asChild><Link href="/projects"><ArrowLeft className="h-4 w-4" /></Link></Button>
                <h1 className="text-2xl font-bold text-slate-800">{project.name}</h1>
            </div>
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                    <TabsTrigger value="tasks">Tarefas</TabsTrigger>
                    <TabsTrigger value="members">Membros ({project.members.length})</TabsTrigger>
                    <TabsTrigger value="settings">Configurações</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle><CheckCircle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{taskCounts.total}</div><p className="text-xs text-muted-foreground">{taskCounts.done} concluídas</p></CardContent></Card>
                        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Velocidade da Sprint</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{sprintVelocity}</div><p className="text-xs text-muted-foreground">Média de pontos/sprint</p></CardContent></Card>
                        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Tempo Médio de Conclusão</CardTitle><Clock className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{averageLeadTime} {averageLeadTime === 1 ? 'dia' : 'dias'}</div><p className="text-xs text-muted-foreground">Desde a criação até a conclusão</p></CardContent></Card>
                        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Equipe</CardTitle><UserPlus className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{project.members.length}</div><p className="text-xs text-muted-foreground">Membros no projeto</p></CardContent></Card>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
                        <Card className="lg:col-span-4"><CardHeader><CardTitle>Burndown da Sprint Ativa</CardTitle><CardDescription>Progresso do trabalho planejado vs. realizado.</CardDescription></CardHeader><CardContent className="h-[300px] flex items-center justify-center"><p className="text-slate-400">Gráfico de Burndown em breve...</p></CardContent></Card>
                        <Card className="lg:col-span-3"><CardHeader><CardTitle>Distribuição de Tarefas</CardTitle><CardDescription>Visão geral das tarefas por status e prioridade.</CardDescription></CardHeader><CardContent className="h-[300px]"><TaskDistributionChart statusData={statusDistribution} priorityData={priorityDistribution} /></CardContent></Card>
                    </div>
                </TabsContent>
                <TabsContent value="tasks" className="mt-4">
                    <Tabs defaultValue="kanban">
                        <TabsList><TabsTrigger value="backlog">Backlog ({backlog.length})</TabsTrigger><TabsTrigger value="sprints">Sprints ({projectSprints.length})</TabsTrigger><TabsTrigger value="kanban">Quadro Kanban</TabsTrigger></TabsList>
                        <TabsContent value="backlog" className="mt-4">
                            <Card>
                                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <CardTitle>Backlog do Produto</CardTitle>
                                    <div className="flex w-full sm:w-auto items-center gap-2"><Select value={targetSprintId} onValueChange={setTargetSprintId}><SelectTrigger className="flex-grow sm:flex-grow-0 sm:w-[180px]"><SelectValue placeholder="Mover para sprint..." /></SelectTrigger><SelectContent>{projectSprints.map(sprint => (<SelectItem key={sprint.id} value={sprint.id}>{sprint.name}</SelectItem>))}</SelectContent></Select><Button size="sm" onClick={() => handleBulkUpdateTasks(Array.from(selectedBacklogTasks), targetSprintId)} disabled={selectedBacklogTasks.size === 0 || !targetSprintId}>Mover ({selectedBacklogTasks.size})</Button><Button size="sm" onClick={() => setModalState({ type: 'newTask' })}><Plus className="mr-2 h-4 w-4" />Adicionar Tarefa</Button></div>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                    {backlog.map(task => (<div key={task.id} draggable onDragStart={(e) => handleDragStart(e, task)}><TaskCard task={task as any} isSelected={selectedBacklogTasks.has(task.id)} onSelect={handleBacklogTaskSelect} onView={(t) => setModalState({ type: "viewTask", data: t })} onEdit={(t) => setModalState({ type: "editTask", data: t })} onDelete={(id) => { setShowDeleteConfirmation(true); setItemToDelete({ type: "task", id, name: task.title })}} onStatusChange={handleTaskStatusChange} /></div>))}
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="sprints" className="mt-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Sprints</CardTitle><Button size="sm" onClick={() => setModalState({ type: 'newSprint' })}><Plus className="mr-2 h-4 w-4" /> Nova Sprint</Button></CardHeader>
                                <CardContent className="space-y-4">
                                    {projectSprints.length > 0 ? projectSprints.map(sprint => { const selectedTasksInThisSprint = Array.from(selectedSprintTasks).filter(taskId => sprint.tasks.some(t => t.id === taskId)); return (<Card key={sprint.id} onDragOver={handleDragOver} onDrop={(e) => handleDropOnSprint(e, sprint.id)}><CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"><div><CardTitle>{sprint.name}</CardTitle><CardDescription>{sprint.startDate && new Date(sprint.startDate).toLocaleDateString('pt-BR')}{" - "}{sprint.endDate && new Date(sprint.endDate).toLocaleDateString('pt-BR')}</CardDescription></div><Button size="sm" variant="outline" onClick={() => handleBulkUpdateTasks(selectedTasksInThisSprint, null)} disabled={selectedTasksInThisSprint.length === 0}>Mover para Backlog ({selectedTasksInThisSprint.length})</Button></CardHeader><CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{sprint.tasks.length > 0 ? sprint.tasks.map(task => (<TaskCard key={task.id} task={task as any} isSelected={selectedSprintTasks.has(task.id)} onSelect={handleSprintTaskSelect} onView={(t) => setModalState({ type: "viewTask", data: t })} onEdit={(t) => setModalState({ type: "editTask", data: t })} onDelete={(id) => {setShowDeleteConfirmation(true); setItemToDelete({ type: "task", id, name: task.title })}} />)) : (<div className="col-span-full text-sm text-slate-500">Arraste tarefas do backlog para cá.</div>)}</CardContent></Card>)}) : <p className="text-sm text-slate-500">Nenhuma sprint foi criada para este projeto.</p>}
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="kanban" className="mt-4">
                            <div className="flex items-center gap-2 mb-4"><Label className="flex-shrink-0 flex items-center gap-2"><GitBranch className="h-4 w-4" /> Sprint Ativa</Label><Select value={selectedSprintId} onValueChange={setSelectedSprintId}><SelectTrigger className="max-w-xs"><SelectValue placeholder="Selecione uma sprint para visualizar..." /></SelectTrigger><SelectContent>{projectSprints.map(sprint => (<SelectItem key={sprint.id} value={sprint.id}>{sprint.name}</SelectItem>))}</SelectContent></Select></div>
                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">{(['todo', 'doing', 'done', 'canceled'] as TaskStatus[]).map((status) => (<div key={status} onDragOver={handleDragOver} onDrop={(e) => handleDropOnKanban(e, status)} className="flex flex-col gap-2 rounded-lg bg-slate-50 p-4 min-h-[200px]"><h3 className="font-semibold text-slate-800 capitalize">{status} ({(kanbanTasks[status] ?? []).length})</h3>{(kanbanTasks[status] ?? []).map((task) => (<div key={task.id} draggable onDragStart={(e) => handleDragStart(e, task)}><TaskCard task={task as any} onView={(t) => setModalState({ type: "viewTask", data: t })} onEdit={(t) => setModalState({ type: "editTask", data: t })} onDelete={(id) => { setShowDeleteConfirmation(true); setItemToDelete({ type: "task", id, name: task.title })}} onStatusChange={handleTaskStatusChange} /></div>))}</div>))}</div>
                        </TabsContent>
                    </Tabs>
                </TabsContent>
                <TabsContent value="members" className="mt-4">
                    <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle>Membros do Projeto</CardTitle><Button size="sm" onClick={() => setModalState({ type: 'addMember' })}><UserPlus className="mr-2 h-4 w-4"/>Convidar Membro</Button></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Função no Projeto</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader><TableBody>{project.members.map(member => (<TableRow key={member.id}><TableCell className="flex items-center gap-3"><Avatar className="h-9 w-9"><AvatarFallback>{member.name?.charAt(0).toUpperCase()}</AvatarFallback></Avatar><div><p className="font-semibold">{member.name}</p><p className="text-sm text-slate-500">{member.email}</p></div></TableCell><TableCell><Badge variant="secondary">{member.projectRole}</Badge></TableCell><TableCell className="text-right"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-5 w-5"/></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onSelect={() => setModalState({ type: 'editMember', data: member })}><Shield className="mr-2 h-4 w-4"/> Alterar Função</DropdownMenuItem><DropdownMenuItem onSelect={() => { setShowDeleteConfirmation(true); setItemToDelete({ type: 'member', id: member.id, name: member.name || member.email })}} className="text-red-500"><Trash className="mr-2 h-4 w-4"/> Remover do Projeto</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>))}</TableBody></Table></CardContent></Card>
                </TabsContent>
                <TabsContent value="settings" className="mt-4 space-y-6">
                    <Card><CardHeader><CardTitle>Informações do Projeto</CardTitle><CardDescription>Altere o nome, descrição e o status geral do projeto.</CardDescription></CardHeader><form onSubmit={handleEditProject}><CardContent className="space-y-4"><div className="space-y-2"><Label htmlFor="name">Nome do Projeto</Label><Input id="name" name="name" defaultValue={project.name}/></div><div className="space-y-2"><Label htmlFor="description">Descrição</Label><Textarea id="description" name="description" defaultValue={project.description || ''}/></div><div className="space-y-2"><Label htmlFor="status">Status do Projeto</Label><Select name="status" defaultValue={project.status}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="active">Ativo</SelectItem><SelectItem value="paused">Pausado</SelectItem><SelectItem value="completed">Concluído</SelectItem><SelectItem value="archived">Arquivado</SelectItem></SelectContent></Select></div></CardContent><CardFooter><Button type="submit">Salvar Alterações</Button></CardFooter></form></Card>
                    <Card className="border-destructive"><CardHeader><CardTitle className="text-destructive">Zona de Perigo</CardTitle></CardHeader><CardContent><div className="flex items-center justify-between"><div><p className="font-semibold">Excluir este projeto</p><p className="text-sm text-slate-600">Esta ação é permanente e não pode ser desfeita.</p></div><Button variant="destructive" onClick={() => { setShowDeleteConfirmation(true); setItemToDelete({ type: 'project', id: project.id, name: project.name })}}><Trash className="mr-2 h-4 w-4"/> Excluir Projeto</Button></div></CardContent></Card>
                </TabsContent>
            </Tabs>
            <TaskFormModal
                isOpen={modalState.type === 'newTask' || modalState.type === 'editTask'}
                onClose={() => setModalState({ type: null })}
                onSubmit={handleTaskFormSubmit}
                task={modalState.type === 'editTask' ? modalState.data : null}
                projects={projectsForModal}
                users={project.members}
                sprints={projectSprints}
                taskTypes={taskTypes}
            />
            <TaskDetailsModal
                isOpen={modalState.type === 'viewTask'}
                onClose={() => setModalState({ type: null })}
                task={taskForViewModal}
                onDataRefresh={() => fetchData(true)}
                onStatusChange={handleTaskStatusChange}
                onTaskUpdate={handleTaskUpdate}
                members={project.members}
                taskTypes={taskTypes}
            />
            <Dialog open={modalState.type === 'addMember'} onOpenChange={() => setModalState({ type: null })}><DialogContent><DialogHeader><DialogTitle>Convidar Novo Membro</DialogTitle></DialogHeader><div className="grid gap-4 py-4"><Label>Usuário</Label><Select name="userId" required value={selectedUser} onValueChange={setSelectedUser}><SelectTrigger><SelectValue placeholder="Selecione um usuário..."/></SelectTrigger><SelectContent>{systemUsers.filter(su => !project.members.some(pm => pm.id === su.id)).map(user => (<SelectItem key={user.id} value={user.id}>{user.name} ({user.email})</SelectItem>))}</SelectContent></Select><Label>Função no Projeto</Label><Select name="roleId" required value={selectedRole} onValueChange={setSelectedRole}><SelectTrigger><SelectValue placeholder="Selecione uma função..."/></SelectTrigger><SelectContent>{projectRoles.map(role => ( <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem> ))}</SelectContent></Select></div><DialogFooter><Button variant="outline" type="button" onClick={() => setModalState({ type: null })}>Cancelar</Button><Button type="button" onClick={handleAddMember}>Adicionar</Button></DialogFooter></DialogContent></Dialog>
            <Dialog open={modalState.type === 'editMember'} onOpenChange={() => setModalState({ type: null })}><form onSubmit={handleUpdateMemberRole}><DialogContent><DialogHeader><DialogTitle>Alterar Função de {modalState.data?.name}</DialogTitle></DialogHeader><div className="grid gap-4 py-4"><Label>Nova Função</Label><Select name="roleId" defaultValue={projectRoles.find(r => r.name === modalState.data?.projectRole)?.id} required><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{projectRoles.map(role => ( <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem> ))}</SelectContent></Select></div><DialogFooter><Button variant="outline" type="button" onClick={() => setModalState({ type: null })}>Cancelar</Button><Button type="submit">Salvar</Button></DialogFooter></DialogContent></form></Dialog>
            <Dialog open={modalState.type === 'newSprint'} onOpenChange={() => setModalState({ type: null })}><DialogContent><form onSubmit={handleCreateSprint}><DialogHeader><DialogTitle>Criar Nova Sprint</DialogTitle></DialogHeader><div className="grid gap-4 py-4"><div className="grid gap-2"><Label htmlFor="sprint-name">Nome da Sprint</Label><Input id="sprint-name" name="name" required /></div><div className="grid gap-2"><Label htmlFor="start-date">Data de Início</Label><Input id="start-date" name="startDate" type="date" required /></div><div className="grid gap-2"><Label htmlFor="end-date">Data de Término</Label><Input id="end-date" name="endDate" type="date" required /></div></div><DialogFooter><Button variant="outline" type="button" onClick={() => setModalState({ type: null })}>Cancelar</Button><Button type="submit">Criar Sprint</Button></DialogFooter></form></DialogContent></Dialog>
            <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>A ação de excluir "{itemToDelete?.name}" não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        </DashboardLayout>
    )
}