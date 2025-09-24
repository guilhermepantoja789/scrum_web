// Local: components/kanban/SprintTasksModal.tsx

"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { TaskCard } from "@/components/kanban/TaskCard"
import { FolderKanban } from "lucide-react"
import type { SprintWithTasks as SprintDTO, TaskWithRelations as TaskDTO } from "@/lib/data/projects"

type Props = {
    sprint: SprintDTO | null
    isOpen: boolean
    onClose: () => void
    // Funções para passar para o TaskCard, tornando-os interativos
    onViewTask: (task: TaskDTO) => void
    onEditTask: (task: TaskDTO) => void
    onDeleteTask: (taskId: string, taskName: string) => void
}

export function SprintTasksModal({ sprint, isOpen, onClose, onViewTask, onEditTask, onDeleteTask }: Props) {
    if (!sprint) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Tarefas da Sprint: {sprint.name}</DialogTitle>
                    <DialogDescription>
                        Todas as tarefas planejadas para esta sprint no projeto "{sprint.project.name}".
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-grow overflow-y-auto p-1 pr-4">
                    {sprint.tasks.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sprint.tasks.map(task => (
                                <TaskCard
                                    key={task.id}
                                    task={task as any}
                                    onView={onViewTask}
                                    onEdit={onEditTask}
                                    onDelete={(taskId) => onDeleteTask(taskId, task.title)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 rounded-lg border-2 border-dashed">
                            <FolderKanban className="h-16 w-16 text-slate-300" />
                            <p className="mt-4 font-medium text-slate-700">Nenhuma tarefa nesta sprint.</p>
                            <p className="text-sm">Você pode mover tarefas do backlog para cá.</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}