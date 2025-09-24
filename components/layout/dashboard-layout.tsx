"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BarChart3, Calendar, FolderKanban, Home, LogOut, Menu, Settings, Shield, User as UserIcon, Tags } from "lucide-react" // 1. Importar o novo ícone

// Componentes UI
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuthContext } from "@/context/AuthContext"

// Rotas principais
const mainRoutes = [
    { label: "Dashboard", icon: Home, href: "/dashboard" },
    { label: "Projetos", icon: FolderKanban, href: "/projects" },
    { label: "Sprints", icon: Calendar, href: "/sprints" },
    { label: "Kanban", icon: FolderKanban, href: "/kanban" },
    { label: "Relatórios", icon: BarChart3, href: "/reports" },
]

// Rotas de Administração
const adminRoutes = [
    { label: "Usuários", icon: UserIcon, href: "/admin/users" },
    { label: "Funções", icon: Shield, href: "/admin/roles" },
    // 2. ADICIONAR A NOVA ROTA AQUI
    { label: "Tipos de Tarefa", icon: Tags, href: "/admin/task-types" },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const { user, isAuthenticated, isLoading, logout } = useAuthContext()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/')
        }
    }, [isAuthenticated, isLoading, router])

    const handleLogout = () => {
        logout()
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return null
    }

    const UserMenu = () => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start p-2 h-auto">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback>{user?.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start truncate">
                            <span className="text-sm font-medium leading-none">{user?.name || 'Usuário'}</span>
                            <span className="text-xs text-slate-500 leading-none mt-1">{user?.email || ''}</span>
                        </div>
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )

    const NavLinks = ({ onClick }: { onClick?: () => void }) => (
        <nav className="flex-1 px-4 py-4 space-y-1">
            {mainRoutes.map((route) => (
                <Link key={route.href} href={route.href} onClick={onClick} className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${ pathname.startsWith(route.href) ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-100" }`}>
                    <route.icon className="h-5 w-5" />
                    <span>{route.label}</span>
                </Link>
            ))}
            {user?.role?.name?.toLowerCase() === 'admin' && (
                <div className="pt-4">
                    <h3 className="px-3 mb-2 text-xs font-semibold uppercase text-slate-500 tracking-wider">Administração</h3>
                    {adminRoutes.map((route) => (
                        <Link key={route.href} href={route.href} onClick={onClick} className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${ pathname.startsWith(route.href) ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-100" }`}>
                            <route.icon className="h-5 w-5" />
                            <span>{route.label}</span>
                        </Link>
                    ))}
                </div>
            )}
        </nav>
    )

    return (
        <div className="flex h-screen bg-slate-50">
            {/* Sidebar Desktop */}
            <aside className="hidden md:flex md:w-64 md:flex-col">
                <div className="flex flex-col h-full bg-white border-r border-slate-200">
                    <div className="flex items-center h-16 px-6 border-b"><Link href="/dashboard" className="flex items-center gap-2 font-bold text-slate-800"><Home className="h-5 w-5" /><span>Scrum Master</span></Link></div>
                    <NavLinks />
                    <div className="p-4 border-t border-slate-200"><UserMenu /></div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Header Mobile */}
                <header className="md:hidden flex items-center h-16 px-4 bg-white border-b border-slate-200">
                    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                        <SheetTrigger asChild><Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button></SheetTrigger>
                        <SheetContent side="left" className="w-64 p-0">
                            <div className="flex flex-col h-full">
                                <div className="flex items-center h-16 px-6 border-b"><Link href="/dashboard" className="flex items-center gap-2 font-bold text-slate-800"><Home className="h-5 w-5" /><span>Scrum Master</span></Link></div>
                                <NavLinks onClick={() => setSidebarOpen(false)} />
                                <div className="p-4 border-t border-slate-200"><UserMenu /></div>
                            </div>
                        </SheetContent>
                    </Sheet>
                    <div className="ml-auto"><UserMenu /></div>
                </header>

                <main className="flex-1 overflow-auto p-6">{children}</main>
            </div>
        </div>
    )
}