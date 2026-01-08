# @hyqo/nanoapi

A lightweight, type-safe API client for SvelteKit applications that leverages native SvelteKit features.

## Features

- **SvelteKit-native**: Uses SvelteKit's `fetch` and `error` handling
- **Type-safe**: TypeScript support with `Success` and `Failure` types
- **Lightweight**: Minimal dependencies
- **Flexible**: Configurable base URL and request options
- **Helper utilities**: Built-in query params, body, and method helpers

## Installation

```sh
npm install @hyqo/nanoapi
```

## Usage

### Creating an API client

```typescript
// src/lib/api.server.ts
import { createApiClient } from '@hyqo/nanoapi'

export const api = createApiClient({
    base: 'https://api.example.com',
    prepareRequest: init => {
        // Add default headers, authentication, etc.
        init.headers = {
            ...init.headers,
            Authorization: 'Bearer token',
        }
    },
})
```

### Making requests

```typescript
// +page.server.ts
import { api } from '$lib/api.server'
import { withQuery, withMethod, withBody } from '@hyqo/nanoapi'

export async function load() {
    // GET request
    const users = await api('/users', withMethod('GET'))

    // GET with query parameters
    const filteredUsers = await api(`/users${withQuery({ role: 'admin', active: true })}`, withMethod('GET'))

    return { users, filteredUsers }
}

export const actions = {
    create: async ({ request }) => {
        const data = await request.formData()

        // POST request with JSON body
        const result = await api('/users', {
            ...withBody('POST'),
            body: JSON.stringify({
                name: data.get('name'),
                email: data.get('email'),
            }),
        })

        return result
    },
}
```

## API Reference

### `createApiClient(options)`

Creates a new API client instance.

**Parameters:**

- `options.base` (string): Base URL for all requests (defaults to empty string)
- `options.prepareRequest` (function, optional): Function to modify `RequestInit` before each request

**Returns:** An async function `(path: string, init?: RequestInit) => Promise<unknown>`

### Helper Functions

#### `withQuery(query)`

Converts an object to URL query parameters.

```typescript
withQuery({ search: 'test', page: 1 })
// Returns: "?search=test&page=1"
```

#### `withBody(method, contentType)`

Creates `RequestInit` object for requests with body.

```typescript
withBody('POST', 'application/json')
// Returns: { method: 'POST', headers: { 'Content-Type': 'application/json' } }
```

Default: `method = 'POST'`, `contentType = 'application/json'`

#### `withMethod(method)`

Creates `RequestInit` object with HTTP method.

```typescript
withMethod('GET')
// Returns: { method: 'GET' }
```

### Types

```typescript
type Success<T extends object = {}> = Promise<{ ok: true } & T>
type Failure<T extends object = {}> = Promise<{ ok: false } & T>
```

Use these types for type-safe API responses:

```typescript
async function getUser(id: string): Success<{ user: User }> | Failure<{ error: string }> {
    // ...
}
```

## Error Handling

The client automatically handles HTTP errors:

- **2xx**: Returns parsed JSON
- **4xx**: Returns parsed JSON (client errors)
- **5xx**: Throws SvelteKit error using `error(status)`

## Development

```sh
npm install
npm run dev
```

## Building

```sh
npm run build
```

## Testing

```sh
npm test
```

## License

MIT
