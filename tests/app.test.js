const request = require('supertest');
const app = require('../src/index');

describe('API Endpoints', () => {
  test('GET / debe retornar 200 con status ok', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.message).toBeDefined();
    expect(res.body.timestamp).toBeDefined();
  });

  test('GET /health debe retornar 200 con status healthy', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  test('GET /ruta-inexistente debe retornar 404', async () => {
    const res = await request(app).get('/ruta-inexistente');
    expect(res.statusCode).toBe(404);
  });
});