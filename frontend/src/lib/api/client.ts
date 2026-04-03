import { env } from '@/lib/env'
import { supabase } from '@/lib/supabase'

interface ApiError {
  error: string
  message?: string
}

class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = env.apiUrl
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession()

    return {
      'Content-Type': 'application/json',
      ...(session?.access_token && {
        Authorization: `Bearer ${session.access_token}`,
      }),
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: 'Unknown error',
      }))
      throw new Error(error.message || error.error || `HTTP ${response.status}`)
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T
    }

    return response.json()
  }

  async get<T>(path: string): Promise<T> {
    const headers = await this.getAuthHeaders()
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers,
    })
    return this.handleResponse<T>(response)
  }

  async post<T>(path: string, data?: unknown): Promise<T> {
    const headers = await this.getAuthHeaders()
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    })
    return this.handleResponse<T>(response)
  }

  async put<T>(path: string, data: unknown): Promise<T> {
    const headers = await this.getAuthHeaders()
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    })
    return this.handleResponse<T>(response)
  }

  async delete<T>(path: string): Promise<T> {
    const headers = await this.getAuthHeaders()
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers,
    })
    return this.handleResponse<T>(response)
  }

  async patch<T>(path: string, data: unknown): Promise<T> {
    const headers = await this.getAuthHeaders()
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    })
    return this.handleResponse<T>(response)
  }

  async upload<T>(path: string, formData: FormData): Promise<T> {
    const { data: { session } } = await supabase.auth.getSession()

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        ...(session?.access_token && {
          Authorization: `Bearer ${session.access_token}`,
        }),
      },
      body: formData,
    })
    return this.handleResponse<T>(response)
  }
}

export const apiClient = new ApiClient()
