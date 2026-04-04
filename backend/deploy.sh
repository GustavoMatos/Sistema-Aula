#!/bin/bash

###############################################################################
# Script de Deploy - Lead Tracker Backend
# Uso: ./deploy.sh [servidor]
# Exemplo: ./deploy.sh user@203.0.113.50
###############################################################################

set -e  # Exit on error

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configurações
DEPLOY_USER="${1}"
REMOTE_DIR="/var/www/lead-tracker-api"
LOCAL_DIR="$(pwd)"

if [ -z "$DEPLOY_USER" ]; then
  echo -e "${RED}❌ Erro: Informe o servidor${NC}"
  echo "Uso: ./deploy.sh user@ip-do-servidor"
  echo "Exemplo: ./deploy.sh ubuntu@203.0.113.50"
  exit 1
fi

echo -e "${GREEN}🚀 Iniciando deploy do Lead Tracker API${NC}"
echo "Servidor: $DEPLOY_USER"
echo "Diretório remoto: $REMOTE_DIR"
echo ""

# 1. Build local
echo -e "${YELLOW}📦 1. Compilando TypeScript...${NC}"
npm run build

# 2. Criar diretório no servidor
echo -e "${YELLOW}📁 2. Preparando diretório no servidor...${NC}"
ssh "$DEPLOY_USER" "mkdir -p $REMOTE_DIR/logs"

# 3. Enviar arquivos
echo -e "${YELLOW}📤 3. Enviando arquivos...${NC}"
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.env' \
  --exclude 'logs' \
  --exclude '.git' \
  --exclude 'src' \
  "$LOCAL_DIR/" "$DEPLOY_USER:$REMOTE_DIR/"

# 4. Enviar .env (separadamente por segurança)
echo -e "${YELLOW}🔐 4. Enviando .env...${NC}"
if [ -f ".env.production" ]; then
  scp .env.production "$DEPLOY_USER:$REMOTE_DIR/.env"
else
  echo -e "${YELLOW}⚠️  Aviso: .env.production não encontrado. Usando .env${NC}"
  scp .env "$DEPLOY_USER:$REMOTE_DIR/.env"
fi

# 5. Instalar dependências no servidor
echo -e "${YELLOW}📚 5. Instalando dependências no servidor...${NC}"
ssh "$DEPLOY_USER" "cd $REMOTE_DIR && npm ci --production"

# 6. Reiniciar PM2
echo -e "${YELLOW}🔄 6. Reiniciando aplicação com PM2...${NC}"
ssh "$DEPLOY_USER" << 'ENDSSH'
cd /var/www/lead-tracker-api

# Instalar PM2 se não existir
if ! command -v pm2 &> /dev/null; then
  echo "Instalando PM2..."
  npm install -g pm2
fi

# Reiniciar ou iniciar aplicação
pm2 delete lead-tracker-api 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

ENDSSH

# 7. Verificar status
echo -e "${YELLOW}✅ 7. Verificando status...${NC}"
ssh "$DEPLOY_USER" "pm2 status"

echo ""
echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo ""
echo "📊 Comandos úteis:"
echo "  Ver logs:        ssh $DEPLOY_USER 'pm2 logs lead-tracker-api'"
echo "  Reiniciar:       ssh $DEPLOY_USER 'pm2 restart lead-tracker-api'"
echo "  Status:          ssh $DEPLOY_USER 'pm2 status'"
echo "  Monitorar:       ssh $DEPLOY_USER 'pm2 monit'"
echo ""
