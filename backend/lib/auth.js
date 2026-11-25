const { ensure } = require('./errors');
const { digest, sameSecret } = require('./security');

function authentication(store, config) {
  async function required(req, res, next) {
    const authorization = req.get('Authorization') || '';
    ensure(/^Bearer [A-Za-z0-9_-]{43}$/.test(authorization), 401, '로그인이 필요합니다.');
    const tokenHash = digest(authorization.slice(7));
    const identity = await store.read((state) => {
      const session = state.sessions.find((item) => item.tokenHash === tokenHash && Date.parse(item.expiresAt) > Date.now());
      const user = session && state.users.find((item) => item.id === session.userId && item.role === session.role);
      return user ? { user, sessionId: session.id } : null;
    });
    ensure(identity, 401, '로그인이 만료되었거나 유효하지 않습니다.');
    req.user = identity.user;
    req.sessionId = identity.sessionId;
    next();
  }

  function role(...allowed) {
    return [required, (req, res, next) => {
      ensure(allowed.includes(req.user.role), 403, '해당 작업을 수행할 권한이 없습니다.');
      next();
    }];
  }

  function operations(req, res, next) {
    ensure(config.operationsKey.length >= 32, 503, '운영용 API 키 설정이 필요합니다.');
    const supplied = req.get('X-Operations-Key') || '';
    ensure(supplied && sameSecret(supplied, config.operationsKey), 403, '운영용 API 권한이 필요합니다.');
    next();
  }

  return { required, role, operations };
}

module.exports = authentication;
