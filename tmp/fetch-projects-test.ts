async function main() {
  try {
    const loginRes = await fetch('http://localhost:8000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'mockmanager@useaxiom.com',
        password: 'password123'
      })
    });
    if (!loginRes.ok) {
      throw new Error(`Login failed with status ${loginRes.status}: ${await loginRes.text()}`);
    }
    const loginData: any = await loginRes.json();
    const token = loginData.access_token;
    console.log('Login succeeded! Token:', token.substring(0, 20) + '...');

    const projectsRes = await fetch('http://localhost:8000/api/v1/projects', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!projectsRes.ok) {
      throw new Error(`Projects fetch failed with status ${projectsRes.status}: ${await projectsRes.text()}`);
    }
    const projectsData: any = await projectsRes.json();
    console.log('Projects count from Next.js server:', projectsData.length);
  } catch (err: any) {
    console.error('Error during rewrite verification:', err.message);
  }
}

main();
