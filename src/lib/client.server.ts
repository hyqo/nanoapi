import { error } from '@sveltejs/kit'

import { getRequestEvent } from '$app/server'

export function createApiClient(
    options: {
        base: string
        prepareRequest?: (init: RequestInit) => void
    } = {
        base: '',
    }
) {
    return async (path: string, init: RequestInit = {}): Promise<unknown> => {
        options.prepareRequest?.(init)

        const { fetch } = getRequestEvent()

        const response = await fetch(`${options.base}${path}`, init)

        if (response.ok) {
            if (response.status === 204 || response.status === 205) {
                return null
            }
        } else {
            if (!(400 <= response.status && response.status <= 499)) {
                error(response.status)
            }
        }

        return await response.json()
    }
}
