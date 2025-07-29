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
      const pattern = req.interceptor.path;
      if (typeof pattern === 'string') {
        return pattern === path || pattern.startsWith(path);
      }
      if (pattern instanceof RegExp) {
        return pattern.test(path);
      }
      return false;
    });
  }

  getRequestsForMethod(method: string): TrackedRequest[] {
    return this.requests.filter(req => req.method.toLowerCase() === method.toLowerCase());
  }
}

export const requestTracker = new NockRequestTracker();

export { NockRequestTracker };
