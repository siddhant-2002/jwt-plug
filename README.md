# jwt-plug

Lightweight, pluggable JWT helper utilities for Node.js and Express. Provides access & refresh token creation, verification, and revocation — with a simple in-memory blacklist by default and extension points for Redis or a database-backed revocation store.

Designed to be small, auditable, and easy to extend.

## Features

- 🔐 Access & Refresh Tokens — Create signed JWT tokens with unique `jti` identifiers.
- 🔎 Verification Helpers — Validate access tokens or refresh tokens independently.
- ⛔ Token Revocation — In-memory blacklist (default), easily replaceable with a persistent adapter.
- 🚀 Express Example Included — A ready-to-run demo server demonstrating login, refresh, protected routes, and logout.

## Installation

Install from npm:

```bash
npm install jwt-plug
```

## Quick Start

```js
const { token } = require('jwt-plug');

// create tokens
const access = token.createAccessToken('user-id', '15m');
const refresh = token.createRefreshToken('user-id', '7d');

// verify access token
try {
  const decoded = token.verifyAccessToken(access);
  console.log('user:', decoded.sub);
} catch (err) {
  console.error('invalid or revoked token', err.message);
}

// revoke by jti
const { jti } = token.verifyAccessToken(access);
token.revokeToken(jti);
```

## Express Demo App

A minimal server is included at `examples/express-demo/server.js`.

Available routes:

| Route        | Method | Description                                      |
| ------------ | ------ | ------------------------------------------------ |
| `/login`     | POST   | Returns `{ accessToken, refreshToken }`          |
| `/protected` | GET    | Requires `Authorization: Bearer <token>`         |
| `/refresh`   | POST   | Exchanges a refresh token for a new access token |
| `/logout`    | POST   | Revokes a token or `jti`                         |

Run it locally:

```bash
node ./examples/express-demo/server.js
```

Example usage (curl / PowerShell):

```powershell
curl -X POST http://localhost:3000/login -H "Content-Type: application/json" -d '{"userId":"alice"}'
curl -H "Authorization: Bearer <ACCESS_TOKEN>" http://localhost:3000/protected
curl -X POST http://localhost:3000/refresh -H "Content-Type: application/json" -d '{"refreshToken":"<REFRESH_TOKEN>"}'
curl -X POST http://localhost:3000/logout -H "Content-Type: application/json" -d '{"token":"<ACCESS_TOKEN>"}'
```

## Environment Variables

You must provide strong secrets in production.

| Variable         | Description                        |
| ---------------- | ---------------------------------- |
| `ACCESS_SECRET`  | Secret used to sign access tokens  |
| `REFRESH_SECRET` | Secret used to sign refresh tokens |

Example (PowerShell):

```powershell
$env:ACCESS_SECRET = 'your-very-long-secret'
$env:REFRESH_SECRET = 'another-long-secret'
node server.js
```

## API Reference

### Token Creation

```js
token.createAccessToken(userId, expiresIn);
token.createRefreshToken(userId, expiresIn);
```

* `userId` — the value stored in the `sub` claim
* `expiresIn` — `'15m'`, `'1h'`, `'7d'`, etc.
* Refresh tokens include `{ rt: true }` in the payload.

### Token Verification

```js
token.verifyAccessToken(tokenString);
token.verifyRefreshToken(tokenString);
```

Both return the decoded payload or throw an error if the token is:

- invalid
- expired
- revoked
- (for refresh tokens) not a refresh token

### Token Revocation

```js
token.revokeToken(jti);
```

The default blacklist is a simple in-memory `Set`.

## Using a Persistent Blacklist (Redis / DB)

The default in-memory blacklist is not suitable for multi-instance production environments. To replace it, implement an object with:

```js
has(jti); // boolean or Promise<boolean>
add(jti); // store jti
```

Example Redis-style adapter:

```js
module.exports = {
  async has(jti) {
    return await redis.exists(`revoked:${jti}`);
  },
  async add(jti, ttlSeconds) {
    await redis.set(`revoked:${jti}`, 1, 'EX', ttlSeconds);
  }
};
```

Then integrate this adapter into your token service.

## Security Recommendations


- Use long, random signing secrets for both access and refresh tokens.
- Rotate refresh tokens on use (optional but recommended).
- Store refresh token IDs server-side for robust logout/session control.
- Use Redis or a database-backed blacklist for real deployments.

## Contributing

PRs welcome! If you add a persistent revocation adapter (e.g., Redis), place it under `src/adapters/redis`. Include a small integration test if possible.

## License

MIT
