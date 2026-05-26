const getInternalApiKey = () =>
  process.env.INTERNAL_API_KEY ||
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  null;

const assertInternalKey = (req, res) => {
  const internalKey = String(req.headers['x-internal-api-key'] || '').trim();
  const expectedKey = getInternalApiKey();

  if (!expectedKey || internalKey !== expectedKey) {
    res.status(403).json({ success: false, message: 'Forbidden.' });
    return false;
  }

  return true;
};

module.exports = {
  getInternalApiKey,
  assertInternalKey,
};
