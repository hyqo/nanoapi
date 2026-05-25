import { type Middleware } from './middlewares.ts'

type Fetch = typeof fetch
type FetchInput = Parameters<Fetch>[0]
type FetchInit = Parameters<Fetch>[1]

export type ApiClientOptions = {
    getFetch?: () => typeof fetch
    middlewares?: Middleware[]
}

interface ApiCall<T> extends PromiseLike<T> {
    asJson: <R = T>() => Promise<R>
    asText: () => Promise<string>
    asBlob: () => Promise<Blob>
    asArrayBuffer: () => Promise<ArrayBuffer>
    response: () => Promise<Response>
}

type FetchLike = <T = unknown>(input: FetchInput, init?: FetchInit) => ApiCall<T>

type ApiClient = FetchLike & {
    [Method in 'get' | 'post' | 'put' | 'patch' | 'delete']: FetchLike
}

export function nanoapi(options: ApiClientOptions = {}): ApiClient {
    const { middlewares = [] } = options

    const run = <T = unknown>(input: FetchInput, init: FetchInit = {}): ApiCall<T> => {
        const query = middlewares.reduceRight((next, middleware) => middleware(next), fetch)

        const request = () => {
            return query(input, init)
        }

        return {
            asJson: async () => (await request()).json(),
            asText: async () => (await request()).text(),
            asBlob: async () => (await request()).blob(),
            asArrayBuffer: async () => (await request()).arrayBuffer(),
            response: () => request(),

            then: (...args) =>
                request()
                    .then(autoDetect<T>)
                    .then(...args),
        }
    }

    const withMethod =
        (method: string): FetchLike =>
        (input, init = {}) =>
            run(input, { ...init, method })

    return Object.assign(run, {
        get: withMethod('GET'),
        put: withMethod('PUT'),
        post: withMethod('POST'),
        patch: withMethod('PATCH'),
        delete: withMethod('DELETE'),
    })
}

export async function autoDetect<T>(response: Response): Promise<T> {
    if (response.status === 204 || response.status === 304) {
        return null as T
    }

    if (response.headers.get('content-length') === '0') {
        return null as T
    }

    const contentType = response.headers.get('content-type') ?? ''

    if (contentType.includes('application/json')) {
        return (await response.json()) as T
    }

    if (contentType.startsWith('text/')) {
        return (await response.text()) as T
    }

    if (
        contentType.startsWith('image/') ||
        contentType.startsWith('audio/') ||
        contentType.startsWith('video/') ||
        contentType.includes('application/octet-stream')
    ) {
        return (await response.blob()) as T
    }

    const text = await response.text()
    return (text.length ? text : null) as T
}
