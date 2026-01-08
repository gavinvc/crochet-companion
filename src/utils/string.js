const createHandleBase = (value = '') => {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
};

const withRandomSuffix = (value) => {
  const suffix = Math.random().toString(36).slice(-4);
  return value ? `${value}-${suffix}` : `maker-${suffix}`;
};

const buildHandle = (preferred) => {
  const base = createHandleBase(preferred);
  return base || withRandomSuffix('maker');
};

const buildSlug = (value) => {
  const base = createHandleBase(value);
  return base || withRandomSuffix('group');
};

module.exports = {
  buildHandle,
  withRandomSuffix,
  buildSlug
};
