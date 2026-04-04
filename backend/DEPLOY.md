# 🚀 Guia de Deploy - Lead Tracker Backend

## 📋 Pré-requisitos no VPS

### 1. Node.js 18+
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar
node --version  # Deve ser v18+
npm --version
```

### 2. PM2 (Process Manager)
```bash
sudo npm install -g pm2
pm2 --version
```

### 3. Nginx (opcional, mas recomendado)
```bash
sudo apt-get install -y nginx
sudo systemctl status nginx
```

---

## 🔧 Passo 1: Configurar Ambiente de Produção

### Editar `.env.production`

```bash
cd /Users/gustavomatos/Desktop/Sistema\ Aula/backend
nano .env.production
```

**Substituir:**
- `WEBHOOK_BASE_URL=http://SEU-IP-VPS:3001`
- `FRONTEND_URL=http://SEU-FRONTEND-URL`

**Exemplo:**
```env
WEBHOOK_BASE_URL=http://203.0.113.50:3001
FRONTEND_URL=https://app.seudominio.com
```

---

## 🚀 Passo 2: Deploy Automático

### Executar Script de Deploy

```bash
cd /Users/gustavomatos/Desktop/Sistema\ Aula/backend

# Substitua pelo seu usuário e IP
./deploy.sh ubuntu@203.0.113.50
```

**O script vai:**
1. ✅ Compilar TypeScript (`npm run build`)
2. ✅ Enviar arquivos via rsync
3. ✅ Instalar dependências no servidor
4. ✅ Configurar PM2
5. ✅ Iniciar aplicação

---

## 🔧 Passo 3: Configurar Nginx (Recomendado)

### No servidor VPS:

```bash
# Copiar configuração
sudo cp /var/www/lead-tracker-api/nginx-config.conf /etc/nginx/sites-available/lead-tracker-api

# Editar e substituir SEU-DOMINIO.com
sudo nano /etc/nginx/sites-available/lead-tracker-api

# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/lead-tracker-api /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## 🔒 Passo 4: Configurar Firewall

```bash
# Permitir porta 3001 (se não usar Nginx)
sudo ufw allow 3001/tcp

# OU apenas porta 80/443 (se usar Nginx)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Habilitar firewall
sudo ufw enable
sudo ufw status
```

---

## 🧪 Passo 5: Testar

### Verificar se está rodando:

```bash
# No VPS
pm2 status
pm2 logs lead-tracker-api

# Do seu computador
curl http://SEU-IP-VPS:3001/health
```

**Resposta esperada:**
```json
{"status":"ok","timestamp":"..."}
```

---

## ⚙️ Passo 6: Configurar Webhook na Evolution API

Agora configure o webhook no painel da Evolution API:

**URL:** `http://SEU-IP-VPS:3001/api/webhooks/evolution`

**Eventos:**
- ✅ MESSAGES_UPSERT
- ✅ MESSAGES_UPDATE
- ✅ CONNECTION_UPDATE
- ✅ QRCODE_UPDATED

---

## 📊 Comandos Úteis

### Gerenciar Aplicação

```bash
# Ver logs em tempo real
ssh usuario@ip 'pm2 logs lead-tracker-api'

# Reiniciar
ssh usuario@ip 'pm2 restart lead-tracker-api'

# Parar
ssh usuario@ip 'pm2 stop lead-tracker-api'

# Status
ssh usuario@ip 'pm2 status'

# Monitorar recursos
ssh usuario@ip 'pm2 monit'
```

### Ver logs do Nginx

```bash
ssh usuario@ip 'tail -f /var/log/nginx/lead-tracker-api-access.log'
ssh usuario@ip 'tail -f /var/log/nginx/lead-tracker-api-error.log'
```

---

## 🔄 Atualizar Deploy

Para atualizar após mudanças no código:

```bash
cd /Users/gustavomatos/Desktop/Sistema\ Aula/backend
./deploy.sh ubuntu@203.0.113.50
```

O script vai automaticamente:
- Compilar novo código
- Enviar para servidor
- Reinstalar dependências
- Reiniciar aplicação

---

## 🐛 Troubleshooting

### Aplicação não inicia

```bash
# Ver logs de erro
ssh usuario@ip 'pm2 logs lead-tracker-api --err'

# Ver se porta está em uso
ssh usuario@ip 'lsof -i :3001'
```

### Webhook não funciona

1. **Verificar se backend está acessível:**
   ```bash
   curl http://SEU-IP-VPS:3001/api/webhooks/health
   ```

2. **Verificar logs do webhook:**
   ```bash
   ssh usuario@ip 'pm2 logs lead-tracker-api | grep Webhook'
   ```

3. **Verificar firewall:**
   ```bash
   ssh usuario@ip 'sudo ufw status'
   ```

### CORS Error

Verifique se `FRONTEND_URL` no `.env.production` está correto.

---

## 🔐 Segurança (Produção)

### 1. Usar HTTPS com Let's Encrypt

```bash
# No servidor
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d api.seudominio.com
```

### 2. Proteger variáveis de ambiente

```bash
# No servidor
chmod 600 /var/www/lead-tracker-api/.env
```

### 3. Configurar backup automático

```bash
# Cron para backup diário
0 3 * * * /usr/bin/rsync -a /var/www/lead-tracker-api /backup/
```

---

## ✅ Checklist de Deploy

- [ ] Node.js 18+ instalado no VPS
- [ ] PM2 instalado
- [ ] `.env.production` editado com IPs/domínios corretos
- [ ] Deploy executado com sucesso
- [ ] Aplicação rodando (`pm2 status`)
- [ ] Endpoint `/health` respondendo
- [ ] Firewall configurado
- [ ] Nginx configurado (opcional)
- [ ] Webhook configurado na Evolution API
- [ ] Teste de recebimento de mensagem realizado

---

**Pronto para deploy? Me avise se tiver dúvidas!**
