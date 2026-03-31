import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { config } from './config/index.js'
import { apiLimiter } from './middlewares/rateLimit.middleware.js'
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js'
import routes from './routes/index.js'

const app = express()

// Security middlewares
app.use(helmet())
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}))

// Rate limiting
app.use('/api', apiLimiter)

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// API routes
app.use('/api', routes)

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'Lead Tracking System API',
    version: '0.1.0',
    docs: '/api/health',
  })
})

// Error handling
app.use(notFoundHandler)
app.use(errorHandler)

export default app
