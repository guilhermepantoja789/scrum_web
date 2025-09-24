"use client"

import { useState, useEffect } from "react"
import type { TaskWithRelations as TaskDTO, Member as MemberDTO } from "@/lib/data/projects"
import { useAuthContext } from "@/context/AuthContext"
import { useToast } from "@/hooks/use-toast"
import type { TaskStatus, TaskPriority, TaskType } from "@prisma/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { EditableField } from "@/components/ui/EditableField"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, GitBranch, GanttChartSquare, Flag, Star, Calendar, MessageSquare, Paperclip, CheckCircle2, HelpCircle } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Icon } from "@/components/ui/Icon"
import { Input } from "@/components/ui/input"
import {Avatar, AvatarFallback} from "@/components/ui/avatar";

type Props = {
    isOpen: boolean
    onClose: () => void
    task: TaskDTO | null
    onDataRefresh: () => void
    onStatusChange: (taskId: string, status: TaskStatus) => void
    onTaskUpdate: (taskId: string, data: Partial<Pick<TaskDTO, 'title' | 'description' | 'assigneeId' | 'priority' | 'dueDate' | 'typeId'>>) => void
    members: MemberDTO[]
    taskTypes: TaskType[]
}

function DetailItem({ icon: Icon, label, children }: { icon: React.ElementType, label: string, children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-[auto,1fr] items-start gap-x-3">
            <Icon className="h-4 w-4 text-slate-500 mt-1" />
            <div className="grid gap-y-1">
                <span className="font-semibold text-slate-800">{label}</span>
                <div className="text-slate-600">{children}</div>
            </div>
        </div>
    )
}

export function TaskDetailsModal({ isOpen, onClose, task, onDataRefresh, onStatusChange, onTaskUpdate, members, taskTypes }: Props) {
    const { getAuthHeaders } = useAuthContext()
    const { toast } = useToast()
    const [newComment, setNewComment] = useState("");
    const [isCommenting, setIsCommenting] = useState(false);
    const [description, setDescription] = useState(task?.description || "");

    useEffect(() => {
        if (task) {
            setDescription(task.description || "");
        }
    }, [task]);

    const handleAddComment = async () => {
        if (!newComment.trim() || !task) return;
        setIsCommenting(true);
        try {
            const response = await fetch(`/api/tasks/${task.id}/comments`, {
                method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ content: newComment })
            });
            const result = await response.json();
            if (response.ok) {
                toast({ title: "Sucesso", description: "Comentário adicionado." });
                setNewComment("");
                onDataRefresh();
            } else {
                toast({ title: "Erro", description: result.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Erro de Rede", description: "Não foi possível adicionar o comentário.", variant: "destructive" });
        } finally {
            setIsCommenting(false);
        }
    }

    const formatDateForInput = (date: string | null | undefined) => {
        if (!date) return '';
        return date.split('T')[0];
    }

    if (!task) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <EditableField
                        initialValue={task.title}
                        onSave={(newValue) => onTaskUpdate(task.id, { title: newValue })}
                        displayClassName="text-2xl font-bold"
                        inputClassName="text-2xl h-10"
                    />
                    <DialogDescription>
                        <span>
                            No projeto <Badge variant="outline">{task.project?.name}</Badge>
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6 overflow-y-auto flex-grow pr-4">
                    <div className="md:col-span-2 space-y-6">
                        <div>
                            <h3 className="font-semibold mb-2 text-slate-800">Descrição</h3>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                onBlur={() => onTaskUpdate(task.id, { description: description })}
                                placeholder="Adicione uma descrição mais detalhada..."
                                className="h-32"
                            />
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5" /> Atividade e Comentários
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4 max-h-60 overflow-y-auto">
                                    {task.comments.map(comment => (
                                        <div key={comment.id} className="flex gap-3">
                                            <Avatar className="h-8 w-8"><AvatarFallback>{comment.author.name?.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                                            <div>
                                                <p className="text-sm font-semibold">{comment.author.name} <span className="text-xs font-normal text-slate-500">{new Date(comment.createdAt).toLocaleString('pt-BR')}</span></p>
                                                <div className="mt-1 text-sm bg-slate-100 p-3 rounded-md">{comment.content}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 flex flex-col gap-2">
                                    <Textarea placeholder="Adicionar um comentário..." value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                                    <Button onClick={handleAddComment} disabled={isCommenting || !newComment.trim()} className="self-start">
                                        {isCommenting ? "Enviando..." : "Comentar"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="md:col-span-1">
                        <Card>
                            <CardHeader><CardTitle className="text-lg">Detalhes</CardTitle></CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <DetailItem icon={GanttChartSquare} label="Status">
                                    <div className="flex flex-col items-start gap-2">
                                        <Badge className="capitalize text-sm">{task.status}</Badge>
                                        <div className="flex gap-1 flex-wrap">
                                            {(["todo", "doing", "done", "canceled"] as TaskStatus[]).map((s) => (
                                                task.status !== s && (
                                                    <Button key={s} size="sm" variant="outline" className="capitalize h-7 px-2 text-xs" onClick={() => onStatusChange(task.id, s)}>
                                                        {s}
                                                    </Button>
                                                )
                                            ))}
                                        </div>
                                    </div>
                                </DetailItem>
                                <Separator />
                                <DetailItem icon={task.type ? (p: any) => <Icon name={task.type!.icon as any} {...p} /> : HelpCircle} label="Tipo">
                                    <Select
                                        value={task.typeId || 'none'}
                                        onValueChange={(value) => onTaskUpdate(task.id, { typeId: value === 'none' ? null : value })}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Selecione um tipo..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Nenhum</SelectItem>
                                            {taskTypes.map(type => (
                                                <SelectItem key={type.id} value={type.id}>
                                                    <div className="flex items-center gap-2">
                                                        <Icon name={type.icon as any} className="h-4 w-4" style={{ color: type.color }}/>
                                                        <span>{type.name}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </DetailItem>
                                <DetailItem icon={User} label="Responsável">
                                    <Select
                                        value={task.assigneeId || 'unassigned'}
                                        onValueChange={(value) => onTaskUpdate(task.id, { assigneeId: value === 'unassigned' ? null : value })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unassigned">Ninguém</SelectItem>
                                            {members.map(member => (
                                                <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </DetailItem>
                                <DetailItem icon={Flag} label="Prioridade">
                                    <Select
                                        value={task.priority}
                                        onValueChange={(value) => onTaskUpdate(task.id, { priority: value as TaskPriority })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Baixa</SelectItem>
                                            <SelectItem value="medium">Média</SelectItem>
                                            <SelectItem value="high">Alta</SelectItem>
                                            <SelectItem value="urgent">Urgente</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </DetailItem>
                                <DetailItem icon={GitBranch} label="Sprint">{task.sprint?.name || "Backlog"}</DetailItem>
                                <DetailItem icon={Star} label="Pontos">{task.storyPoints ?? "N/D"}</DetailItem>
                                <DetailItem icon={Calendar} label="Entrega">
                                    <Input
                                        type="date"
                                        value={formatDateForInput(task.dueDate)}
                                        onChange={(e) => onTaskUpdate(task.id, { dueDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                                        className="h-8 text-sm"
                                    />
                                </DetailItem>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}