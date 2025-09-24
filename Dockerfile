# ------------ Base ------------
FROM node:20-alpine

# Compatibilidade glibc
RUN apk add --no-cache libc6-compat

# Diretório de trabalho
WORKDIR /app

# ------------ PNPM ------------
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.15.1 --activate

# Copia manifests e Prisma (melhor cache)
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

# Instala dependências (inclui dev, pois não setamos NODE_ENV=production)
# Usa cache da store do pnpm
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Aprova pacotes que precisam rodar build scripts e aplica
# (Se nada estiver pendente, o comando apenas segue)
RUN pnpm approve-builds prisma @prisma/client @prisma/engines || true \
 && pnpm rebuild --filter prisma --filter @prisma/client || true

# Gera Prisma Client (independente do postinstall)
RUN pnpm exec prisma generate --schema ./prisma/schema.prisma

# Instala tsx globalmente (para rodar "tsx prisma/seed.ts")
RUN pnpm add -g tsx@^4

# Copia o restante do código
COPY . .

# Porta default do Next.js
EXPOSE 3000

# Comando padrão (em dev o docker-compose costuma sobrescrever)
CMD ["pnpm", "dev"]
