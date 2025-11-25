const tokenService = require('../src/services/token.service');
const blacklist = require('../src/utils/blacklist');

describe('token.service', () => {
  beforeEach(() => {
    blacklist.clear();
  });
  test('create and verify access token', () => {
    const token = tokenService.createAccessToken('user1', '1h');
    const decoded = tokenService.verifyAccessToken(token);
    expect(decoded.sub).toBe('user1');
    expect(decoded.jti).toBeDefined();
  });

  test('create and verify refresh token', () => {
    const token = tokenService.createRefreshToken('user2', '1h');
    const decoded = tokenService.verifyRefreshToken(token);
    expect(decoded.sub).toBe('user2');
    expect(decoded.rt).toBeTruthy();
  });

  test('revoked access token is rejected', () => {
    const token = tokenService.createAccessToken('user3', '1h');
    const decoded = tokenService.verifyAccessToken(token);
    tokenService.revokeToken(decoded.jti);
    expect(() => tokenService.verifyAccessToken(token)).toThrow('Access token revoked');
  });
});
