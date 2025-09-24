"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

// Ícones
import { Check, Filter, Plus, Search, FolderKanban } from "lucide-react"

// Componentes UI
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

// Contexto de Autenticação e Tipos
import { useAuthContext as useAuth } from "@/context/AuthContext"
import type { Project, User } from "@prisma/client"

// Tipagem para o projeto com suas relações
export type ProjectWithRelations = Project & {
    owner: User | null
    members: User[]
}

export default function ProjectsPage() {
    const router = useRouter()
    const { toast } = useToast()
    const { isAuthenticated, isLoading: isAuthLoading, getAuthHeaders } = useAuth()

    // --- ESTADOS DO COMPONENTE ---
    const [projects, setProjects] = useState<ProjectWithRelations[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)

    // Estados para os filtros
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")

    // Estados para o modal de criação
    const [showNewProjectModal, setShowNewProjectModal] = useState(false)
    const [newProjectName, setNewProjectName] = useState("")
    const [newProjectDescription, setNewProjectDescription] = useState("")

    // --- EFEITOS (LIFECYCLE) ---

    // Redireciona para o login se o usuário não estiver autenticado
    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            router.push('/')
        }
    }, [isAuthenticated, isAuthLoading, router])

    // Busca os projetos da API quando o usuário está autenticado
    useEffect(() => {
        const fetchProjects = async () => {
            if (!isAuthenticated) return
            setIsLoading(true)
            try {
                const response = await fetch('/api/projects', {
                    headers: getAuthHeaders(),
                })
                const result = await response.json()
                if (result.success) {
                    setProjects(result.data || [])
                } else {
                    toast({
                        title: "Erro ao carregar projetos",
                        description: result.message || "Não foi possível buscar os projetos.",
                        variant: "destructive",
                    })
                }
            } catch (error) {
                toast({
                    title: "Erro de Rede",
                    description: "Houve um problema de conexão ao buscar os projetos.",
                    variant: "destructive",
                })
            } finally {
                setIsLoading(false)
            }
        }

        fetchProjects()
    }, [isAuthenticated, getAuthHeaders, router, toast])


    // --- FUNÇÕES DE AÇÃO (HANDLERS) ---

    const handleCreateProject = async () => {
        if (!newProjectName.trim()) {
            toast({ title: "Validação falhou", description: "O nome do projeto é obrigatório.", variant: "destructive"})
            return
        }

        setIsCreating(true)
        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    name: newProjectName,
                    description: newProjectDescription
                }),
            })
            const result = await response.json()

            if (result.success) {
                toast({ title: "Sucesso!", description: "Projeto criado com sucesso." })
                // Atualiza a lista de projetos localmente para evitar uma nova chamada de API
                setProjects(prev => [result.data, ...prev])
                setShowNewProjectModal(false)
                setNewProjectName("")
                setNewProjectDescription("")
            } else {
                toast({ title: "Erro", description: result.message, variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Erro de Rede", description: "Não foi possível criar o projeto.", variant: "destructive" })
        } finally {
            setIsCreating(false)
        }
    }

    // --- DADOS MEMORIZADOS ---

    // Filtra os projetos com base na busca e no status selecionado
    const filteredProjects = useMemo(() => {
        return projects.filter((project) => {
            const searchMatch = project.name.toLowerCase().includes(searchQuery.toLowerCase())
            const statusMatch = statusFilter === 'all' || project.status === statusFilter
            return searchMatch && statusMatch
        })
    }, [projects, searchQuery, statusFilter])

    // Formata a data para o padrão brasileiro
    const formatDate = (dateString: string | Date) => {
        if (!dateString) return 'Não definido'
        return new Date(dateString).toLocaleDateString('pt-BR')
    }

    // --- RENDERIZAÇÃO ---

    // Estado de Carregamento Inicial
    if (isAuthLoading || isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-slate-600">Carregando seus projetos...</p>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                {/* Cabeçalho da Página */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-bold text-slate-800">Projetos</h1>
                    <Dialog open={showNewProjectModal} onOpenChange={setShowNewProjectModal}>
                        <DialogTrigger asChild>
                            <Button><Plus className="mr-2 h-4 w-4" /> Novo Projeto</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Criar Novo Projeto</DialogTitle>
                                <DialogDescription>Preencha as informações abaixo para criar um novo projeto.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nome do Projeto</Label>
                                    <Input id="name" placeholder="Ex: Lançamento do App" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description">Descrição</Label>
                                    <Textarea id="description" placeholder="Descreva o objetivo do projeto" value={newProjectDescription} onChange={(e) => setNewProjectDescription(e.target.value)} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowNewProjectModal(false)} disabled={isCreating}>Cancelar</Button>
                                <Button onClick={handleCreateProject} disabled={!newProjectName.trim() || isCreating}>{isCreating ? 'Criando...' : 'Criar Projeto'}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Filtros */}
                <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input placeholder="Buscar projetos pelo nome..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-[140px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="active">Ativo</SelectItem>
                                <SelectItem value="completed">Concluído</SelectItem>
                                <SelectItem value="paused">Pausado</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" aria-label="Mais filtros"><Filter className="h-4 w-4" /></Button>
                    </div>
                </div>

                {/* Lista de Projetos */}
                {filteredProjects.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredProjects.map((project) => (
                            <Link href={`/projects/${project.id}`} key={project.id} className="block">
                                <Card className="flex flex-col h-full transition-all hover:shadow-lg">
                                    <CardHeader>
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0"> {/* Permite que o texto quebre corretamente */}
                                                <CardTitle>{project.name}</CardTitle>
                                                {/* CORREÇÃO APLICADA: break-words */}
                                                <CardDescription className="mt-1 line-clamp-2 break-words">{project.description || 'Sem descrição'}</CardDescription>
                                            </div>
                                            <span className={cn( "flex-shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                                                project.status === "active" && "bg-blue-100 text-blue-800",
                                                project.status === "completed" && "bg-green-100 text-green-800",
                                                project.status === "paused" && "bg-yellow-100 text-yellow-800",
                                            )}>{project.status}</span>
                                        </div>
                                    </CardHeader>
                                    <div className="flex-grow"></div> {/* Empurra o footer para baixo */}
                                    <CardFooter className="border-t pt-4">
                                        {/* CORREÇÃO APLICADA: flex-wrap e gap-2 */}
                                        <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
                                            <span className="text-slate-500">
                                              Criado em {formatDate(project.createdAt)} por {project.owner?.name || "Sem dono"}
                                            </span>
                                            <span className="text-slate-500">
                                              {(project.members ?? []).length} membro(s)
                                            </span>
                                            <Button asChild variant="ghost" size="sm" className="gap-1 text-xs -mr-3">
                                                <span className="flex items-center"><Check className="h-3 w-3 mr-1" /> Detalhes</span>
                                            </Button>
                                        </div>
                                    </CardFooter>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    // ADICIONADO: Estado de nenhum projeto encontrado
                    <div className="text-center py-16 border-2 border-dashed rounded-lg">
                        <FolderKanban className="mx-auto h-12 w-12 text-slate-400" />
                        <h3 className="mt-2 text-sm font-semibold text-slate-900">Nenhum projeto encontrado</h3>
                        <p className="mt-1 text-sm text-slate-500">Tente ajustar seus filtros ou crie um novo projeto.</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}