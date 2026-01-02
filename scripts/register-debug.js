require('dotenv').config();

const connectDatabase = require('../src/config/database');
const buildApp = require('../src/app');

const payload = {
  displayName: 'Debugger One',
  email: `debugger-${Date.now()}@example.com`,
  password: 'Password123',
  handle: 'debugger-handle',
  experienceLevel: 'beginner'
};

(async () => {
  try {
    await connectDatabase(process.env.MONGODB_URI);
    const app = buildApp();

    await new Promise((resolve, reject) => {
      const server = app.listen(0, async () => {
        const { port } = server.address();
        try {
          const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const body = await response.text();
          console.log('Status:', response.status);
          console.log('Body:', body);
          server.close(() => resolve());
        } catch (error) {
          server.close(() => reject(error));
        }
      });
    });
  } catch (error) {
    console.error('Test failed', error);
  } finally {
    process.exit();
  }
})();
