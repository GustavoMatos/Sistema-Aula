import multer from 'multer'
import { BadRequestError } from '../utils/errors.js'

// CSV file upload configuration
export const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    // Accept CSV files
    const allowedMimes = ['text/csv', 'application/csv', 'text/plain']
    const isCSV = allowedMimes.includes(file.mimetype) || file.originalname.endsWith('.csv')

    if (isCSV) {
      cb(null, true)
    } else {
      cb(new BadRequestError('Apenas arquivos CSV são permitidos'))
    }
  },
})

// Image upload configuration (for future use)
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new BadRequestError('Apenas imagens são permitidas (JPEG, PNG, GIF, WebP)'))
    }
  },
})
