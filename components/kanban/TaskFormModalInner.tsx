"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Icon } from "@/components/ui/Icon"
import type { Project, User, Task, Sprint, TaskType } from "@prisma/client"
import { TaskPriority } from "@prisma/client" // TaskPriority importado como valor
import type { SprintWithTasks as SprintDTO } from "@/lib/data/projects"

const schema = z.object({
    title: z.string().min(3, { message: "O título deve ter no mínimo 3 caracteres." }),
    description: z.string().optional().nullable(),
    assigneeId: z.string().optional().nullable(),
    sprintId: z.string().optional().nullable(),
    priority: z.nativeEnum(TaskPriority).optional(),
    typeId: z.string().optional().nullable(),
})

export type TaskFormValues = z.infer<typeof schema>

type Props = {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: TaskFormValues) => void
    task?: Partial<Task> & { typeId?: string | null } | null
    projects: Partial<Project>[]
    users: Partial<User>[]
    sprints: SprintDTO[]
    taskTypes: TaskType[]
}

function TaskFormModalInner({ isOpen, onClose, onSubmit, task, projects, users, sprints, taskTypes }: Props) {
    const form = useForm<TaskFormValues>({
        resolver: zodResolver(schema),
        defaultValues: { title: "", description: "", assigneeId: "", sprintId: "", priority: "medium", typeId: "" },
    })

    useEffect(() => {
        if (task) {
            form.reset({
                title: task.title || "",
                description: task.description || "",
                assigneeId: task.assigneeId || "unassigned",
                sprintId: task.sprintId || "backlog",
                priority: task.priority || "medium",
                typeId: task.typeId || "",
            })
        } else {
            form.reset({
                title: "",
                description: "",
                priority: "medium",
                assigneeId: "unassigned",
                sprintId: "backlog",
                typeId: "",
            })
        }
    }, [task, isOpen, form])

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            form.reset();
            onClose();
        }
    }

    const handleFormSubmit = (data: TaskFormValues) => {
        const processedData = {
            ...data,
            sprintId: data.sprintId === 'backlog' ? null : data.sprintId,
            assigneeId: data.assigneeId === 'unassigned' ? null : data.assigneeId,
            typeId: data.typeId === '' ? null : data.typeId,
        };
        onSubmit(processedData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{task ? "Editar Tarefa" : "Criar Nova Tarefa"}</DialogTitle>
                    <DialogDescription>
                        {task ? "Altere as informações da tarefa abaixo." : "Preencha os detalhes da nova tarefa."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                        <FormField control={form.control} name="title" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Título</FormLabel>
                                <FormControl><Input placeholder="Ex: Implementar tela de login" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>

                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Descrição</FormLabel>
                                <FormControl><Textarea placeholder="Detalhes da tarefa..." {...field} value={field.value ?? ''} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>

                        <FormField
                            control={form.control}
                            name="typeId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione um tipo..." /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="">Nenhum</SelectItem>
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
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="sprintId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Sprint</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value ?? 'backlog'}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione uma sprint" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="backlog">Backlog</SelectItem>
                                            {sprints.map(s => (
                                                <SelectItem key={s.id} value={s.id!}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}/>

                            <FormField control={form.control} name="assigneeId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Responsável</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value ?? 'unassigned'}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione um membro" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="unassigned">Ninguém</SelectItem>
                                            {users.map(u => (
                                                <SelectItem key={u.id} value={u.id!}>{u.name ?? u.email}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        </div>

                        <FormField
                            control={form.control}
                            name="priority"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Prioridade</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value ?? 'medium'}>
                                        <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="low">Baixa</SelectItem>
                                            <SelectItem value="medium">Média</SelectItem>
                                            <SelectItem value="high">Alta</SelectItem>
                                            <SelectItem value="urgent">Urgente</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleOpenChange.bind(null, false)}>Cancelar</Button>
                            <Button type="submit">{task ? "Salvar Alterações" : "Criar Tarefa"}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

export default TaskFormModalInner