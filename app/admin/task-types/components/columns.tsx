"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { TaskType } from "@prisma/client"
import { MoreHorizontal, Trash, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Icon } from "@/components/ui/Icon"
import { useToast } from "@/hooks/use-toast"
import { useAuthContext } from "@/context/AuthContext"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"


export const columns = ({ onEdit, onRefresh }: { onEdit: (taskType: TaskType) => void, onRefresh: () => void }): ColumnDef<TaskType>[] => [
    {
        accessorKey: "name",
        header: "Nome",
        cell: ({ row }) => {
            const type = row.original;
            return (
                <div className="flex items-center gap-3 font-medium">
                    <div className="h-6 w-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${type.color}20` }}>
                        <Icon name={type.icon as any} className="h-4 w-4" style={{ color: type.color }} />
                    </div>
                    <span>{type.name}</span>
                </div>
            )
        }
    },
    {
        accessorKey: "color",
        header: "Cor",
        cell: ({ row }) => {
            const color = row.getValue("color") as string;
            return (
                <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: color }} />
                    <span className="font-mono text-sm">{color}</span>
                </div>
            )
        }
    },
    {
        accessorKey: "icon",
        header: "Ícone (Lucide)",
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const taskType = row.original
            const { toast } = useToast();
            const { getAuthHeaders } = useAuthContext();

            const handleDelete = async () => {
                try {
                    const response = await fetch(`/api/task-types/${taskType.id}`, {
                        method: 'DELETE',
                        headers: getAuthHeaders()
                    });
                    if (response.ok) {
                        toast({ title: "Sucesso", description: "Tipo de tarefa excluído." });
                        onRefresh();
                    } else {
                        const result = await response.json();
                        toast({ title: "Erro", description: result.message, variant: "destructive" });
                    }
                } catch (error) {
                    toast({ title: "Erro de Rede", description: "Não foi possível excluir.", variant: "destructive" });
                }
            }

            return (
                <AlertDialog>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onEdit(taskType)}>
                                <Edit className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-red-600">
                                    <Trash className="mr-2 h-4 w-4" /> Excluir
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Todas as tarefas associadas a este tipo serão desvinculadas.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )
        },
    },
]