require('dotenv').config();

const buildApp = require('../src/app');
const connectDatabase = require('../src/config/database');

let cachedApp;

module.exports = async (req, res) => {
  try {
    if (!cachedApp) {
      await connectDatabase(process.env.MONGODB_URI);
      cachedApp = buildApp();
    }

    return cachedApp(req, res);
  } catch (error) {
    console.error('API handler error', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
