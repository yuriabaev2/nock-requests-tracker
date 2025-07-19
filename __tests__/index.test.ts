import axios from 'axios';
import { nock, requestTracker } from '../src/index.js';

describe('nock-requests-tracker', () => {
  beforeEach(() => {
    requestTracker.clearRequests();
  });

  afterEach(() => {
    nock.cleanAll();
    requestTracker.clearRequests();
  });

  it('should track GET requests', async () => {
    const scope = nock('https://api.example.com').get('/users').reply(200, { users: [] });

    await axios.get('https://api.example.com/users');

    const requests = requestTracker.getRequests();
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      method: 'GET',
      url: 'https://api.example.com/users',
      path: '/users',
      matched: true,
    });
    expect(requests[0]?.timestamp).toBeInstanceOf(Date);

    scope.done();
  });

  it('should track POST requests with body', async () => {
    const requestBody = { name: 'John Doe' };

    const scope = nock('https://api.example.com')
      .post('/users', requestBody)
      .reply(201, { id: 1, name: 'John Doe' });

    await axios.post('https://api.example.com/users', requestBody);

    const requests = requestTracker.getRequests();
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      method: 'POST',
      url: 'https://api.example.com/users',
      path: '/users',
      matched: true,
    });

    scope.done();
  });

  it('should track multiple requests', async () => {
    const scope1 = nock('https://api.example.com').get('/users').reply(200, { users: [] });

    const scope2 = nock('https://api.example.com').post('/posts').reply(201, { id: 1 });

    await axios.get('https://api.example.com/users');
    await axios.post('https://api.example.com/posts', { title: 'Test' });

    const requests = requestTracker.getRequests();
    expect(requests).toHaveLength(2);

    const getRequest = requests.find(r => r.method === 'GET');
    const postRequest = requests.find(r => r.method === 'POST');

    expect(getRequest?.path).toBe('/users');
    expect(postRequest?.path).toBe('/posts');

    scope1.done();
    scope2.done();
  });

  it('should handle query parameters', async () => {
    const scope = nock('https://api.example.com')
      .get('/users')
      .query({ page: '1', limit: '10' })
      .reply(200, { users: [] });

    await axios.get('https://api.example.com/users?page=1&limit=10');

    const requests = requestTracker.getRequests();
    expect(requests).toHaveLength(1);
    expect(requests[0]?.query).toBeDefined();

    scope.done();
  });

  it('should track requests with different HTTP methods', async () => {
    const methods = ['get', 'post', 'put', 'patch', 'delete'] as const;
    const scopes: ReturnType<typeof nock>[] = [];

    for (const method of methods) {
      const scope = nock('https://api.example.com')[method]('/test').reply(200, { success: true });
      scopes.push(scope);
    }

    for (const method of methods) {
      await (axios as any)[method]('https://api.example.com/test');
    }

    const requests = requestTracker.getRequests();
    expect(requests).toHaveLength(5);

    const methodsTracked = requests.map(r => r.method.toLowerCase());
    expect(methodsTracked).toEqual(
      expect.arrayContaining(['get', 'post', 'put', 'patch', 'delete'])
    );

    scopes.forEach(scope => scope.done());
  });

  it('should provide tracker methods', () => {
    expect(requestTracker.getRequests).toBeDefined();
    expect(requestTracker.clearRequests).toBeDefined();
    expect(requestTracker.getRequestsForPath).toBeDefined();
    expect(requestTracker.getRequestsForMethod).toBeDefined();
  });

  it('should filter requests by path', async () => {
    const scope1 = nock('https://api.example.com').get('/users').reply(200, {});

    const scope2 = nock('https://api.example.com').get('/posts').reply(200, {});

    await axios.get('https://api.example.com/users');
    await axios.get('https://api.example.com/posts');

    const userRequests = requestTracker.getRequestsForPath('/users');
    const postRequests = requestTracker.getRequestsForPath('/posts');

    expect(userRequests).toHaveLength(1);
    expect(postRequests).toHaveLength(1);
    expect(userRequests[0]?.path).toBe('/users');
    expect(postRequests[0]?.path).toBe('/posts');

    scope1.done();
    scope2.done();
  });
});
