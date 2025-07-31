import nock from 'nock';
import { URL } from 'url';
import { requestTracker } from './tracker.js';
import type { RequestInfo, NockInterceptor, TrackedRequest, RequestTracker } from './types.js';

type NockScope = ReturnType<typeof nock>;
type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options';
type NockRepliedEvent = {
  path: string;
  query?: Record<string, string | string[]>;
  headers?: Record<string, string>;
  body?: unknown;
};

const originalNock = nock;

function parseUrl(url: string): { hostname: string; port?: string; protocol: string } {
  try {
    const parsedUrl = new URL(url);
    const result: { hostname: string; port?: string; protocol: string } = {
      hostname: parsedUrl.hostname,
      protocol: parsedUrl.protocol,
    };

    if (parsedUrl.port) {
      result.port = parsedUrl.port;
    }

    return result;
  } catch (error) {
    throw new Error(
      `Invalid URL provided: ${url}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

function buildFullHost(protocol: string, hostname: string, port?: string): string {
  return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
}

function extractQueryParams(path: string, fullHost: string): Record<string, string> {
  try {
    return Object.fromEntries(new URL(path, fullHost).searchParams);
  } catch {
    // If URL parsing fails, return empty object
    return {};
  }
}
function createTrackedNock(baseUrl: string): NockScope & { tracker: RequestTracker } {
  const scope = originalNock(baseUrl);
  const { hostname, port, protocol } = parseUrl(baseUrl);
  const fullHost = buildFullHost(protocol, hostname, port);

  const httpMethods: readonly HttpMethod[] = [
    'get',
    'post',
    'put',
    'patch',
    'delete',
    'head',
    'options',
  ] as const;

  httpMethods.forEach(method => {
    const originalMethod = scope[method];
    if (typeof originalMethod === 'function') {
      // Using any types here due to nock's complex and changing internal types
      // This is a necessary compromise for wrapping nock's functionality
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      (scope as any)[method] = function (path: string | RegExp, body?: unknown): any {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any
        const interceptor = originalMethod.call(this, path, body as any);
        const originalReply = interceptor.reply.bind(interceptor);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        interceptor.reply = function (...args: any[]): any {
          // @ts-expect-error - Complex nock typing compatibility
          const result = originalReply.apply(this, args);

          scope.on('replied', (req: NockRepliedEvent) => {
            const requestInfo: RequestInfo = {
              method: method.toUpperCase(),
              url: `${fullHost}${req.path}`,
              path: req.path,
              query: extractQueryParams(req.path, fullHost),
              headers: req.headers ?? {},
              body: req.body,
              timestamp: new Date(),
            };

            const nockInterceptor: NockInterceptor = {
              method: method.toUpperCase(),
              path,
              body,
            };

            const trackedRequest: TrackedRequest = {
              ...requestInfo,
              interceptor: nockInterceptor,
              matched: true,
            };

            requestTracker.addRequest(trackedRequest);
          });

          return result;
        };

        return interceptor;
      };
    }
  });

  return Object.assign(scope, { tracker: requestTracker });
}

const trackedNock = Object.assign(createTrackedNock, {
  ...originalNock,
  tracker: requestTracker,
});

export { trackedNock as nock };
export { requestTracker };
export type { RequestInfo, NockInterceptor, TrackedRequest, RequestTracker };
