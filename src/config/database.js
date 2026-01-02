const mongoose = require('mongoose');

let cachedConnection = null;
let cachedPromise = null;

const connectDatabase = async (uri) => {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  if (!uri) {
    throw new Error('MONGODB_URI is missing. Add it to your environment configuration.');
  }

  if (!cachedPromise) {
    cachedPromise = mongoose.connect(uri)
      .then(connection => {
        cachedConnection = connection;
        console.log('MongoDB connected');
        return connection;
      })
      .catch(error => {
        cachedPromise = null;
        console.error('MongoDB connection error', error);
        if (process.env.VERCEL) {
          throw error;
        }
        process.exit(1);
      });
  }

  return cachedPromise;
};

module.exports = connectDatabase;
