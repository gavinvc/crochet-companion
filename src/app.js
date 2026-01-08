const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const parserRoutes = require('./routes/parser.routes');
const patternRoutes = require('./routes/pattern.routes');
const progressRoutes = require('./routes/progress.routes');
const groupRoutes = require('./routes/group.routes');

const buildApp = () => {
  const app = express();
  const allowedOrigins = process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',') : undefined;
  const logFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';

  app.use(helmet());
  app.use(cors({ origin: allowedOrigins || true, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan(logFormat));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/profiles', profileRoutes);
  app.use('/api/parser', parserRoutes);
  app.use('/api/patterns', patternRoutes);
  app.use('/api/progress', progressRoutes);
  app.use('/api/groups', groupRoutes);

  app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: 'Unexpected server error' });
  });

  return app;
};

module.exports = buildApp;
