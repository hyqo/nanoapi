import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nanoapi, autoDetect } from './client.ts'

describe('nanoapi', () => {
    let mockFetch: ReturnType<typeof vi.fn>

    beforeEach(() => {
        mockFetch = vi.fn()
        vi.stubGlobal('fetch', mockFetch)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('calls fetch with input and empty init by default', async () => {
        mockFetch.mockResolvedValue(new Response(null, { status: 204 }))

        const api = nanoapi()
        await api('/test')

        expect(mockFetch).toHaveBeenCalledWith('/test', {})
    })

    it('passes init options to fetch', async () => {
        mockFetch.mockResolvedValue(new Response(null, { status: 204 }))

        const api = nanoapi()
        await api('/test', { method: 'GET', headers: { 'x-foo': 'bar' } })

        expect(mockFetch).toHaveBeenCalledWith('/test', { method: 'GET', headers: { 'x-foo': 'bar' } })
    })

    it('.get() sets method to GET', async () => {
        mockFetch.mockResolvedValue(new Response(null, { status: 204 }))

        const api = nanoapi()
        await api.get('/test')

        expect(mockFetch).toHaveBeenCalledWith('/test', { method: 'GET' })
    })

    it('.post() sets method to POST', async () => {
        mockFetch.mockResolvedValue(new Response(null, { status: 204 }))

        const api = nanoapi()
        await api.post('/test', { body: '{}' })

        expect(mockFetch).toHaveBeenCalledWith('/test', { body: '{}', method: 'POST' })
    })

    it('.put() sets method to PUT', async () => {
        mockFetch.mockResolvedValue(new Response(null, { status: 204 }))

        const api = nanoapi()
        await api.put('/test')

        expect(mockFetch).toHaveBeenCalledWith('/test', { method: 'PUT' })
    })

    it('.patch() sets method to PATCH', async () => {
        mockFetch.mockResolvedValue(new Response(null, { status: 204 }))

        const api = nanoapi()
        await api.patch('/test')

        expect(mockFetch).toHaveBeenCalledWith('/test', { method: 'PATCH' })
    })

    it('.delete() sets method to DELETE', async () => {
        mockFetch.mockResolvedValue(new Response(null, { status: 204 }))

        const api = nanoapi()
        await api.delete('/test')

        expect(mockFetch).toHaveBeenCalledWith('/test', { method: 'DELETE' })
    })

    it('applies middlewares in order (first middleware is outermost)', async () => {
        const log: string[] = []
        mockFetch.mockResolvedValue(new Response(null, { status: 204 }))

        const api = nanoapi({
            middlewares: [
                next => (input, init) => { log.push('a'); return next(input, init) },
                next => (input, init) => { log.push('b'); return next(input, init) },
            ],
        })

        await api('/test')

        expect(log).toEqual(['a', 'b'])
    })

    it('middleware can transform input', async () => {
        mockFetch.mockResolvedValue(new Response(null, { status: 204 }))

        const api = nanoapi({
            middlewares: [
                next => (input, init) => next('https://api.example.com' + input, init),
            ],
        })

        await api('/users')

        expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/users', {})
    })

    it('middleware can transform init', async () => {
        mockFetch.mockResolvedValue(new Response(null, { status: 204 }))

        const api = nanoapi({
            middlewares: [
                next => (input, init) =>
                    next(input, { ...init, headers: { Authorization: 'Bearer token' } }),
            ],
        })

        await api('/test')

        expect(mockFetch).toHaveBeenCalledWith('/test', { headers: { Authorization: 'Bearer token' } })
    })

    it('.asJson() returns parsed JSON without auto-detection', async () => {
        const data = { id: 1, name: 'test' }
        mockFetch.mockResolvedValue({ json: async () => data })

        const api = nanoapi()
        const result = await api('/test').asJson()

        expect(result).toEqual(data)
    })

    it('.asText() returns raw text', async () => {
        mockFetch.mockResolvedValue({ text: async () => 'hello world' })

        const api = nanoapi()
        const result = await api('/test').asText()

        expect(result).toBe('hello world')
    })

    it('.asBlob() returns a Blob', async () => {
        const blob = new Blob(['data'])
        mockFetch.mockResolvedValue({ blob: async () => blob })

        const api = nanoapi()
        const result = await api('/test').asBlob()

        expect(result).toBe(blob)
    })

    it('.asArrayBuffer() returns an ArrayBuffer', async () => {
        const buffer = new ArrayBuffer(8)
        mockFetch.mockResolvedValue({ arrayBuffer: async () => buffer })

        const api = nanoapi()
        const result = await api('/test').asArrayBuffer()

        expect(result).toBe(buffer)
    })

    it('.response() returns the raw Response object', async () => {
        const mockResponse = new Response('ok', { status: 200 })
        mockFetch.mockResolvedValue(mockResponse)

        const api = nanoapi()
        const result = await api('/test').response()

        expect(result).toBe(mockResponse)
    })

    it('.then() auto-detects JSON response', async () => {
        mockFetch.mockResolvedValue(
            new Response('{"x":42}', { headers: { 'content-type': 'application/json' } }),
        )

        const api = nanoapi()
        const result = await api('/test')

        expect(result).toEqual({ x: 42 })
    })

    it('.then() auto-detects text response', async () => {
        mockFetch.mockResolvedValue(
            new Response('hello', { headers: { 'content-type': 'text/plain' } }),
        )

        const api = nanoapi()
        const result = await api('/test')

        expect(result).toBe('hello')
    })
})

describe('autoDetect', () => {
    it('returns null for 204 No Content', async () => {
        expect(await autoDetect(new Response(null, { status: 204 }))).toBeNull()
    })

    it('returns null for 304 Not Modified', async () => {
        expect(await autoDetect(new Response(null, { status: 304 }))).toBeNull()
    })

    it('returns null when content-length is 0', async () => {
        const response = new Response('', { headers: { 'content-length': '0' } })
        expect(await autoDetect(response)).toBeNull()
    })

    it('parses JSON for application/json content type', async () => {
        const response = new Response('{"a":1}', {
            headers: { 'content-type': 'application/json' },
        })
        expect(await autoDetect(response)).toEqual({ a: 1 })
    })

    it('parses JSON for application/json with charset', async () => {
        const response = new Response('{"a":1}', {
            headers: { 'content-type': 'application/json; charset=utf-8' },
        })
        expect(await autoDetect(response)).toEqual({ a: 1 })
    })

    it('returns text for text/plain content type', async () => {
        const response = new Response('hello', { headers: { 'content-type': 'text/plain' } })
        expect(await autoDetect(response)).toBe('hello')
    })

    it('returns text for text/html content type', async () => {
        const response = new Response('<p>hi</p>', { headers: { 'content-type': 'text/html' } })
        expect(await autoDetect(response)).toBe('<p>hi</p>')
    })

    it('returns Blob for image/* content type', async () => {
        const response = new Response(new Uint8Array([1, 2, 3]), {
            headers: { 'content-type': 'image/png' },
        })
        expect(await autoDetect(response)).toBeInstanceOf(Blob)
    })

    it('returns Blob for audio/* content type', async () => {
        const response = new Response(new Uint8Array([1, 2]), {
            headers: { 'content-type': 'audio/mpeg' },
        })
        expect(await autoDetect(response)).toBeInstanceOf(Blob)
    })

    it('returns Blob for video/* content type', async () => {
        const response = new Response(new Uint8Array([1, 2]), {
            headers: { 'content-type': 'video/mp4' },
        })
        expect(await autoDetect(response)).toBeInstanceOf(Blob)
    })

    it('returns Blob for application/octet-stream', async () => {
        const response = new Response(new Uint8Array([1, 2]), {
            headers: { 'content-type': 'application/octet-stream' },
        })
        expect(await autoDetect(response)).toBeInstanceOf(Blob)
    })

    it('returns text for unknown content type when body is non-empty', async () => {
        const response = new Response('<?xml version="1.0"?>', {
            headers: { 'content-type': 'application/xml' },
        })
        expect(await autoDetect(response)).toBe('<?xml version="1.0"?>')
    })

    it('returns null for unknown content type when body is empty', async () => {
        const response = new Response('', { headers: { 'content-type': 'application/xml' } })
        expect(await autoDetect(response)).toBeNull()
    })
})
