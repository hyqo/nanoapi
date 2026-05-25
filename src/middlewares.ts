export type Middleware = (next: typeof fetch) => typeof fetch

export const withBaseUrl =
    (baseUrl: string): Middleware =>
    next =>
    (input, init) => {
        if (typeof input === 'string' && input.startsWith('/')) {
            return next(baseUrl + input, init)
        }

        return next(input, init)
    }

export const withAuth =
    (getToken: () => string): Middleware =>
    next =>
    (input, init) => {
        const headers = new Headers(init?.headers)
        headers.set('Authorization', `Bearer ${getToken()}`)
        return next(input, { ...init, headers })
    }

export const withContentType =
    (contentType: string, replace: boolean = true): Middleware =>
    next =>
    (input, init) => {
        const headers = new Headers(init?.headers)
        if (headers.has('content-type') && !replace) {
            return next(input, init)
        }
        headers.set('content-type', contentType)
        return next(input, { ...init, headers })
    }

export const withTimeout =
    (milliseconds: number): Middleware =>
    next =>
    (input, init) => {
        const signals = [AbortSignal.timeout(milliseconds)]
        if (init?.signal) signals.push(init.signal)

        return next(input, { ...init, signal: AbortSignal.any(signals) })
    }
