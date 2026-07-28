import fetch from 'node-fetch';
import * as jwt from 'jsonwebtoken';

async function testReminders() {
  const secret = process.env.JWT_SECRET || 'super_secret_change_me_in_production';
  const token = jwt.sign(
    { sub: '00000000-0000-0000-0000-000000000001', email: 'test@axiom.com', role: 'MANAGER', organizationId: '00000000-0000-0000-0000-000000000001' },
    secret,
    { expiresIn: '1h' },
  );

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  console.log('--- Testing GET /api/v1/notifications/reminders/schedules ---');
  const getRes = await fetch('http://localhost:3001/api/v1/notifications/reminders/schedules', { headers });
  console.log('GET Status:', getRes.status, await getRes.text());

  console.log('--- Testing POST /api/v1/notifications/reminders/schedules ---');
  const postRes = await fetch('http://localhost:3001/api/v1/notifications/reminders/schedules', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      employeeName: 'Rahul Sharma',
      employeeId: 'EMP-005',
      employeePhone: '+918105670193',
      projectName: 'Mobile Banking Dashboard',
      projectDescription: 'Build responsive Next.js analytics and transaction tracking dashboard.',
      deadline: '2026-07-30',
    }),
  });
  console.log('POST Status:', postRes.status, await postRes.text());
}

testReminders();
