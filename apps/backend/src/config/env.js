const requiredEnvVars = ['MONGODB_URI', 'ADMIN_JWT_SECRET'];

const validateEnv = () => {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  const hasInternalBridgeKey = Boolean(
    process.env.INTERNAL_API_KEY || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  );

  if (missing.length) {
    const error = new Error(`Missing required environment variables: ${missing.join(', ')}`);
    error.code = 'ENV_VALIDATION_ERROR';
    throw error;
  }

  if (!hasInternalBridgeKey) {
    const error = new Error('Missing internal auth bridge secret. Set INTERNAL_API_KEY (recommended) or AUTH_SECRET/NEXTAUTH_SECRET.');
    error.code = 'ENV_VALIDATION_ERROR';
    throw error;
  }
};

module.exports = {
  validateEnv,
};
