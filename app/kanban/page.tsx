"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, X } from "lucide-react"
import { useAuthContext } from "@/context/AuthContext"
import { useToast } from "@/hooks/use-toast"
import type { Project, Sprint, Task, TaskType, User } from "@prisma/client"

import DashboardLayout from "@/components/layout/dashboard-layout"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { TaskCard } from "@/components/kanban/TaskCard"
import { TaskWithRelations as TaskDTO } from "@/lib/data/projects"

// Um tipo para os filtros para manter o código limpo
type Filters = {
    searchQuery: string;
    projectId: string;
    sprintId: string;
    assigneeId: string;
    typeId: string;
}

export default function GlobalKanbanPage() {
    const { getAuthHeaders } = useAuthContext();
    const { toast } = useToast();

    // Estados para os dados
    const [tasks, setTasks] = useState<TaskDTO[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Estado para os filtros
    const [filters, setFilters] = useState<Filters>({
        searchQuery: '', projectId: 'all', sprintId: 'all', assigneeId: 'all', typeId: 'all'
    });

    // Função para buscar os dados que preenchem os filtros (projetos, usuários, etc.)
    const fetchFilterData = useCallback(async () => {
        try {
            const [projectsRes, usersRes, sprintsRes, typesRes] = await Promise.all([
                fetch('/api/projects', { headers: getAuthHeaders() }),
                fetch('/api/users', { headers: getAuthHeaders() }),
                fetch('/api/sprints', { headers: getAuthHeaders() }),
                fetch('/api/task-types', { headers: getAuthHeaders() }),
            ]);
            const projectsResult = await projectsRes.json();
            const usersResult = await usersRes.json();
            const sprintsResult = await sprintsRes.json();
            const typesResult = await typesRes.json();

            if (projectsResult.success) setProjects(projectsResult.data);
            if (usersResult.success) setUsers(usersResult.data);
            if (sprintsResult.success) setSprints(sprintsResult.data);
            if (typesResult.success) setTaskTypes(typesResult.data);

        } catch (error) {
            toast({ title: "Erro", description: "Não foi possível carregar os filtros.", variant: "destructive" });
        }
    }, [getAuthHeaders, toast]);

    // Busca os dados dos filtros na primeira renderização
    useEffect(() => {
        fetchFilterData();
    }, [fetchFilterData]);

    // Busca as tarefas toda vez que um filtro muda
    useEffect(() => {
        const fetchTasks = async () => {
            setIsLoading(true);
            const params = new URLSearchParams();

            if (filters.searchQuery) params.append('searchQuery', filters.searchQuery);
            if (filters.projectId !== 'all') params.append('projectId', filters.projectId);
            if (filters.sprintId !== 'all') params.append('sprintId', filters.sprintId);
            if (filters.assigneeId !== 'all') params.append('assigneeId', filters.assigneeId);
            if (filters.typeId !== 'all') params.append('typeId', filters.typeId);

            try {
                const response = await fetch(`/api/tasks?${params.toString()}`, { headers: getAuthHeaders() });
                const result = await response.json();
                if (result.success) {
                    setTasks(result.data);
                } else {
                    toast({ title: "Erro ao Filtrar", description: result.message, variant: "destructive" });
                }
            } catch (error) {
                toast({ title: "Erro de Rede", description: "Não foi possível buscar as tarefas.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };

        fetchTasks();
    }, [filters, getAuthHeaders, toast]);

    const handleFilterChange = (filterName: keyof Filters, value: string) => {
        setFilters(prev => ({ ...prev, [filterName]: value }));
    }

    const clearFilters = () => {
        setFilters({ searchQuery: '', projectId: 'all', sprintId: 'all', assigneeId: 'all', typeId: 'all' });
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Quadro de Tarefas Global</h1>
                </div>

                {/* BARRA DE FILTROS */}
                <div className="p-4 bg-white rounded-lg border space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <Input
                            placeholder="Buscar por título..."
                            className="lg:col-span-2"
                            value={filters.searchQuery}
                            onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                        />
                        <Select value={filters.projectId} onValueChange={(v) => handleFilterChange('projectId', v)}>
                            <SelectTrigger><SelectValue placeholder="Projeto" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Projetos</SelectItem>
                                {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={filters.sprintId} onValueChange={(v) => handleFilterChange('sprintId', v)}>
                            <SelectTrigger><SelectValue placeholder="Sprint" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as Sprints</SelectItem>
                                <SelectItem value="backlog">Backlog</SelectItem>
                                {sprints.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={filters.assigneeId} onValueChange={(v) => handleFilterChange('assigneeId', v)}>
                            <SelectTrigger><SelectValue placeholder="Responsável" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="unassigned">Ninguém</SelectItem>
                                {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center justify-between">
                        <Select value={filters.typeId} onValueChange={(v) => handleFilterChange('typeId', v)}>
                            <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Tipo de Tarefa" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Tipos</SelectItem>
                                <SelectItem value="none">Nenhum</SelectItem>
                                {taskTypes.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button variant="ghost" onClick={clearFilters}><X className="mr-2 h-4 w-4" /> Limpar Filtros</Button>
                    </div>
                </div>

                {/* Exibição dos Resultados */}
                <div className="text-sm text-slate-500">{isLoading ? 'Buscando tarefas...' : `${tasks.length} tarefa(s) encontrada(s).`}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {tasks.map(task => (
                        <TaskCard key={task.id} task={task} />
                    ))}
                </div>
            </div>
        </DashboardLayout>
    )
}