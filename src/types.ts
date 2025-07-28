export interface RequestInfo {
  method: string;
  url: string;
  path: string;
  query?: Record<string, string | string[]> | undefined;
  headers?: Record<string, string | string[]> | undefined;
  body?: unknown;
  timestamp: Date;
}

export interface NockInterceptor {
  method: string;
  path: string | RegExp;
  query?: boolean | Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string | string[]>;
}

export interface TrackedRequest extends RequestInfo {
  interceptor: NockInterceptor;
  matched: boolean;
}

export type RequestTracker = {
  getRequests: () => TrackedRequest[];
  clearRequests: () => void;
  getRequestsForPath: (path: string) => TrackedRequest[];
  getRequestsForMethod: (method: string) => TrackedRequest[];
};
