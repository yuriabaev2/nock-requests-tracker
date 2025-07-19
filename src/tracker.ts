import type { TrackedRequest, RequestTracker } from './types.js';

class NockRequestTracker implements RequestTracker {
  private readonly requests: TrackedRequest[] = [];

  addRequest(request: TrackedRequest): void {
    this.requests.push(request);
  }

  getRequests(): TrackedRequest[] {
    return [...this.requests];
  }

  clearRequests(): void {
    this.requests.length = 0;
  }

  getRequestsForPath(path: string): TrackedRequest[] {
    return this.requests.filter(req => {
      if (typeof req.interceptor.path === 'string') {
        return req.interceptor.path === path || req.path === path;
      }
      return req.interceptor.path.test(req.path);
    });
  }

  getRequestsForMethod(method: string): TrackedRequest[] {
    return this.requests.filter(req => 
      req.method.toLowerCase() === method.toLowerCase()
    );
  }
}

export const requestTracker = new NockRequestTracker();

export { NockRequestTracker };