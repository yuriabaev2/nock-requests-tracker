import nock from 'nock';
import { URL } from 'url';
import { requestTracker } from './tracker.js';
import type { RequestInfo, NockInterceptor, TrackedRequest, RequestTracker } from './types.js';

type NockScope = ReturnType<typeof nock>;
// type  NockInterceptorInstance = ReturnType<NockScope[keyof NockScope]>;

const originalNock = nock; // just checking that nock is imported correctly

function parseUrl(url: string): { hostname: string; port?: string; protocol: string } {
  const parsedUrl = new URL(url);
  return {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port,
    protocol: parsedUrl.protocol,
  };
}
function createTrackedNock(baseUrl: string): NockScope & { tracker: RequestTracker } {
  const scope = originalNock(baseUrl);
  const { hostname, port, protocol } = parseUrl(baseUrl);
  const fullHost = `${protocol}//${hostname}${port ? `:${port}` : ''}`;

  const originalMethods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'] as const;

  originalMethods.forEach(method => {
    const originalMethod = scope[method];
    if (typeof originalMethod === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/explicit-function-return-type
      (scope as unknown as any)[method] = function (path: string | RegExp, body?: unknown) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const interceptor = originalMethod.call(this, path, body);

        const originalReply = interceptor.reply.bind(interceptor);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-function-return-type, @typescript-eslint/ban-ts-comment
        interceptor.reply = function (...args: any[]) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error: reply typing is incompatible with our use-case here
          const result = originalReply.apply(this, args);

          scope.on(
            'replied',
            (req: {
              path: string;
              query?: Record<string, string | string[]>;
              headers?: Record<string, string>;
              body?: unknown;
            }) => {
              const requestInfo: RequestInfo = {
                method: method.toUpperCase(),
                url: `${fullHost}${req.path}`,
                path: req.path,
                query: req.query,
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
            }
          );

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
