import { spawn } from 'node:child_process';

export async function withCodexServer({ executable = 'codex', args = [], cwd, env }, operation) {
  const child = spawn(executable, [...args, '-c', 'features.plugins=true', 'app-server'], { cwd, env, stdio: ['pipe', 'pipe', 'pipe'] });
  const pending = new Map();
  let nextId = 0;
  let buffer = '';
  let stderr = '';
  const rejectPending = error => { for (const request of pending.values()) request.reject(error); pending.clear(); };
  child.stderr.on('data', data => { stderr = (stderr + data.toString()).slice(-2000); });
  child.on('error', rejectPending);
  child.on('close', () => rejectPending(new Error('Codex app-server closed: ' + stderr)));
  child.stdout.on('data', data => {
    buffer += data.toString();
    while (buffer.includes('\n')) {
      const end = buffer.indexOf('\n');
      const line = buffer.slice(0, end); buffer = buffer.slice(end + 1);
      let message; try { message = JSON.parse(line); } catch { continue; }
      const request = pending.get(message.id);
      if (!request) continue;
      pending.delete(message.id);
      if (message.error) request.reject(new Error(JSON.stringify(message.error)));
      else request.resolve(message.result);
    }
  });
  const request = (method, params) => new Promise((resolve, reject) => {
    const id = ++nextId;
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error('Timeout waiting for ' + method)); }, 20000);
    pending.set(id, { resolve: result => { clearTimeout(timeout); resolve(result); }, reject: error => { clearTimeout(timeout); reject(error); } });
    child.stdin.write(JSON.stringify({ id, method, params }) + '\n');
  });
  try {
    await request('initialize', { clientInfo: { name: 'scientific-market-preview-verifier', version: '0.1.0' }, capabilities: { experimentalApi: true } });
    child.stdin.write(JSON.stringify({ method: 'initialized' }) + '\n');
    return await operation(request);
  } finally {
    const closed = new Promise(resolve => child.once('close', resolve));
    child.stdin.end();
    let timeout;
    await Promise.race([closed, new Promise(resolve => { timeout = setTimeout(() => { child.kill('SIGTERM'); resolve(); }, 3000); })]);
    clearTimeout(timeout);
  }
}
