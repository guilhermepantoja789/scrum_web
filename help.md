# Comando úteis e anotações
+ docker exec <container> npx prisma migrate dev | Este é o comando mais importante. Ele vai ler seu arquivo schema.prisma, criar os arquivos de migração (se ainda não existirem) e aplicar a estrutura das tabelas no seu banco de dados.
+ docker exec <container> npx prisma generate | Este comando lê o schema.prisma e atualiza os tipos TypeScript dentro de node_modules/@prisma/client para que seu código tenha autocomplete e type-safety com base nos seus models.
+ docker exec <container> npx prisma db seed | Aliementa o banco com dados iniciais (seed.ts)