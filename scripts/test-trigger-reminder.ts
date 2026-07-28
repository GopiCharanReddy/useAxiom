import fetch from 'node-fetch';
import * as jwt from 'jsonwebtoken';

async function testTriggerReminder() {
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

  console.log('--- Testing POST /api/v1/notifications/reminders/trigger ---');
  const res = await fetch('http://localhost:3001/api/v1/notifications/reminders/trigger', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      scheduleId: 'rem_sched_101',
      phone: '+918105670193',
      aiTone: 'Professional',
    }),
  });

  console.log('Status:', res.status, res.statusText);
  const body = await res.text();
  console.log('Body:', body);
}

testTriggerReminder();
