#!/usr/bin/env node
/**
 * Script para configurar webhook manualmente na Evolution API
 *
 * Uso:
 * node setup-webhook.js NOME_DA_INSTANCIA API_KEY_DA_INSTANCIA [WEBHOOK_URL]
 *
 * Exemplo:
 * node setup-webhook.js "minha-instancia" "abc123" "http://192.168.1.10:3001"
 */

import axios from 'axios';

const EVOLUTION_API_URL = 'https://evo.azzoasset.com.br';
const GLOBAL_API_KEY = 'fUkENETOME3AoAWLTqRIBDWT89GGYDj9';

async function setupWebhook() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('❌ Uso: node setup-webhook.js NOME_DA_INSTANCIA [API_KEY] [WEBHOOK_URL]');
    console.error('');
    console.error('Exemplos:');
    console.error('  node setup-webhook.js "minha-instancia"');
    console.error('  node setup-webhook.js "minha-instancia" "abc123"');
    console.error('  node setup-webhook.js "minha-instancia" "abc123" "http://192.168.1.10:3001"');
    process.exit(1);
  }

  const instanceName = args[0];
  const apiKey = args[1] || GLOBAL_API_KEY;
  const webhookUrl = args[2] || 'http://localhost:3001';

  console.log('🔧 Configurando webhook...');
  console.log(`📱 Instância: ${instanceName}`);
  console.log(`🔗 Webhook URL: ${webhookUrl}/api/webhooks/evolution`);
  console.log('');

  try {
    const response = await axios.post(
      `${EVOLUTION_API_URL}/webhook/set/${instanceName}`,
      {
        url: `${webhookUrl}/api/webhooks/evolution`,
        enabled: true,
        webhookByEvents: true,
        webhookBase64: false,
        events: [
          'MESSAGES_UPSERT',
          'MESSAGES_UPDATE',
          'CONNECTION_UPDATE',
          'QRCODE_UPDATED'
        ]
      },
      {
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Webhook configurado com sucesso!');
    console.log('');
    console.log('Resposta da API:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');
    console.log('🧪 Para testar:');
    console.log('1. Envie uma mensagem para o número WhatsApp conectado');
    console.log('2. Verifique os logs do backend');
    console.log('3. Verifique se o lead foi criado automaticamente');

  } catch (error) {
    console.error('❌ Erro ao configurar webhook:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

setupWebhook();
