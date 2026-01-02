const mongoose = require('mongoose');

const connectDatabase = async (uri) => {
  try {
    if (!uri) {
      throw new Error('MONGODB_URI is missing. Add it to your environment configuration.');
    }

    await mongoose.connect(uri);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error', error);
    process.exit(1);
  }
};

module.exports = connectDatabase;
