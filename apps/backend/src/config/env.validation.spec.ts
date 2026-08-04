import { validate } from './env.validation';

describe('env validation', () => {
  it('accepts a fully specified environment', () => {
    expect(() =>
      validate({
        NODE_ENV: 'production',
        PORT: '3000',
        FRONTEND_URL: 'http://localhost:3001',
        NBA_DEFAULT_SEASON: '2025-26',
        ESPN_MAX_CONCURRENCY: '5',
      }),
    ).not.toThrow();
  });

  it('accepts an empty environment because every variable has a default', () => {
    expect(() => validate({})).not.toThrow();
  });

  it('keeps unrelated variables so ConfigService still sees them', () => {
    expect(validate({ SOME_OTHER_VAR: 'kept' })).toMatchObject({
      SOME_OTHER_VAR: 'kept',
    });
  });

  it('rejects a port outside the valid range', () => {
    expect(() => validate({ PORT: '99999' })).toThrow(
      /Invalid environment configuration/,
    );
  });

  it('rejects a malformed frontend URL', () => {
    expect(() => validate({ FRONTEND_URL: 'not-a-url' })).toThrow(
      /Invalid environment configuration/,
    );
  });

  it('rejects a season that is not YYYY-YY', () => {
    expect(() => validate({ NBA_DEFAULT_SEASON: '2025' })).toThrow(
      /NBA_DEFAULT_SEASON must be YYYY-YY/,
    );
  });
});
