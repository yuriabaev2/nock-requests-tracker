# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript library that wraps nock (HTTP server mocking library) to provide request tracking capabilities. The package allows developers to track all HTTP requests made through nock interceptors with detailed metadata including headers, body, timestamps, and more.

## Development Commands

- `npm run build` - Compile TypeScript to JavaScript in the `dist/` directory
- `npm run dev` - Watch mode compilation with TypeScript compiler
- `npm test` - Run all tests with Vitest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report (90% threshold)
- `npm run test:ui` - Run tests with Vitest UI
- `npm run lint` - Lint TypeScript files in src/
- `npm run lint:fix` - Lint and auto-fix TypeScript files
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run clean` - Remove the dist/ directory

## Architecture

The library consists of three main components:

### Core Files:
- `src/index.ts` - Main entry point that wraps nock with tracking functionality
- `src/tracker.ts` - `NockRequestTracker` class that manages request storage and filtering
- `src/types.ts` - TypeScript interfaces for request tracking data structures

### Key Architecture Patterns:
1. **Nock Wrapper Pattern**: The main `nock` function is wrapped to intercept HTTP method calls (GET, POST, etc.) and inject tracking logic
2. **Event-Driven Tracking**: Uses nock's 'replied' event to capture request details when HTTP calls are made
3. **Singleton Tracker**: Single `requestTracker` instance manages all tracked requests across the application

### Request Flow:
1. User imports `{ nock }` from this library instead of directly from nock
2. When HTTP methods are called on nock scope, the wrapper intercepts and adds event listeners
3. When actual HTTP requests are made, nock fires 'replied' events
4. Event handlers parse request data and store it in the tracker
5. Users can query tracked requests using filter methods

## Testing

- Tests are located in `__tests__/` directory
- Uses Vitest as the test runner with Node.js environment
- Test files: `index.test.ts` (integration tests) and `tracker.test.ts` (unit tests)
- Tests require `axios` for making actual HTTP requests
- Coverage thresholds set at 90% for all metrics

## Build System

- ES modules with TypeScript compilation target ES2022
- Outputs to `dist/` with declaration files and source maps
- Strict TypeScript configuration with additional safety checks
- Uses semantic-release for automated versioning and publishing

## Key Dependencies

- **Peer dependency**: `nock ^13.0.0` (required by users)
- **Dev dependencies**: Vitest, TypeScript, ESLint, Prettier
- **Runtime**: No additional dependencies beyond Node.js built-ins