const { ensure } = require('./errors');
const MAX_INT = 2147483647;
function text(value, name, maxLength = 200) {
  ensure(typeof value === 'string' && value.trim().length > 0 && [...value].length <= maxLength,
    400, `${name}에 1~${maxLength}자의 문자열을 입력하세요.`);
  return value.trim();
}
function integer(value, name, minimum = 0) {
  ensure(Number.isInteger(value) && value >= minimum && value <= MAX_INT,
    400, `${name}에 ${minimum}~${MAX_INT} 사이의 정수를 입력하세요.`);
  return value;
}
function id(value, name = 'ID') {
  ensure(typeof value === 'string' && /^[1-9]\d*$/.test(value), 400, `${name}는 양의 정수여야 합니다.`);
  return integer(Number(value), name, 1);
}
function choice(value, allowed, name) {
  ensure(allowed.includes(value), 400, `${name}은 ${allowed.join(', ')} 중 하나여야 합니다.`);
  return value;
}
function body(req, allowed) {
  ensure(req.body && typeof req.body === 'object' && !Array.isArray(req.body), 400, 'JSON 객체를 보내주세요.');
  if (allowed) ensure(Object.keys(req.body).every((key) => allowed.includes(key)), 400, '지원하지 않는 입력 항목이 있습니다.');
  return req.body;
}
function email(value) {
  const normalized = text(value, 'email', 100).toLowerCase();
  ensure(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized), 400, '이메일 형식이 올바르지 않습니다.');
  return normalized;
}
function password(value) {
  ensure(typeof value === 'string' && value.length >= 8 && Buffer.byteLength(value) <= 1024,
    400, '비밀번호는 8자 이상, UTF-8 기준 1024바이트 이하여야 합니다.');
  return value;
}
function money(value) { return integer(value, '금액'); }
function changes(value) { ensure(Object.keys(value).length > 0, 400, '수정할 항목을 한 개 이상 입력하세요.'); return value; }
function detail(value) {
  ensure(value === null || (typeof value === 'string' && [...value].length <= 100), 400, 'detailAddress는 null 또는 100자 이하 문자열이어야 합니다.');
  return value === null ? null : value.trim();
}
function dateOnly(value, name = 'startDate') {
  ensure(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value), 400, `${name}는 YYYY-MM-DD 날짜여야 합니다.`);
  const parsed = new Date(value + 'T00:00:00Z');
  ensure(Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value, 400, `${name} 날짜가 유효하지 않습니다.`);
  return value;
}
module.exports = { text, integer, id, choice, body, email, password, money, changes, detail, dateOnly, MAX_INT };
