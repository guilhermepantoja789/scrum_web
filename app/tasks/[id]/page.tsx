"use client"

import React, { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Check, Paperclip, Plus, Send, X, Calendar, User as UserIcon, Flag, CircleDot, Badge } from "lucide-react"

// Hooks, Tipos e Componentes da nossa arquitetura
import { useAuthContext } from "@/context/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Task, Subtask, Comment, User, Sprint, Project, TaskStatus, TaskPriority } from "@prisma/client"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

// Tipo de dados completo que a página espera da API
type TaskDetails = Task & {
    project: { id: string, name: string } | null
    assignee: { name: string, email: string } | null
    sprint: { name: string } | null
    subtasks: Subtask[]
    comments: (Comment & { author: { name: string, email: string } })[]
}

export default function TaskDetailPage() {
    const params = useParams()
    const taskId = params.id as string
    const { getAuthHeaders, isAuthenticated, user: currentUser } = useAuthContext()
    const { toast } = useToast()

    const [task, setTask] = useState<TaskDetails | null>(null)
    const [users, setUsers] = useState<Partial<User>[]>([])
    const [sprints, setSprints] = useState<Sprint[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [newSubtaskTitle, setNewSubtaskTitle] = useState("")
    const [commentText, setCommentText] = useState("")

    const fetchData = useCallback(async () => {
        if (!isAuthenticated || !taskId) return;
        setIsLoading(true);
        try {
            const taskRes = await fetch(`/api/tasks/${taskId}`, { headers: getAuthHeaders() });
            const taskResult = await taskRes.json(); // Declaramos aqui

            if (taskResult.success) {
                const taskData = taskResult.data;
                setTask(taskData);

                const [usersRes, sprintsRes] = await Promise.all([
                    fetch(`/api/users`, { headers: getAuthHeaders() }),
                    fetch(`/api/sprints?projectId=${taskData.projectId}`, { headers: getAuthHeaders() })
                ]);
                const usersResult = await usersRes.json();
                const sprintsResult = await sprintsRes.json();
                if(usersResult.success) setUsers(usersResult.data);
                if(sprintsResult.success) setSprints(sprintsResult.data);

            } else {
                // Agora 'taskResult' está acessível aqui
                toast({ title: "Erro", description: taskResult.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Erro de Rede", description: "Não foi possível carregar a tarefa.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, taskId, getAuthHeaders, toast]);

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleUpdateTask = async (data: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>) => {
        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            })
            const result = await response.json()
            if(result.success) {
                toast({ title: "Sucesso", description: "Tarefa atualizada." })
                // Otimização: atualiza o estado localmente antes de recarregar tudo
                setTask(prev => prev ? { ...prev, ...data } : null)
                // Recarrega em segundo plano para garantir consistência
                fetchData()
            } else {
                toast({ title: "Erro", description: result.message, variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Erro de Rede", description: "Não foi possível atualizar a tarefa.", variant: "destructive" })
        }
    }

    const handleAddSubtask = async () => {
        if (!newSubtaskTitle.trim()) return
        try {
            const response = await fetch('/api/subtasks', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ title: newSubtaskTitle, taskId }),
            })
            const result = await response.json()
            if(result.success) {
                toast({ title: "Sucesso", description: "Subtarefa adicionada." })
                fetchData() // Recarrega os dados
                setNewSubtaskTitle("")
            } else {
                toast({ title: "Erro", description: result.message, variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Erro de Rede", description: "Não foi possível adicionar a subtarefa.", variant: "destructive" })
        }
    }

    const handleToggleSubtask = async (subtask: Subtask) => {
        try {
            const response = await fetch(`/api/subtasks/${subtask.id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ completed: !subtask.completed })
            });
            const result = await response.json();
            if (result.success) {
                fetchData(); // Recarrega
            } else {
                toast({ title: "Erro", description: result.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Erro de Rede", description: "Não foi possível atualizar a subtarefa.", variant: "destructive" });
        }
    }

    const handleAddComment = async () => {
        if (!commentText.trim()) return
        try {
            const response = await fetch('/api/comments', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ content: commentText, taskId })
            });
            const result = await response.json();
            if (result.success) {
                toast({ title: "Sucesso", description: "Comentário adicionado." });
                fetchData();
                setCommentText("");
            } else {
                toast({ title: "Erro", description: result.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Erro de Rede", description: "Não foi possível adicionar o comentário.", variant: "destructive" });
        }
    }

    const formatDate = (dateString?: string | Date | null) => {
        if (!dateString) return "Não definida"
        return new Date(dateString).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
    }

    if (isLoading || !task) {
        return <DashboardLayout><div className="p-6 text-center">Carregando tarefa...</div></DashboardLayout>
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/projects/${task.projectId}`}><ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                    <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-200">
                        {task.project?.name}
                    </Badge>

                    {/* Para a prioridade, aplicamos classes de cor condicionalmente */}
                    <Badge className={cn(
                        "font-medium",
                        task.priority === 'high' && "border-transparent bg-red-100 text-red-800 hover:bg-red-200",
                        task.priority === 'urgent' && "border-transparent bg-purple-100 text-purple-800 hover:bg-purple-200",
                        task.priority === 'medium' && "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
                        task.priority === 'low' && "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200"
                    )}>
                        {task.priority}
                    </Badge>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <h1 className="text-2xl font-bold text-slate-800">{task.title}</h1>
                            </CardHeader>
                            <CardContent>
                                <h2 className="mb-2 text-sm font-medium text-slate-600">Descrição</h2>
                                <p className="text-sm text-slate-800 whitespace-pre-wrap">{task.description || "Nenhuma descrição fornecida."}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle className="text-lg">Subtarefas ({task.subtasks.filter(st => st.completed).length}/{task.subtasks.length})</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {task.subtasks.map((subtask) => (
                                        <div key={subtask.id} className="flex items-center gap-2 rounded-md border p-2">
                                            <Checkbox id={`subtask-${subtask.id}`} checked={subtask.completed} onCheckedChange={() => handleToggleSubtask(subtask)} />
                                            <Label htmlFor={`subtask-${subtask.id}`} className={cn("flex-1", subtask.completed && "line-through text-slate-500")}>
                                                {subtask.title}
                                            </Label>
                                        </div>
                                    ))}
                                    <div className="flex items-center gap-2 rounded-md border p-2">
                                        <Input placeholder="Adicionar nova subtarefa..." value={newSubtaskTitle} onChange={(e) => setNewSubtaskTitle(e.target.value)} className="flex-1 border-none focus:ring-0" />
                                        <Button size="sm" onClick={handleAddSubtask} disabled={!newSubtaskTitle.trim()}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle className="text-lg">Comentários</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {task.comments.map((comment) => (
                                        <div key={comment.id} className="flex gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={`https://i.pravatar.cc/32?u=${comment.author.email}`} alt={comment.author.name || ''} />
                                                <AvatarFallback>{comment.author.name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 rounded-md border p-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="font-medium text-sm">{comment.author.name}</div>
                                                    <div className="text-xs text-slate-500">{new Date(comment.createdAt).toLocaleString('pt-BR')}</div>
                                                </div>
                                                <p className="mt-1 text-sm text-slate-700">{comment.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 flex items-start gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={`https://i.pravatar.cc/32?u=${currentUser?.email}`} />
                                        <AvatarFallback>{currentUser?.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <Textarea placeholder="Adicionar um comentário..." value={commentText} onChange={(e) => setCommentText(e.target.value)} />
                                        <Button size="sm" className="mt-2" onClick={handleAddComment} disabled={!commentText.trim()}>
                                            <Send className="mr-2 h-4 w-4" /> Comentar
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader><h2 className="text-lg font-medium">Detalhes</h2></CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div className="flex justify-between items-center"><Label className="flex items-center gap-2 text-slate-500"><CircleDot className="h-4 w-4" /> Status</Label>
                                    <Select value={task.status} onValueChange={(value) => handleUpdateTask({ status: value as TaskStatus })}>
                                        <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                                        <SelectContent>{Object.values(TaskStatus).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="flex justify-between items-center"><Label className="flex items-center gap-2 text-slate-500"><UserIcon className="h-4 w-4" /> Responsável</Label>
                                    <Select value={task.assigneeId || ''} onValueChange={(value) => handleUpdateTask({ assigneeId: value === 'null' ? null : value })}>
                                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Não atribuído" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="null">Não atribuído</SelectItem>
                                            {users.map(u => <SelectItem key={u.id} value={u.id!}>{u.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex justify-between items-center"><Label className="flex items-center gap-2 text-slate-500"><Flag className="h-4 w-4" /> Prioridade</Label>
                                    <Select value={task.priority} onValueChange={(value) => handleUpdateTask({ priority: value as TaskPriority })}>
                                        <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                                        <SelectContent>{Object.values(TaskPriority).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="flex justify-between items-center"><Label className="flex items-center gap-2 text-slate-500"><Calendar className="h-4 w-4" /> Prazo</Label>
                                    <Input type="date" className="w-[180px]" value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''} onChange={(e) => handleUpdateTask({ dueDate: e.target.value ? new Date(e.target.value) : null })}/>
                                </div>
                                <div><Label>Criado em</Label><div className="text-slate-500">{formatDate(task.createdAt)}</div></div>
                                <div><Label>Atualizado em</Label><div className="text-slate-500">{formatDate(task.updatedAt)}</div></div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="text-lg">Anexos</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-sm text-slate-500">A funcionalidade de upload de arquivos é um tópico mais avançado, que envolve serviços de armazenamento.</p>
                                <Button variant="outline" className="w-full mt-4" disabled><Paperclip className="mr-2 h-4 w-4"/> Adicionar Anexo</Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}