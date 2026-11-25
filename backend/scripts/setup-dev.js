const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const dotenv = require('dotenv');

const root = path.join(__dirname, '..');
const file = path.join(root, '.env');
let content = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : fs.readFileSync(path.join(root, '.env.example'), 'utf8');
const parsed = dotenv.parse(content);
if (parsed.OPERATIONS_API_KEY && parsed.OPERATIONS_API_KEY.length < 32) {
  throw new Error('OPERATIONS_API_KEY는 32자 이상이어야 합니다. .env 설정을 확인하세요.');
}
if (!parsed.OPERATIONS_API_KEY) {
  const key = randomBytes(32).toString('base64url');
  if (/^OPERATIONS_API_KEY\s*=.*$/m.test(content)) content = content.replace(/^OPERATIONS_API_KEY\s*=.*$/m, `OPERATIONS_API_KEY=${key}`);
  else content += `\nOPERATIONS_API_KEY=${key}\n`;
  const temporary = `${file}.${randomBytes(8).toString('hex')}.tmp`;
  try {
    fs.writeFileSync(temporary, content, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
    fs.renameSync(temporary, file);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}
console.log('로컬 개발 설정을 준비했습니다. 운영용 API 키는 .env에 저장되었습니다.');
