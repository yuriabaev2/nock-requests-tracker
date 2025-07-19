import { NockRequestTracker } from '../src/tracker.js';
import type { TrackedRequest } from '../src/types.js';

describe('NockRequestTracker', () => {
  let tracker: NockRequestTracker;

  beforeEach(() => {
    tracker = new NockRequestTracker();
  });

  describe('addRequest and getRequests', () => {
    it('should store and retrieve requests', () => {
      const request: TrackedRequest = {
        method: 'GET',
        url: 'https://api.example.com/users',
        path: '/users',
        timestamp: new Date(),
        interceptor: {
          method: 'GET',
          path: '/users',
        },
        matched: true,
      };

      tracker.addRequest(request);
      const requests = tracker.getRequests();

      expect(requests).toHaveLength(1);
      expect(requests[0]).toEqual(request);
    });

    it('should return a copy of requests array', () => {
      const request: TrackedRequest = {
        method: 'GET',
        url: 'https://api.example.com/users',
        path: '/users',
        timestamp: new Date(),
        interceptor: {
          method: 'GET',
          path: '/users',
        },
        matched: true,
      };

      tracker.addRequest(request);
      const requests1 = tracker.getRequests();
      const requests2 = tracker.getRequests();

      expect(requests1).not.toBe(requests2);
      expect(requests1).toEqual(requests2);
    });
  });

  describe('clearRequests', () => {
    it('should clear all stored requests', () => {
      const request: TrackedRequest = {
        method: 'GET',
        url: 'https://api.example.com/users',
        path: '/users',
        timestamp: new Date(),
        interceptor: {
          method: 'GET',
          path: '/users',
        },
        matched: true,
      };

      tracker.addRequest(request);
      expect(tracker.getRequests()).toHaveLength(1);

      tracker.clearRequests();
      expect(tracker.getRequests()).toHaveLength(0);
    });
  });

  describe('getRequestsForPath', () => {
    beforeEach(() => {
      const requests: TrackedRequest[] = [
        {
          method: 'GET',
          url: 'https://api.example.com/users',
          path: '/users',
          timestamp: new Date(),
          interceptor: { method: 'GET', path: '/users' },
          matched: true,
        },
        {
          method: 'POST',
          url: 'https://api.example.com/posts',
          path: '/posts',
          timestamp: new Date(),
          interceptor: { method: 'POST', path: '/posts' },
          matched: true,
        },
        {
          method: 'GET',
          url: 'https://api.example.com/users/123',
          path: '/users/123',
          timestamp: new Date(),
          interceptor: { method: 'GET', path: /\/users\/\d+/ },
          matched: true,
        },
      ];

      requests.forEach(req => tracker.addRequest(req));
    });

    it('should filter requests by exact path match', () => {
      const requests = tracker.getRequestsForPath('/users');
      expect(requests).toHaveLength(1);
      expect(requests[0]?.path).toBe('/users');
    });

    it('should filter requests by regex path match', () => {
      const requests = tracker.getRequestsForPath('/users/123');
      expect(requests).toHaveLength(1);
      expect(requests[0]?.path).toBe('/users/123');
    });

    it('should return empty array for non-matching path', () => {
      const requests = tracker.getRequestsForPath('/nonexistent');
      expect(requests).toHaveLength(0);
    });
  });

  describe('getRequestsForMethod', () => {
    beforeEach(() => {
      const requests: TrackedRequest[] = [
        {
          method: 'GET',
          url: 'https://api.example.com/users',
          path: '/users',
          timestamp: new Date(),
          interceptor: { method: 'GET', path: '/users' },
          matched: true,
        },
        {
          method: 'POST',
          url: 'https://api.example.com/posts',
          path: '/posts',
          timestamp: new Date(),
          interceptor: { method: 'POST', path: '/posts' },
          matched: true,
        },
        {
          method: 'get',
          url: 'https://api.example.com/comments',
          path: '/comments',
          timestamp: new Date(),
          interceptor: { method: 'GET', path: '/comments' },
          matched: true,
        },
      ];

      requests.forEach(req => tracker.addRequest(req));
    });

    it('should filter requests by method (case insensitive)', () => {
      const getRequests = tracker.getRequestsForMethod('GET');
      expect(getRequests).toHaveLength(2);

      const postRequests = tracker.getRequestsForMethod('post');
      expect(postRequests).toHaveLength(1);
    });

    it('should return empty array for non-matching method', () => {
      const requests = tracker.getRequestsForMethod('DELETE');
      expect(requests).toHaveLength(0);
    });
  });
});
