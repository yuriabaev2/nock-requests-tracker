# nock-requests-tracker

[![npm version](https://img.shields.io/npm/v/nock-requests-tracker.svg)](https://www.npmjs.com/package/nock-requests-tracker)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A modern TypeScript package for tracking [nock](https://github.com/nock/nock) HTTP requests with minimal integration requirements. Track all your mocked HTTP requests and analyze them with detailed metadata including request variables, headers, timestamps, and more.

## ✨ Features

- **🔄 Minimal Integration** - Replace `import nock from 'nock'` with `import { nock } from 'nock-requests-tracker'`
- **📊 Detailed Tracking** - Capture method, URL, headers, body, query parameters, and timestamps
- **🎯 Smart Filtering** - Filter requests by path, HTTP method, or custom criteria
- **💪 TypeScript First** - Full type safety with comprehensive type definitions
- **🚀 Lightweight** - No additional runtime dependencies beyond nock
- **🧪 Vitest Ready** - Works perfectly with modern testing frameworks

## 🚀 Installation

```bash
npm install --save-dev nock-requests-tracker
# or
yarn add --dev nock-requests-tracker
# or  
pnpm add --save-dev nock-requests-tracker
```

**Peer dependency:** Requires `nock ^13.0.0`

```bash
npm install nock
```

## 📖 Usage

### Basic Usage

```typescript
// Before
import nock from 'nock';

// After - just change the import!
import { nock, requestTracker } from 'nock-requests-tracker';

// Use nock exactly as before
const scope = nock('https://api.example.com')
  .get('/users')
  .query({ page: '1', limit: '10' })
  .reply(200, { users: [] });

// Make your HTTP requests
await fetch('https://api.example.com/users?page=1&limit=10');

// Access tracked requests
const requests = requestTracker.getRequests();
console.log(requests[0]);
// {
//   method: 'GET',
//   url: 'https://api.example.com/users?page=1&limit=10',
//   path: '/users',
//   query: { page: '1', limit: '10' },
//   headers: { ... },
//   body: undefined,
//   timestamp: 2024-01-15T10:30:00.000Z,
//   interceptor: { method: 'GET', path: '/users' },
//   matched: true
// }
```

### Advanced Filtering

```typescript
import { nock, requestTracker } from 'nock-requests-tracker';

// Setup multiple endpoints
nock('https://api.example.com')
  .get('/users')
  .reply(200, { users: [] })
  .post('/users')
  .reply(201, { id: 1 })
  .get('/posts')
  .reply(200, { posts: [] });

// Make requests
await Promise.all([
  fetch('https://api.example.com/users'),
  fetch('https://api.example.com/users', { method: 'POST', body: '{}' }),
  fetch('https://api.example.com/posts'),
]);

// Filter by path
const userRequests = requestTracker.getRequestsForPath('/users');
console.log(userRequests.length); // 2

// Filter by HTTP method  
const getRequests = requestTracker.getRequestsForMethod('GET');
console.log(getRequests.length); // 2

// Get all requests
const allRequests = requestTracker.getRequests();
console.log(allRequests.length); // 3

// Clear tracked requests
requestTracker.clearRequests();
```

### Testing Integration

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { nock, requestTracker } from 'nock-requests-tracker';

describe('API Tests', () => {
  beforeEach(() => {
    requestTracker.clearRequests();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should track user creation requests', async () => {
    const userData = { name: 'John Doe', email: 'john@example.com' };
    
    const scope = nock('https://api.example.com')
      .post('/users', userData)
      .reply(201, { id: 1, ...userData });

    await axios.post('https://api.example.com/users', userData);

    // Verify request was tracked
    const requests = requestTracker.getRequests();
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      method: 'POST',
      path: '/users',
      matched: true
    });

    // Verify request variables
    expect(requests[0].body).toEqual(userData);
    expect(requests[0].timestamp).toBeInstanceOf(Date);

    scope.done();
  });
});
```

## 📚 API Reference

### `requestTracker`

The main tracker instance with the following methods:

#### `getRequests(): TrackedRequest[]`
Returns all tracked requests.

#### `clearRequests(): void`  
Clears all tracked requests.

#### `getRequestsForPath(path: string): TrackedRequest[]`
Returns requests matching the specified path. Supports both string and regex path matching.

#### `getRequestsForMethod(method: string): TrackedRequest[]`
Returns requests matching the specified HTTP method (case insensitive).

### Types

#### `TrackedRequest`
```typescript
interface TrackedRequest {
  method: string;                    // HTTP method (GET, POST, etc.)
  url: string;                       // Full URL
  path: string;                      // URL path
  query?: Record<string, string | string[]>; // Query parameters
  headers?: Record<string, string | string[]>; // Request headers
  body?: unknown;                    // Request body
  timestamp: Date;                   // Request timestamp
  interceptor: NockInterceptor;      // Original nock interceptor config
  matched: boolean;                  // Whether request matched interceptor
}
```

#### `NockInterceptor`
```typescript
interface NockInterceptor {
  method: string;
  path: string | RegExp;
  query?: boolean | Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string | string[]>;
}
```

#### `RequestTracker`
```typescript
interface RequestTracker {
  getRequests: () => TrackedRequest[];
  clearRequests: () => void;
  getRequestsForPath: (path: string) => TrackedRequest[];
  getRequestsForMethod: (method: string) => TrackedRequest[];
}
```

## 🔧 Configuration

No configuration required! The package works out of the box with sensible defaults.

## 🤝 Compatibility

- **Node.js**: >=16.0.0
- **TypeScript**: >=4.5.0  
- **nock**: ^13.0.0

## 🧪 Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code  
npm run format

# Build package
npm run build
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [nock](https://github.com/nock/nock) - HTTP server mocking library
- Inspired by the need for better HTTP request tracking in tests
- Thanks to the TypeScript and testing communities

## 📈 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes.

---

**Made with ❤️ and TypeScript**
