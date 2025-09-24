"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'

export function ApiTester() {
  const { isAuthenticated, getAuthHeaders, user } = useAuth()
  const [testResults, setTestResults] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testProjectsApi = async () => {
    setLoading(true)
    setTestResults('Testando API de projetos...\n')
    
    try {
      const response = await fetch('/api/projects', {
        headers: getAuthHeaders(),
        cache: 'no-store'
      })
      
      setTestResults(prev => prev + `Status: ${response.status}\n`)
      setTestResults(prev => prev + `Headers: ${JSON.stringify(Object.fromEntries(response.headers), null, 2)}\n`)
      
      if (response.ok) {
        const data = await response.json()
        setTestResults(prev => prev + `Resposta: ${JSON.stringify(data, null, 2)}\n`)
      } else {
        const error = await response.text()
        setTestResults(prev => prev + `Erro: ${error}\n`)
      }
    } catch (error) {
      setTestResults(prev => prev + `Erro de fetch: ${error}\n`)
    } finally {
      setLoading(false)
    }
  }

  const testAuth = () => {
    const authInfo = {
      isAuthenticated,
      user,
      token: localStorage.getItem('token'),
      headers: getAuthHeaders()
    }
    setTestResults(`Estado de autenticação:\n${JSON.stringify(authInfo, null, 2)}`)
  }

  const clearResults = () => {
    setTestResults('')
  }

  if (!isAuthenticated) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Debug API</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Usuário não autenticado</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Debug API</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button onClick={testAuth} variant="outline">
            Testar Auth
          </Button>
          <Button onClick={testProjectsApi} disabled={loading}>
            {loading ? 'Testando...' : 'Testar Projetos API'}
          </Button>
          <Button onClick={clearResults} variant="outline">
            Limpar
          </Button>
        </div>
        
        {testResults && (
          <div className="bg-gray-100 p-4 rounded-md">
            <pre className="text-sm whitespace-pre-wrap overflow-auto max-h-96">
              {testResults}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
