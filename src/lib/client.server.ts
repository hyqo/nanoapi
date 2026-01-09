import { error } from '@sveltejs/kit'

import { getRequestEvent } from '$app/server'

export type ApiClientOptions = {
    base?: string
    prepareRequest?: (init: RequestInit) => void
    throwOn?: Array<number>
}

export function createApiClient(clientOptions: ApiClientOptions = {}) {
    const options = {
        base: '',
        throwOn: [],
        ...clientOptions,
    }

    return async (path: string, init: RequestInit = {}): Promise<unknown> => {
        options.prepareRequest?.(init)

        const { fetch } = getRequestEvent()

        const response = await fetch(`${options.base}${path}`, init)

        if (response.status >= 500) {
            error(response.status)
        }

        if (options.throwOn.includes(response.status)) {
            error(response.status)
        }

        if (response.status === 204 || response.status === 205) {
            return null
        }

        return await response.json()
    }
}
