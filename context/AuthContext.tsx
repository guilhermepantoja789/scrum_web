"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

// ✅ 1. DEFINIMOS O TIPO PARA A ROLE, QUE AGORA É UM OBJETO
type Role = {
    id: string;
    name: string;
    permissions: string[];
}

// ✅ 2. ATUALIZAMOS O TIPO DO USUÁRIO PARA USAR O NOVO TIPO ROLE
type User = {
    id: string
    name?: string | null
    email: string
    role?: Role // <-- AQUI ESTÁ A MUDANÇA PRINCIPAL
}

type AuthContextType = {
    user: User | null
    token: string | null
    isAuthenticated: boolean
    isLoading: boolean
    login: (token: string, user: User) => void
    logout: () => void
    getAuthHeaders: (extraHeaders?: Record<string, string>) => Record<string, string>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        try {
            const storedToken = localStorage.getItem("token")
            const storedUser = localStorage.getItem("user")

            if (storedToken && storedUser) {
                setToken(storedToken)
                setUser(JSON.parse(storedUser))
            }
        } catch (err) {
            console.error("Erro ao carregar sessão:", err)
        } finally {
            setIsLoading(false)
        }
    }, [])

    const login = (t: string, u: User) => {
        setToken(t)
        setUser(u)
        localStorage.setItem("token", t)
        localStorage.setItem("user", JSON.stringify(u))
    }

    const logout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" })
        } catch (err) {
            console.error("Erro ao chamar logout API:", err)
        }
        setToken(null)
        setUser(null)
        localStorage.removeItem("token")
        localStorage.removeItem("user")
    }

    const getAuthHeaders = (extraHeaders: Record<string, string> = {}) => {
        return token
            ? { Authorization: `Bearer ${token}`, ...extraHeaders }
            : { ...extraHeaders }
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: !!user,
                isLoading,
                login,
                logout,
                getAuthHeaders,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuthContext() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error("useAuthContext deve ser usado dentro do AuthProvider")
    return ctx
}