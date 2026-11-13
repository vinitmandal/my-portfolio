const placeholderJwtSecret = 'replace_with_a_strong_random_secret';

const hasSecureJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  return Boolean(secret && secret.length >= 32 && secret !== placeholderJwtSecret);
};

module.exports = { hasSecureJwtSecret };
