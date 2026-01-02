require('dotenv').config();

const connectDatabase = require('./src/config/database');
const buildApp = require('./src/app');

const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/crochet-companion';

const bootstrap = async () => {
  await connectDatabase(mongoUri);
  const app = buildApp();

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};

bootstrap().catch(error => {
  console.error('Server failed to start', error);
  process.exit(1);
});

