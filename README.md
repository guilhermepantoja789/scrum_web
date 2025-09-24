# 🚀 Scrum Master - Sistema Completo

Sistema completo de gerenciamento Scrum com autenticação e banco PostgreSQL.

## ✨ Funcionalidades

### 🔐 Autenticação
- **Cadastro de usuários** com validação de email único
- **Login seguro** com JWT tokens
- **Controle de acesso** - só usuários autenticados acessam o sistema
- **Hash de senhas** com bcryptjs

### 📊 Gestão de Projetos
- **Criar projetos** com nome, descrição e datas
- **Listar projetos** do usuário logado
- **Editar e excluir** projetos
- **Filtros e busca** por nome

### 🏃‍♂️ Sprints e Tarefas
- **Criar sprints** vinculadas a projetos
- **Gerenciar tarefas** com status, prioridade e responsáveis
- **Quadro Kanban** para visualização de fluxo
- **Relatórios** de progresso

## 🗄️ Banco de Dados

**PostgreSQL Local** com Docker:
- Dados persistentes (não mais em memória)
- Relacionamentos entre usuários, projetos, sprints e tarefas
- Migrations automáticas na inicialização

## 🚀 Como Usar

### 1. Iniciar o Banco de Dados
```bash
# Subir PostgreSQL com Docker
docker-compose up -d

# Verificar se está rodando
docker-compose ps
```

### 2. Instalar Dependências
```bash
pnpm install
```

### 3. Iniciar o Projeto
```bash
pnpm run dev
```

### 4. Acessar o Sistema
- **URL**: http://localhost:3000
- **Primeira vez**: Crie uma conta na aba "Cadastro"
- **Login**: Use suas credenciais na aba "Login"

## 📋 Fluxo Completo

### 1. **Cadastro/Login**
- Acesse http://localhost:3000
- Cadastre uma nova conta ou faça login
- Sistema redireciona automaticamente para o dashboard

### 2. **Criar Projeto**
- No dashboard, clique em "Novo Projeto"
- Preencha nome e descrição
- Projeto é salvo no banco PostgreSQL

### 3. **Gerenciar Dados**
- **Projetos**: Página dedicada com CRUD completo
- **Sprints**: Criar sprints vinculadas aos projetos
- **Tarefas**: Adicionar tarefas às sprints
- **Kanban**: Visualizar progresso das tarefas

## 🛠️ APIs Disponíveis

### Autenticação
- `POST /api/auth/register` - Cadastro
- `POST /api/auth/login` - Login

### Projetos
- `GET /api/projects` - Listar projetos do usuário
- `POST /api/projects` - Criar projeto
- `PUT /api/projects/[id]` - Editar projeto
- `DELETE /api/projects/[id]` - Excluir projeto

### Sprints
- `GET /api/sprints` - Listar sprints
- `POST /api/sprints` - Criar sprint

### Tarefas
- `GET /api/tasks` - Listar tarefas
- `POST /api/tasks` - Criar tarefa

## 🔒 Segurança

- **JWT tokens** com expiração de 7 dias
- **Middleware de autenticação** em todas as APIs
- **Isolamento de dados** por usuário
- **Senhas com hash** bcrypt
- **Validações** de entrada em todas as APIs

## 🗃️ Estrutura do Banco

```sql
users (id, name, email, password, created_at, updated_at)
  ↓
projetos (id, nome, descricao, user_id, status, datas)
  ↓  
sprints (id, nome, projeto_id, user_id, datas, pontos)
  ↓
tarefas (id, titulo, projeto_id, sprint_id, assignee_id, status)
```

## 📊 Interface de Banco

**Adminer** (interface web do banco):
- **URL**: http://localhost:8080
- **Sistema**: PostgreSQL
- **Servidor**: postgres
- **Usuário**: admin
- **Senha**: admin123
- **Base**: scrum_master

## 🔧 Comandos Úteis

```bash
# Gerenciar banco
pnpm run db:start    # Iniciar PostgreSQL
pnpm run db:stop     # Parar PostgreSQL
pnpm run db:reset    # Reiniciar (limpar dados)

# Desenvolvimento
pnpm run dev         # Iniciar desenvolvimento
pnpm run build       # Build de produção
pnpm run start       # Iniciar produção
```

## 📁 Estrutura do Projeto

```
app/
├── api/auth/          # APIs de autenticação
├── api/projects/      # APIs de projetos
├── api/sprints/       # APIs de sprints
├── api/tasks/         # APIs de tarefas
├── dashboard/         # Dashboard principal
├── projects/          # Gestão de projetos
└── page.tsx          # Login/Cadastro

lib/
├── auth/             # Middleware de autenticação
├── data/             # Funções do banco
├── db/               # Conexão PostgreSQL
└── types/            # Tipos TypeScript

hooks/
└── use-auth.ts       # Hook de autenticação

database/
└── init/             # Scripts de inicialização do banco
```

## 🎯 Diferenças da Versão Anterior

### ❌ Antes (Dados Mockados)
- Dados em arrays JavaScript
- Perdidos ao recarregar página
- Sem autenticação real
- LocalStorage para persistência

### ✅ Agora (Banco Real)
- **PostgreSQL** com relacionamentos
- **Dados persistentes** entre sessões
- **Autenticação JWT** completa
- **APIs REST** funcionais
- **Controle de acesso** por usuário

## 🚀 Próximos Passos

1. **Deploy em produção** (Vercel + banco remoto)
2. **Adicionar mais funcionalidades** (comentários, anexos)
3. **Melhorar relatórios** (gráficos, métricas)
4. **Notificações** em tempo real
5. **Colaboração** entre usuários

---

**Sistema 100% funcional** com autenticação e banco de dados real! 🎉
