"use client"

import { useMemo } from "react"
import type { TaskStatus } from "@prisma/client"
import type { TaskWithRelations as TaskDTO } from "@/lib/data/projects"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, GitBranch, Calendar } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/Icon"

type TaskCardProps = {
    task: TaskDTO
    isSelected?: boolean
    onSelect?: (taskId: string) => void
    onView?: (task: TaskDTO) => void
    onEdit?: (task: TaskDTO) => void
    onDelete?: (taskId: string) => void
    onStatusChange?: (id: string, status: TaskStatus) => void
}

export function TaskCard({ task, isSelected, onSelect, onView, onEdit, onDelete, onStatusChange }: TaskCardProps) {
    const dueDate = useMemo(() => (task.dueDate ? new Date(task.dueDate) : null), [task.dueDate])

    const getDueDateInfo = (date: Date | null) => {
        if (!date) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(date);
        dueDate.setHours(0, 0, 0, 0);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const formattedDate = dueDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        if (diffDays < 0) return { text: `Venceu ${formattedDate}`, color: 'text-red-600' };
        if (diffDays === 0) return { text: `Vence hoje`, color: 'text-red-600' };
        if (diffDays === 1) return { text: `Vence amanhã`, color: 'text-amber-600' };
        if (diffDays <= 3) return { text: `Vence em ${diffDays} dias`, color: 'text-amber-600' };
        return { text: `Vence em ${formattedDate}`, color: 'text-slate-500' };
    };

    const dueDateInfo = getDueDateInfo(dueDate);

    return (
        <Card
            className={cn(
                "transition-all flex flex-col h-full relative overflow-hidden",
                onSelect && "cursor-pointer hover:border-blue-500",
                onView && !onSelect && "cursor-pointer hover:shadow-md",
                isSelected && "border-blue-500 ring-2 ring-blue-200"
            )}
            onClick={() => onView?.(task)}
        >
            <div
                className="absolute left-0 top-0 h-full w-1.5"
                style={{ backgroundColor: task.type?.color || '#e2e8f0' }}
            />
            <div className="flex items-start p-4 pl-5 flex-grow">
                {onSelect && (
                    <div className="flex items-center h-full pr-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={isSelected} onCheckedChange={() => onSelect(task.id)} />
                    </div>
                )}
                <div className="flex-grow space-y-2">
                    <CardHeader className="p-0 space-y-2">
                        <div className="flex items-center gap-2">
                            {task.type && <Icon name={task.type.icon as any} className="h-4 w-4 flex-shrink-0" style={{ color: task.type.color }} />}
                            <CardTitle className="text-base font-semibold text-slate-800 leading-tight">{task.title}</CardTitle>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            <Badge variant="secondary" className="capitalize">{task.priority}</Badge>
                            {task.sprint?.name && <Badge variant="outline" className="flex items-center gap-1"><GitBranch className="h-3 w-3" />{task.sprint.name}</Badge>}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 text-sm text-slate-600 space-y-2">
                        {task.assignee && (
                            <span><span className="font-medium">Responsável: </span>{task.assignee.name || task.assignee.email}</span>
                        )}
                        {dueDateInfo && (
                            <div className={cn('flex items-center text-xs font-semibold', dueDateInfo.color)}>
                                <Calendar className="mr-1 h-3 w-3" />
                                {dueDateInfo.text}
                            </div>
                        )}
                    </CardContent>
                </div>
            </div>
            <CardFooter className="flex items-center justify-end gap-2 p-3 pt-2">
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button size="icon" variant="outline" onClick={() => onEdit?.(task)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="destructive" onClick={() => onDelete?.(task.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    )
}
export default TaskCard