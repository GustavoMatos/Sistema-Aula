/**
 * PM2 Ecosystem Configuration
 * Para gerenciar o processo do backend em produção
 */

module.exports = {
  apps: [{
    name: 'lead-tracker-api',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    // Restart policy
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',

    // Logs
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

    // Advanced features
    min_uptime: '10s',
    max_restarts: 10,

    // Cron restart
    cron_restart: '0 3 * * *' // Restart diariamente às 3h
  }]
};
