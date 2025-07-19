import nock from 'nock';
import { URL } from 'url';
import { requestTracker } from './tracker.js';
import type { RequestInfo, NockInterceptor, TrackedRequest, RequestTracker } from './types.js';

type NockScope = ReturnType<typeof nock>;
type NockInterceptorInstance = ReturnType<NockScope[keyof NockScope]>;

const originalNock = nock;

function parseUrl(url: string): { hostname: string; port?: string; protocol: string } {
  const parsedUrl = new URL(url);
  return {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || undefined,
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
      (scope as any)[method] = function(path: string | RegExp, body?: unknown) {
        const interceptor = originalMethod.call(this, path, body);
        
        const originalReply = interceptor.reply;
        interceptor.reply = function(...args: any[]) {
          const result = originalReply.apply(this, args);
          
          scope.on('replied', (req: any) => {
            const requestInfo: RequestInfo = {
              method: method.toUpperCase(),
              url: `${fullHost}${req.path}`,
              path: req.path,
              query: req.query || {},
              headers: req.headers || {},
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
