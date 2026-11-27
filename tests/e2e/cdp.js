// Edge/Chrome 을 원격 디버깅으로 띄워 페이지에서 JS 를 실행하는 작은 도구 (E2E 테스트용, 의존성 없음)
const { spawn } = require('child_process'), http = require('http'), path = require('path'), fs = require('fs');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const get = u => new Promise((res, rej) => http.get(u, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => res(d)); }).on('error', rej));
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function launch(port, profile, w, h) {
  const p = spawn(EDGE, ['--headless=new', '--disable-gpu', '--allow-file-access-from-files', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, `--window-size=${w || 520},${h || 1000}`, 'about:blank'], { stdio: 'ignore' });
  for (let i = 0; i < 60; i++) { try { await get(`http://127.0.0.1:${port}/json/version`); break; } catch (e) { await sleep(250); } }
  const tabs = JSON.parse(await get(`http://127.0.0.1:${port}/json`)); const tab = tabs.find(t => t.type === 'page');
  const ws = new WebSocket(tab.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let id = 0; const pend = new Map(); const logs = [];
  ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } else if (d.method === 'Runtime.exceptionThrown') logs.push('EXC ' + (d.params.exceptionDetails.exception && d.params.exceptionDetails.exception.description || d.params.exceptionDetails.text)); else if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') logs.push('console.error ' + d.params.args.map(a => a.value || a.description).join(' ')); };
  const send = (method, params) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable'); await send('Page.enable');
  const api = {
    logs, send,
    async goto(url) { await send('Page.navigate', { url }); await sleep(1200); },
    async eval(expr) { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error('eval: ' + (r.result.exceptionDetails.exception || {}).description); return r.result.result.value; },
    async shot(file) { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(file, Buffer.from(r.result.data, 'base64')); },
    async setSize(w, h, mobile) { await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: !!mobile }); },
    close() { try { ws.close(); } catch (e) { } p.kill(); }
  };
  return api;
}
module.exports = { launch, sleep };
