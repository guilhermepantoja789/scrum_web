"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Lock, Mail, User as UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuthContext } from "@/context/AuthContext"
import type { User } from "@prisma/client"

// Tipos para as requisições e respostas
type LoginRequest = { email: string; password: string }
type RegisterRequest = { name: string; email: string; password: string }
type UserWithoutPassword = Omit<User, "password">
type AuthResponse = {
    success: boolean
    message: string
    data?: {
        token: string
        user: UserWithoutPassword & { role: any }
    }
}

export default function LoginPage() {
    const router = useRouter()
    const { login, isAuthenticated, isLoading: isAuthLoading } = useAuthContext()
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string>("")
    const [success, setSuccess] = useState<string>("")

    // NOVO ESTADO: Controla se o sistema já foi inicializado com um admin
    const [systemInitialized, setSystemInitialized] = useState<boolean | null>(null)

    // EFEITO PARA VERIFICAR O STATUS DO SISTEMA NA PRIMEIRA RENDERIZAÇÃO
    useEffect(() => {
        const checkSystemStatus = async () => {
            try {
                const response = await fetch('/api/system/status');

                // ✅ ETAPA 1: VERIFICA SE A RESPOSTA DA API FOI BEM-SUCEDIDA
                if (!response.ok) {
                    // Se a API retornar um erro (404, 500, etc.), lança um erro para o catch.
                    throw new Error(`O servidor respondeu com o status: ${response.status}`);
                }

                const data = await response.json();
                setSystemInitialized(data.hasAdmin);
                setError("") // Limpa qualquer erro se a chamada for bem-sucedida

            } catch (err) {
                // ✅ ETAPA 2: O CATCH AGORA SÓ TRATA DO LOG E DO ESTADO, SEM MOSTRAR ERRO
                console.error("Falha ao verificar status do sistema, assumindo modo de configuração inicial:", err);

                // Não exibe mais uma mensagem de erro para o usuário, pois o fallback é o comportamento desejado.
                // setError("Não foi possível conectar ao servidor para verificar o status do sistema.");

                // Define o estado para mostrar o formulário de criação de admin.
                setSystemInitialized(false);
            }
        };
        checkSystemStatus();
    }, []);

    // Redireciona se o usuário já estiver logado
    useEffect(() => {
        if (!isAuthLoading && isAuthenticated) {
            router.push("/dashboard")
        }
    }, [isAuthenticated, isAuthLoading, router])

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")
        setSuccess("")

        const formData = new FormData(e.currentTarget)
        const loginData: LoginRequest = {
            email: formData.get("email") as string,
            password: formData.get("password") as string,
        }

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(loginData)
            })

            const result: AuthResponse = await response.json()

            if (result.success && result.data?.token && result.data?.user) {
                login(result.data.token, result.data.user)
                setSuccess("Login bem-sucedido! Redirecionando...")
                router.push("/dashboard")
            } else {
                setError(result.message)
            }
        } catch (error) {
            setError("Erro ao fazer login. Tente novamente.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")
        setSuccess("")

        const formData = new FormData(e.currentTarget)
        const password = formData.get("register-password") as string
        const confirmPassword = formData.get("confirm-password") as string

        if (password !== confirmPassword) {
            setError("As senhas não coincidem")
            setIsLoading(false)
            return
        }

        const registerData: RegisterRequest = {
            name: formData.get("name") as string,
            email: formData.get("register-email") as string,
            password: password,
        }

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(registerData)
            })

            const result: AuthResponse = await response.json()

            if (result.success && result.data?.token && result.data?.user) {
                login(result.data.token, result.data.user)
                setSuccess("Cadastro realizado com sucesso! Redirecionando...")
                router.push("/dashboard")
            } else {
                setError(result.message)
            }
        } catch (error) {
            setError("Erro ao fazer cadastro. Tente novamente.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleFormInteraction = () => {
        // ✅ ETAPA 3: Limpa as mensagens de erro/sucesso quando o usuário interage
        if (error) setError("");
        if (success) setSuccess("");
    }

    // Formulário de registro (reutilizado em ambos os cenários)
    const RegisterForm = () => (
        <form onSubmit={handleRegister}>
            <CardContent className="space-y-4 pt-4">
                {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">{error}</div>}
                {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">{success}</div>}

                <div className="space-y-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <div className="relative"><UserIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" /><Input id="name" name="name" placeholder="Seu nome" required className="pl-10" onFocus={handleFormInteraction} /></div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <div className="relative"><Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" /><Input id="register-email" name="register-email" placeholder="seu@email.com" type="email" className="pl-10" required onFocus={handleFormInteraction} /></div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="register-password">Senha</Label>
                    <div className="relative"><Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" /><Input id="register-password" name="register-password" type={showPassword ? "text" : "password"} className="pl-10 pr-10" required minLength={6} onFocus={handleFormInteraction} /><Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-10 w-10 text-slate-400" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</Button></div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar senha</Label>
                    <Input id="confirm-password" name="confirm-password" type="password" required onFocus={handleFormInteraction} />
                </div>
            </CardContent>
            <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? "Aguarde..." : (systemInitialized ? "Registar" : "Criar Conta Admin")}</Button>
            </CardFooter>
        </form>
    );

    // Tela de loading inicial
    if (isAuthLoading || systemInitialized === null) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md">
                <Card className="border-slate-200 shadow-lg">
                    {/* Renderização Condicional */}
                    {!systemInitialized ? (
                        <>
                            <CardHeader className="space-y-1 text-center">
                                <CardTitle className="text-2xl font-bold text-slate-800">Bem-vindo!</CardTitle>
                                <CardDescription>Para começar, crie a conta do administrador principal.</CardDescription>
                            </CardHeader>
                            <RegisterForm />
                        </>
                    ) : (
                        <>
                            <CardHeader className="space-y-1 text-center">
                                <CardTitle className="text-2xl font-bold text-slate-800">Scrum Master</CardTitle>
                                <CardDescription>Gerencie seus projetos com metodologia Scrum</CardDescription>
                            </CardHeader>
                            <Tabs defaultValue="login" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="login">Login</TabsTrigger>
                                    <TabsTrigger value="register">Cadastro</TabsTrigger>
                                </TabsList>
                                <TabsContent value="login">
                                    <form onSubmit={handleLogin}>
                                        <CardContent className="space-y-4 pt-4">
                                            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">{error}</div>}
                                            {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">{success}</div>}
                                            <div className="space-y-2"><Label htmlFor="email">Email</Label><div className="relative"><Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" /><Input id="email" name="email" placeholder="seu@email.com" type="email" className="pl-10" required /></div></div>
                                            <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="password">Senha</Label></div><div className="relative"><Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" /><Input id="password" name="password" type={showPassword ? "text" : "password"} className="pl-10 pr-10" required /><Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-10 w-10 text-slate-400" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</Button></div></div>
                                        </CardContent>
                                        <CardFooter>
                                            <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? "A entrar..." : "Entrar"}</Button>
                                        </CardFooter>
                                    </form>
                                </TabsContent>
                                <TabsContent value="register">
                                    <RegisterForm />
                                </TabsContent>
                            </Tabs>
                        </>
                    )}
                </Card>
            </div>
        </div>
    )
}