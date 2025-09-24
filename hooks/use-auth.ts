import { useState, useEffect } from 'react';
import type { User } from '@prisma/client';

// 1. Definimos o tipo seguro que será usado em todo o hook
type UserWithoutPassword = Omit<User, 'password'>;

// 2. Atualizamos o AuthState para usar o tipo seguro
interface AuthState {
    user: UserWithoutPassword | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

// O tipo de retorno do hook é atualizado para refletir as mudanças
export function useAuth(): AuthState & {
    login: (token: string, user: UserWithoutPassword) => void;
    logout: () => void;
    getAuthHeaders: () => Record<string, string>;
} {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: true,
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (token && userStr) {
            try {
                // 3. Garantimos que o usuário lido do localStorage também seja do tipo seguro
                const user: UserWithoutPassword = JSON.parse(userStr);
                setAuthState({
                    user,
                    token,
                    isAuthenticated: true,
                    isLoading: false,
                });
            } catch (error) {
                console.error('Erro ao carregar dados do usuário:', error);
                logout();
            }
        } else {
            setAuthState((prev) => ({ ...prev, isLoading: false }));
        }
    }, []);

    // 4. A função login agora aceita corretamente o UserWithoutPassword
    const login = (token: string, user: UserWithoutPassword) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setAuthState({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
        });
    };

    const logout = async () => {
        // Limpa o estado local
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setAuthState({ user: null, token: null, isAuthenticated: false, isLoading: false })

        // Chama a API para limpar o cookie do servidor
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error("Erro ao fazer logout no servidor:", error);
        }

        // Opcional: Redireciona para a página de login
        window.location.href = '/';
    }

    const getAuthHeaders = (): Record<string, string> => {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (authState.token) {
            headers['Authorization'] = `Bearer ${authState.token}`;
        }

        return headers;
    };

    return {
        ...authState,
        login,
        logout,
        getAuthHeaders,
    };
}