import app from './app.js'
import { config } from './config/index.js'
import { logger } from './utils/logger.js'

const PORT = config.port

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`)
  logger.info(`Environment: ${config.env}`)
  logger.info(`Frontend URL: ${config.frontendUrl}`)
  
  if (!config.supabase.url) {
    logger.warn('Supabase URL not configured')
  }
  if (!config.evolution.url) {
    logger.warn('Evolution API URL not configured')
  }
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`)
  process.exit(1)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`)
  process.exit(1)
})
