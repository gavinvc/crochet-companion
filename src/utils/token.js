const jwt = require('jsonwebtoken');

const ensureSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined. Add it to your environment configuration.');
  }
  return secret;
};

const generateAccessToken = (userId, expiresIn = process.env.JWT_EXPIRES_IN || '7d') => {
  return jwt.sign({ sub: userId }, ensureSecret(), { expiresIn });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, ensureSecret());
};

module.exports = {
  generateAccessToken,
  verifyAccessToken
};
