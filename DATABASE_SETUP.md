# 🗄️ Setup do Banco PostgreSQL Local

## Pré-requisitos

- Docker e Docker Compose instalados
- Node.js e pnpm

## 🚀 Iniciar o Banco de Dados

### Opção 1: Scripts automatizados (Linux/Mac)
```bash
# Iniciar banco
pnpm run db:start

# Parar banco
pnpm run db:stop

# Reiniciar banco (limpar dados)
pnpm run db:reset
```

### Opção 2: Comandos manuais
```bash
# Iniciar containers
docker-compose up -d

# Parar containers
docker-compose down

# Ver logs
docker-compose logs postgres
```

## 📊 Acesso ao Banco

### Adminer (Interface Web)
- URL: http://localhost:8080
- Sistema: PostgreSQL
- Servidor: postgres
- Usuário: admin
- Senha: admin123
- Base de dados: scrum_master

### Conexão Direta
- Host: localhost
- Porta: 5432
- Database: scrum_master
- Usuário: admin
- Senha: admin123

## 🏗️ Estrutura do Banco

O banco é criado automaticamente com:

### Tabelas
- `users` - Usuários do sistema
- `projetos` - Projetos Scrum
- `sprints` - Sprints dos projetos
- `tarefas` - Tarefas das sprints

### Dados Iniciais
- Usuário admin padrão (admin@exemplo.com / senha já com hash)
- Projeto de exemplo

## 🔧 Troubleshooting

### Erro de porta ocupada
```bash
# Ver o que está usando a porta 5432
lsof -i :5432

# Matar processo se necessário
sudo kill -9 <PID>
```

### Limpar dados completamente
```bash
docker-compose down -v
docker-compose up -d
```

### Verificar se está funcionando
```bash
docker-compose ps
docker-compose logs postgres
```

## 🌍 Variáveis de Ambiente

Copie `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

As variáveis já estão configuradas para o banco local.
