# @hyqo/nanoapi

Lightweight fetch wrapper with middleware support and auto response detection.

## Installation

```sh
npm install @hyqo/nanoapi
```

## Usage

```ts
import { nanoapi, withBaseUrl, withAuth, withContentType } from '@hyqo/nanoapi'

const api = nanoapi({
    middlewares: [
        withBaseUrl('https://api.example.com'),
        withAuth(() => localStorage.getItem('token') ?? ''),
        withContentType('application/json'),
    ],
})

// Auto-detects response type (JSON, text, blob)
const user = await api.get('/users/1')

// Explicit response type
const text = await api.get('/hello').asText()
const blob = await api.get('/image').asBlob()
const res  = await api.get('/users').response()
```

## API

### `nanoapi(options?)`

```ts
nanoapi({ middlewares?: Middleware[] }): ApiClient
```

Returns a callable client with method shortcuts:

```ts
api('/path', init?)          // raw fetch
api.get('/path', init?)
api.post('/path', init?)
api.put('/path', init?)
api.patch('/path', init?)
api.delete('/path', init?)
```

Each call returns an `ApiCall<T>`:

| Method | Description |
|---|---|
| `await api(...)` | auto-detects response type |
| `.asJson()` | parse as JSON |
| `.asText()` | parse as text |
| `.asBlob()` | parse as Blob |
| `.asArrayBuffer()` | parse as ArrayBuffer |
| `.response()` | raw `Response` object |

### Auto-detection rules

| Condition | Result |
|---|---|
| Status 204 / 304 | `null` |
| `content-length: 0` | `null` |
| `application/json` | `response.json()` |
| `text/*` | `response.text()` |
| `image/*`, `audio/*`, `video/*`, `application/octet-stream` | `response.blob()` |
| anything else | `response.text()` or `null` if empty |

## Middlewares

Middlewares wrap fetch in order — the first middleware in the array is outermost.

```ts
type Middleware = (next: typeof fetch) => typeof fetch
```

### Built-in middlewares

#### `withBaseUrl(baseUrl)`

Prepends `baseUrl` to paths starting with `/`.

```ts
withBaseUrl('https://api.example.com')
// api.get('/users') → fetch('https://api.example.com/users')
```

#### `withAuth(getToken)`

Adds `Authorization: Bearer <token>` header. Calls `getToken` on every request.

```ts
withAuth(() => myStore.token)
```

#### `withContentType(contentType, replace?)`

Sets `content-type` header. Pass `replace: false` to skip if already set.

```ts
withContentType('application/json')
withContentType('application/json', false)
```

#### `withTimeout(milliseconds)`

Adds an `AbortSignal` timeout. Combines with any existing signal.

```ts
withTimeout(5000)
```

### Custom middleware

```ts
const withLogger: Middleware = next => (input, init) => {
    console.log(input)
    return next(input, init)
}
```

## Helpers

#### `withQuery(params?)`

Converts an object to a query string.

```ts
'/users' + withQuery({ role: 'admin', page: 2 })
// → '/users?role=admin&page=2'
```

#### `withMethod(method)`

Returns `{ method }` as `RequestInit`.

#### `withBody(method?, contentType?)`

Returns `RequestInit` with method and `Content-Type` header.

```ts
withBody('POST', 'application/json')
// → { method: 'POST', headers: { 'Content-Type': 'application/json' } }
```

Defaults: `method = 'POST'`, `contentType = 'application/json'`.

## License

MIT
