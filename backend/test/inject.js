const { IncomingMessage, ServerResponse } = require('node:http');
const { Duplex } = require('node:stream');

// 실제 Express 미들웨어를 실행하되 네트워크 포트는 열지 않는 테스트용 전송 계층입니다.
function inject(app, route, options = {}) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const socket = new Duplex({
      read() {},
      write(chunk, encoding, callback) { chunks.push(Buffer.from(chunk)); callback(); },
    });
    Object.defineProperty(socket, 'remoteAddress', { value: '127.0.0.1' });
    const request = new IncomingMessage(socket);
    request.method = options.method || 'GET';
    request.url = route;
    request.httpVersion = '1.1';
    request.httpVersionMajor = 1;
    request.httpVersionMinor = 1;
    request.complete = true;
    request.headers = Object.fromEntries(new Headers(options.headers));
    const payload = options.body === undefined ? null : Buffer.from(options.body);
    if (payload) request.headers['content-length'] = String(payload.length);
    const response = new ServerResponse(request);
    response.assignSocket(socket);
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error(`요청 처리 시간 초과: ${request.method} ${route}`));
    }, 10000);
    response.on('finish', () => {
      clearTimeout(timer);
      const raw = Buffer.concat(chunks);
      const separator = raw.indexOf('\r\n\r\n');
      const body = raw.subarray(separator + 4);
      const status = response.statusCode;
      resolve(new Response([204, 304].includes(status) ? null : body, {
        status, headers: response.getHeaders(),
      }));
      socket.destroy();
    });
    socket.on('error', (error) => { clearTimeout(timer); reject(error); });
    app(request, response);
    if (payload) request.push(payload);
    request.push(null);
  });
}

module.exports = inject;
