# 🚀 Scrum Master Pro - Sistema de Gerenciamento de Projetos

Um sistema completo de gerenciamento de projetos e tarefas, inspirado em metodologias ágeis como Scrum e Kanban. Desenvolvido com Next.js, Prisma e PostgreSQL.

### ✨ Funcionalidades

*   **Gestão de Acesso e Segurança:**
    *   **Autenticação por JWT:** Login seguro utilizando `jose` para tokens JWT.
    *   **Controle de Papéis (Roles):** Sistema de permissões baseado em papéis (e.g., Admin, Member).
    *   **Hashing de Senhas:** Senhas armazenadas com segurança usando `bcryptjs`.
    *   **Middleware de Proteção:** Rotas de API e páginas protegidas, acessíveis apenas para usuários autenticados e autorizados.

*   **Gestão de Projetos:**
    *   **Criação e Gestão de Projetos:** CRUD completo para projetos com status (Ativo, Pausado, Concluído).
    *   **Equipes de Projeto:** Adicione membros a projetos com papéis específicos.
    *   **Ownership:** Projetos têm um "dono" claro.

*   **Organização com Sprints e Tarefas:**
    *   **Planejamento de Sprints:** Crie e gerencie sprints com datas de início/fim e pontuação (Story Points).
    *   **Gestão Completa de Tarefas:**
        *   CRUD de tarefas vinculadas a projetos e sprints.
        *   **Tipos de Tarefa:** Categorize tarefas (e.g., Funcionalidade, Bug, Melhoria) com ícones e cores customizáveis.
        *   **Prioridades:** Defina prioridades (Baixa, Média, Alta, Urgente).
        *   **Status:** Acompanhe o progresso com um fluxo claro (A Fazer, Fazendo, Feito, Cancelado).
        *   **Estimativas:** Utilize Story Points para estimar o esforço das tarefas.
        *   **Atribuição:** Desigine tarefas a membros específicos da equipe.
    *   **Subtarefas:** Quebre tarefas complexas em itens menores e gerenciáveis.

*   **Colaboração:**
    *   **Comentários:** Discuta tarefas diretamente na plataforma.
    *   **Anexos:** Adicione arquivos e documentos às tarefas.

*   **Visualização e Relatórios:**
    *   **Quadro Kanban:** Visualize o fluxo de trabalho das tarefas de forma intuitiva.
    *   **Dashboard:** Painel com visão geral do status dos projetos e tarefas.
    *   **Relatórios (em desenvolvimento):** Gráficos e métricas sobre o progresso das sprints e da equipe.

### 🛠️ Tech Stack

Esta aplicação é construída com um conjunto de tecnologias modernas e robustas:

-   **Framework:** [Next.js](https://nextjs.org/) (App Router)
-   **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
-   **ORM:** [Prisma](https://www.prisma.io/)
-   **Banco de Dados:** [PostgreSQL](https://www.postgresql.org/)
-   **Cache:** [Redis](https://redis.io/)
-   **UI:** [Tailwind CSS](https://tailwindcss.com/) com [shadcn/ui](https://ui.shadcn.com/) e [Radix UI](https://www.radix-ui.com/)
-   **Gerenciamento de Formulários:** [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
-   **Autenticação:** [Jose (JWT)](https://github.com/panva/jose)
-   **Visualização de Dados:** [Recharts](https://recharts.org/)
-   **Ambiente de Execução:** [Docker](https://www.docker.com/)

### 🚀 Começando

Siga estas instruções para configurar e rodar o projeto em seu ambiente de desenvolvimento local.

#### **Pré-requisitos**

-   [Node.js](https://nodejs.org/) (v20.x ou superior)
-   [pnpm](https://pnpm.io/installation) (v10.x ou superior)
-   [Docker](https://www.docker.com/get-started/) e [Docker Compose](https://docs.docker.com/compose/install/)

#### **Instalação e Configuração**

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/seu-repositorio.git
    cd seu-repositorio
    ```

2.  **Crie o arquivo de variáveis de ambiente:**
    Copie o arquivo de exemplo `.env.example` para um novo arquivo chamado `.env.local`. Os valores padrão já estão configurados para o ambiente Docker local.
    ```bash
    cp .env.example .env.local
    ```

3.  **Instale as dependências do projeto:**
    ```bash
    pnpm install
    ```

4.  **Inicie os serviços de backend (Banco de Dados e Cache):**
    Este comando irá iniciar os contêineres do PostgreSQL e do Redis em background.
    ```bash
    pnpm run db:start
    ```
    *Para verificar se os contêineres estão rodando, use `docker ps`.*

5.  **Popule o banco de dados com dados iniciais:**
    Este script irá aplicar as migrações do Prisma e executar o `seed` para criar dados essenciais, como papéis de usuário e tipos de tarefa.
    ```bash
    pnpm run db:seed
    ```

6.  **Inicie a aplicação em modo de desenvolvimento:**
    ```bash
    pnpm run dev
    ```

7.  **Acesse o sistema:**
    -   Abra seu navegador e acesse [http://localhost:3000](http://localhost:3000).
    -   A aplicação estará pronta para uso. Você pode criar uma nova conta ou explorar a API.

### 📜 Scripts Disponíveis

Todos os scripts podem ser executados com `pnpm run <nome-do-script>`.

| Comando         | Descrição                                                                                             |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| `dev`           | Inicia o servidor de desenvolvimento do Next.js em `http://localhost:3000`.                           |
| `build`         | Compila a aplicação para produção.                                                                    |
| `start`         | Inicia um servidor de produção após a compilação (`build`).                                           |
| `lint`          | Executa o linter (ESLint) para analisar o código em busca de problemas.                               |
| `db:start`      | Inicia os contêineres Docker do PostgreSQL, Redis e Adminer em background.                            |
| `db:stop`       | Para e remove os contêineres Docker definidos no `docker-compose.yml`.                                |
| `db:reset`      | Para, remove os contêineres e **deleta todos os volumes de dados** (PostgreSQL e Redis). Use com cuidado. |
| `db:seed`       | Executa o script `prisma/seed.ts` para popular o banco de dados com dados iniciais (requer `tsx`).      |

### 🗄️ Banco de Dados

O projeto utiliza **PostgreSQL** como banco de dados, gerenciado pelo ORM **Prisma**. A estrutura do banco de dados é definida no arquivo `prisma/schema.prisma`.

#### **Visão Geral do Schema**

O schema é modelado em torno dos seguintes conceitos principais:

-   **`User`**: Armazena informações dos usuários, como email, senha (com hash) e seu papel no sistema.
-   **`Role`**: Define os papéis dos usuários (ex: "Admin", "Member") e suas permissões.
-   **`Project`**: Representa um projeto, com um dono (`owner`) e múltiplos membros.
-   **`ProjectMember`**: Tabela de junção que conecta `User` e `Project`, definindo quem faz parte de qual projeto.
-   **`Sprint`**: Períodos de trabalho dentro de um projeto, com datas de início e fim e estimativas de pontos.
-   **`Task`**: A unidade de trabalho fundamental. Uma tarefa pertence a um projeto, pode estar em uma sprint e ser atribuída a um usuário.
-   **`TaskType`**: Tipos de tarefa customizáveis (ex: "Bug", "Funcionalidade") para melhor categorização.
-   **`Subtask`**: Itens menores para dividir uma `Task` principal.
-   **`Comment`** e **`Attachment`**: Permitem colaboração através de comentários e anexos de arquivos nas tarefas.

#### **Acesso via Adminer (Interface Gráfica)**

Uma interface web para o banco de dados (Adminer) fica disponível enquanto os contêineres Docker estão rodando.

-   **URL**: [http://localhost:8080](http://localhost:8080)
-   **Sistema**: `PostgreSQL`
-   **Servidor**: `db`
-   **Usuário**: `app`
-   **Senha**: `app`
-   **Base de Dados**: `app`

### 🔐 Segurança

-   **Autenticação JWT:** A comunicação com a API é protegida usando JSON Web Tokens (JWT) gerados pela biblioteca `jose`.
-   **Hashing de Senhas:** As senhas dos usuários são protegidas com o algoritmo `bcryptjs` antes de serem armazenadas.
-   **Middleware de Proteção:** Um middleware no Next.js intercepta requisições para rotas protegidas, validando o token JWT e as permissões do usuário antes de permitir o acesso.
-   **Variáveis de Ambiente:** Informações sensíveis, como segredos de token e URLs de conexão, são gerenciadas através de variáveis de ambiente (`.env.local`) e não são expostas no código-fonte.
