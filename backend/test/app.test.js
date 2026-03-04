import request from 'supertest';
import app from '../src/app.js';

describe('backend health and metrics', () => {
  it('should return status ok on /health', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ status: 'ok' }));
  });

  it('should expose metrics at /metrics', async () => {
    const res = await request(app).get('/metrics');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('process_cpu_user_seconds_total');
  });
});
