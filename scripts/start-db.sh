#!/bin/bash

echo "🚀 Iniciando PostgreSQL com Docker..."

# Verificar se o Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker primeiro."
    exit 1
fi

# Parar containers existentes (se houver)
echo "🛑 Parando containers existentes..."
docker-compose down

# Iniciar o PostgreSQL
echo "📦 Iniciando containers..."
docker-compose up -d

echo "⏳ Aguardando PostgreSQL inicializar..."
sleep 10

# Verificar se está rodando
if docker-compose ps | grep -q "Up"; then
    echo "✅ PostgreSQL está rodando!"
    echo "📊 Adminer (interface web) disponível em: http://localhost:8080"
    echo "🗄️  Banco de dados: localhost:5432"
    echo "👤 Usuário: admin"
    echo "🔑 Senha: admin123"
    echo "📛 Database: scrum_master"
else
    echo "❌ Erro ao iniciar PostgreSQL"
    docker-compose logs
fi
