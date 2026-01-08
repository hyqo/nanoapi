export type Success<T extends object = object> = Promise<{ ok: true } & T>
export type Failure<T extends object = object> = Promise<{ ok: false } & T>

export function withQuery(query?: Record<string, string | number | boolean>) {
    if (!query) return ''

    const searchParams = new URLSearchParams()

    for (const [name, value] of Object.entries(query)) {
        searchParams.set(name, value.toString())
    }

    return searchParams.size ? `?${searchParams.toString()}` : ''
}

export function withBody(
    method: 'POST' | 'PUT' | 'PATCH' = 'POST',
    contentType: string = 'application/json'
): RequestInit {
    return { ...withMethod(method), headers: { 'Content-Type': contentType } }
}

export function withMethod(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'): RequestInit {
    return { method }
}
