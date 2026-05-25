function trimEnv(value: string | undefined) {
  return value?.trim() || "";
}

export function getGoogleOAuthCredentials() {
  return {
    clientId: trimEnv(process.env.GOOGLE_CLIENT_ID),
    clientSecret: trimEnv(process.env.GOOGLE_CLIENT_SECRET),
  };
}

export function isGoogleOAuthConfigured() {
  const { clientId, clientSecret } = getGoogleOAuthCredentials();

  if (!clientId || !clientSecret) {
    return false;
  }

  if (/your_google_client_secret|changeme|example/i.test(clientSecret)) {
    return false;
  }

  // Google client secrets are typically longer than this when complete
  if (clientSecret.length < 28) {
    return false;
  }

  return true;
}
