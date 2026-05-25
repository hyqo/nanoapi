import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { withBaseUrl, withAuth, withContentType, withTimeout } from './middlewares.ts'

let mockFetch: ReturnType<typeof vi.fn<typeof fetch>>

beforeEach(() => {
    mockFetch = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('withBaseUrl', () => {
    it('prepends base URL to paths starting with /', () => {
        const middleware = withBaseUrl('https://api.example.com')
        middleware(mockFetch)('/users', {})
        expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/users', {})
    })

    it('leaves absolute URLs unchanged', () => {
        const middleware = withBaseUrl('https://api.example.com')
        middleware(mockFetch)('https://other.com/users', {})
        expect(mockFetch).toHaveBeenCalledWith('https://other.com/users', {})
    })

    it('leaves Request objects unchanged', () => {
        const req = new Request('https://other.com/users')
        const middleware = withBaseUrl('https://api.example.com')
        middleware(mockFetch)(req, {})
        expect(mockFetch).toHaveBeenCalledWith(req, {})
    })
})

describe('withAuth', () => {
    it('adds Authorization header with bearer token', () => {
        const middleware = withAuth(() => 'my-token')
        middleware(mockFetch)('/test', {})
        const headers = mockFetch.mock.calls[0][1].headers as Headers
        expect(headers.get('Authorization')).toBe('Bearer my-token')
    })

    it('calls getToken on every request', () => {
        let counter = 0
        const getToken = () => `token-${++counter}`
        const next = withAuth(getToken)(mockFetch)
        next('/test', {})
        next('/test', {})
        expect(counter).toBe(2)
    })

    it('preserves existing headers', () => {
        const middleware = withAuth(() => 'token')
        middleware(mockFetch)('/test', { headers: { 'x-custom': 'value' } })
        const headers = mockFetch.mock.calls[0][1].headers as Headers
        expect(headers.get('x-custom')).toBe('value')
        expect(headers.get('Authorization')).toBe('Bearer token')
    })
})

describe('withContentType', () => {
    it('sets content-type header', () => {
        const middleware = withContentType('application/json')
        middleware(mockFetch)('/test', {})
        const headers = mockFetch.mock.calls[0][1].headers as Headers
        expect(headers.get('content-type')).toBe('application/json')
    })

    it('replaces existing content-type by default', () => {
        const middleware = withContentType('application/json')
        middleware(mockFetch)('/test', { headers: { 'content-type': 'text/plain' } })
        const headers = mockFetch.mock.calls[0][1].headers as Headers
        expect(headers.get('content-type')).toBe('application/json')
    })

    it('preserves existing content-type when replace=false', () => {
        const middleware = withContentType('application/json', false)
        middleware(mockFetch)('/test', { headers: { 'content-type': 'text/plain' } })
        expect(mockFetch).toHaveBeenCalledWith('/test', { headers: { 'content-type': 'text/plain' } })
    })

    it('sets content-type when header absent and replace=false', () => {
        const middleware = withContentType('application/json', false)
        middleware(mockFetch)('/test', {})
        const headers = mockFetch.mock.calls[0][1].headers as Headers
        expect(headers.get('content-type')).toBe('application/json')
    })
})

describe('withTimeout', () => {
    it('adds a timeout signal', () => {
        const middleware = withTimeout(5000)
        middleware(mockFetch)('/test', {})
        const signal = mockFetch.mock.calls[0][1].signal as AbortSignal
        expect(signal).toBeInstanceOf(AbortSignal)
    })

    it('combines timeout with existing signal', () => {
        const controller = new AbortController()
        const middleware = withTimeout(5000)
        middleware(mockFetch)('/test', { signal: controller.signal })
        const signal = mockFetch.mock.calls[0][1].signal as AbortSignal
        expect(signal).toBeInstanceOf(AbortSignal)
        expect(signal).not.toBe(controller.signal)
    })

    it('preserves other init options', () => {
        const middleware = withTimeout(5000)
        middleware(mockFetch)('/test', { method: 'POST', body: '{}' })
        const init = mockFetch.mock.calls[0][1]
        expect(init.method).toBe('POST')
        expect(init.body).toBe('{}')
    })
})
