import fetch from 'node-fetch';
import * as jwt from 'jsonwebtoken';

async function testJwtEndpoints() {
  const secret = process.env.JWT_SECRET || 'super_secret_change_me_in_production';
  const token = jwt.sign(
    { sub: '00000000-0000-0000-0000-000000000001', email: 'test@axiom.com', role: 'MANAGER', organizationId: '00000000-0000-0000-0000-000000000001' },
    secret,
    { expiresIn: '1h' },
  );

  const headers = { Authorization: `Bearer ${token}` };

  console.log('--- Testing GET /api/v1/auth/me ---');
  const meRes = await fetch('http://localhost:3001/api/v1/auth/me', { headers });
  console.log('Status:', meRes.status, await meRes.text());

  console.log('--- Testing GET /api/v1/analytics/dashboard ---');
  const dashRes = await fetch('http://localhost:3001/api/v1/analytics/dashboard', { headers });
  console.log('Status:', dashRes.status, await dashRes.text());

  console.log('--- Testing GET /api/v1/projects ---');
  const projRes = await fetch('http://localhost:3001/api/v1/projects', { headers });
  console.log('Status:', projRes.status, await projRes.text());
}

testJwtEndpoints();
