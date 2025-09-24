"use client"

import { useState, useEffect, useCallback } from "react"
import { BarChart, Calendar, Download, FileText, Filter, LineChart, PieChart, RefreshCcw, AlertCircle } from "lucide-react"

// Hooks, Tipos e Componentes da nossa arquitetura
import { useAuthContext } from "@/context/AuthContext"
import { useToast } from "@/hooks/use-toast"
import type { Project } from "@prisma/client"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { formatDateRange } from "@/lib/utils/date-formatter" // (Assumindo que o arquivo foi movido para lib/utils)
// (Assumindo que você tenha um componente DatePicker)
// import { DatePicker } from "@/components/ui/date-picker"

export default function ReportsPage() {
    const { getAuthHeaders, isAuthenticated } = useAuthContext()
    const { toast } = useToast()

    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [projects, setProjects] = useState<Project[]>([])
    const [activeTab, setActiveTab] = useState("overview")

    const [selectedProject, setSelectedProject] = useState("all")
    const [dateRange, setDateRange] = useState("last30")
    const [customDateRange, setCustomDateRange] = useState<{ start: Date | null, end: Date | null }>({ start: null, end: null })

    const [overviewData, setOverviewData] = useState<any>({ stats: {}, statusDistribution: [], priorityDistribution: [] })
    const [sprintsData, setSprintsData] = useState<any>({ sprints: [], impedimentos: [] })
    const [teamData, setTeamData] = useState<any>({ teamPerformance: [], timeToComplete: [] })

    const buildApiUrl = (baseUrl: string) => {
        const params = new URLSearchParams()
        if (selectedProject !== "all") {
            params.append('projectId', selectedProject)
        }
        params.append('dateRange', dateRange)
        if (dateRange === "custom" && customDateRange.start && customDateRange.end) {
            params.append('startDate', customDateRange.start.toISOString())
            params.append('endDate', customDateRange.end.toISOString())
        }
        return `${baseUrl}?${params.toString()}`
    }

    const loadAllData = useCallback(async () => {
        if (!isAuthenticated) return
        setIsLoading(true)
        setError(null)
        try {
            const [overviewRes, sprintsRes, teamRes] = await Promise.all([
                fetch(buildApiUrl("/api/reports/overview"), { headers: getAuthHeaders() }),
                fetch(buildApiUrl("/api/reports/sprints"), { headers: getAuthHeaders() }),
                fetch(buildApiUrl("/api/reports/team"), { headers: getAuthHeaders() }),
            ])
            const overviewResult = await overviewRes.json()
            const sprintsResult = await sprintsRes.json()
            const teamResult = await teamRes.json()

            if (overviewResult.success) setOverviewData(overviewResult.data)
            if (sprintsResult.success) setSprintsData(sprintsResult.data)
            if (teamResult.success) setTeamData(teamResult.data)

            if (!overviewResult.success || !sprintsResult.success || !teamResult.success) {
                throw new Error("Falha ao carregar um ou mais relatórios.")
            }
        } catch (err) {
            const errorMessage = (err instanceof Error) ? err.message : "Ocorreu um erro desconhecido."
            setError(errorMessage)
            toast({ title: "Erro ao Carregar Dados", description: errorMessage, variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }, [isAuthenticated, selectedProject, dateRange, customDateRange, getAuthHeaders, toast])

    useEffect(() => {
        const loadProjects = async () => {
            if (!isAuthenticated) return
            try {
                const response = await fetch("/api/reports/projects", { headers: getAuthHeaders() })
                const result = await response.json()
                if (result.success) {
                    setProjects(result.data)
                }
            } catch (error) {
                console.error("Erro ao carregar projetos:", error)
            }
        }
        loadProjects()
    }, [isAuthenticated, getAuthHeaders])

    useEffect(() => {
        loadAllData()
    }, [loadAllData])

    const exportReport = (format: string) => {
        toast({ title: "Funcionalidade em desenvolvimento", description: `A exportação para ${format} será implementada.` })
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-bold text-slate-800">Relatórios</h1>
                    <div className="flex flex-wrap items-center gap-2">
                        <Select value={selectedProject} onValueChange={setSelectedProject}>
                            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Selecionar projeto" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Projetos</SelectItem>
                                {projects.map((project) => (
                                    <SelectItem key={project.id} value={project.id}>
                                        {project.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={dateRange} onValueChange={setDateRange}>
                            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Período" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="last7">Últimos 7 dias</SelectItem>
                                <SelectItem value="last30">Últimos 30 dias</SelectItem>
                                <SelectItem value="last90">Últimos 90 dias</SelectItem>
                                <SelectItem value="custom">Personalizado</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" onClick={loadAllData} disabled={isLoading}>
                            <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        </Button>
                        <Button variant="outline" onClick={() => exportReport('PDF')}><Download className="mr-2 h-4 w-4" />Exportar</Button>
                    </div>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Erro</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
                        <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                        <TabsTrigger value="sprints">Sprints</TabsTrigger>
                        <TabsTrigger value="team">Equipe</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-4 space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{isLoading ? "..." : overviewData.stats.totalTarefas}</div></CardContent></Card>
                            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Tarefas Concluídas</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{isLoading ? "..." : overviewData.stats.tarefasConcluidas}</div><p className="text-xs text-slate-500">{overviewData.stats.percentualConcluidas}% do total</p></CardContent></Card>
                            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Tempo Médio de Conclusão</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{isLoading ? "..." : `${overviewData.stats.tempoMedioConclusao} dias`}</div></CardContent></Card>
                            <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Velocidade da Sprint</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{isLoading ? "..." : `${overviewData.velocity} pontos`}</div></CardContent></Card>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card><CardHeader><CardTitle>Burndown Chart</CardTitle><CardDescription>Progresso da sprint atual vs. ideal</CardDescription></CardHeader><CardContent><div className="h-64 bg-gray-100 flex items-center justify-center rounded-md"><p className="text-gray-500">Gráfico aqui</p></div></CardContent></Card>
                            <Card><CardHeader><CardTitle>Distribuição de Tarefas</CardTitle><CardDescription>Por status e prioridade</CardDescription></CardHeader><CardContent><div className="h-64 bg-gray-100 flex items-center justify-center rounded-md"><p className="text-gray-500">Gráfico aqui</p></div></CardContent></Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="sprints" className="mt-4 space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Desempenho das Sprints</CardTitle><CardDescription>Análise de velocidade e conclusão por sprint</CardDescription></CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <div className="grid grid-cols-5 gap-4 bg-slate-50 p-4 text-sm font-medium text-slate-600">
                                        <div>Sprint</div><div>Período</div><div>Tarefas Concluídas</div><div>Impedimentos</div>
                                    </div>
                                    {isLoading ? <div className="p-4 text-center">Carregando...</div> : sprintsData.sprints.map((sprint: any) => (
                                        <div key={sprint.id} className="grid grid-cols-5 gap-4 border-t p-4">
                                            <div className="font-medium">{sprint.nome}</div>
                                            <div>{formatDateRange(sprint.dataInicio, sprint.dataFim)}</div>
                                            <div>{sprint.tarefasConcluidas}/{sprint.totalTarefas}</div>
                                            <div>{sprint.impedimentos || 0}</div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="team" className="mt-4 space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Desempenho da Equipe</CardTitle><CardDescription>Análise de produtividade por membro</CardDescription></CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <div className="grid grid-cols-5 gap-4 bg-slate-50 p-4 text-sm font-medium text-slate-600">
                                        <div>Membro</div><div>Tarefas Totais</div><div>Concluídas</div><div>Pendentes</div><div>Eficiência</div>
                                    </div>
                                    {isLoading ? <div className="p-4 text-center">Carregando...</div> : teamData.teamPerformance.map((member: any) => (
                                        <div key={member.id} className="grid grid-cols-5 gap-4 border-t p-4">
                                            <div className="font-medium">{member.nome}</div>
                                            <div>{member.totalTarefas}</div>
                                            <div>{member.tarefasConcluidas}</div>
                                            <div>{member.tarefasPendentes}</div>
                                            <div>{member.eficiencia}%</div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}