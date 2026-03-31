import { config } from './index.js'

export const evolutionConfig = {
  baseUrl: config.evolution.url,
  apiKey: config.evolution.apiKey,
  
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'apikey': this.apiKey,
    }
  },
}
