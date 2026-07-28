import fetch from 'node-fetch';

async function testApiHealth() {
  console.log('Testing backend API endpoints on http://localhost:3001...');
  try {
    const res = await fetch('http://localhost:3001/api/v1/auth/me');
    console.log('Status:', res.status, res.statusText);
    const body = await res.text();
    console.log('Body:', body);
  } catch (err) {
    console.error('Fetch failed:', err);
  }
}

testApiHealth();
