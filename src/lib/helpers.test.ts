import { describe, it, expect } from 'vitest'
import { withQuery, withBody, withMethod } from './helpers'

describe('withQuery', () => {
    it('should return empty string for undefined or empty object', () => {
        expect(withQuery()).toBe('')
        expect(withQuery({})).toBe('')
    })

    it('should convert mixed types to query params', () => {
        const result = withQuery({ name: 'Alice', age: 25, active: true })
        expect(result).toBe('?name=Alice&age=25&active=true')
    })

    it('should URL encode special characters', () => {
        const result = withQuery({ search: 'hello world', email: 'test@example.com' })
        expect(result).toBe('?search=hello+world&email=test%40example.com')
    })
})

describe('withMethod', () => {
    it('should create RequestInit with specified method', () => {
        expect(withMethod('GET')).toEqual({ method: 'GET' })
        expect(withMethod('POST')).toEqual({ method: 'POST' })
        expect(withMethod('DELETE')).toEqual({ method: 'DELETE' })
    })
})

describe('withBody', () => {
    it('should create RequestInit with default POST and application/json', () => {
        const result = withBody()
        expect(result).toEqual({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        })
    })

    it('should create RequestInit with custom method and content type', () => {
        const result = withBody('PUT', 'text/plain')
        expect(result).toEqual({
            method: 'PUT',
            headers: { 'Content-Type': 'text/plain' },
        })
    })
})
