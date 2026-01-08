import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createApiClient } from './client.server'

vi.mock('@sveltejs/kit', () => ({
    error: (status: number) => {
        throw new Error(`SvelteKit error: ${status}`)
    },
}))

vi.mock('$app/server', () => ({
    getRequestEvent: vi.fn(),
}))

describe('createApiClient', () => {
    let mockFetch: ReturnType<typeof vi.fn>

    beforeEach(async () => {
        mockFetch = vi.fn()
        const { getRequestEvent } = await import('$app/server')

        vi.mocked(getRequestEvent).mockReturnValue({ fetch: mockFetch } as any)
    })

    it('should make a successful GET request', async () => {
        const apiClient = createApiClient({ base: 'https://api.example.com' })
        const mockData = { id: 1, name: 'Test' }

        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => mockData,
        })

        const result = await apiClient('/users')

        expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/users', {})
        expect(result).toEqual(mockData)
    })

    it('should call prepareRequest before making request', async () => {
        const prepareRequest = vi.fn((init: RequestInit) => {
            init.headers = { Authorization: 'Bearer token' }
        })

        const apiClient = createApiClient({
            base: 'https://api.example.com',
            prepareRequest,
        })

        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({}),
        })

        await apiClient('/users', { method: 'GET' })

        expect(prepareRequest).toHaveBeenCalledWith({
            method: 'GET',
            headers: { Authorization: 'Bearer token' },
        })
        expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/users', {
            method: 'GET',
            headers: { Authorization: 'Bearer token' },
        })
    })

    it('should return JSON for 4xx client errors', async () => {
        const apiClient = createApiClient({ base: 'https://api.example.com' })
        const errorData = { error: 'Not found' }

        mockFetch.mockResolvedValue({
            ok: false,
            status: 404,
            json: async () => errorData,
        })

        const result = await apiClient('/users/999')

        expect(result).toEqual(errorData)
    })

    it('should throw error for 5xx server errors', async () => {
        const apiClient = createApiClient({ base: 'https://api.example.com' })

        mockFetch.mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({ error: 'Internal server error' }),
        })

        await expect(apiClient('/users')).rejects.toThrow('SvelteKit error: 500')
    })

    it('should handle POST request with body', async () => {
        const apiClient = createApiClient({ base: 'https://api.example.com' })
        const mockResponse = { id: 1, created: true }

        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => mockResponse,
        })

        const result = await apiClient('/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'John' }),
        })

        expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'John' }),
        })
        expect(result).toEqual(mockResponse)
    })
})
